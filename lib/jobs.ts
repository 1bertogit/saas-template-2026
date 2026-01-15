// Re-export trigger jobs for easy invocation
// Import these in your API routes or server actions to trigger background jobs

export { sendWelcomeEmail, sendSubscriptionEmail } from '@/trigger/email-jobs';
export { retryFailedPayment, subscriptionRenewalReminder } from '@/trigger/subscription-jobs';
export { processDataExport, syncExternalServices } from '@/trigger/data-jobs';

// Helper function to safely trigger jobs with error handling
export async function triggerJob<T>(
  job: { trigger: (payload: T) => Promise<{ id: string }> },
  payload: T,
  options?: { idempotencyKey?: string }
): Promise<{ success: boolean; runId?: string; error?: string }> {
  try {
    const result = await job.trigger(payload);
    return { success: true, runId: result.id };
  } catch (error) {
    console.error('Failed to trigger job:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
