import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionCtx } from "../_generated/server";
import { handleUnfurlHandler } from "./slackUnfurl";
import { buildSlackSignedRequest } from "./testUtils";

const SLACK_UNFURL_URL = "https://api.convex.dev/slack/unfurl";

// Boundary constants for validation tests
const MAX_PAYLOAD_SIZE = 10000;
const MAX_LINK_COUNT = 25;
const MAX_SLACK_ID_LENGTH = 64;
const MAX_URL_LENGTH = 2048;

/** Create a minimal ActionCtx mock with the methods used by the handler */
function createMockActionCtx(overrides?: { runQuery?: ReturnType<typeof vi.fn> }): ActionCtx {
  return {
    runQuery: overrides?.runQuery ?? vi.fn(),
    runMutation: vi.fn(),
    runAction: vi.fn(),
    scheduler: { runAfter: vi.fn(), runAt: vi.fn(), cancel: vi.fn() },
    auth: { getUserIdentity: vi.fn() },
    storage: { getUrl: vi.fn(), generateUploadUrl: vi.fn(), delete: vi.fn(), get: vi.fn() },
    vectorSearch: vi.fn(),
  } as unknown as ActionCtx;
}

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
    const ctx = createMockActionCtx({ runQuery });
    const oversizePayload = "x".repeat(MAX_PAYLOAD_SIZE + 1);
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
    const ctx = createMockActionCtx({ runQuery });
    const links = Array.from({ length: MAX_LINK_COUNT + 1 }, (_, i) => ({
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

  it("should reject malformed payload JSON", async () => {
    const runQuery = vi.fn();
    const ctx = createMockActionCtx({ runQuery });
    const malformed =
      '{"team_id":"T-1","user_id":"U-1","links":[{"url":"https://nixelo.app/issues/ABC-1"}';
    const body = new URLSearchParams({ payload: malformed }).toString();
    const request = await buildSignedRequest(body, signingSecret);

    const response = await handleUnfurlHandler(ctx, request);
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Malformed payload JSON");
    expect(runQuery).not.toHaveBeenCalled();
  });

  it("should reject payloads with oversized team/user IDs", async () => {
    const runQuery = vi.fn();
    const ctx = createMockActionCtx({ runQuery });
    const body = new URLSearchParams({
      payload: JSON.stringify({
        team_id: "T".repeat(MAX_SLACK_ID_LENGTH + 1),
        user_id: "U".repeat(MAX_SLACK_ID_LENGTH + 1),
        links: [{ url: "https://nixelo.app/issues/ABC-1" }],
      }),
    }).toString();
    const request = await buildSignedRequest(body, signingSecret);

    const response = await handleUnfurlHandler(ctx, request);
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toMatch(/Invalid team_id|Invalid user_id/);
    expect(runQuery).not.toHaveBeenCalled();
  });

  it("should reject payloads with team_id containing surrounding whitespace", async () => {
    const runQuery = vi.fn();
    const ctx = createMockActionCtx({ runQuery });
    const body = new URLSearchParams({
      payload: JSON.stringify({
        team_id: " T-OK ",
        user_id: "U-OK",
        links: [{ url: "https://nixelo.app/issues/ABC-1" }],
      }),
    }).toString();
    const request = await buildSignedRequest(body, signingSecret);

    const response = await handleUnfurlHandler(ctx, request);
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Invalid team_id");
    expect(runQuery).not.toHaveBeenCalled();
  });

  it("should reject payloads with team_id containing control characters", async () => {
    const runQuery = vi.fn();
    const ctx = createMockActionCtx({ runQuery });
    const body = new URLSearchParams({
      payload: JSON.stringify({
        team_id: "T-OK\n",
        user_id: "U-OK",
        links: [{ url: "https://nixelo.app/issues/ABC-1" }],
      }),
    }).toString();
    const request = await buildSignedRequest(body, signingSecret);

    const response = await handleUnfurlHandler(ctx, request);
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Invalid team_id");
    expect(runQuery).not.toHaveBeenCalled();
  });

  it("should reject payloads with user_id containing surrounding whitespace", async () => {
    const runQuery = vi.fn();
    const ctx = createMockActionCtx({ runQuery });
    const body = new URLSearchParams({
      payload: JSON.stringify({
        team_id: "T-OK",
        user_id: " U-OK ",
        links: [{ url: "https://nixelo.app/issues/ABC-1" }],
      }),
    }).toString();
    const request = await buildSignedRequest(body, signingSecret);

    const response = await handleUnfurlHandler(ctx, request);
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Invalid user_id");
    expect(runQuery).not.toHaveBeenCalled();
  });

  it("should reject payloads with user_id containing control characters", async () => {
    const runQuery = vi.fn();
    const ctx = createMockActionCtx({ runQuery });
    const body = new URLSearchParams({
      payload: JSON.stringify({
        team_id: "T-OK",
        user_id: "U-OK\n",
        links: [{ url: "https://nixelo.app/issues/ABC-1" }],
      }),
    }).toString();
    const request = await buildSignedRequest(body, signingSecret);

    const response = await handleUnfurlHandler(ctx, request);
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Invalid user_id");
    expect(runQuery).not.toHaveBeenCalled();
  });

  it("should reject payloads with oversized link URLs", async () => {
    const runQuery = vi.fn();
    const ctx = createMockActionCtx({ runQuery });
    const body = new URLSearchParams({
      payload: JSON.stringify({
        team_id: "T-OK",
        user_id: "U-OK",
        links: [{ url: `https://nixelo.app/issues/${"A".repeat(MAX_URL_LENGTH + 1)}` }],
      }),
    }).toString();
    const request = await buildSignedRequest(body, signingSecret);

    const response = await handleUnfurlHandler(ctx, request);
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Link URL is too long");
    expect(runQuery).not.toHaveBeenCalled();
  });

  it("should reject payloads with non-array links field", async () => {
    const runQuery = vi.fn();
    const ctx = createMockActionCtx({ runQuery });
    const body = new URLSearchParams({
      payload: JSON.stringify({
        team_id: "T-OK",
        user_id: "U-OK",
        links: { url: "https://nixelo.app/issues/ABC-1" },
      }),
    }).toString();
    const request = await buildSignedRequest(body, signingSecret);

    const response = await handleUnfurlHandler(ctx, request);
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Invalid links payload");
    expect(runQuery).not.toHaveBeenCalled();
  });

  it("should reject payloads with non-string link URL values", async () => {
    const runQuery = vi.fn();
    const ctx = createMockActionCtx({ runQuery });
    const body = new URLSearchParams({
      payload: JSON.stringify({
        team_id: "T-OK",
        user_id: "U-OK",
        links: [{ url: 12345 }],
      }),
    }).toString();
    const request = await buildSignedRequest(body, signingSecret);

    const response = await handleUnfurlHandler(ctx, request);
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Invalid link URL");
    expect(runQuery).not.toHaveBeenCalled();
  });

  it("should return empty unfurls when payload has no links", async () => {
    const runQuery = vi.fn();
    const ctx = createMockActionCtx({ runQuery });
    const body = new URLSearchParams({
      payload: JSON.stringify({
        team_id: "T-OK",
        user_id: "U-OK",
      }),
    }).toString();
    const request = await buildSignedRequest(body, signingSecret);

    const response = await handleUnfurlHandler(ctx, request);
    const payload = (await response.json()) as {
      unfurls: Record<string, { title: string; text: string }>;
    };

    expect(response.status).toBe(200);
    expect(payload.unfurls).toEqual({});
    expect(runQuery).not.toHaveBeenCalled();
  });

  it("should reject requests missing Slack signature headers", async () => {
    const runQuery = vi.fn();
    const ctx = createMockActionCtx({ runQuery });
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

  it("should reject requests with stale Slack signature timestamps", async () => {
    const runQuery = vi.fn();
    const ctx = createMockActionCtx({ runQuery });
    const body = new URLSearchParams({
      payload: JSON.stringify({
        team_id: "T-OK",
        user_id: "U-OK",
        links: [{ url: "https://nixelo.app/issues/ABC-1" }],
      }),
    }).toString();
    const request = await buildSignedRequest(body, signingSecret);
    const staleTimestamp = `${Math.floor(Date.now() / 1000) - 301}`;
    const staleRequest = new Request(request.url, {
      method: request.method,
      headers: new Headers(request.headers),
      body,
    });
    staleRequest.headers.set("x-slack-request-timestamp", staleTimestamp);

    const response = await handleUnfurlHandler(ctx, staleRequest);
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(401);
    expect(payload.error).toBe("Invalid Slack signature.");
    expect(runQuery).not.toHaveBeenCalled();
  });

  it("should reject requests with non-numeric Slack signature timestamps", async () => {
    const runQuery = vi.fn();
    const ctx = createMockActionCtx({ runQuery });
    const body = new URLSearchParams({
      payload: JSON.stringify({
        team_id: "T-OK",
        user_id: "U-OK",
        links: [{ url: "https://nixelo.app/issues/ABC-1" }],
      }),
    }).toString();
    const request = await buildSignedRequest(body, signingSecret);
    const invalidTimestampRequest = new Request(request.url, {
      method: request.method,
      headers: new Headers(request.headers),
      body,
    });
    invalidTimestampRequest.headers.set("x-slack-request-timestamp", "not-a-number");

    const response = await handleUnfurlHandler(ctx, invalidTimestampRequest);
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(401);
    expect(payload.error).toBe("Invalid Slack signature.");
    expect(runQuery).not.toHaveBeenCalled();
  });

  it("should unfurl only unique issue links and ignore non-issue links", async () => {
    const issueUrl = "https://nixelo.app/issues/ABC-1";
    const nonIssueUrl = "https://nixelo.app/projects/ABC";
    const runQuery = vi.fn(async () => ({
      title: "ABC-1 title",
      text: "ABC-1 text",
    }));
    const ctx = createMockActionCtx({ runQuery });
    const body = new URLSearchParams({
      payload: JSON.stringify({
        team_id: "T-OK",
        user_id: "U-OK",
        links: [{ url: issueUrl }, { url: issueUrl }, { url: nonIssueUrl }, {}],
      }),
    }).toString();
    const request = await buildSignedRequest(body, signingSecret);

    const response = await handleUnfurlHandler(ctx, request);
    const payload = (await response.json()) as {
      unfurls: Record<string, { title: string; text: string }>;
    };

    expect(response.status).toBe(200);
    expect(runQuery).toHaveBeenCalledTimes(1);
    expect(payload.unfurls).toEqual({
      [issueUrl]: {
        title: "ABC-1 title",
        text: "ABC-1 text",
      },
    });
  });
});
