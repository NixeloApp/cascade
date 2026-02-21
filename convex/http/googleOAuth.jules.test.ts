import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionCtx } from "../_generated/server";
import * as envLib from "../lib/env";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";
import { handleCallbackHandler, initiateAuthHandler, triggerSyncHandler } from "./googleOAuth";

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
}));

// Mock api/internal
vi.mock("../_generated/api", () => ({
  api: {
    googleCalendar: {
      getConnection: "api.googleCalendar.getConnection",
      syncFromGoogle: "api.googleCalendar.syncFromGoogle",
    },
  },
  internal: {
    googleCalendar: {
      getDecryptedTokens: "internal.googleCalendar.getDecryptedTokens",
    },
  },
}));

describe("Google OAuth Flow", () => {
  const mockCtx = {
    runQuery: vi.fn(),
    runMutation: vi.fn(),
  } as unknown as ActionCtx;

  beforeEach(() => {
    vi.resetAllMocks();
    // Default config
    vi.mocked(envLib.getGoogleClientId).mockReturnValue("test-client-id");
    vi.mocked(envLib.getGoogleClientSecret).mockReturnValue("test-client-secret");
    vi.mocked(envLib.isGoogleOAuthConfigured).mockReturnValue(true);
    process.env.CONVEX_SITE_URL = "https://test.convex.site";
  });

  afterEach(() => {
    delete process.env.CONVEX_SITE_URL;
  });

  describe("initiateAuthHandler", () => {
    it("should redirect to Google with correct parameters", async () => {
      const request = new Request("https://api.convex.site/google/auth");
      const response = await initiateAuthHandler(mockCtx, request);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(302);

      const location = response.headers.get("Location");
      expect(location).toBeDefined();
      // biome-ignore lint/style/noNonNullAssertion: testing convenience
      const url = new URL(location!);

      expect(url.origin).toBe("https://accounts.google.com");
      expect(url.pathname).toBe("/o/oauth2/v2/auth");
      expect(url.searchParams.get("client_id")).toBe("test-client-id");
      expect(url.searchParams.get("redirect_uri")).toBe("https://test.convex.site/google/callback");
      expect(url.searchParams.get("scope")).toContain("calendar");
      expect(url.searchParams.get("response_type")).toBe("code");
      expect(url.searchParams.get("access_type")).toBe("offline");
      expect(url.searchParams.get("prompt")).toBe("consent");
    });

    it("should return error if not configured", async () => {
      vi.mocked(envLib.isGoogleOAuthConfigured).mockReturnValue(false);

      const request = new Request("https://api.convex.site/google/auth");
      const response = await initiateAuthHandler(mockCtx, request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toContain("not configured");
    });
  });

  describe("handleCallbackHandler", () => {
    it("should return HTML error if error param exists", async () => {
      const request = new Request("https://api.convex.site/google/callback?error=access_denied");
      const response = await handleCallbackHandler(mockCtx, request);

      expect(response.status).toBe(400);
      const text = await response.text();
      expect(text).toContain("Connection Failed");
      expect(text).toContain("access_denied");
    });

    it("should return 400 if code is missing", async () => {
      const request = new Request("https://api.convex.site/google/callback");
      const response = await handleCallbackHandler(mockCtx, request);

      expect(response.status).toBe(400);
      expect(await response.text()).toBe("Missing authorization code");
    });

    it("should exchange code for token and return success HTML", async () => {
      // Mock token exchange response
      vi.mocked(fetchWithTimeout).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: "google_access_token",
          refresh_token: "google_refresh_token",
          expires_in: 3600,
        }),
      } as Response);

      // Mock user info response
      vi.mocked(fetchWithTimeout).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: "test@example.com" }),
      } as Response);

      const request = new Request("https://api.convex.site/google/callback?code=auth_code");
      const response = await handleCallbackHandler(mockCtx, request);

      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toContain("Connected Successfully");
      expect(text).toContain("test@example.com");
      expect(text).toContain("google_access_token");
      expect(text).toContain("google_refresh_token");

      // Verify fetch calls
      expect(fetchWithTimeout).toHaveBeenCalledTimes(2);
      // Check token exchange call
      expect(vi.mocked(fetchWithTimeout).mock.calls[0][0]).toBe(
        "https://oauth2.googleapis.com/token",
      );
      // Check user info call
      expect(vi.mocked(fetchWithTimeout).mock.calls[1][0]).toBe(
        "https://www.googleapis.com/oauth2/v2/userinfo",
      );
    });

    it("should handle token exchange failure", async () => {
      vi.mocked(fetchWithTimeout).mockResolvedValueOnce({
        ok: false,
        text: async () => "invalid_grant",
      } as Response);

      const request = new Request("https://api.convex.site/google/callback?code=auth_code");
      const response = await handleCallbackHandler(mockCtx, request);

      expect(response.status).toBe(500);
      const text = await response.text();
      expect(text).toContain("Connection Failed");
    });

    it("should handle user info fetch failure", async () => {
      // Token success
      vi.mocked(fetchWithTimeout).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "token" }),
      } as Response);

      // User info failure
      vi.mocked(fetchWithTimeout).mockResolvedValueOnce({
        ok: false,
      } as Response);

      const request = new Request("https://api.convex.site/google/callback?code=auth_code");
      const response = await handleCallbackHandler(mockCtx, request);

      // It catches the error and returns HTML error page
      expect(response.status).toBe(500);
      const text = await response.text();
      expect(text).toContain("Connection Failed");
    });
  });

  describe("triggerSyncHandler", () => {
    it("should return error if not connected", async () => {
      vi.mocked(mockCtx.runQuery).mockResolvedValue(null);

      const request = new Request("https://api.convex.site/google/sync", { method: "POST" });
      const response = await triggerSyncHandler(mockCtx, request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Not connected to Google Calendar");
    });

    it("should return error if sync is disabled", async () => {
      vi.mocked(mockCtx.runQuery).mockResolvedValue({ _id: "conn1", syncEnabled: false });

      const request = new Request("https://api.convex.site/google/sync", { method: "POST" });
      const response = await triggerSyncHandler(mockCtx, request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Sync is disabled");
    });

    it("should return error if tokens missing", async () => {
      vi.mocked(mockCtx.runQuery).mockResolvedValue({ _id: "conn1", syncEnabled: true });
      vi.mocked(mockCtx.runMutation).mockResolvedValue(null);

      const request = new Request("https://api.convex.site/google/sync", { method: "POST" });
      const response = await triggerSyncHandler(mockCtx, request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe("Failed to get Google tokens");
    });

    it("should sync events successfully", async () => {
      vi.mocked(mockCtx.runQuery).mockResolvedValue({ _id: "conn1", syncEnabled: true });
      // First mutation call: get tokens
      vi.mocked(mockCtx.runMutation).mockResolvedValueOnce({ accessToken: "access_token" });
      // Second mutation call: sync result
      vi.mocked(mockCtx.runMutation).mockResolvedValueOnce({ imported: 5 });

      // Mock events fetch
      vi.mocked(fetchWithTimeout).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: "evt1",
              summary: "Event 1",
              start: { dateTime: "2023-01-01T10:00:00Z" },
              end: { dateTime: "2023-01-01T11:00:00Z" },
            },
          ],
        }),
      } as Response);

      const request = new Request("https://api.convex.site/google/sync", { method: "POST" });
      const response = await triggerSyncHandler(mockCtx, request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.imported).toBe(5);

      // Verify sync mutation was called
      expect(mockCtx.runMutation).toHaveBeenCalledTimes(2);
      expect(vi.mocked(mockCtx.runMutation).mock.calls[1][1]).toMatchObject({
        connectionId: "conn1",
        events: expect.arrayContaining([
          expect.objectContaining({
            googleEventId: "evt1",
            title: "Event 1",
          }),
        ]),
      });
    });

    it("should handle fetch error", async () => {
      vi.mocked(mockCtx.runQuery).mockResolvedValue({ _id: "conn1", syncEnabled: true });
      vi.mocked(mockCtx.runMutation).mockResolvedValueOnce({ accessToken: "access_token" });

      vi.mocked(fetchWithTimeout).mockResolvedValueOnce({
        ok: false,
      } as Response);

      const request = new Request("https://api.convex.site/google/sync", { method: "POST" });
      const response = await triggerSyncHandler(mockCtx, request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain("Failed to fetch Google Calendar events");
    });
  });
});
