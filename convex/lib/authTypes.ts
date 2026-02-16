/**
 * Type augmentations for Convex Auth integration
 *
 * The Convex Auth library extends the standard @auth/core provider types
 * by passing a database context (ctx) to sendVerificationRequest.
 * This file provides proper TypeScript types for this integration.
 *
 * See: https://github.com/get-convex/convex-auth/issues
 */

import type { ActionCtx, QueryCtx } from "../_generated/server";

/**
 * Context type that Convex Auth passes to email provider callbacks.
 * Despite the QueryCtx type, the actual runtime context is an ActionCtx
 * (EnrichedActionCtx from convex-auth), which has runMutation capability.
 *
 * The Convex Auth library passes this context to sendVerificationRequest,
 * but the @auth/core types don't include it in the function signature.
 */
export type ConvexAuthContext = QueryCtx & Partial<Pick<ActionCtx, "runMutation" | "runQuery">>;
