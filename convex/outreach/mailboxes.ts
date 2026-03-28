/**
 * Outreach Mailboxes — Connect/disconnect user's Gmail/Outlook for sending
 *
 * Unlike platform email (Mailtrap/Resend/SendPulse), outreach sends FROM
 * the user's own mailbox via their OAuth credentials. This module manages
 * those connections.
 *
 * OAuth flow is handled in HTTP handlers (convex/http/outreachOAuth.ts).
 * This module handles CRUD after the OAuth tokens are obtained.
 */

import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { authenticatedMutation, authenticatedQuery } from "../customFunctions";
import { BOUNDED_LIST_LIMIT } from "../lib/boundedQueries";
import { isEncrypted } from "../lib/encryption";
import { notFound, validation } from "../lib/errors";
import { outreachMailboxProviders } from "../validators";
import { loadMailboxDeliverabilitySnapshots } from "./deliverability";
import { buildMailboxRateLimitDefaults } from "./mailboxRateLimits";
import { encryptMailboxTokensForStorage } from "./mailboxTokens";

const DEFAULT_REPAIR_BATCH_SIZE = 50;

// =============================================================================
// Queries
// =============================================================================

/** List connected mailboxes for current user */
export const list = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    const mailboxes = await ctx.db
      .query("outreachMailboxes")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .take(BOUNDED_LIST_LIMIT);

    // Strip tokens from response (never send to client)
    return mailboxes.map((m) => ({
      ...m,
      accessToken: "[redacted]",
      refreshToken: m.refreshToken ? "[redacted]" : undefined,
    }));
  },
});

/** Get a single mailbox */
export const get = authenticatedQuery({
  args: { mailboxId: v.id("outreachMailboxes") },
  handler: async (ctx, args) => {
    const mailbox = await ctx.db.get(args.mailboxId);
    if (!mailbox || mailbox.userId !== ctx.userId) throw notFound("mailbox", args.mailboxId);

    // Strip tokens from response (never send to client)
    return {
      ...mailbox,
      accessToken: "[redacted]",
      refreshToken: mailbox.refreshToken ? "[redacted]" : undefined,
    };
  },
});

// =============================================================================
// Mutations
// =============================================================================

/**
 * Register a connected mailbox after OAuth flow completes.
 * Called by the OAuth callback handler (HTTP action).
 */
export const createMailbox = authenticatedMutation({
  args: {
    provider: outreachMailboxProviders,
    email: v.string(),
    displayName: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(ctx.userId);
    if (!user?.defaultOrganizationId) throw validation("organization", "No default organization");
    const encryptedTokens = await encryptMailboxTokensForStorage({
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
    });

    // Check if this mailbox is already connected
    const existing = await ctx.db
      .query("outreachMailboxes")
      .withIndex("by_user_provider", (q) =>
        q.eq("userId", ctx.userId).eq("provider", args.provider),
      )
      .take(BOUNDED_LIST_LIMIT);

    const alreadyConnected = existing.find(
      (m) => m.email.toLowerCase() === args.email.toLowerCase(),
    );

    if (alreadyConnected) {
      // Update tokens on existing connection
      await ctx.db.patch(alreadyConnected._id, {
        accessToken: encryptedTokens.accessToken,
        refreshToken: encryptedTokens.refreshToken,
        expiresAt: args.expiresAt,
        isActive: true,
        updatedAt: Date.now(),
      });
      return alreadyConnected._id;
    }

    const rateLimitDefaults = buildMailboxRateLimitDefaults();
    return await ctx.db.insert("outreachMailboxes", {
      userId: ctx.userId,
      organizationId: user.defaultOrganizationId,
      provider: args.provider,
      email: args.email.toLowerCase(),
      displayName: args.displayName,
      accessToken: encryptedTokens.accessToken,
      refreshToken: encryptedTokens.refreshToken,
      expiresAt: args.expiresAt,
      ...rateLimitDefaults,
      isActive: true,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Internal mutation for creating/updating a mailbox from the OAuth callback.
 * Called by HTTP actions that already have tokens — no auth context needed.
 */
export const createMailboxFromOAuth = internalMutation({
  args: {
    userId: v.id("users"),
    organizationId: v.id("organizations"),
    provider: outreachMailboxProviders,
    email: v.string(),
    displayName: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify the user and organization exist before creating the mailbox
    const user = await ctx.db.get(args.userId);
    if (!user) throw validation("userId", "User not found");
    const org = await ctx.db.get(args.organizationId);
    if (!org) throw validation("organizationId", "Organization not found");
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .unique();
    if (!membership) {
      throw validation("organizationId", "User is not a member of the organization");
    }
    const encryptedTokens = await encryptMailboxTokensForStorage({
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
    });

    const existing = await ctx.db
      .query("outreachMailboxes")
      .withIndex("by_user_provider", (q) =>
        q.eq("userId", args.userId).eq("provider", args.provider),
      )
      .take(BOUNDED_LIST_LIMIT);

    const alreadyConnected = existing.find(
      (m) => m.email.toLowerCase() === args.email.toLowerCase(),
    );

    if (alreadyConnected) {
      await ctx.db.patch(alreadyConnected._id, {
        accessToken: encryptedTokens.accessToken,
        refreshToken: encryptedTokens.refreshToken,
        expiresAt: args.expiresAt,
        isActive: true,
        updatedAt: Date.now(),
      });
      return alreadyConnected._id;
    }

    const rateLimitDefaults = buildMailboxRateLimitDefaults();
    return await ctx.db.insert("outreachMailboxes", {
      userId: args.userId,
      organizationId: args.organizationId,
      provider: args.provider,
      email: args.email.toLowerCase(),
      displayName: args.displayName,
      accessToken: encryptedTokens.accessToken,
      refreshToken: encryptedTokens.refreshToken,
      expiresAt: args.expiresAt,
      ...rateLimitDefaults,
      isActive: true,
      updatedAt: Date.now(),
    });
  },
});

export const backfillEncryptedMailboxTokens = internalMutation({
  args: {
    cursor: v.union(v.string(), v.null()),
    numItems: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const numItems = Math.min(args.numItems ?? DEFAULT_REPAIR_BATCH_SIZE, BOUNDED_LIST_LIMIT);
    const page = await ctx.db
      .query("outreachMailboxes")
      .paginate({ numItems, cursor: args.cursor });

    let repaired = 0;
    for (const mailbox of page.page) {
      const hasPlaintextAccessToken =
        mailbox.accessToken.length > 0 && !isEncrypted(mailbox.accessToken);
      const hasPlaintextRefreshToken =
        mailbox.refreshToken !== undefined && !isEncrypted(mailbox.refreshToken);

      if (!hasPlaintextAccessToken && !hasPlaintextRefreshToken) {
        continue;
      }

      const encryptedTokens = await encryptMailboxTokensForStorage({
        accessToken: mailbox.accessToken,
        refreshToken: mailbox.refreshToken,
      });

      await ctx.db.patch(mailbox._id, {
        accessToken: encryptedTokens.accessToken,
        refreshToken: encryptedTokens.refreshToken,
        updatedAt: Date.now(),
      });
      repaired += 1;
    }

    return {
      continueCursor: page.continueCursor,
      isDone: page.isDone,
      repaired,
      scanned: page.page.length,
    };
  },
});

/** Disconnect a mailbox (deactivate, keep record for audit) */
export const disconnect = authenticatedMutation({
  args: { mailboxId: v.id("outreachMailboxes") },
  handler: async (ctx, args) => {
    const mailbox = await ctx.db.get(args.mailboxId);
    if (!mailbox || mailbox.userId !== ctx.userId) throw notFound("mailbox", args.mailboxId);

    await ctx.db.patch(args.mailboxId, {
      isActive: false,
      accessToken: "",
      refreshToken: undefined,
      updatedAt: Date.now(),
    });
  },
});

/** Update daily send limit */
export const updateLimit = authenticatedMutation({
  args: {
    mailboxId: v.id("outreachMailboxes"),
    dailySendLimit: v.number(),
  },
  handler: async (ctx, args) => {
    const mailbox = await ctx.db.get(args.mailboxId);
    if (!mailbox || mailbox.userId !== ctx.userId) throw notFound("mailbox", args.mailboxId);

    if (args.dailySendLimit < 1 || args.dailySendLimit > 100) {
      throw validation("dailySendLimit", "Daily send limit must be between 1 and 100");
    }

    await ctx.db.patch(args.mailboxId, {
      dailySendLimit: args.dailySendLimit,
      updatedAt: Date.now(),
    });

    const refreshedMailbox = await ctx.db.get(args.mailboxId);
    if (!refreshedMailbox) throw notFound("mailbox", args.mailboxId);
    const deliverabilitySnapshots = await loadMailboxDeliverabilitySnapshots(ctx, [
      refreshedMailbox,
    ]);
    const deliverability = deliverabilitySnapshots.get(refreshedMailbox._id);

    return {
      configuredDailyLimit: args.dailySendLimit,
      deliverabilityStatus: deliverability?.deliverabilityStatus ?? "healthy",
      effectiveDailyLimit: deliverability?.effectiveDailyLimit ?? args.dailySendLimit,
      hasCapacityOverride: deliverability?.hasCapacityOverride ?? false,
      warmupStageLabel: deliverability?.warmupStage.label ?? "Days 1-3",
    };
  },
});
