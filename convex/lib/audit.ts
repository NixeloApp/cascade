import type { FunctionReference } from "convex/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { isTest } from "../testConfig";
import type { AuditMetadata } from "../validators";

export interface AuditLogArgs {
  action: string;
  actorId?: Id<"users">;
  targetId: string;
  targetType: string;
  metadata?: AuditMetadata;
}

// Minimal interface for context with scheduler
// We use a more specific type to avoid 'any'
interface ContextWithScheduler {
  scheduler: {
    runAfter: (
      delayMs: number,
      functionReference: FunctionReference<"mutation" | "action">,
      // biome-ignore lint/suspicious/noExplicitAny: generic args for runAfter
      args: any,
    ) => Promise<any>; // biome-ignore lint/suspicious/noExplicitAny: generic return type
  };
}

/**
 * Logs an audit entry to track actions, skipping in test environments.
 * This helper centralizes the "skip in test" logic to prevent transaction errors.
 */
export async function logAudit(ctx: ContextWithScheduler, args: AuditLogArgs) {
  if (!isTest) {
    // internal.auditLogs.log is an internal mutation, but FunctionReference<"mutation"> implies public by default or generic.
    // We cast to any first to avoid "neither type sufficiently overlaps" error when casting to FunctionReference<"mutation">.
    // biome-ignore lint/suspicious/noExplicitAny: casting for generic compatibility
    await ctx.scheduler.runAfter(0, internal.auditLogs.log as any, args);
  }
}
