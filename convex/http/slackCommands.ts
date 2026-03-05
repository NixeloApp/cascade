/**
 * Slack Slash Command HTTP Handler
 *
 * Handles `/nixelo` slash command requests from Slack.
 */

import { internal } from "../_generated/api";
import { type ActionCtx, httpAction } from "../_generated/server";
import { constantTimeEqual } from "../lib/apiAuth";
import { getSlackSigningSecret, isSlackSigningSecretConfigured } from "../lib/env";

const MAX_SLASH_COMMAND_TEXT_LENGTH = 2000;
const MAX_SLASH_COMMAND_BODY_LENGTH = 12000;
const MAX_SLACK_TEAM_ID_LENGTH = 64;
const MAX_SLACK_USER_ID_LENGTH = 64;

type SlashCommandResponseType = "ephemeral" | "in_channel";

interface SlashCommandPayload {
  teamId: string;
  callerSlackUserId: string;
  text: string;
}

function createSlackJsonResponse(
  text: string,
  status: number,
  responseType: SlashCommandResponseType = "ephemeral",
): Response {
  return new Response(
    JSON.stringify({
      response_type: responseType,
      text,
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    },
  );
}

function isInvalidSlackId(value: string): boolean {
  if (value.trim() !== value || /\s/.test(value)) {
    return true;
  }
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code < 32 || code === 127) {
      return true;
    }
  }
  return false;
}

function hasControlCharacters(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code < 32 || code === 127) {
      return true;
    }
  }
  return false;
}

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

function validateSlackPayloadId(
  value: string,
  fieldName: "team_id" | "user_id",
  maxLength: number,
): string | null {
  if (!value) {
    return `Missing ${fieldName} in Slack command payload.`;
  }
  if (value.length > maxLength || isInvalidSlackId(value)) {
    return `Invalid ${fieldName} in Slack command payload.`;
  }
  return null;
}

function parseAndValidateSlashCommandPayload(rawBody: string): SlashCommandPayload | Response {
  const params = new URLSearchParams(rawBody);
  const teamId = params.get("team_id") || "";
  const callerSlackUserId = params.get("user_id") || "";
  const text = params.get("text") || "";

  const teamIdError = validateSlackPayloadId(teamId, "team_id", MAX_SLACK_TEAM_ID_LENGTH);
  if (teamIdError) {
    return createSlackJsonResponse(teamIdError, 400);
  }

  const userIdError = validateSlackPayloadId(
    callerSlackUserId,
    "user_id",
    MAX_SLACK_USER_ID_LENGTH,
  );
  if (userIdError) {
    return createSlackJsonResponse(userIdError, 400);
  }

  if (text.length > MAX_SLASH_COMMAND_TEXT_LENGTH) {
    return createSlackJsonResponse("Command text is too long.", 400);
  }
  if (hasControlCharacters(text)) {
    return createSlackJsonResponse("Command text contains invalid characters.", 400);
  }

  return { teamId, callerSlackUserId, text };
}

/**
 * Validate and process Slack `/nixelo` slash command requests.
 *
 * Security and validation behavior:
 * - Requires configured Slack signing secret and valid Slack signature headers.
 * - Rejects stale requests older than 5 minutes (replay protection).
 * - Enforces maximum request body and command text lengths.
 * - Requires and bounds-checks `team_id` and `user_id` payload fields.
 *
 * Response contract:
 * - `200` with Slack-compatible JSON response on handled commands.
 * - `400` for missing/invalid command payload fields.
 * - `401` for invalid signatures.
 * - `413` for oversized payloads.
 * - `500` for configuration issues or unexpected backend failures.
 */
export const handleSlashCommandHandler = async (ctx: ActionCtx, request: Request) => {
  if (!isSlackSigningSecretConfigured()) {
    return createSlackJsonResponse("Slack signing secret is not configured.", 500);
  }

  const rawBody = await request.text();
  const rawBodyBytes = new TextEncoder().encode(rawBody).byteLength;
  if (rawBodyBytes > MAX_SLASH_COMMAND_BODY_LENGTH) {
    return createSlackJsonResponse("Request body is too large.", 413);
  }

  if (!(await verifySlackSignature(request.headers, rawBody))) {
    return createSlackJsonResponse("Invalid Slack signature.", 401);
  }

  const payload = parseAndValidateSlashCommandPayload(rawBody);
  if (payload instanceof Response) {
    return payload;
  }

  const { teamId, callerSlackUserId, text } = payload;
  try {
    const result = await ctx.runMutation(internal.slackCommandsCore.executeCommand, {
      teamId,
      callerSlackUserId,
      text,
    });

    return createSlackJsonResponse(result.message, 200, result.ok ? "in_channel" : "ephemeral");
  } catch {
    // Security: avoid leaking internal backend details to Slack users.
    return createSlackJsonResponse("Slash command failed. Please try again later.", 500);
  }
};

export const handleSlashCommand = httpAction(handleSlashCommandHandler);
