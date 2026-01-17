import { task, schedules } from '@trigger.dev/sdk/v3';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { subscriptions, users } from '@/lib/db/schema';
import { eq, and, lt, lte } from 'drizzle-orm';
import { sendCancellationEmail, sendPaymentFailedEmail } from './email-jobs';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' })
  : null;

// Helper to format date in pt-BR
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

// Process subscription renewal reminders (7 days before)
export const subscriptionRenewalReminder = schedules.task({
  id: 'subscription-renewal-reminder',
  cron: '0 10 * * *', // Every day at 10 AM
  maxDuration: 300,
  run: async () => {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringSubscriptions = await db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.status, 'active'),
        eq(subscriptions.cancelAtPeriodEnd, false),
        lte(subscriptions.stripeCurrentPeriodEnd, sevenDaysFromNow)
      ),
      with: {
        // Note: You'd need to set up relations for this to work
      },
    });

    let processed = 0;
    let reminded = 0;

    for (const sub of expiringSubscriptions) {
      processed++;
      // Fetch user info
      const user = await db.query.users.findFirst({
        where: eq(users.id, sub.userId),
      });

      if (user && sub.stripeCurrentPeriodEnd) {
        console.warn(`[RenewalReminder] Subscription ${sub.id} expires on ${sub.stripeCurrentPeriodEnd}`);
        // In production, send reminder email here
        reminded++;
      }
    }

    return {
      success: true,
      processed,
      reminded,
      expiringCount: expiringSubscriptions.length,
    };
  },
});

// Handle failed payment retry with exponential backoff
export const retryFailedPayment = task({
  id: 'retry-failed-payment',
  maxDuration: 120,
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 60000, // Wait 1 minute between retries
    maxTimeoutInMs: 300000, // Max 5 minutes
    factor: 2,
    randomize: true, // Add jitter to prevent thundering herd
  },
  run: async (payload: {
    subscriptionId: string;
    invoiceId: string;
    attemptNumber: number;
    userId: string;
    invoiceAmount: number;
  }) => {
    if (!stripe) {
      return { success: false, reason: 'stripe_not_configured' };
    }

    const { subscriptionId, invoiceId, attemptNumber, userId, invoiceAmount } = payload;

    console.warn(`[RetryPayment] Retrying payment for subscription ${subscriptionId}, attempt ${attemptNumber}`);

    try {
      // Try to pay the invoice
      const invoice = await stripe.invoices.pay(invoiceId);

      if (invoice.status === 'paid') {
        console.warn(`[RetryPayment] Payment succeeded for ${subscriptionId}`);
        return { success: true, invoiceId, status: 'paid' };
      }

      // If still unpaid, the retry failed
      return { success: false, invoiceId, status: invoice.status };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[RetryPayment] Failed for ${subscriptionId}:`, message);

      // Notify user about failed payment
      const user = await db.query.users.findFirst({
        where: eq(users.clerkId, userId),
      });

      if (user) {
        // Calculate next retry with exponential backoff (2^attempt minutes, max 30 min)
        const backoffMinutes = Math.min(Math.pow(2, attemptNumber), 30);
        const nextRetry = new Date();
        nextRetry.setMinutes(nextRetry.getMinutes() + backoffMinutes);

        await sendPaymentFailedEmail.trigger({
          email: user.email,
          name: user.name || 'Cliente',
          amount: invoiceAmount,
          retryDate: attemptNumber < 3 ? formatDate(nextRetry) : undefined,
        });
      }

      throw error; // Re-throw to trigger retry
    }
  },
});

// Clean up expired trials
export const cleanupExpiredTrials = schedules.task({
  id: 'cleanup-expired-trials',
  cron: '0 0 * * *', // Every day at midnight
  maxDuration: 300,
  run: async () => {
    const now = new Date();

    // Find trialing subscriptions that have expired
    const expiredTrials = await db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.status, 'trialing'),
        lt(subscriptions.stripeCurrentPeriodEnd, now)
      ),
    });

    let processed = 0;
    let updated = 0;

    for (const trial of expiredTrials) {
      processed++;
      try {
        // Update status to expired
        await db
          .update(subscriptions)
          .set({
            status: 'expired',
            updatedAt: now,
          })
          .where(eq(subscriptions.id, trial.id));

        updated++;
        console.warn(`[CleanupTrials] Expired trial ${trial.id}`);
      } catch (error) {
        console.error(`[CleanupTrials] Failed to update ${trial.id}:`, error);
      }
    }

    return {
      success: true,
      processed,
      updated,
      expiredCount: expiredTrials.length,
    };
  },
});

// Process subscription cancellations (send emails, cleanup)
export const processSubscriptionCancellation = task({
  id: 'process-subscription-cancellation',
  maxDuration: 60,
  retry: {
    maxAttempts: 3,
  },
  run: async (payload: {
    userId: string;
    subscriptionId: string;
    plan: string;
    endDate: Date;
  }) => {
    const { userId, subscriptionId, plan, endDate } = payload;

    // Get user info
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      console.warn(`[CancellationProcess] User not found: ${userId}`);
      return { success: false, reason: 'user_not_found' };
    }

    // Send cancellation email
    await sendCancellationEmail.trigger({
      email: user.email,
      name: user.name || 'Cliente',
      plan,
      endDate: formatDate(endDate),
    });

    console.warn(`[CancellationProcess] Processed cancellation for ${user.email}`);

    return {
      success: true,
      userId,
      subscriptionId,
      emailSent: true,
    };
  },
});

// Sync subscriptions with Stripe (daily reconciliation)
export const syncSubscriptionsWithStripe = schedules.task({
  id: 'sync-subscriptions-with-stripe',
  cron: '0 3 * * *', // Every day at 3 AM
  maxDuration: 600,
  run: async () => {
    if (!stripe) {
      return { success: false, reason: 'stripe_not_configured' };
    }

    const allSubscriptions = await db.query.subscriptions.findMany({
      where: eq(subscriptions.status, 'active'),
    });

    let synced = 0;
    let updated = 0;
    let errors = 0;

    for (const sub of allSubscriptions) {
      synced++;
      try {
        const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);

        // Check if status differs
        if (stripeSub.status !== sub.status) {
          await db
            .update(subscriptions)
            .set({
              status: stripeSub.status,
              cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
              stripeCurrentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.id, sub.id));

          updated++;
          console.warn(`[SyncStripe] Updated subscription ${sub.id}: ${sub.status} -> ${stripeSub.status}`);
        }
      } catch (error) {
        errors++;
        console.error(`[SyncStripe] Error syncing ${sub.id}:`, error);
      }
    }

    return {
      success: true,
      synced,
      updated,
      errors,
    };
  },
});
