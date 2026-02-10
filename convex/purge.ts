import { v } from "convex/values";
import type { TableNames } from "./_generated/dataModel";
import { internalMutation } from "./_generated/server";
import { validation } from "./lib/errors";

const TABLES: TableNames[] = [
  "documents",
  "documentVersions",
  "documentTemplates",
  "workspaces",
  "projects",
  "projectMembers",
  "issues",
  "issueComments",
  "issueLinks",
  "sprints",
  "issueActivity",
  "issueWatchers",
  "labels",
  "issueTemplates",
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
  "userOnboarding",
  "calendarEvents",
  "meetingAttendance",
  "availabilitySlots",
  "bookingPages",
  "bookings",
  "calendarConnections",
  "githubConnections",
  "githubRepositories",
  "githubPullRequests",
  "githubCommits",
  "offlineSyncQueue",
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
  "organizationMembers",
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
  "rateLimits",
  "auditLogs",
  "users",
  "authAccounts",
  "authSessions",
  "authRefreshTokens",
  "authVerificationCodes",
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
