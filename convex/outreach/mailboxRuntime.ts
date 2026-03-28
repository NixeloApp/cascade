import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { BOUNDED_LIST_LIMIT } from "../lib/boundedQueries";
import { encryptMailboxTokensForStorage, getDecryptedMailboxTokenSnapshot } from "./mailboxTokens";

/** Read an active outreach mailbox and decrypt its tokens for runtime use. */
export async function getMailboxRuntimeState(
  ctx: Pick<MutationCtx, "db">,
  mailboxId: Id<"outreachMailboxes">,
) {
  const mailbox = await ctx.db.get(mailboxId);
  if (!mailbox?.isActive) return null;

  const tokenSnapshot = await getDecryptedMailboxTokenSnapshot({
    accessToken: mailbox.accessToken,
    refreshToken: mailbox.refreshToken,
  });

  return {
    accessToken: tokenSnapshot.decryptedAccessToken,
    displayName: mailbox.displayName,
    email: mailbox.email,
    expiresAt: mailbox.expiresAt,
    lastHealthCheckAt: mailbox.lastHealthCheckAt,
    provider: mailbox.provider,
    refreshToken: tokenSnapshot.decryptedRefreshToken,
  };
}

/** Persist a refreshed access token for an outreach mailbox. */
export async function updateMailboxRuntimeTokens(
  ctx: Pick<MutationCtx, "db">,
  args: {
    accessToken: string;
    expiresAt: number;
    mailboxId: Id<"outreachMailboxes">;
  },
) {
  const encryptedTokens = await encryptMailboxTokensForStorage({
    accessToken: args.accessToken,
    refreshToken: undefined,
  });

  await ctx.db.patch(args.mailboxId, {
    accessToken: encryptedTokens.accessToken,
    expiresAt: args.expiresAt,
    updatedAt: Date.now(),
  });
}

/** Advance the mailbox health-check watermark after a successful poll. */
export async function updateMailboxRuntimeHealthCheck(
  ctx: Pick<MutationCtx, "db">,
  mailboxId: Id<"outreachMailboxes">,
) {
  await ctx.db.patch(mailboxId, {
    lastHealthCheckAt: Date.now(),
  });
}

/** List active outreach mailboxes for one provider using a bounded indexed query. */
export async function listActiveMailboxesForProvider(
  ctx: Pick<QueryCtx, "db">,
  provider: "google" | "microsoft",
) {
  return await ctx.db
    .query("outreachMailboxes")
    .withIndex("by_active_and_provider", (q) => q.eq("isActive", true).eq("provider", provider))
    .take(BOUNDED_LIST_LIMIT);
}
