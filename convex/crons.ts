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
 * Process scheduled automation triggers (stale_in_status)
 * Runs daily at 4:00 AM UTC
 * Finds issues that have been in a specific status for longer than configured days
 * and executes the matching automation rule's action
 */
crons.daily(
  "process scheduled automation triggers",
  { hourUTC: 4, minuteUTC: 0 },
  internal.automationRules.processScheduledTriggers,
);

/**
 * Auto-archive done issues
 * Runs daily at 3:00 AM UTC
 * Archives issues in "done" workflow states older than the project's autoArchiveDays setting
 */
crons.daily(
  "auto-archive done issues",
  { hourUTC: 3, minuteUTC: 0 },
  internal.autoArchive.archiveStaleDoneIssues,
);

/**
 * OAuth Health Check (Synthetic)
 * Runs every 15 minutes to verify Google OAuth is working
 * Catches issues like expired refresh tokens or API outages
 */
crons.interval(
  "oauth health check",
  { minutes: 15 },
  internal.oauthHealthCheck.checkGoogleOAuthHealth,
);

/**
 * OAuth Token Health Monitor
 * Runs every hour to check all user OAuth tokens
 * Auto-refreshes expiring tokens before they expire
 * Reports aggregated health statistics
 */
crons.interval(
  "oauth token health monitor",
  { hours: 1 },
  internal.oauthTokenMonitor.performTokenHealthCheck,
  {}, // Use default autoRefresh=true
);

/**
 * Process Event Reminders
 * Runs every 5 minutes to send due calendar event reminders
 * Sends email/push/in-app notifications based on user preferences
 */
crons.interval(
  "process event reminders",
  { minutes: 5 },
  internal.eventReminders.processDueReminders,
);

/**
 * Outreach: Process due sequence enrollments
 * Runs every 2 minutes to send emails for active enrollments where nextSendAt has passed
 */
crons.interval(
  "process outreach sends",
  { minutes: 2 },
  internal.outreach.sendEngine.processDueEnrollments,
);

/**
 * Outreach: Reset daily mailbox send counters
 * Runs daily at midnight UTC
 */
crons.daily(
  "reset outreach daily send counts",
  { hourUTC: 0, minuteUTC: 0 },
  internal.outreach.sendEngine.resetDailySendCounts,
);

export default crons;
