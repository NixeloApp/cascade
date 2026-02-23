import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import {
  authenticatedMutation,
  authenticatedQuery,
  projectAdminMutation,
  projectQuery,
} from "./customFunctions";
import { batchFetchCustomFields } from "./lib/batchHelpers";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { conflict, notFound, validation } from "./lib/errors";
import { MAX_PAGE_SIZE } from "./lib/queryLimits";
import {
  assertCanAccessProject,
  assertCanEditProject,
  assertIsProjectAdmin,
} from "./projectAccess";

/**
 * Validate that a string represents a valid number.
 *
 * @param value - The string to validate as a number
 * @throws A validation error when `value` is not a valid number
 */
function validateNumberField(value: string): void {
  if (Number.isNaN(Number(value))) {
    throw validation("value", "Must be a valid number");
  }
}

// Helper: Validate URL field value
function validateUrlField(value: string): void {
  try {
    new URL(value);
  } catch {
    throw validation("value", "Must be a valid URL");
  }
}

// Helper: Validate select/multiselect field value
function validateSelectField(
  value: string,
  fieldType: "select" | "multiselect",
  options: string[],
): void {
  const values = fieldType === "multiselect" ? value.split(",") : [value];
  for (const val of values) {
    if (!options.includes(val.trim())) {
      throw validation("value", `Invalid option: ${val}`);
    }
  }
}

/**
 * Validate a custom field value according to the field's type.
 *
 * @param field - The custom field definition to validate against
 * @param value - The value to validate
 * @throws Throws a validation error if `value` is not valid for the field's `fieldType`
 */
function validateCustomFieldValue(field: Doc<"customFields">, value: string): void {
  if (field.fieldType === "number") {
    validateNumberField(value);
  } else if (field.fieldType === "url") {
    validateUrlField(value);
  } else if ((field.fieldType === "select" || field.fieldType === "multiselect") && field.options) {
    validateSelectField(value, field.fieldType, field.options);
  }
}

// Get all custom fields for a project
export const list = projectQuery({
  args: {},
  handler: async (ctx) => {
    // projectQuery handles auth + project access check
    return await ctx.db
      .query("customFields")
      .withIndex("by_project", (q) => q.eq("projectId", ctx.projectId))
      .take(MAX_PAGE_SIZE);
  },
});

// Create a new custom field
export const create = projectAdminMutation({
  args: {
    name: v.string(),
    fieldKey: v.string(),
    fieldType: v.union(
      v.literal("text"),
      v.literal("number"),
      v.literal("select"),
      v.literal("multiselect"),
      v.literal("date"),
      v.literal("checkbox"),
      v.literal("url"),
    ),
    options: v.optional(v.array(v.string())),
    isRequired: v.boolean(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // adminMutation handles auth + admin check

    // Check if field key already exists for this project
    const existing = await ctx.db
      .query("customFields")
      .withIndex("by_project_key", (q) =>
        q.eq("projectId", ctx.projectId).eq("fieldKey", args.fieldKey),
      )
      .first();

    if (existing) {
      throw conflict("A field with this key already exists");
    }

    const fieldId = await ctx.db.insert("customFields", {
      projectId: ctx.projectId,
      name: args.name,
      fieldKey: args.fieldKey,
      fieldType: args.fieldType,
      options: args.options,
      isRequired: args.isRequired,
      description: args.description,
      createdBy: ctx.userId,
    });
    return { fieldId };
  },
});

// Update a custom field
export const update = authenticatedMutation({
  args: {
    id: v.id("customFields"),
    name: v.optional(v.string()),
    options: v.optional(v.array(v.string())),
    isRequired: v.optional(v.boolean()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const field = await ctx.db.get(args.id);
    if (!field) {
      throw notFound("customField", args.id);
    }

    if (!field.projectId) {
      throw validation("projectId", "Field has no project");
    }

    await assertIsProjectAdmin(ctx, field.projectId, ctx.userId);

    const updates: Partial<typeof field> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.options !== undefined) updates.options = args.options;
    if (args.isRequired !== undefined) updates.isRequired = args.isRequired;
    if (args.description !== undefined) updates.description = args.description;

    await ctx.db.patch(args.id, updates);
  },
});

// Delete a custom field
export const remove = authenticatedMutation({
  args: {
    id: v.id("customFields"),
  },
  handler: async (ctx, args) => {
    const field = await ctx.db.get(args.id);
    if (!field) {
      throw notFound("customField", args.id);
    }

    if (!field.projectId) {
      throw validation("projectId", "Field has no project");
    }

    await assertIsProjectAdmin(ctx, field.projectId, ctx.userId);

    // Delete all values for this field
    const values = await ctx.db
      .query("customFieldValues")
      .withIndex("by_field", (q) => q.eq("fieldId", args.id))
      .take(BOUNDED_LIST_LIMIT);

    await Promise.all(values.map((value) => ctx.db.delete(value._id)));

    await ctx.db.delete(args.id);
  },
});

// Get custom field values for an issue
export const getValuesForIssue = authenticatedQuery({
  args: {
    issueId: v.id("issues"),
  },
  handler: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);
    if (!issue) return [];

    try {
      if (!issue.projectId) return [];
      await assertCanAccessProject(ctx, issue.projectId, ctx.userId);
    } catch {
      return [];
    }

    const values = await ctx.db
      .query("customFieldValues")
      .withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
      .take(BOUNDED_LIST_LIMIT);

    // Batch fetch field definitions to avoid N+1 queries
    const fieldIds = values.map((v) => v.fieldId);
    const fieldMap = await batchFetchCustomFields(ctx, fieldIds);

    // Enrich with pre-fetched data (no N+1)
    const enrichedValues = values.map((value) => ({
      ...value,
      field: fieldMap.get(value.fieldId) ?? null,
    }));

    return enrichedValues.filter((v) => v.field !== null);
  },
});

// Set a custom field value for an issue
export const setValue = authenticatedMutation({
  args: {
    issueId: v.id("issues"),
    fieldId: v.id("customFields"),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw notFound("issue", args.issueId);
    }

    if (!issue.projectId) {
      throw validation("projectId", "Issue has no project");
    }

    await assertCanEditProject(ctx, issue.projectId, ctx.userId);

    const field = await ctx.db.get(args.fieldId);
    if (!field) {
      throw notFound("customField", args.fieldId);
    }

    if (field.projectId !== issue.projectId) {
      throw validation("fieldId", "Field does not belong to the same project as the issue");
    }

    // Validate value based on field type
    validateCustomFieldValue(field, args.value);

    // Check if value already exists
    const existing = await ctx.db
      .query("customFieldValues")
      .withIndex("by_issue_field", (q) => q.eq("issueId", args.issueId).eq("fieldId", args.fieldId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("customFieldValues", {
        issueId: args.issueId,
        fieldId: args.fieldId,
        value: args.value,
        updatedAt: Date.now(),
      });
    }

    // Log activity
    await ctx.db.insert("issueActivity", {
      issueId: args.issueId,
      userId: ctx.userId,
      action: "updated",
      field: `custom_${field.fieldKey}`,
      newValue: args.value,
    });
  },
});

// Remove a custom field value
export const removeValue = authenticatedMutation({
  args: {
    issueId: v.id("issues"),
    fieldId: v.id("customFields"),
  },
  handler: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw notFound("issue", args.issueId);
    }

    if (!issue.projectId) {
      throw validation("projectId", "Issue has no project");
    }

    await assertCanEditProject(ctx, issue.projectId, ctx.userId);

    const existing = await ctx.db
      .query("customFieldValues")
      .withIndex("by_issue_field", (q) => q.eq("issueId", args.issueId).eq("fieldId", args.fieldId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);

      const field = await ctx.db.get(args.fieldId);
      if (field) {
        await ctx.db.insert("issueActivity", {
          issueId: args.issueId,
          userId: ctx.userId,
          action: "updated",
          field: `custom_${field.fieldKey}`,
          oldValue: existing.value,
          newValue: "",
        });
      }
    }
  },
});
