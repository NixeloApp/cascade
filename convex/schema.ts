import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { issueActivityFields, issuesFields, projectsFields } from "./schemaFields";
import {
  auditMetadata,
  blockNoteContent,
  boardTypes,
  bookingFieldTypes,
  calendarEventColors,
  calendarProviders,
  calendarStatuses,
  cancelledByOptions,
  chatRoles,
  ciStatuses,
  dashboardLayout,
  emailDigests,
  employmentTypes,
  inviteRoles,
  issuePriorities,
  issueTypes,
  linkTypes,
  periodTypes,
  personas,
  projectRoles,
  proseMirrorSnapshot,
  prStates,
  simplePriorities,
  sprintStatuses,
  webhookStatuses,
  workflowCategories,
} from "./validators";

const applicationTables = {
  documents: defineTable({
    title: v.string(),
    isPublic: v.boolean(),
    createdBy: v.id("users"),
    updatedAt: v.number(),
    // Hierarchy - every doc belongs to an org, optionally scoped to workspace/project
    organizationId: v.id("organizations"), // Required - all docs belong to an org
    workspaceId: v.optional(v.id("workspaces")), // Optional - workspace-level docs
    projectId: v.optional(v.id("projects")), // Optional - project-level docs
    // Soft Delete
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_creator", ["createdBy"])
    .index("by_public", ["isPublic"])
    .index("by_organization", ["organizationId"])
    .index("by_workspace", ["workspaceId"])
    .index("by_project", ["projectId"])
    .index("by_creator_updated", ["createdBy", "updatedAt"])
    .index("by_deleted", ["isDeleted"])
    .index("by_organization_deleted", ["organizationId", "isDeleted"])
    .index("by_organization_public", ["organizationId", "isPublic"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["isPublic", "createdBy", "organizationId", "workspaceId", "projectId"],
    }),

  documentVersions: defineTable({
    documentId: v.id("documents"),
    version: v.number(), // Version number from ProseMirror
    snapshot: proseMirrorSnapshot, // ProseMirror snapshot data
    title: v.string(), // Document title at this version
    createdBy: v.id("users"), // User who created this version
    changeDescription: v.optional(v.string()), // Optional description of changes
  })
    .index("by_document", ["documentId"])
    .index("by_document_version", ["documentId", "version"]),

  // Y.js document state for real-time collaboration
  yjsDocuments: defineTable({
    documentId: v.id("documents"), // Link to parent document
    // Y.js state vector and updates are stored as binary (base64 encoded)
    stateVector: v.string(), // Base64 encoded Y.js state vector
    updates: v.array(v.string()), // Array of base64 encoded Y.js updates (batched for performance)
    // Version tracking
    version: v.number(), // Monotonically increasing version for conflict resolution
    // Metadata
    lastModifiedBy: v.optional(v.id("users")),
    updatedAt: v.number(),
  })
    .index("by_document", ["documentId"])
    .index("by_document_version", ["documentId", "version"]),

  // Y.js awareness state for cursor positions and user presence
  yjsAwareness: defineTable({
    documentId: v.id("documents"),
    userId: v.id("users"),
    // Awareness data (cursor position, selection, etc.)
    clientId: v.number(), // Y.js client ID
    awarenessData: v.string(), // JSON string of awareness state
    // Timestamp for garbage collection
    lastSeenAt: v.number(),
  })
    .index("by_document", ["documentId"])
    .index("by_document_user", ["documentId", "userId"])
    .index("by_last_seen", ["lastSeenAt"]),

  documentTemplates: defineTable({
    name: v.string(), // Template name: "Meeting Notes", "RFC", "Project Brief"
    description: v.optional(v.string()),
    category: v.string(), // "meeting", "planning", "design", "engineering", etc.
    icon: v.string(), // Emoji or icon identifier
    content: blockNoteContent, // BlockNote/ProseMirror content structure
    isBuiltIn: v.boolean(), // Built-in templates vs user-created
    isPublic: v.boolean(), // Public templates visible to all users
    createdBy: v.optional(v.id("users")), // Creator (null for built-in)
    projectId: v.optional(v.id("projects")), // Project-specific template (optional)
    updatedAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_built_in", ["isBuiltIn"])
    .index("by_public", ["isPublic"])
    .index("by_creator", ["createdBy"])
    .index("by_project", ["projectId"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["category", "isPublic", "isBuiltIn"],
    }),

  // NEW: Department-level workspaces (Engineering, Marketing, Product, etc.)
  workspaces: defineTable({
    name: v.string(), // "Engineering", "Marketing", "Product"
    slug: v.string(), // "engineering", "marketing", "product"
    description: v.optional(v.string()),
    icon: v.optional(v.string()), // Emoji like 🏗️, 📱, 🎨
    organizationId: v.id("organizations"),
    createdBy: v.id("users"),
    updatedAt: v.number(),
    // Settings
    settings: v.optional(
      v.object({
        defaultProjectVisibility: v.optional(v.boolean()),
        allowExternalSharing: v.optional(v.boolean()),
      }),
    ),
  })
    .index("by_organization", ["organizationId"])
    .index("by_organization_slug", ["organizationId", "slug"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["organizationId"],
    }),

  // Workspace Members (User-Workspace relationships - department-level access)
  workspaceMembers: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    role: v.union(
      v.literal("admin"), // Can manage workspace settings and members
      v.literal("editor"), // Can create/edit workspace-level content (docs)
      v.literal("member"), // Can view workspace resources
    ),
    addedBy: v.id("users"),
    // Soft Delete
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"])
    .index("by_workspace_user", ["workspaceId", "userId"])
    .index("by_role", ["role"])
    .index("by_workspace_role", ["workspaceId", "role"])
    .index("by_deleted", ["isDeleted"]),

  projects: defineTable(projectsFields)
    .index("by_creator", ["createdBy"])
    .index("by_key", ["key"])
    .index("by_public", ["isPublic"])
    .index("by_organization", ["organizationId"])
    .index("by_workspace", ["workspaceId"]) // NEW
    .index("by_team", ["teamId"])
    .index("by_owner", ["ownerId"])
    .index("by_organization_public", ["organizationId", "isPublic"])
    .index("by_deleted", ["isDeleted"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["isPublic", "createdBy", "organizationId", "workspaceId"], // Added workspaceId
    }),

  projectMembers: defineTable({
    projectId: v.id("projects"),
    userId: v.id("users"),
    role: projectRoles,
    addedBy: v.id("users"),
    // Soft Delete
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_project", ["projectId"])
    .index("by_user", ["userId"])
    .index("by_project_user", ["projectId", "userId"])
    .index("by_role", ["role"])
    .index("by_deleted", ["isDeleted"]),

  issues: defineTable(issuesFields)
    .index("by_project", ["projectId"])
    .index("by_organization", ["organizationId"]) // NEW
    .index("by_organization_deleted", ["organizationId", "isDeleted"])
    .index("by_workspace", ["workspaceId"]) // Standardized
    .index("by_team", ["teamId"]) // NEW
    .index("by_team_deleted", ["teamId", "isDeleted"])
    .index("by_key", ["key"])
    .index("by_assignee", ["assigneeId", "isDeleted"])
    .index("by_reporter", ["reporterId", "isDeleted"])
    .index("by_status", ["status"])
    .index("by_sprint", ["sprintId", "isDeleted"])
    .index("by_epic", ["epicId", "isDeleted"])
    .index("by_parent", ["parentId", "isDeleted"])
    .index("by_project_status", ["projectId", "status", "isDeleted"])
    .index("by_project_status_updated", ["projectId", "status", "updatedAt"])
    .index("by_project_sprint_status", ["projectId", "sprintId", "status", "isDeleted"]) // Optimized for sprint board counts
    .index("by_project_sprint_status_updated", ["projectId", "sprintId", "status", "updatedAt"]) // NEW OPTIMIZATION
    .index("by_project_updated", ["projectId", "updatedAt"])
    .index("by_project_due_date", ["projectId", "dueDate"])
    .index("by_organization_status", ["organizationId", "status", "isDeleted"]) // NEW
    .index("by_workspace_status", ["workspaceId", "status", "isDeleted"]) // Standardized
    .index("by_team_status", ["teamId", "status", "isDeleted"]) // NEW
    .index("by_team_status_updated", ["teamId", "status", "updatedAt"]) // NEW OPTIMIZATION
    .index("by_deleted", ["isDeleted"]) // Soft delete index
    // Project trash view & optimized active listing
    .index("by_project_deleted", ["projectId", "isDeleted"])
    .searchIndex("search_title", {
      searchField: "searchContent",
      filterFields: [
        "projectId",
        "organizationId",
        "workspaceId",
        "teamId",
        "type",
        "status",
        "priority",
      ], // Added organizationId
    })
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 512, // Voyage AI voyage-3-lite embedding dimension
      filterFields: ["projectId", "workspaceId", "teamId"], // Added workspaceId, teamId
    })
    .index("by_project_type", ["projectId", "type", "isDeleted"]),

  issueComments: defineTable({
    issueId: v.id("issues"),
    authorId: v.id("users"),
    content: v.string(),
    mentions: v.array(v.id("users")), // User IDs mentioned in comment
    updatedAt: v.number(),
    // Soft Delete
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_issue", ["issueId"])
    .index("by_author", ["authorId"])
    .index("by_deleted", ["isDeleted"]),

  issueCommentReactions: defineTable({
    commentId: v.id("issueComments"),
    userId: v.id("users"),
    emoji: v.string(),
    createdAt: v.number(),
  })
    .index("by_comment", ["commentId"])
    .index("by_comment_user_emoji", ["commentId", "userId", "emoji"]),

  issueLinks: defineTable({
    fromIssueId: v.id("issues"),
    toIssueId: v.id("issues"),
    linkType: linkTypes,
    createdBy: v.id("users"),
  })
    .index("by_from_issue", ["fromIssueId"])
    .index("by_to_issue", ["toIssueId"]),

  sprints: defineTable({
    projectId: v.id("projects"), // Sprint belongs to project
    name: v.string(),
    goal: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    status: sprintStatuses,
    createdBy: v.id("users"),
    updatedAt: v.number(),
    // Soft Delete
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_project", ["projectId"])
    .index("by_status", ["status"])
    .index("by_deleted", ["isDeleted"]),

  issueActivity: defineTable(issueActivityFields)
    .index("by_issue", ["issueId"])
    .index("by_user", ["userId"]),

  issueWatchers: defineTable({
    issueId: v.id("issues"),
    userId: v.id("users"),
  })
    .index("by_issue", ["issueId"])
    .index("by_user", ["userId"])
    .index("by_issue_user", ["issueId", "userId"]),

  labelGroups: defineTable({
    projectId: v.id("projects"), // Group belongs to project
    name: v.string(), // e.g., "Priority", "Component", "Area"
    description: v.optional(v.string()),
    displayOrder: v.number(), // For sorting groups in UI
    createdBy: v.id("users"),
  })
    .index("by_project", ["projectId"])
    .index("by_project_name", ["projectId", "name"])
    .index("by_project_order", ["projectId", "displayOrder"]),

  labels: defineTable({
    projectId: v.id("projects"), // Label belongs to project
    groupId: v.optional(v.id("labelGroups")), // Optional group assignment
    name: v.string(),
    color: v.string(), // Hex color code like "#3B82F6"
    displayOrder: v.optional(v.number()), // Order within group
    createdBy: v.id("users"),
  })
    .index("by_project", ["projectId"])
    .index("by_project_name", ["projectId", "name"])
    .index("by_group", ["groupId"]),

  issueTemplates: defineTable({
    projectId: v.id("projects"), // Template belongs to project
    name: v.string(),
    type: issueTypes,
    titleTemplate: v.string(),
    descriptionTemplate: v.string(),
    defaultPriority: issuePriorities,
    defaultLabels: v.array(v.string()),
    createdBy: v.id("users"),
  })
    .index("by_project", ["projectId"])
    .index("by_project_type", ["projectId", "type"]),

  webhooks: defineTable({
    projectId: v.id("projects"), // Webhook belongs to project
    name: v.string(),
    url: v.string(),
    events: v.array(v.string()), // e.g., ["issue.created", "issue.updated"]
    secret: v.optional(v.string()), // For HMAC signature
    isActive: v.boolean(),
    createdBy: v.id("users"),
    lastTriggered: v.optional(v.number()),
    // Soft Delete
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_project", ["projectId"])
    .index("by_active", ["isActive"])
    .index("by_deleted", ["isDeleted"]),

  webhookExecutions: defineTable({
    webhookId: v.id("webhooks"),
    event: v.string(), // Event that triggered: "issue.created", etc.
    status: webhookStatuses,
    requestPayload: v.string(), // JSON string of the request body
    responseStatus: v.optional(v.number()), // HTTP status code
    responseBody: v.optional(v.string()), // Response from webhook endpoint
    error: v.optional(v.string()), // Error message if failed
    attempts: v.number(), // Number of delivery attempts
    completedAt: v.optional(v.number()),
  })
    .index("by_webhook", ["webhookId"])
    .index("by_status", ["status"]),

  savedFilters: defineTable({
    projectId: v.id("projects"), // Filter belongs to project
    userId: v.id("users"),
    name: v.string(),
    filters: v.object({
      type: v.optional(v.array(issueTypes)),
      status: v.optional(v.array(v.string())),
      priority: v.optional(
        v.array(
          v.union(
            v.literal("lowest"),
            v.literal("low"),
            v.literal("medium"),
            v.literal("high"),
            v.literal("highest"),
          ),
        ),
      ),
      assigneeId: v.optional(v.array(v.id("users"))),
      labels: v.optional(v.array(v.string())),
      sprintId: v.optional(v.id("sprints")),
      epicId: v.optional(v.id("issues")),
    }),
    isPublic: v.boolean(), // Whether other team members can use this filter
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_user", ["userId"])
    .index("by_project_public", ["projectId", "isPublic"]),

  projectTemplates: defineTable({
    name: v.string(),
    description: v.string(),
    category: v.string(), // "software", "marketing", "design", etc.
    icon: v.string(), // Emoji or icon identifier
    boardType: boardTypes,
    workflowStates: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        category: workflowCategories,
        order: v.number(),
      }),
    ),
    defaultLabels: v.array(
      v.object({
        name: v.string(),
        color: v.string(),
      }),
    ),
    isBuiltIn: v.boolean(), // Built-in templates vs user-created
    createdBy: v.optional(v.id("users")),
  })
    .index("by_category", ["category"])
    .index("by_built_in", ["isBuiltIn"]),

  automationRules: defineTable({
    projectId: v.id("projects"), // Automation rule
    name: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    trigger: v.string(), // Trigger type: "status_changed", "assignee_changed", etc.
    triggerValue: v.optional(v.string()), // Optional trigger value (e.g., specific status)
    actionType: v.string(), // Action: "set_assignee", "add_label", "send_notification", etc.
    actionValue: v.string(), // Action value/params as JSON string
    createdBy: v.id("users"),
    updatedAt: v.number(),
    executionCount: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_active", ["isActive"])
    .index("by_project_active", ["projectId", "isActive"]),

  customFields: defineTable({
    projectId: v.id("projects"), // Custom field belongs to project
    name: v.string(),
    fieldKey: v.string(), // Unique key like "customer_id"
    fieldType: v.union(
      v.literal("text"),
      v.literal("number"),
      v.literal("select"),
      v.literal("multiselect"),
      v.literal("date"),
      v.literal("checkbox"),
      v.literal("url"),
    ),
    options: v.optional(v.array(v.string())), // For select/multiselect types
    isRequired: v.boolean(),
    description: v.optional(v.string()),
    createdBy: v.id("users"),
  })
    .index("by_project", ["projectId"])
    .index("by_project_key", ["projectId", "fieldKey"]),

  customFieldValues: defineTable({
    issueId: v.id("issues"),
    fieldId: v.id("customFields"),
    value: v.string(), // Stored as string, parsed based on field type
    updatedAt: v.number(),
  })
    .index("by_issue", ["issueId"])
    .index("by_field", ["fieldId"])
    .index("by_issue_field", ["issueId", "fieldId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(), // "mention", "assigned", "comment", "status_change", etc.
    title: v.string(),
    message: v.string(),
    issueId: v.optional(v.id("issues")),
    projectId: v.optional(v.id("projects")),
    documentId: v.optional(v.id("documents")),
    actorId: v.optional(v.id("users")), // Who triggered the notification
    isRead: v.boolean(),
    // Soft Delete
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "isRead"])
    .index("by_deleted", ["isDeleted"]),

  notificationPreferences: defineTable({
    userId: v.id("users"),
    // Master toggles
    emailEnabled: v.boolean(), // Master switch for all email notifications
    // Individual notification type preferences
    emailMentions: v.boolean(), // Send email when @mentioned
    emailAssignments: v.boolean(), // Send email when assigned to issue
    emailComments: v.boolean(), // Send email for comments on my issues
    emailStatusChanges: v.boolean(), // Send email for status changes on watched issues
    // Digest preferences
    emailDigest: emailDigests,
    digestDay: v.optional(v.string()), // "monday", "tuesday", etc. (for weekly digest)
    digestTime: v.optional(v.string()), // "09:00", "17:00", etc. (24h format)
    // Metadata
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  unsubscribeTokens: defineTable({
    userId: v.id("users"),
    token: v.string(),
    usedAt: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  userOnboarding: defineTable({
    userId: v.id("users"),
    onboardingCompleted: v.boolean(),
    onboardingStep: v.optional(v.number()), // Current step (0-5)
    sampleWorkspaceCreated: v.optional(v.boolean()), // Whether sample project was generated (migration-safe)
    sampleProjectCreated: v.optional(v.boolean()), // Deprecated field name (migration-safe)
    tourShown: v.boolean(), // Whether welcome tour was shown
    wizardCompleted: v.boolean(), // Whether project wizard was completed
    checklistDismissed: v.boolean(), // Whether checklist was dismissed
    // Persona-based onboarding fields
    onboardingPersona: v.optional(personas), // User's self-selected persona
    wasInvited: v.optional(v.boolean()), // Whether user was invited (denormalized)
    invitedByName: v.optional(v.string()), // Name of person who invited them
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Calendar & Scheduling (Agency Features)
  calendarEvents: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(), // Unix timestamp
    endTime: v.number(), // Unix timestamp
    allDay: v.boolean(),
    location: v.optional(v.string()),
    eventType: v.union(
      v.literal("meeting"), // Team or client meetings
      v.literal("deadline"), // Project deadlines
      v.literal("timeblock"), // Focus time blocks
      v.literal("personal"), // Personal events
    ),
    // Attendees
    organizerId: v.id("users"),
    attendeeIds: v.array(v.id("users")), // Internal team members
    externalAttendees: v.optional(v.array(v.string())), // External emails
    // Links
    projectId: v.optional(v.id("projects")), // Link to project
    issueId: v.optional(v.id("issues")), // Link to issue
    // Status
    status: calendarStatuses,
    // Recurrence
    isRecurring: v.boolean(),
    recurrenceRule: v.optional(v.string()), // RRULE format (e.g., "FREQ=WEEKLY;BYDAY=MO,WE,FR")
    // Meeting details
    meetingUrl: v.optional(v.string()), // Zoom, Meet, etc.
    notes: v.optional(v.string()),
    // Attendance tracking
    isRequired: v.optional(v.boolean()), // Required attendance (for tracking who missed)
    // Display
    color: v.optional(calendarEventColors), // Optional palette color override
    // Metadata
    updatedAt: v.number(),
  })
    .index("by_organizer", ["organizerId"])
    .index("by_project", ["projectId"])
    .index("by_issue", ["issueId"])
    .index("by_start_time", ["startTime"])
    .index("by_status", ["status"])
    .index("by_required", ["isRequired"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["organizerId", "projectId", "status"],
    }),

  // Meeting Attendance Tracking (for required meetings)
  meetingAttendance: defineTable({
    eventId: v.id("calendarEvents"),
    userId: v.id("users"),
    status: v.union(
      v.literal("present"), // Attended on time
      v.literal("tardy"), // Attended but late
      v.literal("absent"), // Did not attend
    ),
    markedBy: v.id("users"), // Admin/organizer who marked attendance
    markedAt: v.number(),
    notes: v.optional(v.string()), // Optional notes: "Left early", "Technical issues", etc.
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_event_user", ["eventId", "userId"]),

  // User availability for booking (Cal.com-style)
  availabilitySlots: defineTable({
    userId: v.id("users"),
    dayOfWeek: v.union(
      v.literal("monday"),
      v.literal("tuesday"),
      v.literal("wednesday"),
      v.literal("thursday"),
      v.literal("friday"),
      v.literal("saturday"),
      v.literal("sunday"),
    ),
    startTime: v.string(), // 24h format like "09:00"
    endTime: v.string(), // 24h format like "17:00"
    isActive: v.boolean(),
    timezone: v.string(), // IANA timezone like "America/New_York"
  })
    .index("by_user", ["userId"])
    .index("by_user_day", ["userId", "dayOfWeek"])
    .index("by_active", ["isActive"]),

  // Booking pages (Cal.com-style)
  bookingPages: defineTable({
    userId: v.id("users"),
    slug: v.string(), // Unique URL slug like "john-doe" or "team-discovery"
    title: v.string(), // e.g., "30 Minute Discovery Call"
    description: v.optional(v.string()),
    duration: v.number(), // Duration in minutes
    // Availability settings
    bufferTimeBefore: v.number(), // Minutes before meeting
    bufferTimeAfter: v.number(), // Minutes after meeting
    minimumNotice: v.number(), // Minimum hours notice required
    maxBookingsPerDay: v.optional(v.number()),
    // Meeting settings
    location: v.union(
      v.literal("phone"),
      v.literal("zoom"),
      v.literal("meet"),
      v.literal("teams"),
      v.literal("in-person"),
      v.literal("custom"),
    ),
    locationDetails: v.optional(v.string()), // Phone number, Zoom link, address, etc.
    // Questions for booker
    questions: v.optional(
      v.array(
        v.object({
          label: v.string(),
          type: bookingFieldTypes,
          required: v.boolean(),
        }),
      ),
    ),
    // Settings
    isActive: v.boolean(),
    requiresConfirmation: v.boolean(), // Manual approval
    color: v.string(), // Calendar color hex
    // Metadata
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_slug", ["slug"])
    .index("by_active", ["isActive"]),

  // Scheduled bookings
  bookings: defineTable({
    bookingPageId: v.id("bookingPages"),
    hostId: v.id("users"), // Person being booked
    // Booker information
    bookerName: v.string(),
    bookerEmail: v.string(),
    bookerPhone: v.optional(v.string()),
    bookerAnswers: v.optional(v.string()), // JSON string of question answers
    // Meeting details
    startTime: v.number(), // Unix timestamp
    endTime: v.number(), // Unix timestamp
    timezone: v.string(), // Booker's timezone
    location: v.string(),
    locationDetails: v.optional(v.string()),
    // Status
    status: v.union(
      v.literal("pending"), // Awaiting confirmation
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("completed"),
    ),
    cancelledBy: v.optional(cancelledByOptions),
    cancellationReason: v.optional(v.string()),
    // Links to created event
    calendarEventId: v.optional(v.id("calendarEvents")),
    // Reminders
    reminderSent: v.boolean(),
    // Metadata
    updatedAt: v.number(),
  })
    .index("by_booking_page", ["bookingPageId"])
    .index("by_host", ["hostId"])
    .index("by_email", ["bookerEmail"])
    .index("by_start_time", ["startTime"])
    .index("by_status", ["status"])
    .index("by_host_status", ["hostId", "status"]),

  // External calendar connections (Google, Outlook)
  calendarConnections: defineTable({
    userId: v.id("users"),
    provider: calendarProviders,
    providerAccountId: v.string(), // Email/account ID from provider
    // OAuth tokens (encrypted in production)
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    // Settings
    syncEnabled: v.boolean(),
    syncDirection: v.union(
      v.literal("import"), // Only import from external calendar
      v.literal("export"), // Only export to external calendar
      v.literal("bidirectional"), // Two-way sync
    ),
    lastSyncAt: v.optional(v.number()),
    // Metadata
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_provider", ["provider"])
    .index("by_user_provider", ["userId", "provider"]),

  // GitHub Integration
  githubConnections: defineTable({
    userId: v.id("users"),
    githubUserId: v.string(), // GitHub user ID
    githubUsername: v.string(), // GitHub username
    // OAuth tokens
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    // Metadata
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_github_user", ["githubUserId"]),

  githubRepositories: defineTable({
    projectId: v.id("projects"),
    repoOwner: v.string(), // Repository owner (org or user)
    repoName: v.string(), // Repository name
    repoFullName: v.string(), // "owner/repo"
    repoId: v.string(), // GitHub repository ID
    // Settings
    syncPRs: v.boolean(), // Sync pull requests
    syncIssues: v.boolean(), // Sync GitHub issues (optional)
    autoLinkCommits: v.boolean(), // Auto-link commits that mention issue keys
    // Metadata
    linkedBy: v.id("users"),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_repo_id", ["repoId"])
    .index("by_repo_full_name", ["repoFullName"]),

  githubPullRequests: defineTable({
    issueId: v.optional(v.id("issues")), // Linked Nixelo issue
    projectId: v.id("projects"),
    repositoryId: v.id("githubRepositories"),
    // GitHub PR data
    prNumber: v.number(),
    prId: v.string(), // GitHub PR ID
    title: v.string(),
    body: v.optional(v.string()),
    state: prStates,
    mergedAt: v.optional(v.number()),
    closedAt: v.optional(v.number()),
    // Author
    authorUsername: v.string(),
    authorAvatarUrl: v.optional(v.string()),
    // Links
    htmlUrl: v.string(), // GitHub PR URL
    // Status checks
    checksStatus: v.optional(ciStatuses),
    // Metadata
    updatedAt: v.number(),
  })
    .index("by_issue", ["issueId"])
    .index("by_project", ["projectId"])
    .index("by_repository", ["repositoryId"])
    .index("by_pr_id", ["prId"])
    .index("by_repository_pr_number", ["repositoryId", "prNumber"]),

  githubCommits: defineTable({
    issueId: v.optional(v.id("issues")), // Auto-linked via commit message
    projectId: v.id("projects"),
    repositoryId: v.id("githubRepositories"),
    // GitHub commit data
    sha: v.string(), // Commit SHA
    message: v.string(),
    authorUsername: v.string(),
    authorAvatarUrl: v.optional(v.string()),
    htmlUrl: v.string(), // GitHub commit URL
    committedAt: v.number(),
    // Metadata
  })
    .index("by_issue", ["issueId"])
    .index("by_project", ["projectId"])
    .index("by_repository", ["repositoryId"])
    .index("by_sha", ["sha"]),

  // Offline sync queue
  offlineSyncQueue: defineTable({
    userId: v.id("users"),
    mutationType: v.string(), // e.g., "issues.update", "issues.create"
    mutationArgs: v.string(), // JSON string of mutation arguments
    status: v.union(
      v.literal("pending"), // Waiting to be synced
      v.literal("syncing"), // Currently syncing
      v.literal("completed"), // Successfully synced
      v.literal("failed"), // Failed to sync (will retry)
    ),
    attempts: v.number(), // Number of sync attempts
    lastAttempt: v.optional(v.number()),
    error: v.optional(v.string()), // Error message if failed
    // Metadata
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"]),

  // AI Integration
  aiChats: defineTable({
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")), // Link chat to specific project for context
    title: v.string(), // Auto-generated from first message or user-provided
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_project", ["projectId"]),

  aiMessages: defineTable({
    chatId: v.id("aiChats"),
    role: chatRoles,
    content: v.string(),
    // Context provided to AI (for debugging and transparency)
    contextData: v.optional(
      v.object({
        issueIds: v.optional(v.array(v.id("issues"))),
        documentIds: v.optional(v.array(v.id("documents"))),
        sprintIds: v.optional(v.array(v.id("sprints"))),
      }),
    ),
    // AI response metadata
    modelUsed: v.optional(v.string()), // e.g., "claude-3-5-sonnet-20241022"
    tokensUsed: v.optional(v.number()),
    responseTime: v.optional(v.number()), // Milliseconds
  }).index("by_chat", ["chatId"]),

  aiSuggestions: defineTable({
    userId: v.id("users"),
    projectId: v.id("projects"),
    suggestionType: v.union(
      v.literal("issue_description"), // AI-generated issue description
      v.literal("issue_priority"), // AI-suggested priority
      v.literal("issue_labels"), // AI-suggested labels
      v.literal("issue_assignee"), // AI-suggested assignee
      v.literal("sprint_planning"), // AI sprint planning suggestions
      v.literal("risk_detection"), // AI-detected project risks
      v.literal("insight"), // General AI insights
    ),
    targetId: v.optional(v.string()), // ID of issue/sprint being suggested for
    suggestion: v.string(), // The AI suggestion content
    reasoning: v.optional(v.string()), // Why AI made this suggestion
    // User actions
    accepted: v.optional(v.boolean()), // Did user accept the suggestion?
    dismissed: v.optional(v.boolean()),
    // Metadata
    modelUsed: v.string(),
    confidence: v.optional(v.number()), // 0-1 confidence score
    respondedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_project", ["projectId"])
    .index("by_type", ["suggestionType"])
    .index("by_project_type", ["projectId", "suggestionType"])
    .index("by_target", ["targetId"]),

  aiUsage: defineTable({
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    provider: v.literal("anthropic"),
    model: v.string(),
    operation: v.union(
      v.literal("chat"), // AI chat conversation
      v.literal("suggestion"), // AI suggestion generation
      v.literal("automation"), // AI automation task
      v.literal("analysis"), // AI analytics/insights
    ),
    // Token usage
    promptTokens: v.number(),
    completionTokens: v.number(),
    totalTokens: v.number(),
    // Cost estimation (optional, based on provider pricing)
    estimatedCost: v.optional(v.number()), // In USD cents
    // Performance
    responseTime: v.number(), // Milliseconds
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
    // Metadata
  })
    .index("by_user", ["userId"])
    .index("by_project", ["projectId"])
    .index("by_provider", ["provider"])
    .index("by_operation", ["operation"]),

  // REST API Keys (for CLI and external integrations)
  apiKeys: defineTable({
    userId: v.id("users"),
    name: v.string(), // User-friendly name: "My CLI Tool", "GitHub Actions", etc.
    keyHash: v.string(), // SHA-256 hash of the API key
    keyPrefix: v.string(), // First 8 chars for display: "sk_casc_AbCdEfGh..."
    // Permissions & Scopes
    scopes: v.array(v.string()), // e.g., ["issues:read", "issues:write", "projects:read"]
    // Optional project restriction
    projectId: v.optional(v.id("projects")), // If set, key only works for this project
    // Rate limiting
    rateLimit: v.number(), // Requests per minute (default: 100)
    // Status
    isActive: v.boolean(),
    lastUsedAt: v.optional(v.number()),
    usageCount: v.number(), // Total API calls made with this key
    // Expiration
    expiresAt: v.optional(v.number()), // Optional expiration timestamp
    // Rotation tracking
    rotatedFromId: v.optional(v.id("apiKeys")), // Previous key this was rotated from
    rotatedAt: v.optional(v.number()), // When old key was rotated (grace period start)
    // Metadata
    revokedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_key_hash", ["keyHash"])
    .index("by_active", ["isActive"])
    .index("by_user_active", ["userId", "isActive"])
    .index("by_rotated_from", ["rotatedFromId"])
    .index("by_expires", ["expiresAt"]),

  // API usage logs (for monitoring and rate limiting)
  apiUsageLogs: defineTable({
    apiKeyId: v.id("apiKeys"),
    userId: v.id("users"),
    // Request details
    method: v.string(), // GET, POST, PATCH, DELETE
    endpoint: v.string(), // e.g., "/api/issues"
    statusCode: v.number(), // HTTP status code
    responseTime: v.number(), // Milliseconds
    // Request metadata
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    // Errors
    error: v.optional(v.string()),
    // Timestamp
  })
    .index("by_api_key", ["apiKeyId"])
    .index("by_user", ["userId"]),

  // Pumble Integration (Team Chat)
  pumbleWebhooks: defineTable({
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")), // Optional: link to specific project
    name: v.string(), // User-friendly name: "Team Notifications", "Bug Reports Channel"
    webhookUrl: v.string(), // Pumble incoming webhook URL
    // Event subscriptions
    events: v.array(v.string()), // e.g., ["issue.created", "issue.updated", "issue.assigned"]
    // Settings
    isActive: v.boolean(),
    sendMentions: v.boolean(), // Send when user is @mentioned
    sendAssignments: v.boolean(), // Send when assigned to issue
    sendStatusChanges: v.boolean(), // Send when issue status changes
    // Stats
    messagesSent: v.number(),
    lastMessageAt: v.optional(v.number()),
    lastError: v.optional(v.string()),
    // Metadata
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_project", ["projectId"])
    .index("by_active", ["isActive"])
    .index("by_user_active", ["userId", "isActive"]),

  // Time Tracking (Native - Kimai-like features)
  timeEntries: defineTable({
    userId: v.id("users"), // Who logged the time
    projectId: v.optional(v.id("projects")), // Project
    issueId: v.optional(v.id("issues")), // Issue (optional)
    // Time data
    startTime: v.number(), // Unix timestamp
    endTime: v.optional(v.number()), // Unix timestamp (null if timer still running)
    duration: v.number(), // Duration in seconds
    date: v.number(), // Date of time entry (for grouping/filtering)
    // Description & Activity
    description: v.optional(v.string()),
    activity: v.optional(v.string()), // e.g., "Development", "Meeting", "Code Review", "Design"
    tags: v.array(v.string()), // Tags for categorization
    // Billing
    hourlyRate: v.optional(v.number()), // Hourly rate at time of entry (snapshot)
    totalCost: v.optional(v.number()), // Calculated cost (duration * hourlyRate)
    currency: v.string(), // Currency code: "USD", "EUR", etc.
    billable: v.boolean(), // Is this time billable to client?
    billed: v.boolean(), // Has this been billed to client?
    invoiceId: v.optional(v.string()), // Link to invoice if billed
    // Equity compensation
    isEquityHour: v.boolean(), // Is this compensated with equity (non-paid)? Default: false
    equityValue: v.optional(v.number()), // Calculated equity value for this entry
    // Status
    isLocked: v.boolean(), // Locked entries can't be edited (for payroll/billing)
    isApproved: v.boolean(), // Approved by manager
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    // Metadata
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_project", ["projectId"])
    .index("by_issue", ["issueId"])
    .index("by_date", ["date"])
    .index("by_user_date", ["userId", "date"])
    .index("by_project_date", ["projectId", "date"])
    .index("by_billable", ["billable"])
    .index("by_billed", ["billed"])
    .index("by_user_project", ["userId", "projectId"])
    .index("by_equity", ["isEquityHour"]),

  // User Hourly Rates (for cost calculation)
  userRates: defineTable({
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")), // Project-specific rate (overrides default)
    hourlyRate: v.number(), // Rate per hour
    currency: v.string(), // Currency code: "USD", "EUR", etc.
    // Effective period
    effectiveFrom: v.number(), // Start date of this rate
    effectiveTo: v.optional(v.number()), // End date (null if current rate)
    // Rate type
    rateType: v.union(
      v.literal("internal"), // Internal cost rate
      v.literal("billable"), // Client billable rate
    ),
    // Metadata
    setBy: v.id("users"), // Who set this rate
    notes: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_project", ["projectId"])
    .index("by_user_project", ["userId", "projectId"])
    .index("by_effective_from", ["effectiveFrom"])
    .index("by_effective_to", ["effectiveTo"])
    .index("by_rate_type", ["rateType"]),

  // User Employment Types & Work Hour Configuration
  userProfiles: defineTable({
    userId: v.id("users"), // One profile per user
    employmentType: v.union(
      v.literal("employee"), // Full-time employee
      v.literal("contractor"), // Independent contractor
      v.literal("intern"), // Intern/trainee
    ),
    // Work hour configuration (can override employment type defaults)
    maxHoursPerWeek: v.optional(v.number()), // Max billable hours per week (overrides type default)
    maxHoursPerDay: v.optional(v.number()), // Max hours per day (overrides type default)
    requiresApproval: v.optional(v.boolean()), // Does time tracking require manager approval?
    canWorkOvertime: v.optional(v.boolean()), // Can log overtime hours?
    // Employment details
    startDate: v.optional(v.number()), // Employment start date
    endDate: v.optional(v.number()), // Employment end date (for contractors/interns)
    department: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    managerId: v.optional(v.id("users")), // Direct manager
    // Equity compensation (employees only)
    hasEquity: v.boolean(), // Does employee have equity compensation? Default: false
    equityPercentage: v.optional(v.number()), // Equity stake percentage (e.g., 0.5 for 0.5%)
    requiredEquityHoursPerWeek: v.optional(v.number()), // Required non-paid equity hours per week
    requiredEquityHoursPerMonth: v.optional(v.number()), // Alternative: monthly equity hours requirement
    maxEquityHoursPerWeek: v.optional(v.number()), // Maximum equity hours allowed per week
    equityHourlyValue: v.optional(v.number()), // Estimated value per equity hour (for tracking)
    equityNotes: v.optional(v.string()), // Notes about equity arrangement
    // Status
    isActive: v.boolean(), // Is user currently active?
    // Metadata
    createdBy: v.id("users"), // Admin who created profile
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_employment_type", ["employmentType"])
    .index("by_manager", ["managerId"])
    .index("by_active", ["isActive"])
    .index("by_employment_active", ["employmentType", "isActive"]),

  // Employment Type Default Configurations
  employmentTypeConfigs: defineTable({
    type: employmentTypes,
    name: v.string(), // Display name: "Full-time Employee", "Contractor", "Intern"
    description: v.optional(v.string()),
    // Default work hour limits
    defaultMaxHoursPerWeek: v.number(), // e.g., 40 for employees, 20 for interns
    defaultMaxHoursPerDay: v.number(), // e.g., 8 for employees, 4 for interns
    defaultRequiresApproval: v.boolean(), // e.g., true for interns, false for employees
    defaultCanWorkOvertime: v.boolean(), // e.g., false for interns, true for employees
    // Permissions & restrictions
    canAccessBilling: v.boolean(), // Can see billing/rate info
    canManageProjects: v.boolean(), // Can create/manage projects
    // Metadata
    isActive: v.boolean(), // Is this type currently in use?
    updatedAt: v.number(),
  }).index("by_type", ["type"]),

  // Hour Compliance Tracking (for monitoring required hours)
  hourComplianceRecords: defineTable({
    userId: v.id("users"),
    periodType: periodTypes, // Weekly or monthly tracking
    periodStart: v.number(), // Start of period (Unix timestamp)
    periodEnd: v.number(), // End of period (Unix timestamp)
    // Hours tracked
    totalHoursWorked: v.number(), // Total hours logged in period
    totalEquityHours: v.optional(v.number()), // Total equity hours (for employees with equity)
    // Requirements from user profile at time of record
    requiredHoursPerWeek: v.optional(v.number()), // Weekly requirement snapshot
    requiredHoursPerMonth: v.optional(v.number()), // Monthly requirement snapshot
    requiredEquityHoursPerWeek: v.optional(v.number()), // Equity hours requirement snapshot
    requiredEquityHoursPerMonth: v.optional(v.number()),
    maxHoursPerWeek: v.optional(v.number()), // Max hours limit snapshot
    // Compliance status
    status: v.union(
      v.literal("compliant"), // Met requirements
      v.literal("under_hours"), // Worked less than required
      v.literal("over_hours"), // Exceeded maximum hours (warning)
      v.literal("equity_under"), // Didn't meet equity hour requirements
    ),
    // Variance
    hoursDeficit: v.optional(v.number()), // How many hours short (if under_hours)
    hoursExcess: v.optional(v.number()), // How many hours over (if over_hours)
    equityHoursDeficit: v.optional(v.number()), // Equity hours short
    // Notification
    notificationSent: v.boolean(), // Was admin/manager notified?
    notificationId: v.optional(v.id("notifications")),
    // Review
    reviewedBy: v.optional(v.id("users")), // Admin who reviewed this record
    reviewedAt: v.optional(v.number()),
    reviewNotes: v.optional(v.string()),
    // Metadata
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_period", ["periodStart"])
    .index("by_status", ["status"])
    .index("by_user_period", ["userId", "periodStart"])
    .index("by_user_status", ["userId", "status"])
    .index("by_period_status", ["periodStart", "status"]),

  // User Invitations
  invites: defineTable({
    email: v.string(), // Email address to invite
    role: inviteRoles, // Platform role: superAdmin = full system access
    organizationId: v.id("organizations"), // organization to invite user to
    projectId: v.optional(v.id("projects")), // Project to add user to (optional, for project-level invites)
    projectRole: v.optional(projectRoles), // Role in project if projectId is set
    invitedBy: v.id("users"), // Admin who sent the invite
    token: v.string(), // Unique invitation token
    expiresAt: v.number(), // Expiration timestamp
    status: v.union(
      v.literal("pending"), // Not yet accepted
      v.literal("accepted"), // User accepted and created account
      v.literal("revoked"), // Admin revoked the invite
      v.literal("expired"), // Invite expired
    ),
    acceptedBy: v.optional(v.id("users")), // User who accepted (if accepted)
    acceptedAt: v.optional(v.number()), // When accepted
    revokedBy: v.optional(v.id("users")), // Admin who revoked (if revoked)
    revokedAt: v.optional(v.number()), // When revoked
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_token", ["token"])
    .index("by_status", ["status"])
    .index("by_invited_by", ["invitedBy"])
    .index("by_email_status", ["email", "status"])
    .index("by_organization", ["organizationId"])
    .index("by_project", ["projectId"])
    .index("by_organization_status", ["organizationId", "status"]),

  // Organizations (Multi-tenant support)
  organizations: defineTable({
    name: v.string(), // organization name
    slug: v.string(), // URL-friendly slug: "acme-corp", "example-agency"
    timezone: v.string(), // organization default timezone (IANA): "America/New_York", "Europe/London"
    // organization settings (required)
    settings: v.object({
      defaultMaxHoursPerWeek: v.number(), // organization-wide default max hours per week
      defaultMaxHoursPerDay: v.number(), // organization-wide default max hours per day
      requiresTimeApproval: v.boolean(), // Require time entry approval by default
      billingEnabled: v.boolean(), // Enable billing features
    }),
    // Metadata
    createdBy: v.id("users"), // organization creator (becomes owner)
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_creator", ["createdBy"])
    .searchIndex("search_name", {
      searchField: "name",
    }),

  // organization Members (User-organization relationships with roles)
  organizationMembers: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    role: v.union(
      v.literal("owner"), // organization owner (creator, can't be removed, full control)
      v.literal("admin"), // organization admin (can manage members, settings, billing)
      v.literal("member"), // Regular member (can use organization resources)
    ),
    addedBy: v.id("users"), // Who added this member
    joinedAt: v.optional(v.number()), // When the user actually joined (accepted invite)
  })
    .index("by_organization", ["organizationId"])
    .index("by_user", ["userId"])
    .index("by_organization_user", ["organizationId", "userId"])
    .index("by_role", ["role"])
    .index("by_user_role", ["userId", "role"])
    .index("by_organization_role", ["organizationId", "role"]),

  // Teams (within a organization - for data isolation and grouping)
  teams: defineTable({
    organizationId: v.id("organizations"), // organization this team belongs to
    workspaceId: v.id("workspaces"), // Team belongs to workspace
    name: v.string(), // Team name: "Product Team", "Dev Team", "Design Team"
    slug: v.string(), // URL-friendly slug: "product-team", "dev-team"
    description: v.optional(v.string()),
    icon: v.optional(v.string()), // NEW: Team icon/emoji
    leadId: v.optional(v.id("users")), // NEW: Team lead
    // Team settings
    isPrivate: v.boolean(), // If true, team projects are private by default
    settings: v.optional(
      // NEW: Team settings
      v.object({
        defaultIssueType: v.optional(v.string()),
        cycleLength: v.optional(v.number()),
        cycleDayOfWeek: v.optional(v.number()),
        defaultEstimate: v.optional(v.number()),
      }),
    ),
    // Metadata
    createdBy: v.id("users"),
    updatedAt: v.number(),
    // Soft Delete
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_organization", ["organizationId"])
    .index("by_workspace", ["workspaceId"]) // NEW
    .index("by_workspace_slug", ["workspaceId", "slug"]) // NEW - for looking up teams by workspace and slug
    .index("by_organization_slug", ["organizationId", "slug"])
    .index("by_creator", ["createdBy"])
    .index("by_lead", ["leadId"]) // NEW
    .index("by_deleted", ["isDeleted"]) // Soft delete index
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["organizationId", "workspaceId"], // Added workspaceId
    }),

  // Team Members (User-Team relationships)
  teamMembers: defineTable({
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: v.union(
      v.literal("admin"), // Team admin (can manage team members and settings)
      v.literal("member"), // Regular team member
    ),
    addedBy: v.id("users"),
    // Soft Delete
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_team", ["teamId"])
    .index("by_user", ["userId"])
    .index("by_team_user", ["teamId", "userId"])
    .index("by_role", ["role"])
    .index("by_deleted", ["isDeleted"]),

  // ============================================
  // Meeting Bot / AI Notetaker (Read.ai-like)
  // ============================================

  // Meeting recordings - stores the actual audio/video files
  meetingRecordings: defineTable({
    calendarEventId: v.optional(v.id("calendarEvents")), // Link to calendar event (if scheduled)
    // Meeting info (for ad-hoc recordings without calendar event)
    meetingUrl: v.optional(v.string()), // Google Meet URL, Zoom URL, etc.
    meetingPlatform: v.union(
      v.literal("google_meet"),
      v.literal("zoom"),
      v.literal("teams"),
      v.literal("other"),
    ),
    title: v.string(), // Meeting title
    // Recording details
    recordingFileId: v.optional(v.id("_storage")), // Convex storage for audio file
    recordingUrl: v.optional(v.string()), // External URL if stored elsewhere
    duration: v.optional(v.number()), // Duration in seconds
    fileSize: v.optional(v.number()), // File size in bytes
    // Status
    status: v.union(
      v.literal("scheduled"), // Bot will join at scheduled time
      v.literal("joining"), // Bot is joining the meeting
      v.literal("recording"), // Bot is in meeting, recording
      v.literal("processing"), // Recording finished, processing audio
      v.literal("transcribing"), // Sending to Whisper
      v.literal("summarizing"), // Sending to Claude
      v.literal("completed"), // All done
      v.literal("cancelled"), // Cancelled by user
      v.literal("failed"), // Something went wrong
    ),
    errorMessage: v.optional(v.string()), // Error details if failed
    // Timestamps
    scheduledStartTime: v.optional(v.number()), // When bot should join
    actualStartTime: v.optional(v.number()), // When recording actually started
    actualEndTime: v.optional(v.number()), // When recording ended
    // Bot details
    botName: v.string(), // Display name: "Nixelo Notetaker"
    botJoinedAt: v.optional(v.number()),
    botLeftAt: v.optional(v.number()),
    // Permissions
    createdBy: v.id("users"),
    projectId: v.optional(v.id("projects")), // Link to project for context
    isPublic: v.boolean(), // Can all project members see this?
    // Metadata
    updatedAt: v.number(),
  })
    .index("by_calendar_event", ["calendarEventId"])
    .index("by_creator", ["createdBy"])
    .index("by_project", ["projectId"])
    .index("by_status", ["status"])
    .index("by_scheduled_time", ["scheduledStartTime"])
    .index("by_platform", ["meetingPlatform"]),

  // Meeting transcripts - the raw transcription from Whisper
  meetingTranscripts: defineTable({
    recordingId: v.id("meetingRecordings"),
    // Full transcript
    fullText: v.string(), // Complete transcript text
    // Segmented transcript with timestamps and speakers
    segments: v.array(
      v.object({
        startTime: v.number(), // Seconds from start
        endTime: v.number(),
        speaker: v.optional(v.string()), // Speaker name/label if diarization available
        speakerUserId: v.optional(v.id("users")), // Matched Nixelo user (if identified)
        text: v.string(),
        confidence: v.optional(v.number()), // Whisper confidence score
      }),
    ),
    // Processing info
    language: v.string(), // Detected language: "en", "es", etc.
    modelUsed: v.string(), // Whisper model: "whisper-1", etc.
    processingTime: v.optional(v.number()), // How long transcription took (ms)
    // Word count and stats
    wordCount: v.number(),
    speakerCount: v.optional(v.number()), // Number of distinct speakers
    // Metadata
  })
    .index("by_recording", ["recordingId"])
    .searchIndex("search_transcript", {
      searchField: "fullText",
    }),

  // Meeting summaries - AI-generated summaries from Claude
  meetingSummaries: defineTable({
    recordingId: v.id("meetingRecordings"),
    transcriptId: v.id("meetingTranscripts"),
    // Summary content
    executiveSummary: v.string(), // 2-3 sentence overview
    keyPoints: v.array(v.string()), // Bullet points of main topics
    // Action items extracted
    actionItems: v.array(
      v.object({
        description: v.string(),
        assignee: v.optional(v.string()), // Name mentioned in meeting
        assigneeUserId: v.optional(v.id("users")), // Matched Nixelo user
        dueDate: v.optional(v.string()), // Due date if mentioned
        priority: v.optional(simplePriorities),
        issueCreated: v.optional(v.id("issues")), // If converted to Nixelo issue
      }),
    ),
    // Decisions made
    decisions: v.array(v.string()),
    // Questions raised (unanswered or for follow-up)
    openQuestions: v.array(v.string()),
    // Topics discussed with time ranges
    topics: v.array(
      v.object({
        title: v.string(),
        startTime: v.optional(v.number()), // When topic started
        endTime: v.optional(v.number()), // When topic ended
        summary: v.string(),
      }),
    ),
    // Sentiment/tone analysis (optional)
    overallSentiment: v.optional(
      v.union(
        v.literal("positive"),
        v.literal("neutral"),
        v.literal("negative"),
        v.literal("mixed"),
      ),
    ),
    // Processing info
    modelUsed: v.string(), // Claude model: "claude-3-5-sonnet", etc.
    promptTokens: v.optional(v.number()),
    completionTokens: v.optional(v.number()),
    processingTime: v.optional(v.number()), // How long summarization took (ms)
    // Metadata
    regeneratedAt: v.optional(v.number()), // If user requested regeneration
  })
    .index("by_recording", ["recordingId"])
    .index("by_transcript", ["transcriptId"]),

  // Meeting participants - who was in the meeting
  meetingParticipants: defineTable({
    recordingId: v.id("meetingRecordings"),
    // Participant info
    displayName: v.string(), // Name as shown in meeting
    email: v.optional(v.string()), // Email if available
    userId: v.optional(v.id("users")), // Matched Nixelo user
    // Participation stats
    joinedAt: v.optional(v.number()),
    leftAt: v.optional(v.number()),
    speakingTime: v.optional(v.number()), // Total seconds speaking
    speakingPercentage: v.optional(v.number()), // % of meeting they spoke
    // Role
    isHost: v.boolean(),
    isExternal: v.boolean(), // Not a Nixelo user
  })
    .index("by_recording", ["recordingId"])
    .index("by_user", ["userId"])
    .index("by_email", ["email"]),

  // ============================================
  // Service Usage Tracking (Free Tier Rotation)
  // ============================================

  // Track usage per service provider per month
  serviceUsage: defineTable({
    serviceType: v.union(
      v.literal("transcription"),
      v.literal("email"),
      v.literal("sms"),
      v.literal("ai"), // For future AI provider rotation
    ),
    provider: v.string(), // "whisper", "speechmatics", "gladia", "resend", "sendpulse", etc.
    month: v.string(), // "2025-11" format
    // Usage metrics
    unitsUsed: v.number(), // Minutes for transcription, emails sent, etc.
    freeUnitsLimit: v.number(), // Free tier limit for this provider
    // Cost tracking (when free tier exceeded)
    paidUnitsUsed: v.number(), // Units beyond free tier
    estimatedCost: v.number(), // Estimated cost in cents
    // Metadata
    lastUpdatedAt: v.number(),
  })
    .index("by_service_type", ["serviceType"])
    .index("by_provider", ["provider"])
    .index("by_month", ["month"])
    .index("by_service_month", ["serviceType", "month"])
    .index("by_provider_month", ["provider", "month"]),

  // Provider configuration (free tier limits, priority order)
  serviceProviders: defineTable({
    serviceType: v.union(
      v.literal("transcription"),
      v.literal("email"),
      v.literal("sms"),
      v.literal("ai"),
    ),
    provider: v.string(), // "speechmatics", "gladia", "resend", etc.
    // Free tier info
    freeUnitsPerMonth: v.number(), // 0 = no free tier
    freeUnitsType: v.union(
      v.literal("monthly"), // Resets each month
      v.literal("one_time"), // One-time credit
      v.literal("yearly"), // Resets yearly
    ),
    oneTimeUnitsRemaining: v.optional(v.number()), // For one-time credits
    // Pricing after free tier
    costPerUnit: v.number(), // Cost per unit in cents (e.g., $0.006/min = 0.6 cents)
    unitType: v.string(), // "minute", "email", "message", "token"
    // Provider status
    isEnabled: v.boolean(),
    isConfigured: v.boolean(), // Has API key set
    priority: v.number(), // Lower = preferred (1 = first choice)
    // Metadata
    displayName: v.string(),
    notes: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_service_type", ["serviceType"])
    .index("by_provider", ["provider"])
    .index("by_service_enabled", ["serviceType", "isEnabled"])
    .index("by_service_priority", ["serviceType", "priority"]),

  // Bot job queue - for scheduling bots to join meetings
  meetingBotJobs: defineTable({
    recordingId: v.id("meetingRecordings"),
    // Job details
    meetingUrl: v.string(),
    scheduledTime: v.number(), // When to join
    // Status
    status: v.union(
      v.literal("pending"), // Waiting for scheduled time
      v.literal("queued"), // Sent to bot service
      v.literal("running"), // Bot is active
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled"),
    ),
    // Retries
    attempts: v.number(),
    maxAttempts: v.number(),
    lastAttemptAt: v.optional(v.number()),
    nextAttemptAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    // Bot service reference
    botServiceJobId: v.optional(v.string()), // ID from Railway bot service
    // Metadata
    updatedAt: v.number(),
  })
    .index("by_recording", ["recordingId"])
    .index("by_status", ["status"])
    .index("by_scheduled_time", ["scheduledTime"])
    .index("by_next_attempt", ["nextAttemptAt"]),

  userSettings: defineTable({
    userId: v.id("users"),
    dashboardLayout: v.optional(dashboardLayout), // Dashboard widget preferences
    theme: v.optional(v.string()), // "light", "dark", "system"
    sidebarCollapsed: v.optional(v.boolean()),
    // Preferences moved from users table
    emailNotifications: v.optional(v.boolean()),
    desktopNotifications: v.optional(v.boolean()),
    timezone: v.optional(v.string()), // IANA timezone
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Rate limiter tables (from @convex-dev/rate-limiter)
  rateLimits: defineTable({
    key: v.string(), // Rate limit key (e.g., API key ID)
    value: v.number(), // Current token count
    expiresAt: v.number(), // Expiration timestamp
  })
    .index("by_key", ["key"])
    .index("by_expiry", ["expiresAt"]),

  // Audit Logs
  auditLogs: defineTable({
    action: v.string(), // "team.create", "project.delete", "member.add"
    actorId: v.optional(v.id("users")), // Who performed the action (optional for system actions)
    targetId: v.string(), // ID of the affected object (generic string to support mixed types)
    targetType: v.string(), // "team", "project", "user", "webhook", etc.
    metadata: v.optional(auditMetadata), // Structured metadata (e.g. old role, new role)
    timestamp: v.number(),
  })
    .index("by_action", ["action"])
    .index("by_actor", ["actorId"])
    .index("by_target", ["targetId"])
    .index("by_timestamp", ["timestamp"]),

  // E2E Testing: Plaintext OTP codes for test users only
  // The authVerificationCodes table stores hashed codes, making them unreadable.
  // For E2E tests, we store plaintext codes here (only for @inbox.mailtrap.io emails)
  testOtpCodes: defineTable({
    email: v.string(), // Test user email
    code: v.string(), // Plaintext OTP code
    expiresAt: v.number(), // Expiration timestamp
  })
    .index("by_email", ["email"])
    .index("by_expiry", ["expiresAt"]),

  // OAuth Health Monitoring: Track health check results for alerting
  oauthHealthChecks: defineTable({
    success: v.boolean(),
    latencyMs: v.number(),
    error: v.optional(v.string()),
    errorCode: v.optional(v.string()),
    timestamp: v.number(),
  }).index("by_timestamp", ["timestamp"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
  // Override users table to add custom fields (must include all auth fields)
  users: defineTable({
    // Required auth fields from @convex-dev/auth
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    image: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
    // Custom fields for Nixelo
    defaultOrganizationId: v.optional(v.id("organizations")), // User's primary/default organization
    bio: v.optional(v.string()), // User bio/description
    timezone: v.optional(v.string()), // User timezone
    emailNotifications: v.optional(v.boolean()),
    desktopNotifications: v.optional(v.boolean()),
    // Invite tracking
    inviteId: v.optional(v.id("invites")), // Link to original invite (tracks "was invited" vs "self-signup")
    // E2E Testing fields
    isTestUser: v.optional(v.boolean()), // True if this is an E2E test user
    testUserCreatedAt: v.optional(v.number()), // When test user was created (for garbage collection)
  })
    .index("email", ["email"])
    .index("isTestUser", ["isTestUser"])
    .index("emailVerificationTime", ["emailVerificationTime"])
    .index("phone", ["phone"])
    .index("phoneVerificationTime", ["phoneVerificationTime"])
    .index("defaultOrganization", ["defaultOrganizationId"]),
});
