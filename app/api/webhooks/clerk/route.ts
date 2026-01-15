import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { processUserOnboarding } from '@/lib/jobs';
import {
  isWebhookProcessed,
  markWebhookProcessed,
  isWebhookTimestampValid,
} from '@/lib/webhook-idempotency';

export const runtime = 'nodejs';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: Request) {
  if (!webhookSecret) {
    console.error('[Clerk Webhook] CLERK_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  // Get headers
  const headersList = await headers();
  const svix_id = headersList.get('svix-id');
  const svix_timestamp = headersList.get('svix-timestamp');
  const svix_signature = headersList.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  // Validate timestamp to prevent replay attacks (5 minute tolerance)
  if (!isWebhookTimestampValid(svix_timestamp)) {
    console.error('[Clerk Webhook] Timestamp validation failed');
    return NextResponse.json({ error: 'Webhook timestamp invalid' }, { status: 400 });
  }

  // Get body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify webhook signature
  const wh = new Webhook(webhookSecret);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('[Clerk Webhook] Verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`[Clerk Webhook] Received event: ${evt.type} (${svix_id})`);

  // Idempotency check - skip if already processed
  const alreadyProcessed = await isWebhookProcessed(svix_id, 'clerk');
  if (alreadyProcessed) {
    console.log(`[Clerk Webhook] Skipping duplicate event: ${svix_id}`);
    return NextResponse.json({ received: true, skipped: true });
  }

  try {
    switch (evt.type) {
      // New user created
      case 'user.created': {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data;
        const primaryEmail = email_addresses?.find((e) => e.id === evt.data.primary_email_address_id);
        const email = primaryEmail?.email_address || email_addresses?.[0]?.email_address;
        const name = [first_name, last_name].filter(Boolean).join(' ') || undefined;

        if (!email) {
          console.error('[Clerk Webhook] No email found for user:', id);
          break;
        }

        // Check if user already exists (in case of race condition)
        const existingUser = await db.query.users.findFirst({
          where: eq(users.clerkId, id),
        });

        if (existingUser) {
          console.log(`[Clerk Webhook] User already exists: ${email}`);
          break;
        }

        // Create user in database
        await db.insert(users).values({
          clerkId: id,
          email,
          name,
          imageUrl: image_url,
        });

        console.log(`[Clerk Webhook] User created in DB: ${email}`);

        // Trigger onboarding job (welcome email, usage init, etc)
        await processUserOnboarding.trigger({
          userId: id,
          email,
          name: name || 'Novo usuário',
        });

        console.log(`[Clerk Webhook] Onboarding job triggered for: ${email}`);
        break;
      }

      // User updated
      case 'user.updated': {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data;
        const primaryEmail = email_addresses?.find((e) => e.id === evt.data.primary_email_address_id);
        const email = primaryEmail?.email_address || email_addresses?.[0]?.email_address;
        const name = [first_name, last_name].filter(Boolean).join(' ') || undefined;

        if (email) {
          await db
            .update(users)
            .set({
              email,
              name,
              imageUrl: image_url,
              updatedAt: new Date(),
            })
            .where(eq(users.clerkId, id));

          console.log(`[Clerk Webhook] User updated: ${email}`);
        }
        break;
      }

      // User deleted
      case 'user.deleted': {
        const { id } = evt.data;

        if (id) {
          const deletedUser = await db.query.users.findFirst({
            where: eq(users.clerkId, id),
          });

          if (deletedUser) {
            // Soft delete by marking as deleted (keeps audit trail)
            // For hard delete, uncomment the line below
            await db.delete(users).where(eq(users.clerkId, id));
            console.log(`[Clerk Webhook] User deleted: ${deletedUser.email}`);
          }
        }
        break;
      }

      default:
        console.log(`[Clerk Webhook] Unhandled event type: ${evt.type}`);
    }

    // Mark event as processed for idempotency
    await markWebhookProcessed(svix_id, 'clerk');

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Clerk Webhook] Handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
