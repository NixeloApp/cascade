import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { checkApiKeyRateLimit } from "./rateLimiter";

/**
 * API Authentication Utilities
 *
 * Helper functions for authenticating and authorizing API requests.
 */

/**
 * Hashes an API key using SHA-256.
 *
 * Used to securely store API keys in the database.
 * The original key cannot be recovered from the hash.
 *
 * @param key - The raw API key string
 * @returns A promise resolving to the hexadecimal string representation of the hash
 *
 * @example
 * const hash = await hashApiKey("sk_live_12345");
 * // Returns "a1b2c3..."
 */
export async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Constant-time string comparison to prevent timing attacks.
 *
 * This function takes the same amount of time regardless of where the mismatch occurs,
 * preventing attackers from guessing the string character by character by measuring
 * response times.
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns True if strings are equal, false otherwise
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Context object returned after successful API authentication.
 */
export interface ApiAuthContext {
  /** The ID of the authenticated user */
  userId: Id<"users">;
  /** The ID of the API key used for authentication */
  keyId: Id<"apiKeys">;
  /** List of scopes granted to this API key */
  scopes: string[];
  /** Optional project ID if the key is scoped to a specific project */
  projectId?: Id<"projects">;
  /** Rate limit (requests per minute) associated with this key */
  rateLimit: number;
}

/**
 * Extracts the API key from the Authorization header.
 *
 * Supports both "Bearer <token>" and raw "<token>" formats.
 * Case-insensitive for "Bearer".
 *
 * @param headers - The request headers
 * @returns The extracted API key or null if missing/invalid
 *
 * @example
 * // Authorization: Bearer sk_123
 * extractApiKey(headers) // "sk_123"
 *
 * // Authorization: sk_123
 * extractApiKey(headers) // "sk_123"
 */
export function extractApiKey(headers: Headers): string | null {
  const authHeader = headers.get("authorization");
  if (!authHeader) return null;

  // Support both "Bearer token" and "token" formats
  const parts = authHeader.split(" ");
  if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
    return parts[1];
  }
  if (parts.length === 1) {
    return parts[0];
  }

  return null;
}

/**
 * Validates an API key against the database.
 *
 * 1. Hashes the provided key
 * 2. Looks up the key by hash
 * 3. Checks if key is active
 * 4. Checks if key has expired
 *
 * Note: For HTTP actions, use `internal.apiKeys.validateApiKeyInternal` instead
 * to avoid exposing this logic directly.
 *
 * @param ctx - The Convex query context (needs db access)
 * @param apiKey - The raw API key to validate
 * @returns The auth context if valid, or null if invalid/inactive/expired
 */
export async function validateApiKey(
  ctx: { db: QueryCtx["db"] },
  apiKey: string,
): Promise<ApiAuthContext | null> {
  // Hash the provided key
  const keyHash = await hashApiKey(apiKey);

  // Find key by hash
  const key = await ctx.db
    .query("apiKeys")
    .withIndex("by_key_hash", (q) => q.eq("keyHash", keyHash))
    .first();

  if (!key) return null;
  if (!key.isActive) return null;
  if (key.expiresAt && key.expiresAt < Date.now()) return null;

  return {
    userId: key.userId,
    keyId: key._id,
    scopes: key.scopes,
    projectId: key.projectId,
    rateLimit: key.rateLimit,
  };
}

/**
 * Checks if the authenticated context has the required scope.
 *
 * Supports:
 * - Global wildcard `*`: Grants all permissions
 * - Resource wildcard `resource:*`: Grants all actions on a resource
 * - Exact match: Must match the required scope exactly
 *
 * @param auth - The authentication context
 * @param requiredScope - The scope to check for (e.g., "issues:read")
 * @returns True if the user has the required scope
 *
 * @example
 * const auth = { scopes: ["issues:*"] };
 * hasScope(auth, "issues:read") // true
 * hasScope(auth, "projects:read") // false
 */
export function hasScope(auth: ApiAuthContext, requiredScope: string): boolean {
  // Wildcard scope grants all permissions
  if (auth.scopes.includes("*")) return true;

  // Check for exact scope match
  if (auth.scopes.includes(requiredScope)) return true;

  // Check for resource:* wildcard (e.g., "issues:*" grants "issues:read", "issues:write", etc.)
  const [resource] = requiredScope.split(":");
  if (auth.scopes.includes(`${resource}:*`)) return true;

  return false;
}

/**
 * Verifies if the API key has access to the requested project.
 *
 * - If the key is NOT project-scoped (projectId is undefined), it has access to ALL projects.
 * - If the key IS project-scoped, it only has access if the IDs match.
 *
 * @param auth - The authentication context
 * @param requestedProjectId - The ID of the project being accessed
 * @returns True if access is allowed
 */
export function verifyProjectAccess(
  auth: ApiAuthContext,
  requestedProjectId?: Id<"projects">,
): boolean {
  // If key is not project-scoped, allow any project
  if (!auth.projectId) return true;

  // If key is project-scoped, only allow that project
  return auth.projectId === requestedProjectId;
}

/**
 * Checks the rate limit for an API key.
 *
 * Uses the token bucket algorithm via `checkApiKeyRateLimit`.
 *
 * @param ctx - Mutation or Query context
 * @param keyId - The ID of the API key
 * @returns Object indicating success or failure with retry time
 */
export async function checkRateLimit(
  ctx: MutationCtx | QueryCtx,
  keyId: Id<"apiKeys">,
): Promise<{ allowed: true } | { allowed: false; retryAfter: number }> {
  // Get key to check rate limit
  const key = await ctx.db.get(keyId);
  if (!key) return { allowed: false, retryAfter: 60 };

  // Use the efficient token bucket rate limiter component
  const result = await checkApiKeyRateLimit(ctx, keyId, key.rateLimit);

  if (!result.ok) {
    // retryAfter is in milliseconds, convert to seconds
    const retryAfterSeconds = Math.ceil(result.retryAfter / 1000);
    return { allowed: false, retryAfter: retryAfterSeconds };
  }

  return { allowed: true };
}

/**
 * Create a standard API error response
 */
// Standard security headers for all API responses
const SECURITY_HEADERS = {
  "Content-Type": "application/json",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none';",
  "Referrer-Policy": "no-referrer",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

/**
 * Creates a standardized JSON error response.
 *
 * Includes security headers (CSP, HSTS, etc.) by default.
 *
 * @param statusCode - HTTP status code (e.g., 400, 401, 500)
 * @param message - Human-readable error message
 * @param details - Optional additional error details
 * @returns A Response object
 */
export function createErrorResponse(
  statusCode: number,
  message: string,
  details?: Record<string, unknown>,
): Response {
  return new Response(
    JSON.stringify({
      error: {
        code: statusCode,
        message,
        ...details,
      },
    }),
    {
      status: statusCode,
      headers: SECURITY_HEADERS,
    },
  );
}

/**
 * Creates a standardized JSON success response.
 *
 * Includes security headers by default.
 *
 * @param data - The data to return in the response body
 * @param statusCode - HTTP status code (default: 200)
 * @returns A Response object
 */
export function createSuccessResponse(data: unknown, statusCode = 200): Response {
  return new Response(JSON.stringify(data), {
    status: statusCode,
    headers: SECURITY_HEADERS,
  });
}
