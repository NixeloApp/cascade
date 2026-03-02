/**
 * Slack Unfurl HTTP Handler
 *
 * Handles Slack link unfurl callbacks.
 */

import { internal } from "../_generated/api";
import { type ActionCtx, httpAction } from "../_generated/server";
import { constantTimeEqual } from "../lib/apiAuth";
import { getSlackSigningSecret, isSlackSigningSecretConfigured } from "../lib/env";
import { escapeHtml } from "../lib/html";

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
  links?: Array<{ url?: string }>;
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

  try {
    const payload = JSON.parse(payloadRaw) as SlackUnfurlPayload;
    const teamId = payload.team_id;
    if (!teamId) {
      return new Response(JSON.stringify({ error: "Missing team_id." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const unfurls: Record<
      string,
      {
        title: string;
        text: string;
      }
    > = {};

    const links = payload.links || [];
    for (const link of links) {
      const url = link.url;
      if (!url) {
        continue;
      }

      const issue = await ctx.runQuery(internal.slackUnfurl.getIssueUnfurl, {
        teamId,
        url,
      });
      if (!issue) {
        continue;
      }

      unfurls[url] = {
        title: issue.title,
        text: issue.text,
      };
    }

    return new Response(JSON.stringify({ unfurls }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unfurl failed";
    return new Response(JSON.stringify({ error: escapeHtml(message) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const handleUnfurl = httpAction(handleUnfurlHandler);
