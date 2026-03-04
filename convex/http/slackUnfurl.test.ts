import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionCtx } from "../_generated/server";
import { handleUnfurlHandler } from "./slackUnfurl";
import { buildSlackSignedRequest } from "./testUtils";

const SLACK_UNFURL_URL = "https://api.convex.dev/slack/unfurl";

async function buildSignedRequest(body: string, secret: string): Promise<Request> {
  return buildSlackSignedRequest({
    url: SLACK_UNFURL_URL,
    body,
    secret,
  });
}

describe("Slack Unfurl HTTP Handler", () => {
  const originalEnv = process.env;
  const signingSecret = "test-slack-signing-secret";

  beforeEach(() => {
    process.env = { ...originalEnv, SLACK_SIGNING_SECRET: signingSecret };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should reject oversized unfurl payload", async () => {
    const runQuery = vi.fn();
    const ctx = { runQuery } as unknown as ActionCtx;
    const oversizePayload = "x".repeat(10001);
    const body = new URLSearchParams({ payload: oversizePayload }).toString();
    const request = await buildSignedRequest(body, signingSecret);

    const response = await handleUnfurlHandler(ctx, request);
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toContain("too large");
    expect(runQuery).not.toHaveBeenCalled();
  });

  it("should reject unfurl payloads with too many links", async () => {
    const runQuery = vi.fn();
    const ctx = { runQuery } as unknown as ActionCtx;
    const links = Array.from({ length: 26 }, (_, i) => ({
      url: `https://nixelo.app/issues/ABC-${i + 1}`,
    }));
    const body = new URLSearchParams({
      payload: JSON.stringify({
        team_id: "T-TOO-MANY",
        user_id: "U-TOO-MANY",
        links,
      }),
    }).toString();
    const request = await buildSignedRequest(body, signingSecret);

    const response = await handleUnfurlHandler(ctx, request);
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Too many links");
    expect(runQuery).not.toHaveBeenCalled();
  });

  it("should escape parse errors for malformed payload JSON", async () => {
    const runQuery = vi.fn();
    const ctx = { runQuery } as unknown as ActionCtx;
    const malformed =
      '{"team_id":"T-1","user_id":"U-1","links":[{"url":"https://nixelo.app/issues/ABC-1"}';
    const body = new URLSearchParams({ payload: malformed }).toString();
    const request = await buildSignedRequest(body, signingSecret);

    const response = await handleUnfurlHandler(ctx, request);
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(500);
    expect(payload.error).not.toContain("<");
    expect(runQuery).not.toHaveBeenCalled();
  });

  it("should reject requests missing Slack signature headers", async () => {
    const runQuery = vi.fn();
    const ctx = { runQuery } as unknown as ActionCtx;
    const body = new URLSearchParams({
      payload: JSON.stringify({
        team_id: "T-OK",
        user_id: "U-OK",
        links: [{ url: "https://nixelo.app/issues/ABC-1" }],
      }),
    }).toString();
    const request = new Request(SLACK_UNFURL_URL, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const response = await handleUnfurlHandler(ctx, request);
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(401);
    expect(payload.error).toBe("Invalid Slack signature.");
    expect(runQuery).not.toHaveBeenCalled();
  });
});
