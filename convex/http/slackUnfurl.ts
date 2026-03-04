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

export const handleUnfurlHandler = async (ctx: ActionCtx, request: Request) => {
  if (!isSlackSigningSecretConfigured()) {
    return new Response(JSON.stringify({ error: "Slack signing secret is not configured." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rawBody = await request.text();
  if (!(await verifySlackSignature(request.headers, rawBody))) {
    return new Response(JSON.stringify({ error: "Invalid Slack signature." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const params = new URLSearchParams(rawBody);
  const payloadRaw = params.get("payload");
  if (!payloadRaw) {
    return new Response(JSON.stringify({ error: "Missing payload." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (payloadRaw.length > MAX_UNFURL_PAYLOAD_LENGTH) {
    return new Response(JSON.stringify({ error: "Payload is too large." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const payload = JSON.parse(payloadRaw) as SlackUnfurlPayload;
    const teamId = payload.team_id;
    const callerSlackUserId = payload.user_id;
    if (!teamId) {
      return new Response(JSON.stringify({ error: "Missing team_id." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!callerSlackUserId) {
      return new Response(JSON.stringify({ error: "Missing user_id." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const links = payload.links || [];
    if (links.length > MAX_UNFURL_LINKS) {
      return new Response(JSON.stringify({ error: "Too many links in unfurl payload." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const urlToIssueKey = new Map<string, string>();
    for (const link of links) {
      if (!link.url) {
        continue;
      }
      const issueKey = extractIssueKeyFromUrl(link.url);
      if (!issueKey) {
        continue;
      }
      urlToIssueKey.set(link.url, issueKey);
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

    const unfurls: Record<
      string,
      {
        title: string;
        text: string;
      }
    > = {};
    for (const link of resolvedLinks) {
      if (!link) {
        continue;
      }
      unfurls[link.url] = {
        title: link.title,
        text: link.text,
      };
    }

    return new Response(JSON.stringify({ unfurls }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // Security: avoid leaking internal backend details to Slack.
    return new Response(JSON.stringify({ error: "Unfurl failed. Please try again later." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const handleUnfurl = httpAction(handleUnfurlHandler);
