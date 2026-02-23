import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionCtx } from "../_generated/server";
import * as envLib from "../lib/env";
import { fetchJSON, HttpError } from "../lib/fetchWithTimeout";
import { handleCallbackHandler } from "./githubOAuth";

// Define error type for testing
interface AppErrorData {
  code: string;
  message: string;
}

interface AppError extends Error {
  data: AppErrorData;
}

// Mock dependencies
vi.mock("../lib/fetchWithTimeout", () => {
  class MockHttpError extends Error {
    status: number;
    body: string;
    constructor(status: number, body: string) {
      super(`HTTP ${status}: ${body}`);
      this.name = "HttpError";
      this.status = status;
      this.body = body;
    }
  }
  return {
    fetchWithTimeout: vi.fn(),
    fetchJSON: vi.fn(),
    HttpError: MockHttpError,
  };
});

// Mock env library
vi.mock("../lib/env", () => ({
  getGitHubClientId: vi.fn(),
  getGitHubClientSecret: vi.fn(),
  isGitHubOAuthConfigured: vi.fn(),
}));

// Mock errors library (the actual module githubOAuth.ts imports from)
vi.mock("../lib/errors", () => ({
  isAppError: (err: unknown): err is AppError =>
    typeof err === "object" &&
    err !== null &&
    "data" in err &&
    typeof (err as AppError).data?.code === "string",
  validation: (_type: string, msg: string): AppError => {
    const err = new Error(msg) as AppError;
    err.data = { code: "VALIDATION", message: msg };
    return err;
  },
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
    process.env.CONVEX_SITE_URL = "https://test.convex.site";

    // Spy on console.error
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("should fail generically BUT log detailed error when GitHub returns 400 (fixed behavior)", async () => {
    // Setup mock to throw (simulating fetchJSON behavior on non-OK)
    vi.mocked(fetchJSON).mockRejectedValue(new HttpError(400, JSON.stringify(mockErrorResponse)));

    const request = new Request(
      "https://api.convex.site/github/callback?code=bad_code&state=valid_state",
    );
    request.headers.set("Cookie", "github-oauth-state=valid_state");

    const response = await handleCallbackHandler(mockCtx, request);

    // It should catch the validation error and return an error page
    expect(response.status).toBe(400); // handleOAuthError returns 400 for VALIDATION

    const html = await response.text();
    expect(html).toContain("Failed to exchange GitHub authorization code");

    // Check that we DID log the detailed error
    // Note: The implementation logs the *error object*, not necessarily the stringified body directly in the message argument
    // but likely as the second argument.
    // In githubOAuth.ts: console.error("GitHub OAuth error: Failed to exchange code", e);
    // So the second arg is the HttpError object.
    expect(consoleSpy).toHaveBeenCalledWith(
      "GitHub OAuth error: Failed to exchange code",
      expect.objectContaining({
        body: expect.stringContaining("The code passed is incorrect or expired."),
      }),
    );
  });

  it("should fail generically BUT log detailed error when user info fetch returns 400", async () => {
    // Mock token exchange success
    vi.mocked(fetchJSON).mockResolvedValueOnce({ access_token: "token" });

    // Mock user info fetch failure
    vi.mocked(fetchJSON).mockRejectedValueOnce(
      new HttpError(400, JSON.stringify({ message: "Bad credentials" })),
    );

    const request = new Request(
      "https://api.convex.site/github/callback?code=valid_code&state=valid_state",
    );
    request.headers.set("Cookie", "github-oauth-state=valid_state");

    const response = await handleCallbackHandler(mockCtx, request);

    // It should catch the validation error and return an error page
    expect(response.status).toBe(400); // handleOAuthError returns 400 for VALIDATION

    const html = await response.text();
    expect(html).toContain("Failed to get GitHub user info");

    // Check that we DID log the detailed error
    expect(consoleSpy).toHaveBeenCalledWith(
      "GitHub OAuth error: Failed to get user info",
      expect.objectContaining({
        body: expect.stringContaining("Bad credentials"),
      }),
    );
  });
});
