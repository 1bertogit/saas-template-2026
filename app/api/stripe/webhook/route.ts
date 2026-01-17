import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { subscriptions, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  sendSubscriptionEmail,
  sendCancellationEmail,
  sendPaymentFailedEmail,
  retryFailedPayment,
  processSubscriptionCancellation,
} from '@/lib/jobs';
import { isWebhookProcessed, markWebhookProcessed } from '@/lib/webhook-idempotency';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET is not set');
}

// Helper to format date
function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(timestamp * 1000));
}

// Helper to get user by Clerk ID or Stripe customer ID
async function getUserByClerkId(clerkId: string) {
  return db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
}

async function getUserByStripeCustomerId(customerId: string) {
  return db.query.users.findFirst({ where: eq(users.stripeCustomerId, customerId) });
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
  if (!existingUser) return null;

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
    updatedAt: new Date(),
  };

  if (existingSubscription) {
    await db.update(subscriptions).set(payload).where(eq(subscriptions.id, existingSubscription.id));
    return { ...existingSubscription, ...payload, user: existingUser };
  } else {
    const [newSub] = await db.insert(subscriptions).values(payload).returning();
    return { ...newSub, user: existingUser };
  }
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Stripe Webhook] Signature verification failed:', message);
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

  // Idempotency check - skip if already processed
  const alreadyProcessed = await isWebhookProcessed(event.id, 'stripe');
  if (alreadyProcessed) {
    console.log(`[Stripe Webhook] Skipping duplicate event: ${event.id}`);
    return NextResponse.json({ received: true, skipped: true });
  }

  try {
    switch (event.type) {
      // Checkout completed - new subscription
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = session.subscription as string;
        const userId = (session.metadata?.userId as string) || (session.client_reference_id as string) || '';

        if (subscriptionId && userId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0]?.price?.id || '';
          const plan = subscription.items.data[0]?.price?.nickname || 'starter';
          const amount = subscription.items.data[0]?.price?.unit_amount || 0;

          const result = await upsertSubscription({
            userId,
            subscriptionId,
            priceId,
            status: subscription.status,
            currentPeriodEnd: subscription.current_period_end,
            cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
            plan,
          });

          // Send subscription confirmation email
          if (result?.user) {
            await sendSubscriptionEmail.trigger({
              email: result.user.email,
              name: result.user.name || 'Cliente',
              plan: plan.charAt(0).toUpperCase() + plan.slice(1),
              amount,
              periodEnd: formatDate(subscription.current_period_end),
            });
            console.log(`[Stripe Webhook] Subscription email triggered for ${result.user.email}`);
          }
        }
        break;
      }

      // Subscription updated (plan change, renewal, etc)
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId || '';
        const priceId = subscription.items.data[0]?.price?.id || '';
        const plan = subscription.items.data[0]?.price?.nickname || 'starter';

        if (userId) {
          const result = await upsertSubscription({
            userId,
            subscriptionId: subscription.id,
            priceId,
            status: subscription.status,
            currentPeriodEnd: subscription.current_period_end,
            cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
            plan,
          });

          // Check if subscription was set to cancel at period end
          if (subscription.cancel_at_period_end && result?.user) {
            await processSubscriptionCancellation.trigger({
              userId,
              subscriptionId: subscription.id,
              plan: plan.charAt(0).toUpperCase() + plan.slice(1),
              endDate: new Date(subscription.current_period_end * 1000),
            });
            console.log(`[Stripe Webhook] Cancellation scheduled for ${result.user.email}`);
          }
        }
        break;
      }

      // Subscription deleted/canceled
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId || '';
        const priceId = subscription.items.data[0]?.price?.id || '';
        const plan = subscription.items.data[0]?.price?.nickname || 'starter';

        if (userId) {
          await upsertSubscription({
            userId,
            subscriptionId: subscription.id,
            priceId,
            status: 'canceled',
            currentPeriodEnd: subscription.current_period_end,
            cancelAtPeriodEnd: true,
            plan,
          });

          const user = await getUserByClerkId(userId);
          if (user) {
            await sendCancellationEmail.trigger({
              email: user.email,
              name: user.name || 'Cliente',
              plan: plan.charAt(0).toUpperCase() + plan.slice(1),
              endDate: formatDate(subscription.current_period_end),
            });
            console.log(`[Stripe Webhook] Cancellation email sent to ${user.email}`);
          }
        }
        break;
      }

      // Invoice paid successfully
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const _customerId = invoice.customer as string;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          console.log(`[Stripe Webhook] Invoice paid for subscription ${subscriptionId}`);

          // Update subscription status if it was past_due
          const existingSub = await db.query.subscriptions.findFirst({
            where: eq(subscriptions.stripeSubscriptionId, subscriptionId),
          });

          if (existingSub && existingSub.status === 'past_due') {
            await db
              .update(subscriptions)
              .set({ status: 'active', updatedAt: new Date() })
              .where(eq(subscriptions.id, existingSub.id));
          }
        }
        break;
      }

      // Invoice payment failed
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const subscriptionId = invoice.subscription as string;
        const attemptCount = invoice.attempt_count || 1;

        const user = await getUserByStripeCustomerId(customerId);

        if (user) {
          // Update subscription status to past_due
          if (subscriptionId) {
            const existingSub = await db.query.subscriptions.findFirst({
              where: eq(subscriptions.stripeSubscriptionId, subscriptionId),
            });

            if (existingSub) {
              await db
                .update(subscriptions)
                .set({ status: 'past_due', updatedAt: new Date() })
                .where(eq(subscriptions.id, existingSub.id));
            }
          }

          // Send payment failed email
          const nextRetry = invoice.next_payment_attempt
            ? formatDate(invoice.next_payment_attempt)
            : undefined;

          await sendPaymentFailedEmail.trigger({
            email: user.email,
            name: user.name || 'Cliente',
            amount: invoice.amount_due,
            retryDate: nextRetry,
          });

          console.log(`[Stripe Webhook] Payment failed email sent to ${user.email}, attempt ${attemptCount}`);

          // Schedule retry job if not too many attempts (max 3 to match job config)
          if (attemptCount < 3 && subscriptionId && invoice.id) {
            await retryFailedPayment.trigger({
              subscriptionId,
              invoiceId: invoice.id,
              attemptNumber: attemptCount,
              userId: user.clerkId,
              invoiceAmount: invoice.amount_due,
            });
          }
        }
        break;
      }

      // Customer created (for future use)
      case 'customer.created': {
        const customer = event.data.object as Stripe.Customer;
        console.log(`[Stripe Webhook] Customer created: ${customer.id}`);
        break;
      }

      // Trial will end soon (3 days before)
      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId || '';

        if (userId) {
          const user = await getUserByClerkId(userId);
          if (user && subscription.trial_end) {
            console.log(`[Stripe Webhook] Trial ending soon for ${user.email} on ${formatDate(subscription.trial_end)}`);
            // Could send a "trial ending" email here
          }
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    // Mark event as processed for idempotency
    await markWebhookProcessed(event.id, 'stripe');

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
