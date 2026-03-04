import { describe, expect, it } from "vitest";
import type { ActionCtx } from "../_generated/server";
import { handleCallbackHandler } from "./slackOAuth";

const SLACK_CALLBACK_URL = "https://api.convex.dev/slack/callback";

describe("Slack OAuth HTTP Handler", () => {
  it("should escape OAuth error text in callback HTML", async () => {
    const rawError = `<script>alert("xss")</script>`;
    const request = new Request(`${SLACK_CALLBACK_URL}?error=${encodeURIComponent(rawError)}`);
    const ctx = {} as ActionCtx;

    const response = await handleCallbackHandler(ctx, request);
    const html = await response.text();

    expect(response.status).toBe(400);
    expect(html).toContain("&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;");
    expect(html).not.toContain(rawError);
  });

  it("should reject oversized OAuth error query parameter", async () => {
    const oversizedError = "E".repeat(201);
    const request = new Request(
      `${SLACK_CALLBACK_URL}?error=${encodeURIComponent(oversizedError)}`,
    );
    const ctx = {} as ActionCtx;

    const response = await handleCallbackHandler(ctx, request);
    const html = await response.text();

    expect(response.status).toBe(400);
    expect(html).toContain("Slack OAuth request was invalid.");
    expect(html).not.toContain(oversizedError);
  });

  it("should reject oversized OAuth code parameter", async () => {
    const oversizedCode = "c".repeat(1025);
    const request = new Request(`${SLACK_CALLBACK_URL}?code=${oversizedCode}&state=ok-state`, {
      headers: {
        Cookie: "slack-oauth-state=ok-state",
      },
    });
    const ctx = {} as ActionCtx;

    const response = await handleCallbackHandler(ctx, request);
    const html = await response.text();

    expect(response.status).toBe(400);
    expect(html).toContain("Invalid OAuth state.");
  });

  it("should reject oversized OAuth state cookie value", async () => {
    const oversizedState = "s".repeat(1025);
    const request = new Request(`${SLACK_CALLBACK_URL}?code=ok-code&state=ok-state`, {
      headers: {
        Cookie: `slack-oauth-state=${oversizedState}`,
      },
    });
    const ctx = {} as ActionCtx;

    const response = await handleCallbackHandler(ctx, request);
    const html = await response.text();

    expect(response.status).toBe(400);
    expect(html).toContain("Invalid OAuth state.");
  });
});
