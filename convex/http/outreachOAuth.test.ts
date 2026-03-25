import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { internal } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";
import * as envLib from "../lib/env";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";
import { handleGmailCallbackHandler, initiateGmailAuthHandler } from "./outreachOAuth";

const OUTREACH_AUTH_URL = "https://api.convex.site/outreach/google/auth";
const OUTREACH_CALLBACK_URL = "https://api.convex.site/outreach/google/callback";

vi.mock("../lib/env", () => ({
  getGoogleClientId: vi.fn(),
  getGoogleClientSecret: vi.fn(),
  isGoogleOAuthConfigured: vi.fn(),
  getConvexSiteUrl: vi.fn(),
}));

vi.mock("../lib/fetchWithTimeout", () => ({
  fetchWithTimeout: vi.fn(),
}));

vi.mock("../lib/html", () => ({
  escapeHtml: vi.fn((value: string) => value),
}));

vi.mock("../lib/apiAuth", () => ({
  constantTimeEqual: vi.fn((a: string, b: string) => a === b),
}));

vi.mock("./oauthHtml", () => ({
  renderOAuthErrorPageHtml: vi.fn(
    (title: string, message: string) => `<html><h1>${title}</h1><p>${message}</p></html>`,
  ),
}));

function mockOkResponse(data: unknown): Response {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(data),
  } as Response;
}

function mockErrorResponse(status: number, body: string): Response {
  return {
    ok: false,
    status,
    text: async () => body,
  } as Response;
}

function createMockActionCtx() {
  const ctx = {
    runQuery: vi.fn(),
    runMutation: vi.fn(),
    runAction: vi.fn(),
    vectorSearch: vi.fn(),
    scheduler: {},
    auth: {},
    storage: {},
  } as unknown as ActionCtx;

  return {
    ctx,
    runMutation: vi.mocked(ctx.runMutation),
  };
}

describe("Outreach Gmail OAuth Handler", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(envLib.getGoogleClientId).mockReturnValue("test-client-id");
    vi.mocked(envLib.getGoogleClientSecret).mockReturnValue("test-client-secret");
    vi.mocked(envLib.getConvexSiteUrl).mockReturnValue("https://test.convex.site");
    vi.mocked(envLib.isGoogleOAuthConfigured).mockReturnValue(true);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("initiateGmailAuthHandler", () => {
    it("issues a DB-backed nonce and redirects to Google with Gmail scopes", async () => {
      const { ctx, runMutation } = createMockActionCtx();
      runMutation.mockResolvedValue({
        stateToken: "nonce-state-token",
        expiresAt: Date.now() + 600_000,
      });

      const response = await initiateGmailAuthHandler(
        ctx,
        new Request(`${OUTREACH_AUTH_URL}?userId=user_123&organizationId=org_456`),
      );

      expect(response.status).toBe(302);
      expect(runMutation).toHaveBeenCalledWith(internal.outreach.oauthNonces.createNonce, {
        provider: "google",
        userId: "user_123",
        organizationId: "org_456",
      });

      const location = response.headers.get("Location");
      const setCookie = response.headers.get("Set-Cookie");
      expect(location).not.toBeNull();
      expect(setCookie).toContain("outreach-oauth-state=nonce-state-token");
      expect(setCookie).toContain("HttpOnly; Secure; SameSite=Lax");

      if (!location) throw new Error("Expected redirect location");
      const url = new URL(location);
      expect(url.origin).toBe("https://accounts.google.com");
      expect(url.pathname).toBe("/o/oauth2/v2/auth");
      expect(url.searchParams.get("state")).toBe("nonce-state-token");
      expect(url.searchParams.get("scope")).toContain("gmail.send");
      expect(url.searchParams.get("scope")).toContain("gmail.readonly");
      expect(url.searchParams.get("redirect_uri")).toBe(
        "https://test.convex.site/outreach/google/callback",
      );
    });

    it("returns 400 when required user context is missing", async () => {
      const { ctx, runMutation } = createMockActionCtx();
      const response = await initiateGmailAuthHandler(ctx, new Request(OUTREACH_AUTH_URL));

      expect(response.status).toBe(400);
      expect(runMutation).not.toHaveBeenCalled();
      expect(await response.json()).toEqual({
        error: "userId and organizationId are required",
      });
    });
  });

  describe("handleGmailCallbackHandler", () => {
    it("consumes the nonce once and completes mailbox creation on success", async () => {
      const { ctx, runMutation } = createMockActionCtx();
      runMutation
        .mockResolvedValueOnce({
          userId: "user_123",
          organizationId: "org_456",
        })
        .mockResolvedValueOnce("mailbox-789");

      vi.mocked(fetchWithTimeout)
        .mockResolvedValueOnce(
          mockOkResponse({
            access_token: "google_access_token",
            refresh_token: "google_refresh_token",
            expires_in: 3600,
          }),
        )
        .mockResolvedValueOnce(
          mockOkResponse({
            email: "test@example.com",
            name: "Test User",
          }),
        );

      const response = await handleGmailCallbackHandler(
        ctx,
        new Request(`${OUTREACH_CALLBACK_URL}?code=auth_code&state=nonce-state-token`, {
          headers: {
            Cookie: "outreach-oauth-state=nonce-state-token",
          },
        }),
      );

      expect(response.status).toBe(200);
      expect(runMutation).toHaveBeenNthCalledWith(
        1,
        internal.outreach.oauthNonces.getNonceContextAndDelete,
        {
          provider: "google",
          stateToken: "nonce-state-token",
        },
      );
      expect(runMutation).toHaveBeenNthCalledWith(
        2,
        internal.outreach.mailboxes.createMailboxFromOAuth,
        expect.objectContaining({
          userId: "user_123",
          organizationId: "org_456",
          provider: "google",
          email: "test@example.com",
          displayName: "Test User",
          accessToken: "google_access_token",
          refreshToken: "google_refresh_token",
        }),
      );

      const html = await response.text();
      expect(html).toContain("Gmail Connected");
      expect(html).toContain("test@example.com");
      expect(html).toContain("mailbox-789");
      expect(response.headers.get("Set-Cookie")).toContain("outreach-oauth-state=;");
      expect(fetchWithTimeout).toHaveBeenCalledTimes(2);
    });

    it("rejects reused or expired state before token exchange", async () => {
      const { ctx, runMutation } = createMockActionCtx();
      runMutation.mockResolvedValueOnce(null);

      const response = await handleGmailCallbackHandler(
        ctx,
        new Request(`${OUTREACH_CALLBACK_URL}?code=auth_code&state=nonce-state-token`, {
          headers: {
            Cookie: "outreach-oauth-state=nonce-state-token",
          },
        }),
      );

      expect(response.status).toBe(400);
      expect(await response.text()).toContain("expired or was already used");
      expect(fetchWithTimeout).not.toHaveBeenCalled();
    });

    it("consumes the nonce even when Google returns an OAuth error", async () => {
      const { ctx, runMutation } = createMockActionCtx();
      runMutation.mockResolvedValueOnce({
        userId: "user_123",
        organizationId: "org_456",
      });

      const response = await handleGmailCallbackHandler(
        ctx,
        new Request(`${OUTREACH_CALLBACK_URL}?error=access_denied&state=nonce-state-token`, {
          headers: {
            Cookie: "outreach-oauth-state=nonce-state-token",
          },
        }),
      );

      expect(response.status).toBe(400);
      expect(runMutation).toHaveBeenCalledWith(
        internal.outreach.oauthNonces.getNonceContextAndDelete,
        {
          provider: "google",
          stateToken: "nonce-state-token",
        },
      );
      expect(await response.text()).toContain("declined the Gmail permission request");
      expect(fetchWithTimeout).not.toHaveBeenCalled();
    });

    it("rejects mismatched state without consuming a nonce", async () => {
      const { ctx, runMutation } = createMockActionCtx();
      const response = await handleGmailCallbackHandler(
        ctx,
        new Request(`${OUTREACH_CALLBACK_URL}?code=auth_code&state=one-state`, {
          headers: {
            Cookie: "outreach-oauth-state=other-state",
          },
        }),
      );

      expect(response.status).toBe(400);
      expect(await response.text()).toContain("Invalid OAuth state");
      expect(runMutation).not.toHaveBeenCalled();
      expect(fetchWithTimeout).not.toHaveBeenCalled();
    });

    it("returns a safe error page when token exchange fails after nonce consumption", async () => {
      const { ctx, runMutation } = createMockActionCtx();
      runMutation.mockResolvedValueOnce({
        userId: "user_123",
        organizationId: "org_456",
      });
      vi.mocked(fetchWithTimeout).mockResolvedValueOnce(mockErrorResponse(400, "invalid_grant"));

      const response = await handleGmailCallbackHandler(
        ctx,
        new Request(`${OUTREACH_CALLBACK_URL}?code=auth_code&state=nonce-state-token`, {
          headers: {
            Cookie: "outreach-oauth-state=nonce-state-token",
          },
        }),
      );

      expect(response.status).toBe(500);
      expect(await response.text()).toContain("Failed to connect to Gmail");
      expect(runMutation).toHaveBeenCalledTimes(1);
    });
  });
});
