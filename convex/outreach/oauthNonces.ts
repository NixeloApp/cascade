import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { internalMutation } from "../_generated/server";
import { validation } from "../lib/errors";
import { MINUTE } from "../lib/timeUtils";
import { outreachMailboxProviders } from "../validators";

const OUTREACH_OAUTH_NONCE_TTL_MS = 10 * MINUTE;
const EXPIRED_NONCE_PRUNE_BATCH_SIZE = 64;

type OAuthContext = {
  userId: Id<"users">;
  organizationId: Id<"organizations">;
};

async function ensureUserCanConnectMailboxForOrganization(
  ctx: MutationCtx,
  userId: OAuthContext["userId"],
  organizationId: OAuthContext["organizationId"],
): Promise<void> {
  const [user, organization, membership] = await Promise.all([
    ctx.db.get(userId),
    ctx.db.get(organizationId),
    ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_user", (q) =>
        q.eq("organizationId", organizationId).eq("userId", userId),
      )
      .unique(),
  ]);

  if (!user) throw validation("userId", "User not found");
  if (!organization) throw validation("organizationId", "Organization not found");
  if (!membership) {
    throw validation("organizationId", "User is not a member of the organization");
  }
}

async function pruneExpiredNonces(ctx: MutationCtx, now: number): Promise<void> {
  const expiredNonces = await ctx.db
    .query("outreachOAuthNonces")
    .withIndex("by_expires_at", (q) => q.lte("expiresAt", now))
    .take(EXPIRED_NONCE_PRUNE_BATCH_SIZE);

  await Promise.all(expiredNonces.map((nonce) => ctx.db.delete(nonce._id)));
}

export const createNonce = internalMutation({
  args: {
    provider: outreachMailboxProviders,
    userId: v.id("users"),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ensureUserCanConnectMailboxForOrganization(ctx, args.userId, args.organizationId);
    await pruneExpiredNonces(ctx, now);

    const stateToken = crypto.randomUUID();
    await ctx.db.insert("outreachOAuthNonces", {
      provider: args.provider,
      stateToken,
      userId: args.userId,
      organizationId: args.organizationId,
      expiresAt: now + OUTREACH_OAUTH_NONCE_TTL_MS,
      createdAt: now,
    });

    return {
      stateToken,
      expiresAt: now + OUTREACH_OAUTH_NONCE_TTL_MS,
    };
  },
});

export const getNonceContextAndDelete = internalMutation({
  args: {
    provider: outreachMailboxProviders,
    stateToken: v.string(),
  },
  handler: async (ctx, args) => {
    const nonce = await ctx.db
      .query("outreachOAuthNonces")
      .withIndex("by_state_token", (q) => q.eq("stateToken", args.stateToken))
      .unique();

    if (!nonce || nonce.provider !== args.provider) {
      return null;
    }

    const now = Date.now();
    const hasExpired = nonce.expiresAt <= now;

    if (hasExpired) {
      await ctx.db.delete(nonce._id);
      return null;
    }

    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_user", (q) =>
        q.eq("organizationId", nonce.organizationId).eq("userId", nonce.userId),
      )
      .unique();

    if (!membership) {
      await ctx.db.delete(nonce._id);
      return null;
    }

    await ctx.db.delete(nonce._id);
    return {
      userId: nonce.userId,
      organizationId: nonce.organizationId,
    };
  },
});
