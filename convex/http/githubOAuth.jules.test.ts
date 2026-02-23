import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionCtx } from "../_generated/server";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";
import { handleCallbackHandler, listReposHandler } from "./githubOAuth";

// Mock fetchWithTimeout
vi.mock("../lib/fetchWithTimeout", () => ({
  fetchWithTimeout: vi.fn(),
}));

const mockFetchWithTimeout = vi.mocked(fetchWithTimeout);

describe("GitHub OAuth Error Handling", () => {
  const mockCtx = {
    runQuery: vi.fn(),
    runMutation: vi.fn(),
  } as unknown as ActionCtx;

  const mockRequest = (url: string, headers: Record<string, string> = {}) => {
    return new Request(url, { headers });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Set env vars
    process.env.GITHUB_CLIENT_ID = "client_id";
    process.env.GITHUB_CLIENT_SECRET = "client_secret";
    process.env.CONVEX_SITE_URL = "http://localhost";
  });

  afterEach(() => {
    // Clean up env vars
    delete process.env.GITHUB_CLIENT_ID;
    delete process.env.GITHUB_CLIENT_SECRET;
    delete process.env.CONVEX_SITE_URL;
  });

  describe("handleCallbackHandler", () => {
    it("should include upstream error when token exchange fails", async () => {
      const state = "valid-state";
      const code = "valid-code";
      const request = mockRequest(`http://localhost/github/callback?code=${code}&state=${state}`, {
        Cookie: `github-oauth-state=${state}`,
      });

      // Mock token exchange failure
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => "Bad Request from GitHub",
      } as Response);

      const response = await handleCallbackHandler(mockCtx, request);
      const text = await response.text();

      expect(response.status).toBe(400);
      // Improved behavior: includes upstream error
      expect(text).toContain(
        "Failed to exchange GitHub authorization code: Bad Request from GitHub",
      );
    });

    it("should fail gracefully when user info is missing required fields", async () => {
      const state = "valid-state";
      const code = "valid-code";
      const request = mockRequest(`http://localhost/github/callback?code=${code}&state=${state}`, {
        Cookie: `github-oauth-state=${state}`,
      });

      // Mock token exchange success
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "token" }),
      } as Response);

      // Mock user info success but empty object
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}), // Missing id and login
      } as Response);

      const response = await handleCallbackHandler(mockCtx, request);
      const text = await response.text();

      // Improved behavior: returns 400 validation error instead of crashing/succeeding with bad data
      expect(response.status).toBe(400);
      expect(text).toContain("Invalid GitHub user info: missing id or login");
    });

    it("should return HTML error page for invalid state", async () => {
      const request = mockRequest(`http://localhost/github/callback?code=code&state=invalid`, {
        Cookie: `github-oauth-state=valid`,
      });

      const response = await handleCallbackHandler(mockCtx, request);
      const text = await response.text();

      expect(response.status).toBe(400);
      // Improved behavior: HTML error page
      expect(text).toContain("<!DOCTYPE html>");
      expect(text).toContain("Invalid state or missing authorization code");
    });
  });

  describe("listReposHandler", () => {
    it("should handle non-array response from repos endpoint", async () => {
      (mockCtx.runQuery as any).mockResolvedValue({ userId: "user1" });
      (mockCtx.runMutation as any).mockResolvedValue({ accessToken: "token" });

      // Mock repos endpoint returns object instead of array
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Something went wrong" }),
      } as Response);

      const response = await listReposHandler(mockCtx, new Request("http://localhost"));
      const json = await response.json();

      // Improved behavior: 400 with specific error message (changed from 500 to 400 as per refactor)
      expect(response.status).toBe(400);
      expect(json.error).toBe("GitHub repositories response is not an array");
    });
  });
});
