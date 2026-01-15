import { task, schedules } from '@trigger.dev/sdk/v3';

// Process subscription renewal reminders
export const subscriptionRenewalReminder = schedules.task({
  id: 'subscription-renewal-reminder',
  cron: '0 10 * * *', // Every day at 10 AM
  maxDuration: 300,
  run: async () => {
    // Find subscriptions expiring in 7 days and send reminders
    console.log('Checking for subscriptions expiring soon...');

    // Example implementation:
    // const expiringSubscriptions = await db.query.subscriptions.findMany({
    //   where: and(
    //     eq(subscriptions.status, 'active'),
    //     lt(subscriptions.currentPeriodEnd, addDays(new Date(), 7))
    //   ),
    // });
    //
    // for (const sub of expiringSubscriptions) {
    //   await sendRenewalReminder.trigger({ subscriptionId: sub.id });
    // }

    return { processed: 0, success: true };
  },
});

// Handle failed payment retry
export const retryFailedPayment = task({
  id: 'retry-failed-payment',
  maxDuration: 120,
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 60000, // Wait 1 minute between retries
  },
  run: async (payload: { subscriptionId: string; attemptNumber: number }) => {
    const { subscriptionId, attemptNumber } = payload;

    console.log(`Retrying payment for subscription ${subscriptionId}, attempt ${attemptNumber}`);

    // Example: Use Stripe API to retry the payment
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    // if (subscription.latest_invoice) {
    //   await stripe.invoices.pay(subscription.latest_invoice as string);
    // }

    return { success: true, attemptNumber };
  },
});

// Clean up expired trials
export const cleanupExpiredTrials = schedules.task({
  id: 'cleanup-expired-trials',
  cron: '0 0 * * *', // Every day at midnight
  maxDuration: 300,
  run: async () => {
    console.log('Cleaning up expired trials...');

    // Example:
    // const expiredTrials = await db.query.subscriptions.findMany({
    //   where: and(
    //     eq(subscriptions.status, 'trialing'),
    //     lt(subscriptions.trialEnd, new Date())
    //   ),
    // });
    //
    // for (const trial of expiredTrials) {
    //   await db.update(subscriptions)
    //     .set({ status: 'expired' })
    //     .where(eq(subscriptions.id, trial.id));
    // }

    return { processed: 0, success: true };
  },
});
