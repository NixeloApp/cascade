import { v } from "convex/values";
import {
  boardTypes,
  issuePriorities,
  issueTypesWithSubtask,
  workflowCategories,
} from "./validators";

export const projectsFields = {
  name: v.string(),
  key: v.string(), // Project key like "PROJ"
  description: v.optional(v.string()),
  // NEW: Hierarchy
  workspaceId: v.id("workspaces"), // Project belongs to workspace (department)
  teamId: v.optional(v.id("teams")), // Project belongs to team (optional - null for workspace projects)
  // Ownership
  organizationId: v.id("organizations"), // organization this project belongs to
  ownerId: v.id("users"), // User that owns this project
  // Sharing settings
  isPublic: v.optional(v.boolean()), // Visible to all organization members (organization-public)
  // isOrganizationPublic removed (legacy)
  sharedWithTeamIds: v.optional(v.array(v.id("teams"))), // Specific teams with access
  // Audit
  createdBy: v.id("users"), // Who created it (for audit trail)
  updatedAt: v.number(),
  // Board configuration
  boardType: boardTypes,
  workflowStates: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      category: workflowCategories,
      order: v.number(),
      // WIP limit: max issues allowed in this column (0 = no limit)
      wipLimit: v.optional(v.number()),
    }),
  ),
  // Agency features
  defaultHourlyRate: v.optional(v.number()), // Default billing rate for this project
  clientName: v.optional(v.string()), // Client name for agency work
  budget: v.optional(v.number()), // Project budget in currency
  // Soft Delete
  isDeleted: v.optional(v.boolean()),
  deletedAt: v.optional(v.number()),
  deletedBy: v.optional(v.id("users")),
};

export const issuesFields = {
  projectId: v.id("projects"), // Issue belongs to project (required)
  organizationId: v.id("organizations"), // Cached from project.organizationId
  workspaceId: v.id("workspaces"), // Cached from project.workspaceId
  teamId: v.optional(v.id("teams")), // Cached from project.teamId (optional, for performance)
  key: v.string(), // Issue key like "PROJ-123"
  title: v.string(),
  description: v.optional(v.string()),
  type: issueTypesWithSubtask,
  status: v.string(), // References workflow state id
  priority: issuePriorities,
  assigneeId: v.optional(v.id("users")),
  reporterId: v.id("users"),
  updatedAt: v.number(),
  startDate: v.optional(v.number()), // When work should begin
  dueDate: v.optional(v.number()), // Target completion date
  estimatedHours: v.optional(v.number()),
  loggedHours: v.optional(v.number()),
  storyPoints: v.optional(v.number()),
  labels: v.array(v.string()),
  sprintId: v.optional(v.id("sprints")),
  epicId: v.optional(v.id("issues")),
  parentId: v.optional(v.id("issues")), // For sub-tasks
  linkedDocuments: v.array(v.id("documents")),
  attachments: v.array(v.id("_storage")),
  order: v.number(), // For ordering within status columns
  // Optimistic locking - version increments on each update
  version: v.optional(v.number()), // Defaults to 1 on create, increments on update
  // AI/Semantic Search
  embedding: v.optional(v.array(v.float64())), // Vector embedding for semantic search
  searchContent: v.optional(v.string()), // Combined title and description for search
  // Archive (for completed/cancelled issues)
  archivedAt: v.optional(v.number()), // Timestamp when archived (null = active)
  archivedBy: v.optional(v.id("users")), // User who archived this issue
  // Soft Delete
  isDeleted: v.optional(v.boolean()), // Soft delete flag (undefined = not deleted)
  deletedAt: v.optional(v.number()), // Timestamp when deleted
  deletedBy: v.optional(v.id("users")), // User who deleted this issue
};

export const issueActivityFields = {
  issueId: v.id("issues"),
  userId: v.id("users"),
  action: v.string(), // "created", "updated", "commented", "assigned", etc.
  field: v.optional(v.string()), // Field that was changed
  oldValue: v.optional(v.string()),
  newValue: v.optional(v.string()),
};
