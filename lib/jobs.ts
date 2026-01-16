// Re-export trigger jobs for easy invocation
// Import these in your API routes or server actions to trigger background jobs

// Email jobs
export {
  sendWelcomeEmail,
  sendSubscriptionEmail,
  sendCancellationEmail,
  sendPaymentFailedEmail,
  dailyDigestEmail,
} from '@/trigger/email-jobs';

// Subscription jobs
export {
  subscriptionRenewalReminder,
  retryFailedPayment,
  cleanupExpiredTrials,
  processSubscriptionCancellation,
  syncSubscriptionsWithStripe,
} from '@/trigger/subscription-jobs';

// Data jobs
export {
  processDataExport,
  generateWeeklyReports,
  cleanupOldFiles,
  resetMonthlyUsage,
  syncExternalServices,
  processUserOnboarding,
} from '@/trigger/data-jobs';

// Type for job trigger result
type JobTriggerResult<T = unknown> = {
  success: boolean;
  runId?: string;
  error?: string;
  data?: T;
};

// Helper function to safely trigger jobs with error handling
export async function triggerJob<TPayload, TResult = unknown>(
  job: { trigger: (payload: TPayload) => Promise<{ id: string }> },
  payload: TPayload
): Promise<JobTriggerResult<TResult>> {
  try {
    const result = await job.trigger(payload);
    return { success: true, runId: result.id };
  } catch (error) {
    console.error('[TriggerJob] Failed to trigger job:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Helper to trigger multiple jobs in parallel
export async function triggerJobsInParallel<T extends Record<string, { job: { trigger: (payload: unknown) => Promise<{ id: string }> }; payload: unknown }>>(
  jobs: T
): Promise<Record<keyof T, JobTriggerResult>> {
  const entries = Object.entries(jobs) as [keyof T, { job: { trigger: (payload: unknown) => Promise<{ id: string }> }; payload: unknown }][];

  const results = await Promise.allSettled(
    entries.map(async ([key, { job, payload }]) => {
      const result = await triggerJob(job, payload);
      return { key, result };
    })
  );

  return results.reduce((acc, result, index) => {
    const key = entries[index][0];
    if (result.status === 'fulfilled') {
      acc[key] = result.value.result;
    } else {
      acc[key] = { success: false, error: result.reason?.message || 'Unknown error' };
    }
    return acc;
  }, {} as Record<keyof T, JobTriggerResult>);
}
