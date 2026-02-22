import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { internalAction, internalMutation, mutation, query } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { batchFetchCalendarEvents, batchFetchRecordings } from "./lib/batchHelpers";
import { requireBotApiKey } from "./lib/botAuth";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { getBotServiceApiKey, getBotServiceUrl } from "./lib/env";
import { conflict, forbidden, getErrorMessage, notFound, validation } from "./lib/errors";
import { fetchWithTimeout } from "./lib/fetchWithTimeout";
import { notDeleted } from "./lib/softDeleteHelpers";
import { assertCanAccessProject, assertCanEditProject } from "./projectAccess";
import { simplePriorities } from "./validators";

const BOT_SERVICE_TIMEOUT_MS = 30000;

// ===========================================
// Queries
// ===========================================

/**
 * List meeting recordings for the current user, optionally filtered by project.
 *
 * Efficiently fetches related calendar events in a single batch to avoid N+1 queries.
 * Also optimizes existence checks for transcripts and summaries based on recording status.
 *
 * @param projectId - Optional project ID to filter recordings.
 * @param limit - Max number of recordings to return (default: 20).
 * @returns Array of enriched recording objects.
 */
export const listRecordings = authenticatedQuery({
  args: {
    projectId: v.optional(v.id("projects")),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("meetingRecordings"),
      _creationTime: v.number(),
      calendarEventId: v.optional(v.id("calendarEvents")),
      meetingUrl: v.optional(v.string()),
      meetingPlatform: v.union(
        v.literal("google_meet"),
        v.literal("zoom"),
        v.literal("teams"),
        v.literal("other"),
      ),
      title: v.string(),
      recordingFileId: v.optional(v.id("_storage")),
      recordingUrl: v.optional(v.string()),
      duration: v.optional(v.number()),
      fileSize: v.optional(v.number()),
      status: v.union(
        v.literal("scheduled"),
        v.literal("joining"),
        v.literal("recording"),
        v.literal("processing"),
        v.literal("transcribing"),
        v.literal("summarizing"),
        v.literal("completed"),
        v.literal("cancelled"),
        v.literal("failed"),
      ),
      errorMessage: v.optional(v.string()),
      scheduledStartTime: v.optional(v.number()),
      actualStartTime: v.optional(v.number()),
      actualEndTime: v.optional(v.number()),
      botJoinedAt: v.optional(v.number()),
      botLeftAt: v.optional(v.number()),
      botName: v.string(),
      createdBy: v.id("users"),
      projectId: v.optional(v.id("projects")),
      isPublic: v.boolean(),
      createdAt: v.number(),
      updatedAt: v.number(),
      /** Google Calendar event - external API structure. v.any() is intentional. */
      calendarEvent: v.union(v.any(), v.null()),
      hasTranscript: v.boolean(),
      hasSummary: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    let recordings: Doc<"meetingRecordings">[];
    if (args.projectId) {
      // Security: Ensure user has access to the project
      await assertCanAccessProject(ctx, args.projectId, ctx.userId);

      recordings = await ctx.db
        .query("meetingRecordings")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .order("desc")
        .take(limit);

      // Security: Filter out private recordings from other users
      recordings = recordings.filter((r) => r.isPublic || r.createdBy === ctx.userId);
    } else {
      recordings = await ctx.db
        .query("meetingRecordings")
        .withIndex("by_creator", (q) => q.eq("createdBy", ctx.userId))
        .order("desc")
        .take(limit);
    }

    // Batch fetch all related data to avoid N+1 queries
    const calendarEventIds = recordings
      .map((r) => r.calendarEventId)
      .filter((id): id is Id<"calendarEvents"> => !!id);

    // Parallel fetch: calendar events
    const calendarEventMap = await batchFetchCalendarEvents(ctx, calendarEventIds);

    // Enrich with pre-fetched data (no N+1 - all fetches are parallel)
    return recordings.map((recording) => {
      // Optimization: Deduce existence from status to avoid fetching large docs
      // Statuses "summarizing" and "completed" imply a transcript exists.
      // Status "completed" implies a summary exists.
      // For "failed" status, we default to false even if partial data might exist,
      // as users should view details for failed items.
      const hasTranscript = recording.status === "summarizing" || recording.status === "completed";
      const hasSummary = recording.status === "completed";

      return {
        ...recording,
        createdAt: recording._creationTime,
        calendarEvent: recording.calendarEventId
          ? (calendarEventMap.get(recording.calendarEventId) ?? null)
          : null,
        hasTranscript,
        hasSummary,
      };
    });
  },
});

/** Get a meeting recording by its linked calendar event, including summary and job status. */
export const getRecordingByCalendarEvent = authenticatedQuery({
  args: { calendarEventId: v.id("calendarEvents") },
  handler: async (ctx, args) => {
    const recording = await ctx.db
      .query("meetingRecordings")
      .withIndex("by_calendar_event", (q) => q.eq("calendarEventId", args.calendarEventId))
      .first();

    if (!recording) return null;

    // Check access
    if (recording.projectId) {
      await assertCanAccessProject(ctx, recording.projectId, ctx.userId);
    }

    if (recording.createdBy !== ctx.userId && !recording.isPublic) {
      return null;
    }

    const summary = await ctx.db
      .query("meetingSummaries")
      .withIndex("by_recording", (q) => q.eq("recordingId", recording._id))
      .first();

    const job = await ctx.db
      .query("meetingBotJobs")
      .withIndex("by_recording", (q) => q.eq("recordingId", recording._id))
      .first();

    return {
      ...recording,
      hasSummary: !!summary,
      summary,
      job,
    };
  },
});

/** Get a single recording with full details including transcript, summary, participants, and job status. */
export const getRecording = authenticatedQuery({
  args: { recordingId: v.id("meetingRecordings") },
  handler: async (ctx, args) => {
    const recording = await ctx.db.get(args.recordingId);
    if (!recording) throw notFound("recording", args.recordingId);

    // Check access
    if (recording.projectId) {
      await assertCanAccessProject(ctx, recording.projectId, ctx.userId);
    }

    if (recording.createdBy !== ctx.userId && !recording.isPublic) {
      throw forbidden(undefined, "Not authorized to view this recording");
    }

    const calendarEvent = recording.calendarEventId
      ? await ctx.db.get(recording.calendarEventId)
      : null;

    const transcript = await ctx.db
      .query("meetingTranscripts")
      .withIndex("by_recording", (q) => q.eq("recordingId", recording._id))
      .first();

    const summary = await ctx.db
      .query("meetingSummaries")
      .withIndex("by_recording", (q) => q.eq("recordingId", recording._id))
      .first();

    const participants = await ctx.db
      .query("meetingParticipants")
      .withIndex("by_recording", (q) => q.eq("recordingId", recording._id))
      .take(BOUNDED_LIST_LIMIT);

    const job = await ctx.db
      .query("meetingBotJobs")
      .withIndex("by_recording", (q) => q.eq("recordingId", recording._id))
      .first();

    return {
      ...recording,
      calendarEvent,
      transcript,
      summary,
      participants,
      job,
    };
  },
});

/** Get the transcript for a meeting recording. Requires ownership or public access. */
export const getTranscript = authenticatedQuery({
  args: { recordingId: v.id("meetingRecordings") },
  handler: async (ctx, args) => {
    const recording = await ctx.db.get(args.recordingId);
    if (!recording) throw notFound("recording", args.recordingId);

    if (recording.projectId) {
      await assertCanAccessProject(ctx, recording.projectId, ctx.userId);
    }

    if (recording.createdBy !== ctx.userId && !recording.isPublic) {
      throw forbidden();
    }

    return ctx.db
      .query("meetingTranscripts")
      .withIndex("by_recording", (q) => q.eq("recordingId", args.recordingId))
      .first();
  },
});

/** Get the AI-generated summary for a meeting recording. Requires ownership or public access. */
export const getSummary = authenticatedQuery({
  args: { recordingId: v.id("meetingRecordings") },
  handler: async (ctx, args) => {
    const recording = await ctx.db.get(args.recordingId);
    if (!recording) throw notFound("recording", args.recordingId);

    if (recording.projectId) {
      await assertCanAccessProject(ctx, recording.projectId, ctx.userId);
    }

    if (recording.createdBy !== ctx.userId && !recording.isPublic) {
      throw forbidden();
    }

    return ctx.db
      .query("meetingSummaries")
      .withIndex("by_recording", (q) => q.eq("recordingId", args.recordingId))
      .first();
  },
});

/** Return pending bot jobs ready to execute within the next 5 minutes. Authenticated via bot service API key. */
export const getPendingJobs = query({
  args: {
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate bot service API key
    await requireBotApiKey(ctx, args.apiKey);

    const now = Date.now();

    // Get jobs that are pending and scheduled to start within next 5 minutes
    // Bounded to prevent memory issues with many pending jobs
    // Optimized: Use by_status_scheduled index to filter at DB level, preventing starvation by future jobs
    const readyJobs = await ctx.db
      .query("meetingBotJobs")
      .withIndex("by_status_scheduled", (q) =>
        q.eq("status", "pending").lte("scheduledTime", now + 5 * 60 * 1000),
      )
      .take(BOUNDED_LIST_LIMIT);

    // Batch fetch recordings to avoid N+1 queries
    const recordingIds = readyJobs.map((job) => job.recordingId);
    const recordingMap = await batchFetchRecordings(ctx, recordingIds);

    // Enrich with pre-fetched recording data (no N+1)
    return readyJobs.map((job) => ({
      ...job,
      recording: recordingMap.get(job.recordingId) ?? null,
    }));
  },
});

// ===========================================
// Mutations
// ===========================================

/** Schedule a meeting bot to join and record a meeting at a specified time. */
export const scheduleRecording = authenticatedMutation({
  args: {
    calendarEventId: v.optional(v.id("calendarEvents")),
    meetingUrl: v.string(),
    title: v.string(),
    meetingPlatform: v.union(
      v.literal("google_meet"),
      v.literal("zoom"),
      v.literal("teams"),
      v.literal("other"),
    ),
    scheduledStartTime: v.number(),
    projectId: v.optional(v.id("projects")),
    isPublic: v.optional(v.boolean()),
  },
  returns: v.id("meetingRecordings"),
  handler: async (ctx, args) => {
    const now = Date.now();

    if (args.projectId) {
      await assertCanEditProject(ctx, args.projectId, ctx.userId);
    }

    // Create the recording record
    const recordingId = await ctx.db.insert("meetingRecordings", {
      calendarEventId: args.calendarEventId,
      meetingUrl: args.meetingUrl,
      meetingPlatform: args.meetingPlatform,
      title: args.title,
      status: "scheduled",
      scheduledStartTime: args.scheduledStartTime,
      botName: "Nixelo Notetaker",
      createdBy: ctx.userId,
      projectId: args.projectId,
      isPublic: args.isPublic ?? false,
      updatedAt: now,
    });

    // Create the bot job
    await ctx.db.insert("meetingBotJobs", {
      recordingId,
      meetingUrl: args.meetingUrl,
      scheduledTime: args.scheduledStartTime,
      status: "pending",
      attempts: 0,
      maxAttempts: 3,
      updatedAt: now,
    });

    // Schedule the bot to start (Convex scheduler)
    await ctx.scheduler.runAt(
      new Date(args.scheduledStartTime),
      internal.meetingBot.triggerBotJob,
      { recordingId },
    );

    return recordingId;
  },
});

/** Start recording an ad-hoc meeting immediately by dispatching the bot now. */
export const startRecordingNow = authenticatedMutation({
  args: {
    meetingUrl: v.string(),
    title: v.string(),
    meetingPlatform: v.union(
      v.literal("google_meet"),
      v.literal("zoom"),
      v.literal("teams"),
      v.literal("other"),
    ),
    projectId: v.optional(v.id("projects")),
  },
  returns: v.id("meetingRecordings"),
  handler: async (ctx, args) => {
    const now = Date.now();

    if (args.projectId) {
      await assertCanEditProject(ctx, args.projectId, ctx.userId);
    }

    const recordingId = await ctx.db.insert("meetingRecordings", {
      meetingUrl: args.meetingUrl,
      meetingPlatform: args.meetingPlatform,
      title: args.title,
      status: "scheduled",
      scheduledStartTime: now,
      botName: "Nixelo Notetaker",
      createdBy: ctx.userId,
      projectId: args.projectId,
      isPublic: false,
      updatedAt: now,
    });

    await ctx.db.insert("meetingBotJobs", {
      recordingId,
      meetingUrl: args.meetingUrl,
      scheduledTime: now,
      status: "pending",
      attempts: 0,
      maxAttempts: 3,
      updatedAt: now,
    });

    // Trigger immediately
    await ctx.scheduler.runAfter(0, internal.meetingBot.triggerBotJob, {
      recordingId,
    });

    return recordingId;
  },
});

/** Cancel a scheduled recording. Only the creator can cancel, and only while status is 'scheduled'. */
export const cancelRecording = authenticatedMutation({
  args: { recordingId: v.id("meetingRecordings") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const recording = await ctx.db.get(args.recordingId);
    if (!recording) throw notFound("recording", args.recordingId);

    if (recording.createdBy !== ctx.userId) {
      throw forbidden(undefined, "Not authorized to cancel this recording");
    }

    if (recording.status !== "scheduled") {
      throw conflict(
        `Cannot cancel recording with status '${recording.status}'. Only scheduled recordings can be cancelled.`,
      );
    }

    // Update recording status
    await ctx.db.patch(args.recordingId, {
      status: "cancelled",
      updatedAt: Date.now(),
    });

    // Cancel the job
    const job = await ctx.db
      .query("meetingBotJobs")
      .withIndex("by_recording", (q) => q.eq("recordingId", args.recordingId))
      .first();

    if (job) {
      await ctx.db.patch(job._id, {
        status: "cancelled",
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Update a recording's status and metadata.
 *
 * This mutation acts as a webhook receiver for the external bot service.
 * It updates the recording status (e.g., 'recording', 'transcribing', 'completed')
 * and metadata like duration and start/end times.
 *
 * Security:
 * - Requires a valid `apiKey` argument matching the configured `BOT_SERVICE_API_KEY`.
 */
export const updateRecordingStatus = mutation({
  args: {
    apiKey: v.string(),
    recordingId: v.id("meetingRecordings"),
    status: v.union(
      v.literal("scheduled"),
      v.literal("joining"),
      v.literal("recording"),
      v.literal("processing"),
      v.literal("transcribing"),
      v.literal("summarizing"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("failed"),
    ),
    errorMessage: v.optional(v.string()),
    botJoinedAt: v.optional(v.number()),
    botLeftAt: v.optional(v.number()),
    actualStartTime: v.optional(v.number()),
    actualEndTime: v.optional(v.number()),
    duration: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Validate bot service API key
    await requireBotApiKey(ctx, args.apiKey);

    const recording = await ctx.db.get(args.recordingId);
    if (!recording) throw notFound("recording", args.recordingId);

    await ctx.db.patch(args.recordingId, {
      status: args.status,
      errorMessage: args.errorMessage,
      botJoinedAt: args.botJoinedAt ?? recording.botJoinedAt,
      botLeftAt: args.botLeftAt ?? recording.botLeftAt,
      actualStartTime: args.actualStartTime ?? recording.actualStartTime,
      actualEndTime: args.actualEndTime ?? recording.actualEndTime,
      duration: args.duration ?? recording.duration,
      updatedAt: Date.now(),
    });
  },
});

/** Save a meeting transcript and advance the recording to 'summarizing' status. Bot service API key required. */
export const saveTranscript = mutation({
  args: {
    apiKey: v.string(),
    recordingId: v.id("meetingRecordings"),
    fullText: v.string(),
    segments: v.array(
      v.object({
        startTime: v.number(),
        endTime: v.number(),
        speaker: v.optional(v.string()),
        speakerUserId: v.optional(v.id("users")),
        text: v.string(),
        confidence: v.optional(v.number()),
      }),
    ),
    language: v.string(),
    modelUsed: v.string(),
    processingTime: v.optional(v.number()),
    wordCount: v.number(),
    speakerCount: v.optional(v.number()),
  },
  returns: v.id("meetingTranscripts"),
  handler: async (ctx, args) => {
    // Validate bot service API key
    await requireBotApiKey(ctx, args.apiKey);

    const recording = await ctx.db.get(args.recordingId);
    if (!recording) throw notFound("recording", args.recordingId);

    const transcriptId = await ctx.db.insert("meetingTranscripts", {
      recordingId: args.recordingId,
      fullText: args.fullText,
      segments: args.segments,
      language: args.language,
      modelUsed: args.modelUsed,
      processingTime: args.processingTime,
      wordCount: args.wordCount,
      speakerCount: args.speakerCount,
    });

    // Update recording status
    await ctx.db.patch(args.recordingId, {
      status: "summarizing",
      updatedAt: Date.now(),
    });

    return transcriptId;
  },
});

/** Save an AI-generated meeting summary and mark the recording as completed. Bot service API key required. */
export const saveSummary = mutation({
  args: {
    apiKey: v.string(),
    recordingId: v.id("meetingRecordings"),
    transcriptId: v.id("meetingTranscripts"),
    executiveSummary: v.string(),
    keyPoints: v.array(v.string()),
    actionItems: v.array(
      v.object({
        description: v.string(),
        assignee: v.optional(v.string()),
        assigneeUserId: v.optional(v.id("users")),
        dueDate: v.optional(v.string()),
        priority: v.optional(simplePriorities),
        issueCreated: v.optional(v.id("issues")),
      }),
    ),
    decisions: v.array(v.string()),
    openQuestions: v.array(v.string()),
    topics: v.array(
      v.object({
        title: v.string(),
        startTime: v.optional(v.number()),
        endTime: v.optional(v.number()),
        summary: v.string(),
      }),
    ),
    overallSentiment: v.optional(
      v.union(
        v.literal("positive"),
        v.literal("neutral"),
        v.literal("negative"),
        v.literal("mixed"),
      ),
    ),
    modelUsed: v.string(),
    promptTokens: v.optional(v.number()),
    completionTokens: v.optional(v.number()),
    processingTime: v.optional(v.number()),
  },
  returns: v.id("meetingSummaries"),
  handler: async (ctx, args) => {
    // Validate bot service API key
    await requireBotApiKey(ctx, args.apiKey);

    const recording = await ctx.db.get(args.recordingId);
    if (!recording) throw notFound("recording", args.recordingId);

    const summaryId = await ctx.db.insert("meetingSummaries", {
      recordingId: args.recordingId,
      transcriptId: args.transcriptId,
      executiveSummary: args.executiveSummary,
      keyPoints: args.keyPoints,
      actionItems: args.actionItems,
      decisions: args.decisions,
      openQuestions: args.openQuestions,
      topics: args.topics,
      overallSentiment: args.overallSentiment,
      modelUsed: args.modelUsed,
      promptTokens: args.promptTokens,
      completionTokens: args.completionTokens,
      processingTime: args.processingTime,
    });

    // Update recording status to completed
    await ctx.db.patch(args.recordingId, {
      status: "completed",
      updatedAt: Date.now(),
    });

    // Update job status
    const job = await ctx.db
      .query("meetingBotJobs")
      .withIndex("by_recording", (q) => q.eq("recordingId", args.recordingId))
      .first();

    if (job) {
      await ctx.db.patch(job._id, {
        status: "completed",
        updatedAt: Date.now(),
      });
    }

    return summaryId;
  },
});

/** Save meeting participant data, automatically matching emails to Nixelo users. Bot service API key required. */
export const saveParticipants = mutation({
  args: {
    apiKey: v.string(),
    recordingId: v.id("meetingRecordings"),
    participants: v.array(
      v.object({
        displayName: v.string(),
        email: v.optional(v.string()),
        joinedAt: v.optional(v.number()),
        leftAt: v.optional(v.number()),
        speakingTime: v.optional(v.number()),
        speakingPercentage: v.optional(v.number()),
        isHost: v.boolean(),
        isExternal: v.boolean(),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Validate bot service API key
    await requireBotApiKey(ctx, args.apiKey);

    const recording = await ctx.db.get(args.recordingId);
    if (!recording) throw notFound("recording", args.recordingId);

    // Try to match participants to Nixelo users by email (fetch all users in parallel)
    const participantsWithEmails = args.participants.filter((p) => p.email);
    const userLookups = await Promise.all(
      participantsWithEmails.map((p) =>
        ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", p.email))
          .first(),
      ),
    );

    // Build email -> userId map
    const userIdByEmail = new Map<string, Id<"users">>();
    participantsWithEmails.forEach((p, i) => {
      const user = userLookups[i];
      if (user && p.email) {
        userIdByEmail.set(p.email, user._id);
      }
    });

    // Insert all participants in parallel
    await Promise.all(
      args.participants.map((participant) =>
        ctx.db.insert("meetingParticipants", {
          recordingId: args.recordingId,
          displayName: participant.displayName,
          email: participant.email,
          userId: participant.email ? userIdByEmail.get(participant.email) : undefined,
          joinedAt: participant.joinedAt,
          leftAt: participant.leftAt,
          speakingTime: participant.speakingTime,
          speakingPercentage: participant.speakingPercentage,
          isHost: participant.isHost,
          isExternal: participant.isExternal,
        }),
      ),
    );
  },
});

/**
 * Create a project issue from a meeting summary action item and link it back to the summary.
 *
 * This mutation:
 * 1. Verifies the user has access to the recording (owner or public).
 * 2. Verifies the user has write access to the target project.
 * 3. Generates the next sequential issue key (e.g., "PROJ-123").
 * 4. Creates the issue with details from the action item.
 * 5. Updates the original action item with a reference to the new issue.
 *
 * @param summaryId - The ID of the meeting summary containing the action item.
 * @param actionItemIndex - The index of the action item in the summary's `actionItems` array.
 * @param projectId - The ID of the project where the issue should be created.
 * @returns The ID of the newly created issue.
 * @throws {ConvexError} "NO_DOCUMENT_FOUND" if summary, recording, or project is missing.
 * @throws {ConvexError} "NO_ACTION_ITEM_FOUND" if the action item index is invalid.
 * @throws {ConvexError} "FORBIDDEN" if the user lacks permissions.
 */
export const createIssueFromActionItem = authenticatedMutation({
  args: {
    summaryId: v.id("meetingSummaries"),
    actionItemIndex: v.number(),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const summary = await ctx.db.get(args.summaryId);
    if (!summary) throw notFound("summary", args.summaryId);

    // Security Check: Ensure user can access the recording
    const recording = await ctx.db.get(summary.recordingId);
    if (!recording) throw notFound("recording", summary.recordingId);

    if (recording.createdBy !== ctx.userId && !recording.isPublic) {
      throw forbidden(undefined, "Not authorized to access this recording");
    }

    const actionItem = summary.actionItems[args.actionItemIndex];
    if (!actionItem) throw notFound("actionItem");

    // Security Check: Ensure user has write access to the project
    await assertCanEditProject(ctx, args.projectId, ctx.userId);

    // Get project for issue key
    const project = await ctx.db.get(args.projectId);
    if (!project) throw notFound("project", args.projectId);

    // Get next issue number using efficient order desc first pattern
    const latestIssue = await ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .first();

    let nextNumber = 1;
    if (latestIssue) {
      const match = latestIssue.key.match(/-(\d+)$/);
      if (match) {
        nextNumber = Number.parseInt(match[1], 10) + 1;
      }
    }

    // Get approximate count for order
    const issueCount = await ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter(notDeleted)
      .take(BOUNDED_LIST_LIMIT);

    const now = Date.now();

    // Create the issue
    const issueId = await ctx.db.insert("issues", {
      projectId: args.projectId,
      organizationId: project.organizationId,
      workspaceId: project.workspaceId,
      teamId: project.teamId,
      key: `${project.key}-${nextNumber}`,
      title: actionItem.description,
      description: `Created from meeting action item`,
      type: "task",
      status: project.workflowStates[0]?.id ?? "todo",
      priority: actionItem.priority ?? "medium",
      assigneeId: actionItem.assigneeUserId,
      reporterId: ctx.userId,
      updatedAt: now,
      labels: ["from-meeting"],
      linkedDocuments: [],
      attachments: [],
      loggedHours: 0,
      order: issueCount.length,
    });

    // Update the action item with the created issue
    const updatedActionItems = [...summary.actionItems];
    updatedActionItems[args.actionItemIndex] = {
      ...actionItem,
      issueCreated: issueId,
    };

    await ctx.db.patch(args.summaryId, {
      actionItems: updatedActionItems,
    });

    return issueId;
  },
});

// ===========================================
// Internal Functions (called by scheduler)
// ===========================================

/**
 * Trigger a pending bot job to join a meeting.
 *
 * This is the entry point for the bot lifecycle, called by the Convex scheduler at the scheduled start time.
 * It transitions the job from 'pending' to 'queued' and the recording status to 'joining',
 * then dispatches the job to the external bot service via `notifyBotService`.
 */
export const triggerBotJob = internalMutation({
  args: { recordingId: v.id("meetingRecordings") },
  handler: async (ctx, args) => {
    const recording = await ctx.db.get(args.recordingId);
    if (!recording) return;

    if (recording.status !== "scheduled") return;

    const job = await ctx.db
      .query("meetingBotJobs")
      .withIndex("by_recording", (q) => q.eq("recordingId", args.recordingId))
      .filter(notDeleted)
      .first();

    if (!job || job.status !== "pending") return;

    // Update statuses
    await ctx.db.patch(args.recordingId, {
      status: "joining",
      updatedAt: Date.now(),
    });

    await ctx.db.patch(job._id, {
      status: "queued",
      updatedAt: Date.now(),
    });

    // The bot service will poll getPendingJobs and pick this up
    // Or we can call the bot service directly via HTTP action
    await ctx.scheduler.runAfter(0, internal.meetingBot.notifyBotService, {
      jobId: job._id,
      recordingId: args.recordingId,
      meetingUrl: recording.meetingUrl ?? "",
      platform: recording.meetingPlatform,
    });
  },
});

/**
 * Send an HTTP request to the external bot service to start a recording job.
 *
 * This action communicates with the configured bot service to initiate the recording process.
 *
 * Configuration:
 * - Requires `BOT_SERVICE_URL` and `BOT_SERVICE_API_KEY` environment variables.
 * - If not configured, marks the job as failed immediately.
 *
 * Behavior:
 * - Sends a POST request to `${BOT_SERVICE_URL}/api/jobs`.
 * - Payload includes job details and `callbackUrl` (this Convex deployment's URL).
 * - Enforces a 30-second timeout using AbortController to prevent hanging actions.
 * - Updates the job with the external service's job ID on success.
 *
 * Error Handling:
 * - Catches network errors and timeouts.
 * - Logs failures and marks the job as failed via `markJobFailed`.
 * - Failures will trigger automatic retries (handled by `markJobFailed`).
 */
export const notifyBotService = internalAction({
  args: {
    jobId: v.id("meetingBotJobs"),
    recordingId: v.id("meetingRecordings"),
    meetingUrl: v.string(),
    platform: v.union(
      v.literal("google_meet"),
      v.literal("zoom"),
      v.literal("teams"),
      v.literal("other"),
    ),
  },
  handler: async (ctx, args) => {
    const botServiceUrl = getBotServiceUrl();
    const botServiceApiKey = getBotServiceApiKey();

    if (!(botServiceUrl && botServiceApiKey)) {
      await ctx.runMutation(internal.meetingBot.markJobFailed, {
        jobId: args.jobId,
        recordingId: args.recordingId,
        error: "Bot service not configured",
      });
      return;
    }

    try {
      const response = await fetchWithTimeout(
        `${botServiceUrl}/api/jobs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${botServiceApiKey}`,
          },
          body: JSON.stringify({
            jobId: args.jobId,
            recordingId: args.recordingId,
            meetingUrl: args.meetingUrl,
            platform: args.platform,
            botName: "Nixelo Notetaker",
            // Callback URLs for the bot to report status (must be Convex backend URL)
            callbackUrl: process.env.CONVEX_SITE_URL,
          }),
        },
        BOT_SERVICE_TIMEOUT_MS,
      );

      if (!response.ok) {
        throw validation("botService", `Bot service responded with ${response.status}`);
      }

      const data = await response.json();

      // Update job with bot service job ID
      await ctx.runMutation(internal.meetingBot.updateJobBotServiceId, {
        jobId: args.jobId,
        botServiceJobId: data.jobId,
      });
    } catch (error) {
      const errorMessage =
        (error instanceof Error && error.name === "FetchTimeoutError") ||
        (error instanceof Error && error.name === "AbortError")
          ? `Timeout: Bot service request exceeded ${BOT_SERVICE_TIMEOUT_MS}ms`
          : getErrorMessage(error);

      console.error(`Failed to notify bot service for job ${args.jobId}:`, error);

      await ctx.runMutation(internal.meetingBot.markJobFailed, {
        jobId: args.jobId,
        recordingId: args.recordingId,
        error: errorMessage,
      });
    }
  },
});

/** Store the external bot service job ID and mark the job as running. */
export const updateJobBotServiceId = internalMutation({
  args: {
    jobId: v.id("meetingBotJobs"),
    botServiceJobId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      botServiceJobId: args.botServiceJobId,
      status: "running",
      updatedAt: Date.now(),
    });
  },
});

/** Mark a bot job as failed. Retries automatically up to maxAttempts, then fails the recording. */
export const markJobFailed = internalMutation({
  args: {
    jobId: v.id("meetingBotJobs"),
    recordingId: v.id("meetingRecordings"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) return;

    const newAttempts = job.attempts + 1;

    if (newAttempts < job.maxAttempts) {
      // Retry in 1 minute
      const nextAttempt = Date.now() + 60 * 1000;
      await ctx.db.patch(args.jobId, {
        attempts: newAttempts,
        lastAttemptAt: Date.now(),
        nextAttemptAt: nextAttempt,
        errorMessage: args.error,
        status: "pending",
        updatedAt: Date.now(),
      });

      // Schedule retry
      await ctx.scheduler.runAt(new Date(nextAttempt), internal.meetingBot.triggerBotJob, {
        recordingId: args.recordingId,
      });
    } else {
      // Max attempts reached, mark as failed
      await ctx.db.patch(args.jobId, {
        attempts: newAttempts,
        lastAttemptAt: Date.now(),
        errorMessage: args.error,
        status: "failed",
        updatedAt: Date.now(),
      });

      await ctx.db.patch(args.recordingId, {
        status: "failed",
        errorMessage: args.error,
        updatedAt: Date.now(),
      });
    }
  },
});
