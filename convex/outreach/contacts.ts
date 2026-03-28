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
import { validateEmail } from "../lib/constrainedValidators";
import { conflict, notFound, validation } from "../lib/errors";

const IMPORT_RESULT_SAMPLE_LIMIT = 5;

export interface OutreachContactImportInput {
  company?: string;
  customFields?: Record<string, string>;
  email: string;
  firstName?: string;
  lastName?: string;
  tags?: string[];
  timezone?: string;
}

export interface OutreachContactImportBatchResult {
  imported: number;
  sampleExistingEmails: string[];
  sampleInvalidEmails: string[];
  sampleSuppressedEmails: string[];
  skipped: number;
  skippedExisting: number;
  skippedInvalid: number;
  skippedSuppressed: number;
}

interface OutreachContactImportStorage {
  findExistingContact: (
    organizationId: Id<"organizations">,
    email: string,
  ) => Promise<{ _id: string } | null>;
  findSuppression: (
    organizationId: Id<"organizations">,
    email: string,
  ) => Promise<{ _id: string } | null>;
  insertContact: (contact: {
    company?: string;
    createdAt: number;
    createdBy: Id<"users">;
    customFields?: Record<string, string>;
    email: string;
    firstName?: string;
    lastName?: string;
    organizationId: Id<"organizations">;
    source: "csv_import";
    tags?: string[];
    timezone?: string;
  }) => Promise<unknown>;
}

function createImportBatchResult(): OutreachContactImportBatchResult {
  return {
    imported: 0,
    sampleExistingEmails: [],
    sampleInvalidEmails: [],
    sampleSuppressedEmails: [],
    skipped: 0,
    skippedExisting: 0,
    skippedInvalid: 0,
    skippedSuppressed: 0,
  };
}

function pushImportResultSample(samples: string[], email: string) {
  if (samples.length >= IMPORT_RESULT_SAMPLE_LIMIT || samples.includes(email)) {
    return;
  }

  samples.push(email);
}

export async function importContactsForOrganization(
  storage: OutreachContactImportStorage,
  organizationId: Id<"organizations">,
  userId: Id<"users">,
  contacts: OutreachContactImportInput[],
): Promise<OutreachContactImportBatchResult> {
  const result = createImportBatchResult();

  for (const contact of contacts) {
    const email = contact.email.toLowerCase().trim();

    try {
      validateEmail(email);
    } catch {
      result.skipped += 1;
      result.skippedInvalid += 1;
      pushImportResultSample(result.sampleInvalidEmails, email);
      continue;
    }

    const existing = await storage.findExistingContact(organizationId, email);

    if (existing) {
      result.skipped += 1;
      result.skippedExisting += 1;
      pushImportResultSample(result.sampleExistingEmails, email);
      continue;
    }

    const suppressed = await storage.findSuppression(organizationId, email);

    if (suppressed) {
      result.skipped += 1;
      result.skippedSuppressed += 1;
      pushImportResultSample(result.sampleSuppressedEmails, email);
      continue;
    }

    await storage.insertContact({
      organizationId,
      email,
      firstName: contact.firstName,
      lastName: contact.lastName,
      company: contact.company,
      timezone: contact.timezone,
      customFields: contact.customFields,
      tags: contact.tags,
      source: "csv_import",
      createdBy: userId,
      createdAt: Date.now(),
    });
    result.imported += 1;
  }

  return result;
}

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

    return await importContactsForOrganization(
      {
        findExistingContact: (organizationId, email) =>
          ctx.db
            .query("outreachContacts")
            .withIndex("by_organization_email", (q) =>
              q.eq("organizationId", organizationId).eq("email", email),
            )
            .first(),
        findSuppression: (organizationId, email) =>
          ctx.db
            .query("outreachSuppressions")
            .withIndex("by_organization_email", (q) =>
              q.eq("organizationId", organizationId).eq("email", email),
            )
            .first(),
        insertContact: (contact) => ctx.db.insert("outreachContacts", contact),
      },
      user.defaultOrganizationId,
      ctx.userId,
      args.contacts,
    );
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

    // Prevent deleting contacts with active enrollments
    const activeEnrollment = await ctx.db
      .query("outreachEnrollments")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .filter((q) => q.or(q.eq(q.field("status"), "active"), q.eq(q.field("status"), "paused")))
      .first();
    if (activeEnrollment) {
      throw conflict("Cannot delete a contact with active enrollments. Cancel them first.");
    }

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
