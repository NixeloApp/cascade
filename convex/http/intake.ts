/**
 * Public Intake HTTP Handler
 *
 * Accepts external issue submissions for project inboxes.
 * No authentication required — uses a project-specific intake token
 * to identify the target project.
 */

import { api } from "../_generated/api";
import { httpAction } from "../_generated/server";

interface IntakeSubmission {
  title: string;
  description?: string;
  submitterEmail?: string;
  submitterName?: string;
}

function isValidSubmission(body: unknown): body is IntakeSubmission {
  if (!body || typeof body !== "object") return false;
  const obj = body as Record<string, unknown>;
  return typeof obj.title === "string" && obj.title.trim().length > 0 && obj.title.length <= 500;
}

/**
 * Extract a Bearer token from an Authorization header.
 * Returns the token string if the header uses the Bearer scheme,
 * null if no header is provided, or an error string for malformed headers.
 *
 * Rejects non-Bearer schemes (Basic, Digest, etc.) rather than
 * silently extracting garbage as a token.
 */
export function extractBearerToken(
  authHeader: string | null,
): { token: string } | { error: string } | null {
  if (!authHeader) return null;

  // RFC 6750: "Bearer" is case-insensitive
  const match = authHeader.match(/^Bearer\s+(\S+)$/i);
  if (!match) {
    // Distinguish between a different auth scheme vs. malformed Bearer
    if (/^Bearer\s*$/i.test(authHeader)) {
      return { error: "Bearer token value is missing" };
    }
    return { error: "Unsupported authorization scheme — use Bearer token" };
  }

  return { token: match[1] };
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

/** Handle CORS preflight */
export const handleIntakePreflight = httpAction(async () => {
  return new Response(null, { status: 204, headers: corsHeaders() });
});

/** Handle intake submission */
export const handleIntakeSubmission = httpAction(async (ctx, request) => {
  const headers = { ...corsHeaders(), "Content-Type": "application/json" };

  // Extract token from Authorization header or query parameter
  const authResult = extractBearerToken(request.headers.get("Authorization"));
  if (authResult && "error" in authResult) {
    return new Response(JSON.stringify({ error: authResult.error }), {
      status: 401,
      headers,
    });
  }

  const url = new URL(request.url);
  const token = authResult?.token ?? url.searchParams.get("token");

  if (!token) {
    return new Response(JSON.stringify({ error: "Missing intake token" }), {
      status: 401,
      headers,
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers });
  }

  if (!isValidSubmission(body)) {
    return new Response(JSON.stringify({ error: "Required: { title: string (1-500 chars) }" }), {
      status: 400,
      headers,
    });
  }

  try {
    const result = await ctx.runMutation(api.intake.createExternal, {
      token,
      title: body.title.trim(),
      description: body.description?.trim(),
      submitterEmail: body.submitterEmail?.trim(),
      submitterName: body.submitterName?.trim(),
    });

    return new Response(JSON.stringify({ success: true, inboxIssueId: result.inboxIssueId }), {
      status: 201,
      headers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return new Response(JSON.stringify({ error: message }), { status: 400, headers });
  }
});
