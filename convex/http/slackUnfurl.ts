/**
 * Slack Unfurl HTTP Handler
 *
 * Handles Slack link unfurl callbacks.
 */

import { internal } from "../_generated/api";
import { type ActionCtx, httpAction } from "../_generated/server";
import { constantTimeEqual } from "../lib/apiAuth";
import { getSlackSigningSecret, isSlackSigningSecretConfigured } from "../lib/env";

const MAX_UNFURL_PAYLOAD_LENGTH = 10000;
const MAX_UNFURL_LINKS = 25;

/**
 * Compute HMAC-SHA256 using Web Crypto API.
 * Returns hex-encoded digest.
 */
async function hmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifySlackSignature(headers: Headers, rawBody: string): Promise<boolean> {
  if (!isSlackSigningSecretConfigured()) {
    return false;
  }

  const timestamp = headers.get("x-slack-request-timestamp");
  const signature = headers.get("x-slack-signature");
  if (!timestamp || !signature) {
    return false;
  }

  const requestTs = Number(timestamp);
  if (!Number.isFinite(requestTs)) {
    return false;
  }

  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - requestTs);
  if (ageSeconds > 300) {
    return false;
  }

  const baseString = `v0:${timestamp}:${rawBody}`;
  const hmac = await hmacSha256(getSlackSigningSecret(), baseString);
  const expected = `v0=${hmac}`;
  return constantTimeEqual(signature, expected);
}

interface SlackUnfurlPayload {
  team_id?: string;
  user_id?: string;
  links?: Array<{ url?: string }>;
}

function extractIssueKeyFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Only match issue keys in /issues/:key routes to avoid false positives
    const match = parsed.pathname.match(/\/issues\/([A-Z][A-Z0-9]+-\d+)(?:\/|$)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

type PayloadValidation =
  | { ok: true; payload: SlackUnfurlPayload; teamId: string; callerSlackUserId: string }
  | { ok: false; response: Response };

function validatePayload(payloadRaw: string | null): PayloadValidation {
  if (!payloadRaw) {
    return { ok: false, response: jsonError("Missing payload.", 400) };
  }
  if (payloadRaw.length > MAX_UNFURL_PAYLOAD_LENGTH) {
    return { ok: false, response: jsonError("Payload is too large.", 400) };
  }

  const payload = JSON.parse(payloadRaw) as SlackUnfurlPayload;
  const teamId = payload.team_id;
  const callerSlackUserId = payload.user_id;

  if (!teamId) {
    return { ok: false, response: jsonError("Missing team_id.", 400) };
  }
  if (!callerSlackUserId) {
    return { ok: false, response: jsonError("Missing user_id.", 400) };
  }

  const links = payload.links || [];
  if (links.length > MAX_UNFURL_LINKS) {
    return { ok: false, response: jsonError("Too many links in unfurl payload.", 400) };
  }

  return { ok: true, payload, teamId, callerSlackUserId };
}

export const handleUnfurlHandler = async (ctx: ActionCtx, request: Request) => {
  if (!isSlackSigningSecretConfigured()) {
    return jsonError("Slack signing secret is not configured.", 500);
  }

  const rawBody = await request.text();
  if (!(await verifySlackSignature(request.headers, rawBody))) {
    return jsonError("Invalid Slack signature.", 401);
  }

  const params = new URLSearchParams(rawBody);
  const payloadRaw = params.get("payload");

  try {
    const validation = validatePayload(payloadRaw);
    if (!validation.ok) {
      return validation.response;
    }

    const { payload, teamId, callerSlackUserId } = validation;
    const links = payload.links || [];

    const urlToIssueKey = new Map<string, string>();
    for (const link of links) {
      if (!link.url) continue;
      const issueKey = extractIssueKeyFromUrl(link.url);
      if (issueKey) {
        urlToIssueKey.set(link.url, issueKey);
      }
    }
    const resolvedLinks = await Promise.all(
      Array.from(urlToIssueKey.entries()).map(async ([url, issueKey]) => {
        const issue = await ctx.runQuery(internal.slackUnfurl.getIssueUnfurl, {
          teamId,
          callerSlackUserId,
          issueKey,
          url,
        });
        if (!issue) {
          return null;
        }

        return {
          url,
          title: issue.title,
          text: issue.text,
        };
      }),
    );

    const unfurls: Record<string, { title: string; text: string }> = {};
    for (const link of resolvedLinks) {
      if (link) {
        unfurls[link.url] = { title: link.title, text: link.text };
      }
    }

    return new Response(JSON.stringify({ unfurls }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // Security: avoid leaking internal backend details to Slack.
    return jsonError("Unfurl failed. Please try again later.", 500);
  }
};

export const handleUnfurl = httpAction(handleUnfurlHandler);
