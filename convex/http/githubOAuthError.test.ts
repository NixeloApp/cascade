import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionCtx } from "../_generated/server";
import * as envLib from "../lib/env";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";
import { handleCallbackHandler } from "./githubOAuth";

// Mock dependencies
vi.mock("../lib/fetchWithTimeout", () => ({
  fetchWithTimeout: vi.fn(),
}));

// Mock env library
vi.mock("../lib/env", () => ({
  getGitHubClientId: vi.fn(),
  getGitHubClientSecret: vi.fn(),
  isGitHubOAuthConfigured: vi.fn(),
  getConvexSiteUrl: vi.fn(),
}));

describe("GitHub OAuth Error Handling", () => {
  let mockCtx: ActionCtx;
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  const mockErrorResponse = {
    error: "bad_verification_code",
    error_description: "The code passed is incorrect or expired.",
    error_uri: "https://docs.github.com/v3/oauth/#bad-verification-code",
  };

  beforeEach(() => {
    vi.resetAllMocks();
    mockCtx = {
      runQuery: vi.fn(),
      runMutation: vi.fn(),
    } as unknown as ActionCtx;

    // Default config
    vi.mocked(envLib.getGitHubClientId).mockReturnValue("test-client-id");
    vi.mocked(envLib.getGitHubClientSecret).mockReturnValue("test-client-secret");
    vi.mocked(envLib.isGitHubOAuthConfigured).mockReturnValue(true);
    vi.mocked(envLib.getConvexSiteUrl).mockReturnValue("https://test.convex.site");

    // Spy on console.error
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("should fail generically BUT log detailed error when GitHub returns 400 (fixed behavior)", async () => {
    // Setup mock to return 400 with detailed error
    vi.mocked(fetchWithTimeout).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => mockErrorResponse,
      text: async () => JSON.stringify(mockErrorResponse),
    } as Response);

    const request = new Request(
      "https://api.convex.site/github/callback?code=bad_code&state=valid_state",
    );
    request.headers.set("Cookie", "github-oauth-state=valid_state");

    const response = await handleCallbackHandler(mockCtx, request);

    // It should catch the UPSTREAM error and return a 502
    expect(response.status).toBe(502);

    const html = await response.text();
    // User sees generic message
    expect(html).toContain("Failed to exchange authorization code");
    // User does NOT see details
    expect(html).not.toContain("bad_verification_code");

    // Check that we DID log the detailed error
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(
        /\[ERROR\] GitHub OAuth error: Failed to exchange code.*bad_verification_code/,
      ),
    );
  });

  it("should fail generically BUT log detailed error when user info fetch returns 400", async () => {
    // Mock token exchange success
    vi.mocked(fetchWithTimeout).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: "token" }),
    } as Response);

    // Mock user info fetch failure
    vi.mocked(fetchWithTimeout).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: "Bad credentials" }),
      text: async () => JSON.stringify({ message: "Bad credentials" }),
    } as Response);

    const request = new Request(
      "https://api.convex.site/github/callback?code=valid_code&state=valid_state",
    );
    request.headers.set("Cookie", "github-oauth-state=valid_state");

    const response = await handleCallbackHandler(mockCtx, request);

    // It should catch the UPSTREAM error and return a 502
    expect(response.status).toBe(502);

    const html = await response.text();
    // User sees generic message
    expect(html).toContain("Failed to retrieve user info");
    // User does NOT see details
    expect(html).not.toContain("Bad credentials");

    // Check that we DID log the detailed error
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(
        /\[ERROR\] GitHub OAuth error: Failed to get user info.*Bad credentials/,
      ),
    );
  });
});
