/**
 * Reusable Convex Validators
 *
 * Contains validators for complex data structures that would otherwise use v.any().
 * Using explicit validators provides:
 * - Runtime type validation
 * - Better TypeScript inference
 * - Self-documenting schemas
 *
 * @see https://docs.convex.dev/database/schemas
 */

import { type Infer, v } from "convex/values";
import { literals, nullable } from "convex-helpers/validators";

// =============================================================================
// Enum Validators (using literals() for cleaner syntax)
// =============================================================================

// Issue & Project Types
export const issueTypes = literals("task", "bug", "story", "epic");
export const issueTypesWithSubtask = literals("task", "bug", "story", "epic", "subtask");
export const issuePriorities = literals("lowest", "low", "medium", "high", "highest");
export const simplePriorities = literals("low", "medium", "high");
export const boardTypes = literals("kanban", "scrum");
export const workflowCategories = literals("todo", "inprogress", "done");

// Roles
export const projectRoles = literals("admin", "editor", "viewer");
export const organizationRoles = literals("owner", "admin", "member");
export const organizationMemberRoles = literals("admin", "member"); // For adding members (can't add as owner)
export const nullableOrganizationRoles = nullable(organizationRoles); // For return types
export const workspaceRoles = literals("admin", "editor", "member");
export const teamRoles = literals("admin", "member");
export const inviteRoles = literals("user", "superAdmin");
export const chatRoles = literals("user", "assistant", "system");

// Statuses
export const sprintStatuses = literals("future", "active", "completed");
export const moduleStatuses = literals(
  "backlog",
  "planned",
  "in_progress",
  "paused",
  "completed",
  "cancelled",
);
export const inboxIssueStatuses = literals(
  "pending",
  "accepted",
  "declined",
  "snoozed",
  "duplicate",
);
export const inboxIssueSources = literals("in_app", "form", "email", "api");
export const webhookStatuses = literals("success", "failed", "retrying");
export const webhookResultStatuses = literals("success", "failed"); // For execution results
export const calendarStatuses = literals("confirmed", "tentative", "cancelled");
export const calendarEventColors = literals(
  "blue",
  "red",
  "green",
  "amber",
  "orange",
  "purple",
  "pink",
  "teal",
  "indigo",
  "gray",
);
export const attendanceStatuses = literals("present", "tardy", "absent");
export const prStates = literals("open", "closed", "merged");
export const ciStatuses = literals("pending", "success", "failure");

// Link & Relationship Types
export const linkTypes = literals("blocks", "relates", "duplicates");

// Time & Billing
export const employmentTypes = literals("employee", "contractor", "intern");
export const periodTypes = literals("week", "month");
export const rateTypes = literals("internal", "billable");
export const freeUnitTypes = literals("monthly", "one_time", "yearly");
export const serviceTypes = literals("transcription", "email", "sms", "ai");

// Calendar & Sync
export const syncDirections = literals("import", "export", "bidirectional");
export const calendarProviders = literals("google", "outlook");
export const videoProviders = literals("zoom", "google_meet", "ms_teams", "daily");
export const cancelledByOptions = literals("host", "booker");

// User Preferences
export const emailDigests = literals("none", "daily", "weekly");
export const digestFrequencies = literals("daily", "weekly"); // Without "none"
export const personas = literals("team_lead", "team_member");

// Workflow Automation
export const workflowTriggers = literals(
  "booking_created",
  "booking_cancelled",
  "booking_rescheduled",
  "event_reminder", // Before event
  "event_followup", // After event
  "issue_created",
  "issue_status_changed",
  "issue_assigned",
);
export const workflowActionTypes = literals(
  "email_host",
  "email_attendee",
  "email_assignee",
  "sms_attendee",
  "webhook",
  "create_issue",
);
export const workflowStatuses = literals("pending", "sent", "failed", "skipped");

// Booking
export const bookingFieldTypes = literals("text", "email", "phone");
export const schedulingTypes = literals("individual", "round_robin", "collective");
export const roundRobinIntervals = literals("daily", "weekly", "monthly");

// =============================================================================
// Automation Rules
// =============================================================================

/** Available trigger types for automation rules */
export const automationTriggers = literals(
  "status_changed",
  "assignee_changed",
  "priority_changed",
  "issue_created",
  "label_added",
);

/** Available action types for automation rules */
export const automationActionTypes = literals(
  "set_assignee",
  "set_priority",
  "add_label",
  "add_comment",
  "send_notification",
);

/**
 * Typed action value for automation rules.
 * Uses discriminated union based on actionType.
 */
export const automationActionValue = v.union(
  v.object({
    type: v.literal("set_assignee"),
    assigneeId: v.union(v.id("users"), v.null()),
  }),
  v.object({
    type: v.literal("set_priority"),
    priority: issuePriorities,
  }),
  v.object({
    type: v.literal("add_label"),
    label: v.string(),
  }),
  v.object({
    type: v.literal("add_comment"),
    comment: v.string(),
  }),
  v.object({
    type: v.literal("send_notification"),
    message: v.string(),
    recipients: v.optional(v.array(v.id("users"))),
  }),
);

// =============================================================================
// Booking Answers
// =============================================================================

/**
 * Individual booking form answer.
 * Matches the question structure in bookingPages.questions.
 */
export const bookingAnswer = v.object({
  label: v.string(),
  type: bookingFieldTypes,
  value: v.string(),
});

/**
 * Array of booking form answers.
 * Replaces the old JSON string approach.
 */
export const bookerAnswers = v.array(bookingAnswer);

// =============================================================================
// ProseMirror / BlockNote Content
// =============================================================================

/**
 * ProseMirror node structure (recursive).
 * This is a loose validator that captures the general shape without being overly strict,
 * since the editor library defines the exact structure.
 *
 * @see https://prosemirror.net/docs/ref/#model.Node
 */
export const proseMirrorNode = v.object({
  type: v.string(),
  attrs: v.optional(v.record(v.string(), v.any())), // Attributes vary by node type
  content: v.optional(v.array(v.any())), // Recursive - children are also nodes
  marks: v.optional(
    v.array(
      v.object({
        type: v.string(),
        attrs: v.optional(v.record(v.string(), v.any())),
      }),
    ),
  ),
  text: v.optional(v.string()), // Text nodes have text instead of content
});

/**
 * ProseMirror document snapshot.
 * Used for document versions and collaborative editing state.
 */
export const proseMirrorSnapshot = v.object({
  type: v.literal("doc"),
  content: v.optional(v.array(v.any())), // Array of proseMirrorNode
});

/**
 * BlockNote content structure.
 * BlockNote uses a simplified block-based structure on top of ProseMirror.
 *
 * @see https://www.blocknotejs.org/docs/editor-basics/document-structure
 */
export const blockNoteContent = v.array(
  v.object({
    id: v.optional(v.string()),
    type: v.string(), // "paragraph", "heading", "bulletListItem", etc.
    props: v.optional(v.record(v.string(), v.any())), // Block-specific properties
    content: v.optional(v.array(v.any())), // Inline content
    children: v.optional(v.array(v.any())), // Nested blocks
  }),
);

// =============================================================================
// Dashboard Layout
// =============================================================================

/**
 * Dashboard widget configuration.
 */
export const dashboardWidget = v.object({
  id: v.string(),
  type: v.string(), // "issues", "activity", "sprint", "chart", etc.
  position: v.object({
    x: v.number(),
    y: v.number(),
    w: v.number(),
    h: v.number(),
  }),
  config: v.optional(v.record(v.string(), v.any())), // Widget-specific config
});

/**
 * Dashboard layout configuration.
 * Stores user's dashboard widget arrangement and preferences.
 */
export const dashboardLayout = v.object({
  widgets: v.optional(v.array(dashboardWidget)),
  columns: v.optional(v.number()), // Grid columns (default: 12)
  rowHeight: v.optional(v.number()), // Row height in pixels
  // Legacy/Simple mode support
  showStats: v.optional(v.boolean()),
  showRecentActivity: v.optional(v.boolean()),
  showWorkspaces: v.optional(v.boolean()),
});

// =============================================================================
// Audit Log Metadata
// =============================================================================

/**
 * Audit log metadata for various action types.
 * Using a flexible record since metadata varies by action.
 */
export const auditMetadata = v.record(
  v.string(),
  v.union(
    v.string(),
    v.number(),
    v.boolean(),
    v.null(),
    v.array(v.string()),
    v.object({
      old: v.optional(v.union(v.string(), v.number(), v.null())),
      new: v.optional(v.union(v.string(), v.number(), v.null())),
    }),
  ),
);

// =============================================================================
// Calendar Event (from external providers)
// =============================================================================

/**
 * Google Calendar event structure (simplified).
 * External data - using loose validation since structure is defined by Google.
 */
export const googleCalendarEvent = v.object({
  id: v.optional(v.string()),
  summary: v.optional(v.string()),
  description: v.optional(v.string()),
  start: v.optional(
    v.object({
      dateTime: v.optional(v.string()),
      date: v.optional(v.string()),
      timeZone: v.optional(v.string()),
    }),
  ),
  end: v.optional(
    v.object({
      dateTime: v.optional(v.string()),
      date: v.optional(v.string()),
      timeZone: v.optional(v.string()),
    }),
  ),
  attendees: v.optional(
    v.array(
      v.object({
        email: v.optional(v.string()),
        displayName: v.optional(v.string()),
        responseStatus: v.optional(v.string()),
      }),
    ),
  ),
  hangoutLink: v.optional(v.string()),
  htmlLink: v.optional(v.string()),
  status: v.optional(v.string()),
  organizer: v.optional(
    v.object({
      email: v.optional(v.string()),
      displayName: v.optional(v.string()),
    }),
  ),
});

// =============================================================================
// Webhook Payload
// =============================================================================

/**
 * External webhook payload.
 * Structure varies by provider (GitHub, Slack, etc.).
 * Using v.any() is acceptable here - document the reason.
 *
 * NOTE: This intentionally uses v.any() because:
 * 1. Payload structure varies by webhook provider
 * 2. We don't control the external schema
 * 3. Validation happens in provider-specific handlers
 */
export const webhookPayload = v.any();

// =============================================================================
// Type Exports (for TypeScript usage)
// =============================================================================

// Enum types — only types that are imported elsewhere to avoid duplication
export type IssueType = Infer<typeof issueTypes>;
export type IssueTypeWithSubtask = Infer<typeof issueTypesWithSubtask>;
export type IssuePriority = Infer<typeof issuePriorities>;
export type WorkflowCategory = Infer<typeof workflowCategories>;
export type ProjectRole = Infer<typeof projectRoles>;
export type OrganizationRole = Infer<typeof organizationRoles>;
export type ServiceType = Infer<typeof serviceTypes>;

// Runtime arrays (for UI dropdowns, form validation, etc.)
export const ISSUE_TYPES = ["task", "bug", "story", "epic"] as const;
export const ISSUE_TYPES_WITH_SUBTASK = ["task", "bug", "story", "epic", "subtask"] as const;
export const ISSUE_PRIORITIES = ["lowest", "low", "medium", "high", "highest"] as const;

// Complex types
export type ProseMirrorNode = Infer<typeof proseMirrorNode>;
export type ProseMirrorSnapshot = Infer<typeof proseMirrorSnapshot>;
export type BlockNoteContent = Infer<typeof blockNoteContent>;
export type DashboardWidget = Infer<typeof dashboardWidget>;
export type DashboardLayout = Infer<typeof dashboardLayout>;
export type AuditMetadata = Infer<typeof auditMetadata>;
export type CalendarEventColor = Infer<typeof calendarEventColors>;
export type GoogleCalendarEvent = Infer<typeof googleCalendarEvent>;
export type InboxIssueStatus = Infer<typeof inboxIssueStatuses>;
export type InboxIssueSource = Infer<typeof inboxIssueSources>;
export type ModuleStatus = Infer<typeof moduleStatuses>;
export type VideoProvider = Infer<typeof videoProviders>;
export type WorkflowTrigger = Infer<typeof workflowTriggers>;
export type WorkflowActionType = Infer<typeof workflowActionTypes>;
export type WorkflowStatus = Infer<typeof workflowStatuses>;

// Automation rules types
export type AutomationTrigger = Infer<typeof automationTriggers>;
export type AutomationActionType = Infer<typeof automationActionTypes>;
export type AutomationActionValue = Infer<typeof automationActionValue>;

// Booking types
export type BookingAnswer = Infer<typeof bookingAnswer>;
export type BookerAnswers = Infer<typeof bookerAnswers>;
