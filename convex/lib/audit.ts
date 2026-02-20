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

/**
 * Logs an audit entry to track actions, skipping in test environments.
 * This helper centralizes the "skip in test" logic to prevent transaction errors.
 */
export async function logAudit(
  ctx: { scheduler: { runAfter: (delay: number, fn: any, args: any) => Promise<any> } },
  args: AuditLogArgs,
) {
  if (!isTest) {
    await ctx.scheduler.runAfter(0, internal.auditLogs.log, args);
  }
}
