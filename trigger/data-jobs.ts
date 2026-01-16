import { task, schedules } from '@trigger.dev/sdk/v3';
import { db } from '@/lib/db';
import { users, subscriptions, usage } from '@/lib/db/schema';
import { eq, lt, and } from 'drizzle-orm';
import { uploadToR2 } from '@/lib/storage';
import { sendWelcomeEmail } from './email-jobs';

// Helper function to escape CSV values properly
function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  // Convert to string
  let str: string;
  if (value instanceof Date) {
    str = value.toISOString();
  } else if (typeof value === 'object') {
    str = JSON.stringify(value);
  } else {
    str = String(value);
  }

  // Check if escaping is needed
  const needsEscaping = str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r');

  if (needsEscaping) {
    // Escape double quotes by doubling them and wrap in quotes
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

// Process large data exports (CSV/JSON)
export const processDataExport = task({
  id: 'process-data-export',
  maxDuration: 300, // 5 minutes
  retry: {
    maxAttempts: 2,
  },
  run: async (payload: {
    userId: string;
    exportType: 'csv' | 'json';
    dataType: 'usage' | 'subscriptions' | 'all';
  }) => {
    const { userId, exportType, dataType } = payload;

    console.log(`[DataExport] Processing ${exportType} export for user ${userId}, type: ${dataType}`);

    // Fetch user data based on type
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      return { success: false, reason: 'user_not_found' };
    }

    let exportData: Record<string, unknown>[] = [];

    switch (dataType) {
      case 'usage':
        const userUsage = await db.query.usage.findMany({
          where: eq(usage.userId, user.id),
        });
        exportData = userUsage;
        break;

      case 'subscriptions':
        const userSubs = await db.query.subscriptions.findMany({
          where: eq(subscriptions.userId, user.id),
        });
        exportData = userSubs;
        break;

      case 'all':
        const allUsage = await db.query.usage.findMany({
          where: eq(usage.userId, user.id),
        });
        const allSubs = await db.query.subscriptions.findMany({
          where: eq(subscriptions.userId, user.id),
        });
        exportData = [
          { type: 'user', data: user },
          { type: 'usage', data: allUsage },
          { type: 'subscriptions', data: allSubs },
        ];
        break;
    }

    // Format data
    let content: string;
    let contentType: string;
    let fileExtension: string;

    if (exportType === 'json') {
      content = JSON.stringify(exportData, null, 2);
      contentType = 'application/json';
      fileExtension = 'json';
    } else {
      // CSV format with proper escaping
      if (exportData.length === 0) {
        content = '';
      } else {
        const headers = Object.keys(exportData[0] || {}).join(',');
        const rows = exportData.map((row) =>
          Object.values(row)
            .map((v) => escapeCsvValue(v))
            .join(',')
        );
        content = [headers, ...rows].join('\n');
      }
      contentType = 'text/csv';
      fileExtension = 'csv';
    }

    // Upload to R2
    const filename = `exports/${userId}/${Date.now()}-${dataType}.${fileExtension}`;
    const buffer = Buffer.from(content, 'utf-8');

    try {
      const url = await uploadToR2(filename, buffer, contentType);
      console.log(`[DataExport] Export uploaded: ${url}`);

      return {
        success: true,
        userId,
        exportType,
        dataType,
        fileUrl: url,
        recordCount: exportData.length,
      };
    } catch (error) {
      console.error('[DataExport] Upload failed:', error);
      return { success: false, reason: 'upload_failed' };
    }
  },
});

// Weekly usage report generation
export const generateWeeklyReports = schedules.task({
  id: 'generate-weekly-reports',
  cron: '0 6 * * 1', // Every Monday at 6 AM
  maxDuration: 600, // 10 minutes
  run: async () => {
    console.log('[WeeklyReports] Generating weekly reports...');

    const allUsers = await db.query.users.findMany({
      columns: {
        id: true,
        email: true,
        name: true,
        clerkId: true,
      },
    });

    let processed = 0;
    let errors = 0;

    for (const user of allUsers) {
      try {
        // Calculate weekly usage for each user
        const userUsage = await db.query.usage.findMany({
          where: eq(usage.userId, user.id),
        });

        const report = {
          userId: user.id,
          email: user.email,
          weekEnding: new Date().toISOString(),
          totalFeatures: userUsage.length,
          usageSummary: userUsage.map((u) => ({
            feature: u.feature,
            count: u.count,
            limit: u.limit,
            percentUsed: Math.round((u.count / u.limit) * 100),
          })),
        };

        console.log(`[WeeklyReports] Generated report for ${user.email}:`, JSON.stringify(report));
        processed++;
      } catch (error) {
        console.error(`[WeeklyReports] Error for ${user.email}:`, error);
        errors++;
      }
    }

    return {
      success: true,
      processed,
      errors,
      totalUsers: allUsers.length,
    };
  },
});

// Clean up old files from R2 (older than 30 days)
export const cleanupOldFiles = schedules.task({
  id: 'cleanup-old-files',
  cron: '0 3 * * 0', // Every Sunday at 3 AM
  maxDuration: 300,
  run: async () => {
    console.log('[CleanupFiles] Starting file cleanup...');

    // In a real implementation, you would:
    // 1. List all files in the exports folder
    // 2. Check creation dates
    // 3. Delete files older than 30 days

    // For now, we'll log what would be cleaned
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    console.log(`[CleanupFiles] Would delete files older than ${thirtyDaysAgo.toISOString()}`);

    // Example: Track files to delete
    const filesToDelete: string[] = [];

    // In production, iterate through R2 bucket and delete old files
    // const objects = await listR2Objects('exports/');
    // for (const obj of objects) {
    //   if (obj.lastModified < thirtyDaysAgo) {
    //     await deleteFromR2(obj.key);
    //     filesToDelete.push(obj.key);
    //   }
    // }

    return {
      success: true,
      deletedFiles: filesToDelete.length,
      cutoffDate: thirtyDaysAgo.toISOString(),
    };
  },
});

// Reset monthly usage limits
export const resetMonthlyUsage = schedules.task({
  id: 'reset-monthly-usage',
  cron: '0 0 1 * *', // First day of each month at midnight
  maxDuration: 300,
  run: async () => {
    console.log('[ResetUsage] Resetting monthly usage limits...');

    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Get all usage records that need reset
    const usageRecords = await db.query.usage.findMany({
      where: lt(usage.resetAt, now),
    });

    let reset = 0;
    let errors = 0;

    for (const record of usageRecords) {
      try {
        await db
          .update(usage)
          .set({
            count: 0,
            resetAt: nextMonth,
            updatedAt: now,
          })
          .where(eq(usage.id, record.id));

        reset++;
        console.log(`[ResetUsage] Reset usage for ${record.userId}, feature: ${record.feature}`);
      } catch (error) {
        errors++;
        console.error(`[ResetUsage] Failed to reset ${record.id}:`, error);
      }
    }

    return {
      success: true,
      reset,
      errors,
      totalRecords: usageRecords.length,
    };
  },
});

// Sync user data with external services
export const syncExternalServices = task({
  id: 'sync-external-services',
  maxDuration: 120,
  retry: {
    maxAttempts: 3,
  },
  run: async (payload: {
    userId: string;
    services: ('analytics' | 'crm' | 'billing')[];
  }) => {
    const { userId, services } = payload;

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      return { success: false, reason: 'user_not_found' };
    }

    const results: Record<string, { success: boolean; error?: string }> = {};

    for (const service of services) {
      try {
        switch (service) {
          case 'analytics':
            // Sync with PostHog
            console.log(`[SyncServices] Syncing ${user.email} with analytics`);
            // In production: await posthog.identify(userId, { email: user.email, ... })
            results[service] = { success: true };
            break;

          case 'crm':
            // Sync with CRM (e.g., HubSpot)
            console.log(`[SyncServices] Syncing ${user.email} with CRM`);
            // In production: await crm.upsertContact(user)
            results[service] = { success: true };
            break;

          case 'billing':
            // Sync with Stripe
            console.log(`[SyncServices] Syncing ${user.email} with billing`);
            // In production: await stripe.customers.update(...)
            results[service] = { success: true };
            break;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[SyncServices] Failed to sync ${service}:`, message);
        results[service] = { success: false, error: message };
      }
    }

    return {
      success: Object.values(results).every((r) => r.success),
      userId,
      results,
    };
  },
});

// Process new user onboarding (background tasks after signup)
export const processUserOnboarding = task({
  id: 'process-user-onboarding',
  maxDuration: 60,
  retry: {
    maxAttempts: 3,
  },
  run: async (payload: {
    userId: string;
    email: string;
    name: string;
  }) => {
    const { userId, email, name } = payload;

    console.log(`[Onboarding] Processing onboarding for ${email}`);

    // 1. Send welcome email
    await sendWelcomeEmail.trigger({
      email,
      name: name || 'Novo usuário',
      userId,
    });

    // 2. Initialize usage tracking
    const defaultUsageLimits = [
      { feature: 'ai_generations', limit: 100 },
      { feature: 'storage_mb', limit: 500 },
      { feature: 'api_calls', limit: 1000 },
    ];

    // Get internal user ID
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (user) {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);

      for (const { feature, limit } of defaultUsageLimits) {
        try {
          await db.insert(usage).values({
            userId: user.id,
            feature,
            count: 0,
            limit,
            resetAt: nextMonth,
          });
        } catch (error) {
          // Might already exist, ignore
          console.log(`[Onboarding] Usage ${feature} might already exist`);
        }
      }
    }

    // 3. Sync with external services
    await syncExternalServices.trigger({
      userId,
      services: ['analytics'],
    });

    console.log(`[Onboarding] Completed onboarding for ${email}`);

    return {
      success: true,
      userId,
      email,
      tasksCompleted: ['welcome_email', 'usage_init', 'analytics_sync'],
    };
  },
});
