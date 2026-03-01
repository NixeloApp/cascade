/**
 * Audit Logs
 *
 * Internal mutation for recording audit trail entries.
 * Tracks user actions with actor, target, and metadata.
 * Disabled in test environments to prevent transaction conflicts.
 */

import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { auditMetadata } from "./validators";

declare global {
  var IS_TEST_ENV: boolean | undefined;
}

/** Logs an audit entry to track actions, skipping in test environments to prevent transaction errors. */
export const log = internalMutation({
  args: {
    action: v.string(),
    actorId: v.optional(v.id("users")),
    targetId: v.string(),
    targetType: v.string(),
    metadata: v.optional(auditMetadata),
  },
  handler: async (ctx, args) => {
    // Robust check for test environment to prevent "Write outside of transaction" errors
    // Note: If using the mock module approach, this file won't even be run in tests.
    if (globalThis.IS_TEST_ENV || process.env.IS_TEST_ENV) {
      return;
    }

    await ctx.db.insert("auditLogs", {
      action: args.action,
      actorId: args.actorId,
      targetId: args.targetId,
      targetType: args.targetType,
      metadata: args.metadata,
      timestamp: Date.now(),
    });
  },
});
