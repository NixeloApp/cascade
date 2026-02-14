import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { checkApiKeyRateLimit } from "./rateLimiter";

/**
 * API Authentication Utilities
 *
 * Helper functions for authenticating and authorizing API requests.
 */

// Hash API key using SHA-256
export async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * Returns true if strings are equal, false otherwise.
 *
 * This function takes the same amount of time regardless of where the mismatch occurs,
 * preventing attackers from guessing the string character by character.
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

export interface ApiAuthContext {
  userId: Id<"users">;
  keyId: Id<"apiKeys">;
  scopes: string[];
  projectId?: Id<"projects">;
  rateLimit: number;
}

/**
 * Extract API key from Authorization header
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
 * Validate API key and return auth context (for use in queries/mutations)
 * Note: For HTTP actions, use internal.apiKeys.validateApiKeyInternal instead
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
 * Check if auth context has required scope
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
 * Verify project access (if API key is scoped to a project)
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
 * Rate limiting check using efficient token bucket algorithm
 * Returns result indicating if allowed or rate limited with retry time
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
 * Create a standard API success response
 */
export function createSuccessResponse(data: unknown, statusCode = 200): Response {
  return new Response(JSON.stringify(data), {
    status: statusCode,
    headers: SECURITY_HEADERS,
  });
}
