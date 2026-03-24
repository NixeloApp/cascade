/**
 * Outreach Contacts — CRUD for lead/recipient management
 *
 * Contacts are organization-scoped. Each contact has an email, optional
 * personal info, custom fields for template variables, and tags for segmentation.
 */

import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { authenticatedMutation, authenticatedQuery } from "../customFunctions";
import { BOUNDED_LIST_LIMIT } from "../lib/boundedQueries";
import { conflict, notFound, validation } from "../lib/errors";

// =============================================================================
// Queries
// =============================================================================

/** List contacts for the user's default organization */
export const list = authenticatedQuery({
  args: {
    tag: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(ctx.userId);
    const orgId = user?.defaultOrganizationId;
    if (!orgId) return [];

    const contacts = await ctx.db
      .query("outreachContacts")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .take(BOUNDED_LIST_LIMIT);

    const tagFilter = args.tag;
    if (tagFilter) {
      return contacts.filter((c) => c.tags?.includes(tagFilter));
    }
    return contacts;
  },
});

/** Get a single contact by ID */
export const get = authenticatedQuery({
  args: { contactId: v.id("outreachContacts") },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) throw notFound("contact", args.contactId);

    const user = await ctx.db.get(ctx.userId);
    if (contact.organizationId !== user?.defaultOrganizationId)
      throw notFound("contact", args.contactId);

    return contact;
  },
});

// =============================================================================
// Mutations
// =============================================================================

/** Create a single contact */
export const create = authenticatedMutation({
  args: {
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    company: v.optional(v.string()),
    timezone: v.optional(v.string()),
    customFields: v.optional(v.record(v.string(), v.string())),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(ctx.userId);
    if (!user?.defaultOrganizationId) throw validation("organization", "No default organization");

    const orgId = user.defaultOrganizationId;
    const email = args.email.toLowerCase().trim();

    // Deduplicate by org + email
    const existing = await ctx.db
      .query("outreachContacts")
      .withIndex("by_organization_email", (q) => q.eq("organizationId", orgId).eq("email", email))
      .first();

    if (existing) throw conflict(`Contact with email ${email} already exists`);

    return await ctx.db.insert("outreachContacts", {
      organizationId: orgId,
      email,
      firstName: args.firstName,
      lastName: args.lastName,
      company: args.company,
      timezone: args.timezone,
      customFields: args.customFields,
      tags: args.tags,
      source: "manual",
      createdBy: ctx.userId,
      createdAt: Date.now(),
    });
  },
});

/** Import contacts from CSV (batch insert) */
export const importBatch = authenticatedMutation({
  args: {
    contacts: v.array(
      v.object({
        email: v.string(),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        company: v.optional(v.string()),
        timezone: v.optional(v.string()),
        customFields: v.optional(v.record(v.string(), v.string())),
        tags: v.optional(v.array(v.string())),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(ctx.userId);
    if (!user?.defaultOrganizationId) throw validation("organization", "No default organization");

    const orgId = user.defaultOrganizationId;
    let imported = 0;
    let skipped = 0;

    for (const contact of args.contacts) {
      const email = contact.email.toLowerCase().trim();

      // Skip invalid emails
      if (!email.includes("@")) {
        skipped++;
        continue;
      }

      // Deduplicate
      const existing = await ctx.db
        .query("outreachContacts")
        .withIndex("by_organization_email", (q) => q.eq("organizationId", orgId).eq("email", email))
        .first();

      if (existing) {
        skipped++;
        continue;
      }

      // Check suppression list
      const suppressed = await ctx.db
        .query("outreachSuppressions")
        .withIndex("by_organization_email", (q) => q.eq("organizationId", orgId).eq("email", email))
        .first();

      if (suppressed) {
        skipped++;
        continue;
      }

      await ctx.db.insert("outreachContacts", {
        organizationId: orgId,
        email,
        firstName: contact.firstName,
        lastName: contact.lastName,
        company: contact.company,
        timezone: contact.timezone,
        customFields: contact.customFields,
        tags: contact.tags,
        source: "csv_import",
        createdBy: ctx.userId,
        createdAt: Date.now(),
      });
      imported++;
    }

    return { imported, skipped };
  },
});

/** Update a contact */
export const update = authenticatedMutation({
  args: {
    contactId: v.id("outreachContacts"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    company: v.optional(v.string()),
    timezone: v.optional(v.string()),
    customFields: v.optional(v.record(v.string(), v.string())),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) throw notFound("contact", args.contactId);

    const user = await ctx.db.get(ctx.userId);
    if (contact.organizationId !== user?.defaultOrganizationId)
      throw notFound("contact", args.contactId);

    const { contactId, ...updates } = args;
    // Filter out undefined values
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) patch[key] = value;
    }

    await ctx.db.patch(args.contactId, patch);
  },
});

/** Delete a contact (hard delete — they can re-import) */
export const remove = authenticatedMutation({
  args: { contactId: v.id("outreachContacts") },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) throw notFound("contact", args.contactId);

    const user = await ctx.db.get(ctx.userId);
    if (contact.organizationId !== user?.defaultOrganizationId)
      throw notFound("contact", args.contactId);

    await ctx.db.delete(args.contactId);
  },
});

// =============================================================================
// Helpers (used by other outreach modules)
// =============================================================================

/** Check if an email is suppressed for this organization */
export async function isSuppressed(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">,
  email: string,
): Promise<boolean> {
  const suppression = await ctx.db
    .query("outreachSuppressions")
    .withIndex("by_organization_email", (q) =>
      q.eq("organizationId", organizationId).eq("email", email.toLowerCase().trim()),
    )
    .first();
  return suppression !== null;
}

/** Add an email to the suppression list */
export async function suppress(
  ctx: MutationCtx,
  organizationId: Id<"organizations">,
  email: string,
  reason: "hard_bounce" | "unsubscribe" | "complaint" | "manual",
  sourceEnrollmentId?: Id<"outreachEnrollments">,
): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();

  // Don't duplicate suppressions
  const existing = await ctx.db
    .query("outreachSuppressions")
    .withIndex("by_organization_email", (q) =>
      q.eq("organizationId", organizationId).eq("email", normalizedEmail),
    )
    .first();

  if (!existing) {
    await ctx.db.insert("outreachSuppressions", {
      organizationId,
      email: normalizedEmail,
      reason,
      suppressedAt: Date.now(),
      sourceEnrollmentId,
    });
  }
}
