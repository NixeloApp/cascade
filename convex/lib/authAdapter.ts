import { getAuthSessionId } from "@convex-dev/auth/server";
import type { ActionCtx, MutationCtx, QueryCtx } from "../_generated/server";

export async function getSessionId(ctx: QueryCtx | MutationCtx | ActionCtx) {
  return await getAuthSessionId(ctx);
}
