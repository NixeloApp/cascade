import type { Infer } from "convex/values";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { isTest } from "../testConfig";
import type { AuditMetadata, auditActions, auditTargetTypes } from "../validators";

export interface AuditLogArgs {
  action: Infer<typeof auditActions>;
  actorId?: Id<"users">;
  targetId: string;
  targetType: Infer<typeof auditTargetTypes>;
  metadata?: AuditMetadata;
}

// Minimal interface for context with scheduler
// We use a more specific type to avoid 'any'
interface ContextWithScheduler {
  scheduler: {
    runAfter: (
      delayMs: number,
      functionReference: typeof internal.auditLogs.log,
      args: AuditLogArgs,
    ) => Promise<unknown>;
  };
}

/**
 * Logs an audit entry to track actions, skipping in test environments.
 * This helper centralizes the "skip in test" logic to prevent transaction errors.
 */
export async function logAudit(ctx: ContextWithScheduler, args: AuditLogArgs) {
  if (!isTest) {
    await ctx.scheduler.runAfter(0, internal.auditLogs.log, args);
  }
}
