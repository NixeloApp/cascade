import { v } from "convex/values";
import type { TableNames } from "./_generated/dataModel";
import { internalMutation } from "./_generated/server";
import { validation } from "./lib/errors";

export const TABLES: TableNames[] = [
  "documents",
  "documentVersions",
  "documentTemplates",
  "documentFavorites",
  "yjsDocuments",
  "yjsAwareness",
  "workspaces",
  "workspaceMembers",
  "projects",
  "projectMembers",
  "issues",
  "issueComments",
  "issueCommentReactions",
  "documentComments",
  "documentCommentReactions",
  "issueLinks",
  "sprints",
  "issueActivity",
  "issueWatchers",
  "labelGroups",
  "labels",
  "issueTemplates",
  "inboxIssues",
  "webhooks",
  "webhookExecutions",
  "savedFilters",
  "projectTemplates",
  "automationRules",
  "customFields",
  "customFieldValues",
  "notifications",
  "notificationPreferences",
  "unsubscribeTokens",
  "pushSubscriptions",
  "userOnboarding",
  "calendarEvents",
  "meetingAttendance",
  "eventReminders",
  "availabilitySlots",
  "bookingPages",
  "bookings",
  "calendarConnections",
  "githubConnections",
  "githubRepositories",
  "githubPullRequests",
  "githubCommits",
  "offlineSyncQueue",
  "testOtpCodes",
  "oauthHealthChecks",
  "oauthTokenHealthChecks",
  "aiChats",
  "aiMessages",
  "aiSuggestions",
  "aiUsage",
  "apiKeys",
  "apiUsageLogs",
  "pumbleWebhooks",
  "timeEntries",
  "userRates",
  "userProfiles",
  "employmentTypeConfigs",
  "hourComplianceRecords",
  "invites",
  "organizations",
  "organizationIpAllowlist",
  "organizationMembers",
  "ssoConnections",
  "ssoDomains",
  "teams",
  "teamMembers",
  "meetingRecordings",
  "meetingTranscripts",
  "meetingSummaries",
  "meetingParticipants",
  "serviceUsage",
  "serviceProviders",
  "meetingBotJobs",
  "userSettings",
  "auditLogs",
  "users",
  "authAccounts",
  "authSessions",
  // 2FA sessions
  "twoFactorSessions",
  "authRefreshTokens",
  "authVerificationCodes",
  "authVerifiers",
  "authRateLimits",
];

/** Purges all data from the database in batches, requires confirmation parameter. */
export const purgeData = internalMutation({
  args: {
    confirm: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (!args.confirm) {
      throw validation("confirm", "Confirmation required to purge data.");
    }

    let totalDeleted = 0;
    const TARGET_DELETES = 3000; // Increased to 3000 for faster final push
    let totalTablesProcessed = 0;

    for (const table of TABLES) {
      const records = await ctx.db.query(table).take(TARGET_DELETES - totalDeleted);

      for (const record of records) {
        await ctx.db.delete(record._id);
        totalDeleted++;
      }

      totalTablesProcessed++;
      if (totalDeleted >= TARGET_DELETES) {
        break;
      }
    }

    return {
      success: true,
      totalDeleted,
      tablesProcessed: totalTablesProcessed,
    };
  },
});
