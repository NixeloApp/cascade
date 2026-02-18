import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionCtx } from "../_generated/server";
import { handleCallbackHandler, initiateAuthHandler } from "./githubOAuth";

// Stub context - handlers don't use ctx, they only make external API calls
const stubCtx = {} as ActionCtx;

// Mock dependencies
vi.mock("../lib/env", () => ({
  getGitHubClientId: () => "mock-client-id",
  getGitHubClientSecret: () => "mock-client-secret",
  isGitHubOAuthConfigured: () => true,
}));

vi.mock("../_generated/api", () => ({
  api: {},
  internal: {},
}));

describe("GitHub OAuth Security", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, CONVEX_SITE_URL: "https://example.convex.cloud" };

    // Mock crypto.randomUUID
    if (!global.crypto) {
      global.crypto = {} as Crypto;
    }
    (global.crypto as Crypto).randomUUID = () =>
      "mock-uuid-state" as `${string}-${string}-${string}-${string}-${string}`;

    // Mock fetch
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("access_token")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ access_token: "mock-token" }),
        });
      }
      if (url.includes("api.github.com/user")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 12345, login: "testuser" }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe("initiateAuthHandler", () => {
    it("should generate state and set cookie", async () => {
      const response = await initiateAuthHandler(
        stubCtx,
        new Request("http://localhost/github/auth"),
      );

      expect(response.status).toBe(302);
      const location = response.headers.get("Location");
      expect(location).toContain("state=mock-uuid-state");

      const cookies = response.headers.get("Set-Cookie");
      expect(cookies).toBeDefined();
      expect(cookies).toContain("github_oauth_state=mock-uuid-state");
      expect(cookies).toContain("HttpOnly");
      // Expect Secure because CONVEX_SITE_URL is https
      expect(cookies).toContain("Secure");
    });
  });

  describe("handleCallbackHandler", () => {
    it("should succeed with valid state", async () => {
      const request = new Request(
        "http://localhost/github/callback?code=123&state=mock-uuid-state",
      );
      request.headers.set("Cookie", "github_oauth_state=mock-uuid-state");

      const response = await handleCallbackHandler(stubCtx, request);
      expect(response.status).toBe(200);

      // Cookie should be cleared
      const cookies = response.headers.get("Set-Cookie");
      expect(cookies).toContain("github_oauth_state=;");
      expect(cookies).toContain("Max-Age=0");
    });

    it("should fail if state param is missing", async () => {
      const request = new Request("http://localhost/github/callback?code=123");
      // Cookie present, param missing
      request.headers.set("Cookie", "github_oauth_state=mock-uuid-state");

      const response = await handleCallbackHandler(stubCtx, request);
      expect(response.status).toBe(400);
    });

    it("should fail if state cookie is missing", async () => {
      const request = new Request(
        "http://localhost/github/callback?code=123&state=mock-uuid-state",
      );
      // No cookie

      const response = await handleCallbackHandler(stubCtx, request);
      expect(response.status).toBe(400);
    });

    it("should fail if state mismatch", async () => {
      const request = new Request("http://localhost/github/callback?code=123&state=wrong-state");
      request.headers.set("Cookie", "github_oauth_state=mock-uuid-state");

      const response = await handleCallbackHandler(stubCtx, request);
      expect(response.status).toBe(400);
    });
  });
});
