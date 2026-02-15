import { MINUTE } from "@convex-dev/rate-limiter";
import { components, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { type ActionCtx, httpAction } from "../_generated/server";
import {
  type ApiAuthContext,
  createErrorResponse,
  createSuccessResponse,
  extractApiKey,
  hashApiKey,
  hasScope,
  verifyProjectAccess,
} from "../lib/apiAuth";
import { getClientIp } from "../lib/ssrf";
import { logger } from "../lib/logger";

/**
 * REST API for Issues
 */

export const issuesApiHandler = async (ctx: ActionCtx, request: Request) => {
  const startTime = Date.now();
  const url = new URL(request.url);
  const method = request.method;

  let auth: ApiAuthContext | null = null;
  let response: Response;
  let error: string | undefined;

  try {
    const authResult = await authenticateAndRateLimit(ctx, request);
    if (authResult.response) {
      response = authResult.response;
      error = authResult.error;
    } else if (authResult.auth) {
      auth = authResult.auth;
      // Route based on method and path
      if (method === "GET" && url.pathname.endsWith("/api/issues")) {
        response = await handleList(ctx, request, auth);
      } else {
        response = createErrorResponse(404, "Not found");
      }
    } else {
      response = createErrorResponse(500, "Authentication error");
    }
  } catch (e: unknown) {
    const errorResult = handleError(e);
    response = errorResult.response;
    error = errorResult.error;
  }

  // Record usage if authenticated
  if (auth?.keyId) {
    await recordApiUsage(ctx, {
      auth,
      method,
      url,
      response,
      startTime,
      request,
      error,
    });
  }

  return response;
};

export const handler = httpAction(issuesApiHandler);

/**
 * Convert a thrown value into an HTTP error response and a normalized error message.
 *
 * @param e - The thrown value or Error to normalize
 * @returns An object with `response` set to a 403 "Not authorized" response when the error message contains "Not authorized", otherwise a 500 "Internal server error" response; `error` is the extracted error message
 */
function handleError(e: unknown): { response: Response; error: string } {
  const error = e instanceof Error ? e.message : String(e);
  logger.error("API error", { error });
  // Explicitly handle unauthorized errors from internal queries
  if (error.includes("Not authorized")) {
    return { response: createErrorResponse(403, "Not authorized"), error };
  }
  return { response: createErrorResponse(500, "Internal server error"), error };
}

/**
 * Records API key usage metadata for an incoming request.
 *
 * Extracts client metadata (user agent, IP, response time) and persists a usage record keyed to the API key; failures to record are logged and do not affect the request flow.
 *
 * @param auth - Authentication context containing `keyId` used to attribute the usage record
 * @param startTime - Millisecond timestamp (from Date.now()) when request processing began; used to compute response time
 * @param error - Optional error message to associate with the recorded usage
 */
async function recordApiUsage(
  ctx: ActionCtx,
  params: {
    auth: ApiAuthContext;
    method: string;
    url: URL;
    response: Response;
    startTime: number;
    request: Request;
    error?: string;
  },
) {
  const { auth, method, url, response, startTime, request, error } = params;
  try {
    const userAgent = request.headers.get("user-agent") || undefined;
    const ipAddress = getClientIp(request) || undefined;
    const responseTime = Date.now() - startTime;

    await ctx.runMutation(internal.apiKeys.recordUsage, {
      keyId: auth.keyId,
      method,
      endpoint: url.pathname,
      statusCode: response.status,
      responseTime,
      userAgent,
      ipAddress,
      error,
    });
  } catch (e) {
    // Ignore usage recording errors to not affect response
    logger.error("Failed to record API usage", {
      error: e instanceof Error ? e.message : String(e),
    });
  }
}

async function authenticateAndRateLimit(
  ctx: ActionCtx,
  request: Request,
): Promise<{
  auth: ApiAuthContext | null;
  response?: Response;
  error?: string;
}> {
  const apiKey = extractApiKey(request.headers);
  if (!apiKey) {
    return {
      auth: null,
      response: createErrorResponse(401, "Missing API key"),
      error: "Missing API key",
    };
  }

  // 1. Validate Key (Read-only)
  const keyHash = await hashApiKey(apiKey);
  const auth = await ctx.runQuery(internal.apiKeys.validateApiKey, { keyHash });

  if (!auth) {
    return {
      auth: null,
      response: createErrorResponse(401, "Invalid or expired API key"),
      error: "Invalid API key",
    };
  }

  // 2. Enforce Rate Limit (Mutation)
  try {
    const rateLimitResult = await ctx.runMutation(components.rateLimiter.lib.rateLimit, {
      name: `api-key-${auth.keyId}`,
      config: {
        kind: "token bucket",
        rate: auth.rateLimit,
        period: MINUTE,
        capacity: auth.rateLimit,
      },
    });

    if (!rateLimitResult.ok) {
      return {
        auth: null,
        response: createErrorResponse(429, "Rate limit exceeded"),
        error: "Rate limit exceeded",
      };
    }
  } catch (e: unknown) {
    // Handle rate limit error from component
    if (e instanceof Error && e.message.includes("Rate limit")) {
      return {
        auth: null,
        response: createErrorResponse(429, "Rate limit exceeded"),
        error: "Rate limit exceeded",
      };
    }
    throw e;
  }

  return { auth };
}

async function handleList(ctx: ActionCtx, request: Request, auth: ApiAuthContext) {
  if (!hasScope(auth, "issues:read")) {
    return createErrorResponse(403, "Missing scope: issues:read");
  }

  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId") as Id<"projects"> | null;

  if (!projectId) {
    return createErrorResponse(400, "projectId required");
  }

  // 1. Check if the *key* allows this project (Key Scope)
  if (!verifyProjectAccess(auth, projectId)) {
    return createErrorResponse(403, "Not authorized for this project");
  }

  // 2. Call internal query to check if the *user* allows this project and fetch data
  // internal.issues.queries.listIssuesInternal handles the user RBAC check
  const issues = await ctx.runQuery(internal.issues.queries.listIssuesInternal, {
    projectId,
    userId: auth.userId,
  });

  return createSuccessResponse({ data: issues });
}
