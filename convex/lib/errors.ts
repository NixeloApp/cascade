/**
 * Convex Error Utilities
 *
 * Use ConvexError instead of Error for application errors.
 * ConvexError.data is preserved in production (regular Error messages are redacted).
 *
 * @see https://docs.convex.dev/functions/error-handling/
 *
 * @example
 * // Instead of:
 * throw new Error("Not authenticated");
 *
 * // Use:
 * import { unauthenticated } from "./lib/errors";
 * throw unauthenticated();
 */

import { ConvexError } from "convex/values";

/**
 * Standard error codes for the application.
 * These are preserved in production and can be handled on the client.
 */
export type ErrorCode =
  | "UNAUTHENTICATED" // User not logged in
  | "FORBIDDEN" // User lacks permission
  | "NOT_FOUND" // Resource doesn't exist
  | "VALIDATION" // Invalid input
  | "CONFLICT" // Resource state conflict (e.g., duplicate)
  | "RATE_LIMITED" // Too many requests
  | "UPSTREAM" // External service failure (e.g., GitHub, Stripe)
  | "INTERNAL"; // Unexpected server error

/**
 * Error data structure sent to client.
 * All fields except `code` are optional.
 * Index signature required for Convex Value compatibility.
 */
export type ErrorData = {
  code: ErrorCode;
  message?: string;
  resource?: string;
  id?: string;
  field?: string;
  requiredRole?: string;
  retryAfter?: number;
} & Record<string, string | number | undefined>;

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * User is not authenticated.
 * Use when `getAuthUserId(ctx)` returns null.
 *
 * @example
 * const userId = await getAuthUserId(ctx);
 * if (!userId) throw unauthenticated();
 */
export function unauthenticated(): ConvexError<ErrorData> {
  return new ConvexError({ code: "UNAUTHENTICATED", message: "Not authenticated" });
}

/**
 * User lacks permission to perform the action.
 *
 * @param requiredRole - Optional role needed (e.g., "editor", "admin")
 * @param message - Optional custom message
 *
 * @example
 * if (!hasMinimumRole(role, "editor")) throw forbidden("editor");
 */
export function forbidden(requiredRole?: string, message?: string): ConvexError<ErrorData> {
  return new ConvexError({
    code: "FORBIDDEN",
    requiredRole,
    message: message ?? "Not authorized",
  });
}

/**
 * Resource was not found.
 *
 * @param resource - Type of resource (e.g., "project", "issue", "user")
 * @param id - Optional ID of the resource
 *
 * @example
 * const project = await ctx.db.get(projectId);
 * if (!project) throw notFound("project", projectId);
 */
export function notFound(resource: string, id?: string): ConvexError<ErrorData> {
  // Capitalize first letter for readable message
  const capitalized = resource.charAt(0).toUpperCase() + resource.slice(1);
  return new ConvexError({
    code: "NOT_FOUND",
    resource,
    id,
    message: `${capitalized} not found`,
  });
}

/**
 * Input validation failed.
 *
 * @param field - Field that failed validation
 * @param message - Description of the validation error
 *
 * @example
 * if (title.length > 200) throw validation("title", "Title must be under 200 characters");
 */
export function validation(field: string, message: string): ConvexError<ErrorData> {
  return new ConvexError({
    code: "VALIDATION",
    field,
    message,
  });
}

/**
 * Resource state conflict (e.g., duplicate key, invalid state transition).
 *
 * @param message - Description of the conflict
 *
 * @example
 * if (existing) throw conflict("A project with this key already exists");
 */
export function conflict(message: string): ConvexError<ErrorData> {
  return new ConvexError({
    code: "CONFLICT",
    message,
  });
}

/**
 * Rate limit exceeded.
 *
 * @param retryAfter - Seconds until the user can retry
 *
 * @example
 * const { ok, retryAfter } = await rateLimiter.limit(ctx, key);
 * if (!ok) throw rateLimited(retryAfter);
 */
export function rateLimited(retryAfter?: number): ConvexError<ErrorData> {
  return new ConvexError({
    code: "RATE_LIMITED",
    retryAfter,
    message: retryAfter
      ? `Rate limit exceeded. Retry after ${retryAfter} seconds.`
      : "Rate limit exceeded.",
  });
}

/**
 * Upstream service failure.
 * Use when an external API (GitHub, Stripe, etc.) fails or returns an error.
 *
 * @param service - Name of the external service
 * @param message - Description of the failure (safe for client)
 *
 * @example
 * throw upstream("GitHub", "Failed to fetch user repositories");
 */
export function upstream(service: string, message: string): ConvexError<ErrorData> {
  return new ConvexError({
    code: "UPSTREAM",
    service,
    message,
  });
}

/**
 * Internal server error. Use sparingly - prefer specific error types.
 *
 * @param message - Description of what went wrong
 *
 * @example
 * throw internal("Failed to process webhook payload");
 */
export function internal(message: string): ConvexError<ErrorData> {
  return new ConvexError({
    code: "INTERNAL",
    message,
  });
}

// =============================================================================
// Existence Helpers
// =============================================================================

/**
 * Require that a resource exists, throwing NOT_FOUND if null.
 * Type-safe: narrows type from T | null to T.
 *
 * @param resource - The fetched resource (or null)
 * @param resourceName - Name for error messages (e.g., "project", "issue")
 * @param id - Optional ID for error context
 * @returns The resource (narrowed from T | null to T)
 *
 * @example
 * // Instead of:
 * const project = await ctx.db.get(projectId);
 * if (!project) throw notFound("project", projectId);
 *
 * // Use:
 * const project = requireExists(await ctx.db.get(projectId), "project", projectId);
 */
export function requireExists<T>(resource: T | null, resourceName: string, id?: string): T {
  if (!resource) {
    throw notFound(resourceName, id);
  }
  return resource;
}

// =============================================================================
// Ownership Helpers
// =============================================================================

/**
 * Verify resource exists and is owned by the current user.
 * Throws notFound if resource is null, forbidden if not owned.
 *
 * @param resource - The fetched resource (or null)
 * @param userId - The current user's ID
 * @param resourceName - Name for error messages (e.g., "apiKey", "booking")
 * @param ownerField - Field containing owner ID (default: "userId")
 * @returns The resource (for chaining)
 *
 * @example
 * const key = await ctx.db.get(args.keyId);
 * requireOwned(key, ctx.userId, "apiKey");
 *
 * // With custom owner field
 * const booking = await ctx.db.get(args.id);
 * requireOwned(booking, ctx.userId, "booking", "hostId");
 */
export function requireOwned<T extends Record<string, unknown>>(
  resource: T | null,
  userId: string,
  resourceName: string,
  ownerField: keyof T = "userId" as keyof T,
): T {
  if (!resource) {
    throw notFound(resourceName);
  }
  if (resource[ownerField] !== userId) {
    throw forbidden();
  }
  return resource;
}

// =============================================================================
// Type Guards (for client-side handling)
// =============================================================================

/**
 * Check if an error is a ConvexError with our error data structure.
 *
 * @example
 * try {
 *   await updateIssue({ id, title });
 * } catch (error) {
 *   if (isAppError(error)) {
 *     switch (error.data.code) {
 *       case "NOT_FOUND": ...
 *       case "FORBIDDEN": ...
 *     }
 *   }
 * }
 */
export function isAppError(error: unknown): error is ConvexError<ErrorData> {
  return (
    error instanceof ConvexError &&
    typeof error.data === "object" &&
    error.data !== null &&
    "code" in error.data
  );
}

/**
 * Extract error code from a caught error.
 * Returns undefined if not a recognized app error.
 */
export function getErrorCode(error: unknown): ErrorCode | undefined {
  if (isAppError(error)) {
    return error.data.code;
  }
  return undefined;
}

/**
 * Extract error message from a caught error.
 * Falls back to generic message if not available.
 */
export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.data.message || getDefaultMessage(error.data.code);
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}

function getDefaultMessage(code: ErrorCode): string {
  switch (code) {
    case "UNAUTHENTICATED":
      return "Please sign in to continue";
    case "FORBIDDEN":
      return "You don't have permission to do this";
    case "NOT_FOUND":
      return "The requested resource was not found";
    case "VALIDATION":
      return "Invalid input";
    case "CONFLICT":
      return "This action conflicts with existing data";
    case "RATE_LIMITED":
      return "Too many requests. Please try again later.";
    case "UPSTREAM":
      return "An external service is temporarily unavailable.";
    case "INTERNAL":
      return "Something went wrong. Please try again.";
  }
}
