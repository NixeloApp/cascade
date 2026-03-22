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

  const authHeader = request.headers.get("Authorization");
  const url = new URL(request.url);
  const token = authHeader?.replace("Bearer ", "") || url.searchParams.get("token");

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
