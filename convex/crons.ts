/**
 * Scheduled Cron Jobs
 *
 * Handles automated tasks like sending digest emails
 */

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Send daily digest emails
 * Runs every day at 9:00 AM UTC
 */
crons.daily(
  "send daily digests",
  { hourUTC: 9, minuteUTC: 0 },
  internal.email.digests.sendDailyDigests,
);

/**
 * Send weekly digest emails
 * Runs every Monday at 9:00 AM UTC
 */
crons.weekly(
  "send weekly digests",
  { dayOfWeek: "monday", hourUTC: 9, minuteUTC: 0 },
  internal.email.digests.sendWeeklyDigests,
);

/**
 * Cleanup old test users (E2E testing)
 * Runs every hour to delete test users older than 1 hour
 * Only affects users with isTestUser=true flag
 */
crons.interval("cleanup test users", { hours: 1 }, internal.e2e.cleanupTestUsersInternal);

/**
 * Cleanup expired test OTP codes (E2E testing)
 * Runs every 15 minutes to remove expired plaintext OTPs
 * Prevents testOtpCodes table from growing indefinitely
 */
crons.interval("cleanup expired otps", { minutes: 15 }, internal.e2e.cleanupExpiredOtpsInternal);

/**
 * Auto-retry failed offline sync items
 * Runs every 5 minutes to check for failed items ready to retry
 * Uses exponential backoff: 5min, 15min, 45min, 2h, 6h
 * Archives items after 5 failed attempts
 */
crons.interval("retry failed sync items", { minutes: 5 }, internal.offlineSync.autoRetryFailed);

/**
 * Cleanup old completed offline sync items
 * Runs daily to remove completed items older than 7 days
 * Prevents offlineSyncQueue table from growing indefinitely
 */
crons.daily(
  "cleanup old sync items",
  { hourUTC: 3, minuteUTC: 0 },
  internal.offlineSync.cleanupOldItems,
);

/**
 * Permanently delete soft-deleted records older than 30 days
 * Runs daily at 2:00 AM UTC
 * Applies to: projects, documents, issues, sprints, projectMembers
 */
crons.daily(
  "cleanup soft deletes",
  { hourUTC: 2, minuteUTC: 0 },
  internal.softDeleteCleanup.permanentlyDeleteOld,
);

/**
 * OAuth Health Check
 * Runs every 15 minutes to verify Google OAuth is working
 * Catches issues like expired refresh tokens or API outages
 */
crons.interval(
  "oauth health check",
  { minutes: 15 },
  internal.oauthHealthCheck.checkGoogleOAuthHealth,
);

export default crons;
