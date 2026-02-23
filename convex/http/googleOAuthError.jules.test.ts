import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionCtx } from "../_generated/server";
import * as envLib from "../lib/env";
import { fetchJSON, fetchWithTimeout, HttpError } from "../lib/fetchWithTimeout";
import { handleCallbackHandler } from "./googleOAuth";

// Mock env library
vi.mock("../lib/env", () => ({
  getGoogleClientId: vi.fn(),
  getGoogleClientSecret: vi.fn(),
  isGoogleOAuthConfigured: vi.fn(),
  getConvexSiteUrl: vi.fn(),
  validation: (_type: string, msg: string) => new Error(msg),
}));

// Mock fetchWithTimeout
vi.mock("../lib/fetchWithTimeout", () => ({
  fetchWithTimeout: vi.fn(),
  fetchJSON: vi.fn(),
  HttpError: class extends Error {
    status: number;
    body: string;
    constructor(status: number, body: string) {
      super(`HTTP ${status}: ${body}`);
      this.status = status;
      this.body = body;
    }
  },
}));

// Mock api/internal
vi.mock("../_generated/api", () => ({
  api: {},
  internal: {},
}));

describe("Google OAuth Error Handling", () => {
  const mockCtx = {
    runQuery: vi.fn(),
    runMutation: vi.fn(),
  } as unknown as ActionCtx;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(envLib.getGoogleClientId).mockReturnValue("test-client-id");
    vi.mocked(envLib.getGoogleClientSecret).mockReturnValue("test-client-secret");
    vi.mocked(envLib.isGoogleOAuthConfigured).mockReturnValue(true);
    process.env.CONVEX_SITE_URL = "https://test.convex.site";
  });

  afterEach(() => {
    delete process.env.CONVEX_SITE_URL;
  });

  it("should log error details when token exchange fails", async () => {
    // Spy on console.error
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Mock token exchange failure
    const errorBody = JSON.stringify({ error: "invalid_grant", error_description: "Bad Request" });

    // Mock fetchJSON to throw HttpError, simulating upstream failure
    vi.mocked(fetchJSON).mockRejectedValueOnce(
      new HttpError(400, errorBody)
    );

    const request = new Request(
      "https://api.convex.site/google/callback?code=auth_code&state=valid_state",
    );
    request.headers.set("Cookie", "google-oauth-state=valid_state");

    const response = await handleCallbackHandler(mockCtx, request);

    // Verify response is generic 500 HTML
    expect(response.status).toBe(500);
    const text = await response.text();
    expect(text).toContain("Connection Failed");

    // Verify console.error was called with details
    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorArgs = consoleErrorSpy.mock.calls.map((args) => args.join(" ")).join(" ");

    // We expect the error message to contain the upstream error body (parsed description takes precedence)
    expect(errorArgs).toContain("Bad Request");

    consoleErrorSpy.mockRestore();
  });
});
