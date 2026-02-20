import type { FunctionReference } from "convex/server";
import type { ConvexAuthContext } from "./authTypes";
import { isAppError } from "./errors";

/**
 * Checks rate limits for auth actions
 * @param ctx Auth context
 * @param mutation The rate limit check mutation
 * @param args Args for the mutation
 * @param errorMessage Error message to throw if limit exceeded
 */
export async function checkRateLimit(
  ctx: ConvexAuthContext,
  mutation: FunctionReference<"mutation", any>,
  args: any,
  errorMessage: string,
) {
  if (ctx.runMutation) {
    try {
      await ctx.runMutation(mutation, args);
    } catch (error) {
      const isRateLimitError =
        (isAppError(error) && error.data.code === "RATE_LIMITED") ||
        (error instanceof Error && error.message.includes("Rate limit exceeded"));

      if (isRateLimitError) {
        throw new Error(errorMessage);
      }
      throw error;
    }
  }
}
