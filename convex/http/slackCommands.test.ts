import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionCtx } from "../_generated/server";
import { handleSlashCommandHandler } from "./slackCommands";
import { buildSlackSignedRequest } from "./testUtils";

const SLACK_COMMANDS_URL = "https://api.convex.dev/slack/commands";

async function buildSignedRequest(body: string, secret: string): Promise<Request> {
  return buildSlackSignedRequest({
    url: SLACK_COMMANDS_URL,
    body,
    secret,
  });
}

async function buildSignedRequestWithTimestamp(
  body: string,
  secret: string,
  timestamp: number,
): Promise<Request> {
  return buildSlackSignedRequest({
    url: SLACK_COMMANDS_URL,
    body,
    secret,
    timestamp,
  });
}

describe("Slack Slash Command HTTP Handler", () => {
  const originalEnv = process.env;
  const signingSecret = "test-slack-signing-secret";

  beforeEach(() => {
    process.env = { ...originalEnv, SLACK_SIGNING_SECRET: signingSecret };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should reject oversized slash command text", async () => {
    const runMutation = vi.fn();
    const ctx = { runMutation } as unknown as ActionCtx;
    const longText = "a".repeat(2001);
    const body = new URLSearchParams({
      team_id: "T-LONG",
      user_id: "U-LONG",
      text: longText,
    }).toString();
    const request = await buildSignedRequest(body, signingSecret);

    const response = await handleSlashCommandHandler(ctx, request);
    const payload = (await response.json()) as { response_type: string; text: string };

    expect(response.status).toBe(400);
    expect(payload.response_type).toBe("ephemeral");
    expect(payload.text).toContain("too long");
    expect(runMutation).not.toHaveBeenCalled();
  });

  it("should reject slash command text with control characters", async () => {
    const runMutation = vi.fn();
    const ctx = { runMutation } as unknown as ActionCtx;
    const body = new URLSearchParams({
      team_id: "T-OK",
      user_id: "U-OK",
      text: "create\nissue",
    }).toString();
    const request = await buildSignedRequest(body, signingSecret);

    const response = await handleSlashCommandHandler(ctx, request);
    const payload = (await response.json()) as { response_type: string; text: string };

    expect(response.status).toBe(400);
    expect(payload.response_type).toBe("ephemeral");
    expect(payload.text).toContain("invalid characters");
    expect(runMutation).not.toHaveBeenCalled();
  });

  it("should reject oversized slash command body", async () => {
    const runMutation = vi.fn();
    const ctx = { runMutation } as unknown as ActionCtx;
    const largeNoise = "z".repeat(12001);
    const body = new URLSearchParams({
      team_id: "T-LARGE",
      user_id: "U-LARGE",
      text: "ok",
      noise: largeNoise,
    }).toString();
    const request = await buildSignedRequest(body, signingSecret);

    const response = await handleSlashCommandHandler(ctx, request);
    const payload = (await response.json()) as { response_type: string; text: string };

    expect(response.status).toBe(413);
    expect(payload.response_type).toBe("ephemeral");
    expect(payload.text).toContain("too large");
    expect(runMutation).not.toHaveBeenCalled();
  });

  it("should reject oversized team_id", async () => {
    const runMutation = vi.fn();
    const ctx = { runMutation } as unknown as ActionCtx;
    const body = new URLSearchParams({
      team_id: "T".repeat(65),
      user_id: "U-OK",
      text: "create test",
    }).toString();
    const request = await buildSignedRequest(body, signingSecret);

    const response = await handleSlashCommandHandler(ctx, request);
    const payload = (await response.json()) as { response_type: string; text: string };

    expect(response.status).toBe(400);
    expect(payload.response_type).toBe("ephemeral");
    expect(payload.text).toContain("Invalid team_id");
    expect(runMutation).not.toHaveBeenCalled();
  });

  it("should reject slash commands missing user_id", async () => {
    const runMutation = vi.fn();
    const ctx = { runMutation } as unknown as ActionCtx;
    const body = new URLSearchParams({
      team_id: "T-OK",
      text: "create test",
    }).toString();
    const request = await buildSignedRequest(body, signingSecret);

    const response = await handleSlashCommandHandler(ctx, request);
    const payload = (await response.json()) as { response_type: string; text: string };

    expect(response.status).toBe(400);
    expect(payload.response_type).toBe("ephemeral");
    expect(payload.text).toContain("Missing user_id");
    expect(runMutation).not.toHaveBeenCalled();
  });

  it("should reject slash commands missing team_id", async () => {
    const runMutation = vi.fn();
    const ctx = { runMutation } as unknown as ActionCtx;
    const body = new URLSearchParams({
      user_id: "U-OK",
      text: "create test",
    }).toString();
    const request = await buildSignedRequest(body, signingSecret);

    const response = await handleSlashCommandHandler(ctx, request);
    const payload = (await response.json()) as { response_type: string; text: string };

    expect(response.status).toBe(400);
    expect(payload.response_type).toBe("ephemeral");
    expect(payload.text).toContain("Missing team_id");
    expect(runMutation).not.toHaveBeenCalled();
  });

  it("should reject oversized user_id", async () => {
    const runMutation = vi.fn();
    const ctx = { runMutation } as unknown as ActionCtx;
    const body = new URLSearchParams({
      team_id: "T-OK",
      user_id: "U".repeat(65),
      text: "create test",
    }).toString();
    const request = await buildSignedRequest(body, signingSecret);

    const response = await handleSlashCommandHandler(ctx, request);
    const payload = (await response.json()) as { response_type: string; text: string };

    expect(response.status).toBe(400);
    expect(payload.response_type).toBe("ephemeral");
    expect(payload.text).toContain("Invalid user_id");
    expect(runMutation).not.toHaveBeenCalled();
  });

  it("should reject user_id with surrounding whitespace", async () => {
    const runMutation = vi.fn();
    const ctx = { runMutation } as unknown as ActionCtx;
    const body = new URLSearchParams({
      team_id: "T-OK",
      user_id: " U-OK ",
      text: "create test",
    }).toString();
    const request = await buildSignedRequest(body, signingSecret);

    const response = await handleSlashCommandHandler(ctx, request);
    const payload = (await response.json()) as { response_type: string; text: string };

    expect(response.status).toBe(400);
    expect(payload.response_type).toBe("ephemeral");
    expect(payload.text).toContain("Invalid user_id");
    expect(runMutation).not.toHaveBeenCalled();
  });

  it("should reject user_id with control characters", async () => {
    const runMutation = vi.fn();
    const ctx = { runMutation } as unknown as ActionCtx;
    const body = new URLSearchParams({
      team_id: "T-OK",
      user_id: "U-OK\n",
      text: "create test",
    }).toString();
    const request = await buildSignedRequest(body, signingSecret);

    const response = await handleSlashCommandHandler(ctx, request);
    const payload = (await response.json()) as { response_type: string; text: string };

    expect(response.status).toBe(400);
    expect(payload.response_type).toBe("ephemeral");
    expect(payload.text).toContain("Invalid user_id");
    expect(runMutation).not.toHaveBeenCalled();
  });

  it("should reject team_id with surrounding whitespace", async () => {
    const runMutation = vi.fn();
    const ctx = { runMutation } as unknown as ActionCtx;
    const body = new URLSearchParams({
      team_id: " T-OK ",
      user_id: "U-OK",
      text: "create test",
    }).toString();
    const request = await buildSignedRequest(body, signingSecret);

    const response = await handleSlashCommandHandler(ctx, request);
    const payload = (await response.json()) as { response_type: string; text: string };

    expect(response.status).toBe(400);
    expect(payload.response_type).toBe("ephemeral");
    expect(payload.text).toContain("Invalid team_id");
    expect(runMutation).not.toHaveBeenCalled();
  });

  it("should reject team_id with control characters", async () => {
    const runMutation = vi.fn();
    const ctx = { runMutation } as unknown as ActionCtx;
    const body = new URLSearchParams({
      team_id: "T-OK\n",
      user_id: "U-OK",
      text: "create test",
    }).toString();
    const request = await buildSignedRequest(body, signingSecret);

    const response = await handleSlashCommandHandler(ctx, request);
    const payload = (await response.json()) as { response_type: string; text: string };

    expect(response.status).toBe(400);
    expect(payload.response_type).toBe("ephemeral");
    expect(payload.text).toContain("Invalid team_id");
    expect(runMutation).not.toHaveBeenCalled();
  });

  it("should reject requests missing Slack signature headers", async () => {
    const runMutation = vi.fn();
    const ctx = { runMutation } as unknown as ActionCtx;
    const body = new URLSearchParams({
      team_id: "T-OK",
      user_id: "U-OK",
      text: "create test",
    }).toString();
    const request = new Request(SLACK_COMMANDS_URL, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const response = await handleSlashCommandHandler(ctx, request);
    const payload = (await response.json()) as { response_type: string; text: string };

    expect(response.status).toBe(401);
    expect(payload.response_type).toBe("ephemeral");
    expect(payload.text).toBe("Invalid Slack signature.");
    expect(runMutation).not.toHaveBeenCalled();
  });

  it("should reject stale Slack signatures", async () => {
    const runMutation = vi.fn();
    const ctx = { runMutation } as unknown as ActionCtx;
    const body = new URLSearchParams({
      team_id: "T-OK",
      user_id: "U-OK",
      text: "create test",
    }).toString();
    const staleTimestamp = Math.floor(Date.now() / 1000) - 301;
    const request = await buildSignedRequestWithTimestamp(body, signingSecret, staleTimestamp);

    const response = await handleSlashCommandHandler(ctx, request);
    const payload = (await response.json()) as { response_type: string; text: string };

    expect(response.status).toBe(401);
    expect(payload.response_type).toBe("ephemeral");
    expect(payload.text).toBe("Invalid Slack signature.");
    expect(runMutation).not.toHaveBeenCalled();
  });

  it("should reject Slack signatures with non-numeric timestamp", async () => {
    const runMutation = vi.fn();
    const ctx = { runMutation } as unknown as ActionCtx;
    const body = new URLSearchParams({
      team_id: "T-OK",
      user_id: "U-OK",
      text: "create test",
    }).toString();
    const request = new Request(SLACK_COMMANDS_URL, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "x-slack-request-timestamp": "abc",
        "x-slack-signature": "v0=invalid",
      },
      body,
    });

    const response = await handleSlashCommandHandler(ctx, request);
    const payload = (await response.json()) as { response_type: string; text: string };

    expect(response.status).toBe(401);
    expect(payload.response_type).toBe("ephemeral");
    expect(payload.text).toBe("Invalid Slack signature.");
    expect(runMutation).not.toHaveBeenCalled();
  });

  it("should reject Slack signatures that do not match request body", async () => {
    const runMutation = vi.fn();
    const ctx = { runMutation } as unknown as ActionCtx;
    const body = new URLSearchParams({
      team_id: "T-OK",
      user_id: "U-OK",
      text: "create test",
    }).toString();
    const request = await buildSignedRequest(body, signingSecret);

    const tamperedRequest = new Request(SLACK_COMMANDS_URL, {
      method: "POST",
      headers: request.headers,
      body: `${body}&extra=tampered`,
    });

    const response = await handleSlashCommandHandler(ctx, tamperedRequest);
    const payload = (await response.json()) as { response_type: string; text: string };

    expect(response.status).toBe(401);
    expect(payload.response_type).toBe("ephemeral");
    expect(payload.text).toBe("Invalid Slack signature.");
    expect(runMutation).not.toHaveBeenCalled();
  });

  it("should return 500 when Slack signing secret is not configured", async () => {
    process.env = { ...process.env, SLACK_SIGNING_SECRET: "" };
    const runMutation = vi.fn();
    const ctx = { runMutation } as unknown as ActionCtx;
    const body = new URLSearchParams({
      team_id: "T-OK",
      user_id: "U-OK",
      text: "create test",
    }).toString();
    const request = new Request(SLACK_COMMANDS_URL, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const response = await handleSlashCommandHandler(ctx, request);
    const payload = (await response.json()) as { response_type: string; text: string };

    expect(response.status).toBe(500);
    expect(payload.response_type).toBe("ephemeral");
    expect(payload.text).toBe("Slack signing secret is not configured.");
    expect(runMutation).not.toHaveBeenCalled();
  });

  it("should reject Slack signatures with future timestamp beyond tolerance", async () => {
    const runMutation = vi.fn();
    const ctx = { runMutation } as unknown as ActionCtx;
    const body = new URLSearchParams({
      team_id: "T-OK",
      user_id: "U-OK",
      text: "create test",
    }).toString();
    const futureTimestamp = Math.floor(Date.now() / 1000) + 301;
    const request = await buildSignedRequestWithTimestamp(body, signingSecret, futureTimestamp);

    const response = await handleSlashCommandHandler(ctx, request);
    const payload = (await response.json()) as { response_type: string; text: string };

    expect(response.status).toBe(401);
    expect(payload.response_type).toBe("ephemeral");
    expect(payload.text).toBe("Invalid Slack signature.");
    expect(runMutation).not.toHaveBeenCalled();
  });

  it("should not leak internal errors in slash command responses", async () => {
    const runMutation = vi.fn().mockRejectedValue(new Error("database password: super-secret"));
    const ctx = { runMutation } as unknown as ActionCtx;
    const body = new URLSearchParams({
      team_id: "T-OK",
      user_id: "U-OK",
      text: "create issue",
    }).toString();
    const request = await buildSignedRequest(body, signingSecret);

    const response = await handleSlashCommandHandler(ctx, request);
    const payload = (await response.json()) as { response_type: string; text: string };

    expect(response.status).toBe(500);
    expect(payload.response_type).toBe("ephemeral");
    expect(payload.text).toBe("Slash command failed. Please try again later.");
    expect(payload.text).not.toContain("super-secret");
  });
});
