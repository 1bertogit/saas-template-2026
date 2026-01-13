import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { subscriptions, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET is not set');
}

async function upsertSubscription(data: {
  userId: string;
  subscriptionId: string;
  priceId: string;
  status: string;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  plan: string;
}) {
  const { userId, subscriptionId, priceId, status, currentPeriodEnd, cancelAtPeriodEnd, plan } = data;

  const existingUser = await db.query.users.findFirst({ where: eq(users.clerkId, userId) });
  if (!existingUser) return;

  const existingSubscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.stripeSubscriptionId, subscriptionId),
  });

  const payload = {
    userId: existingUser.id,
    stripeSubscriptionId: subscriptionId,
    stripePriceId: priceId,
    stripeCurrentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
    status,
    plan,
    cancelAtPeriodEnd,
  };

  if (existingSubscription) {
    await db.update(subscriptions).set(payload).where(eq(subscriptions.id, existingSubscription.id));
  } else {
    await db.insert(subscriptions).values(payload);
  }
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = session.subscription as string;
        const userId = (session.metadata?.userId as string) || (session.client_reference_id as string) || '';

        if (subscriptionId && userId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = (subscription.items.data[0]?.price?.id as string) || '';
          await upsertSubscription({
            userId,
            subscriptionId,
            priceId,
            status: subscription.status,
            currentPeriodEnd: subscription.current_period_end,
            cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
            plan: subscription.items.data[0]?.price?.nickname || 'starter',
          });
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = (subscription.metadata?.userId as string) || '';
        const priceId = (subscription.items.data[0]?.price?.id as string) || '';

        if (userId) {
          await upsertSubscription({
            userId,
            subscriptionId: subscription.id,
            priceId,
            status: subscription.status,
            currentPeriodEnd: subscription.current_period_end,
            cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
            plan: subscription.items.data[0]?.price?.nickname || 'starter',
          });
        }
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
