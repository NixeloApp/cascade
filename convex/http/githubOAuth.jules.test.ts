import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionCtx } from "../_generated/server";
import { handleCallbackHandler, initiateAuthHandler } from "./githubOAuth";

// Mock dependencies
vi.mock("../lib/env", () => ({
  getGitHubClientId: () => "test-client-id",
  getGitHubClientSecret: () => "test-client-secret",
  isGitHubOAuthConfigured: () => true,
}));

vi.mock("../lib/fetchWithTimeout", () => ({
  fetchWithTimeout: vi.fn(),
}));

// Mock crypto.randomUUID
global.crypto.randomUUID = vi.fn(() => "test-uuid-state");

describe("GitHub OAuth Security", () => {
  let mockCtx: ActionCtx;

  beforeEach(() => {
    mockCtx = {} as ActionCtx;
    vi.clearAllMocks();
    process.env.CONVEX_SITE_URL = "https://test.convex.site";
  });

  afterEach(() => {
    delete process.env.CONVEX_SITE_URL;
  });

  describe("initiateAuthHandler", () => {
    it("should redirect to GitHub and set a state cookie", async () => {
      const request = new Request("https://test.convex.site/github/auth");
      const response = await initiateAuthHandler(mockCtx, request);

      expect(response.status).toBe(302);
      const location = response.headers.get("Location");
      expect(location).toContain("https://github.com/login/oauth/authorize");
      expect(location).toContain("state=test-uuid-state");

      // Fix verification: Set-Cookie header should be present
      const setCookie = response.headers.get("Set-Cookie");
      expect(setCookie).toContain("github_oauth_state=test-uuid-state");
      expect(setCookie).toContain("HttpOnly");
      expect(setCookie).toContain("Secure");
      expect(setCookie).toContain("SameSite=Lax");
    });
  });

  describe("handleCallbackHandler", () => {
    it("should REJECT callback without state parameter", async () => {
      const request = new Request("https://test.convex.site/github/callback?code=mock-code");
      const response = await handleCallbackHandler(mockCtx, request);
      expect(response.status).toBe(400);
      expect(await response.text()).toContain("Invalid state parameter");
    });

    it("should REJECT callback with mismatched state", async () => {
      const request = new Request(
        "https://test.convex.site/github/callback?code=mock-code&state=invalid-state",
        {
          headers: { Cookie: "github_oauth_state=valid-state" },
        },
      );
      const response = await handleCallbackHandler(mockCtx, request);
      expect(response.status).toBe(400);
      expect(await response.text()).toContain("Invalid state parameter");
    });

    it("should REJECT callback with missing cookie", async () => {
      const request = new Request(
        "https://test.convex.site/github/callback?code=mock-code&state=valid-state",
      );
      const response = await handleCallbackHandler(mockCtx, request);
      expect(response.status).toBe(400);
      expect(await response.text()).toContain("Invalid state parameter");
    });

    it("should ACCEPT callback with matching state", async () => {
      // Mock successful token exchange
      const { fetchWithTimeout } = await import("../lib/fetchWithTimeout");
      vi.mocked(fetchWithTimeout).mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "mock-access-token",
            token_type: "bearer",
          }),
        ),
      );

      // Mock successful user info fetch
      vi.mocked(fetchWithTimeout).mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 12345,
            login: "testuser",
          }),
        ),
      );

      const request = new Request(
        "https://test.convex.site/github/callback?code=mock-code&state=valid-state",
        {
          headers: { Cookie: "github_oauth_state=valid-state" },
        },
      );
      const response = await handleCallbackHandler(mockCtx, request);

      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toContain("Connected Successfully");

      // Verify cookie is cleared (optional but recommended)
      const setCookie = response.headers.get("Set-Cookie");
      expect(setCookie).toContain("github_oauth_state=;");
      expect(setCookie).toContain("Max-Age=0");
    });
  });
});
