/**
 * Slack Slash Command HTTP Handler
 *
 * Handles `/nixelo` slash command requests from Slack.
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

export const handleSlashCommandHandler = async (ctx: ActionCtx, request: Request) => {
  if (!isSlackSigningSecretConfigured()) {
    return new Response(
      JSON.stringify({
        response_type: "ephemeral",
        text: "Slack signing secret is not configured.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const rawBody = await request.text();
  if (!(await verifySlackSignature(request.headers, rawBody))) {
    return new Response(
      JSON.stringify({
        response_type: "ephemeral",
        text: "Invalid Slack signature.",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const params = new URLSearchParams(rawBody);
  const teamId = params.get("team_id") || "";
  const text = params.get("text") || "";

  if (!teamId) {
    return new Response(
      JSON.stringify({
        response_type: "ephemeral",
        text: "Missing team_id in Slack command payload.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const result = await ctx.runMutation(internal.slackCommandsCore.executeCommand, {
      teamId,
      text,
    });

    return new Response(
      JSON.stringify({
        response_type: result.ok ? "in_channel" : "ephemeral",
        text: result.message,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Slash command failed";
    return new Response(
      JSON.stringify({
        response_type: "ephemeral",
        text: `Slash command error: ${escapeHtml(message)}`,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

export const handleSlashCommand = httpAction(handleSlashCommandHandler);
