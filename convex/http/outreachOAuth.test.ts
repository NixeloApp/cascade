import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { internal } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";
import * as envLib from "../lib/env";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";
import {
  handleGmailCallbackHandler,
  handleMicrosoftCallbackHandler,
  initiateGmailAuthHandler,
  initiateMicrosoftAuthHandler,
} from "./outreachOAuth";

const OUTREACH_GOOGLE_AUTH_URL = "https://api.convex.site/outreach/google/auth";
const OUTREACH_GOOGLE_CALLBACK_URL = "https://api.convex.site/outreach/google/callback";
const OUTREACH_MICROSOFT_AUTH_URL = "https://api.convex.site/outreach/microsoft/auth";
const OUTREACH_MICROSOFT_CALLBACK_URL = "https://api.convex.site/outreach/microsoft/callback";

vi.mock("../lib/env", () => ({
  getConvexSiteUrl: vi.fn(),
  getGoogleClientId: vi.fn(),
  getGoogleClientSecret: vi.fn(),
  getMicrosoftClientId: vi.fn(),
  getMicrosoftClientSecret: vi.fn(),
  isGoogleOAuthConfigured: vi.fn(),
  isMicrosoftOAuthConfigured: vi.fn(),
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

describe("outreach OAuth handlers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(envLib.getConvexSiteUrl).mockReturnValue("https://test.convex.site");
    vi.mocked(envLib.getGoogleClientId).mockReturnValue("google-client-id");
    vi.mocked(envLib.getGoogleClientSecret).mockReturnValue("google-client-secret");
    vi.mocked(envLib.getMicrosoftClientId).mockReturnValue("microsoft-client-id");
    vi.mocked(envLib.getMicrosoftClientSecret).mockReturnValue("microsoft-client-secret");
    vi.mocked(envLib.isGoogleOAuthConfigured).mockReturnValue(true);
    vi.mocked(envLib.isMicrosoftOAuthConfigured).mockReturnValue(true);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("initiates Gmail OAuth with a DB-backed nonce and Gmail scopes", async () => {
    const { ctx, runMutation } = createMockActionCtx();
    runMutation.mockResolvedValue({
      stateToken: "google-nonce",
      expiresAt: Date.now() + 600_000,
    });

    const response = await initiateGmailAuthHandler(
      ctx,
      new Request(`${OUTREACH_GOOGLE_AUTH_URL}?userId=user_123&organizationId=org_456`),
    );

    expect(response.status).toBe(302);
    expect(runMutation).toHaveBeenCalledWith(internal.outreach.oauthNonces.createNonce, {
      provider: "google",
      userId: "user_123",
      organizationId: "org_456",
    });

    const location = response.headers.get("Location");
    expect(location).not.toBeNull();
    if (!location) throw new Error("Expected Gmail redirect location");

    const url = new URL(location);
    expect(url.origin).toBe("https://accounts.google.com");
    expect(url.pathname).toBe("/o/oauth2/v2/auth");
    expect(url.searchParams.get("scope")).toContain("gmail.send");
    expect(url.searchParams.get("scope")).toContain("gmail.readonly");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://test.convex.site/outreach/google/callback",
    );
  });

  it("initiates Microsoft OAuth with delegated Graph scopes", async () => {
    const { ctx, runMutation } = createMockActionCtx();
    runMutation.mockResolvedValue({
      stateToken: "microsoft-nonce",
      expiresAt: Date.now() + 600_000,
    });

    const response = await initiateMicrosoftAuthHandler(
      ctx,
      new Request(`${OUTREACH_MICROSOFT_AUTH_URL}?userId=user_123&organizationId=org_456`),
    );

    expect(response.status).toBe(302);
    expect(runMutation).toHaveBeenCalledWith(internal.outreach.oauthNonces.createNonce, {
      provider: "microsoft",
      userId: "user_123",
      organizationId: "org_456",
    });

    const location = response.headers.get("Location");
    expect(location).not.toBeNull();
    if (!location) throw new Error("Expected Microsoft redirect location");

    const url = new URL(location);
    expect(url.origin).toBe("https://login.microsoftonline.com");
    expect(url.pathname).toBe("/common/oauth2/v2.0/authorize");
    expect(url.searchParams.get("scope")).toContain("Mail.Send");
    expect(url.searchParams.get("scope")).toContain("Mail.Read");
    expect(url.searchParams.get("scope")).toContain("User.Read");
    expect(url.searchParams.get("scope")).toContain("offline_access");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://test.convex.site/outreach/microsoft/callback",
    );
    expect(url.searchParams.get("response_mode")).toBe("query");
  });

  it("completes Gmail mailbox creation after token exchange and user lookup", async () => {
    const { ctx, runMutation } = createMockActionCtx();
    runMutation
      .mockResolvedValueOnce({
        userId: "user_123",
        organizationId: "org_456",
      })
      .mockResolvedValueOnce("mailbox-google");

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
      new Request(`${OUTREACH_GOOGLE_CALLBACK_URL}?code=auth_code&state=google-nonce`, {
        headers: { Cookie: "outreach-oauth-state-google=google-nonce" },
      }),
    );

    expect(response.status).toBe(200);
    expect(runMutation).toHaveBeenNthCalledWith(
      1,
      internal.outreach.oauthNonces.getNonceContextAndDelete,
      {
        provider: "google",
        stateToken: "google-nonce",
      },
    );
    expect(runMutation).toHaveBeenNthCalledWith(
      2,
      internal.outreach.mailboxes.createMailboxFromOAuth,
      expect.objectContaining({
        provider: "google",
        email: "test@example.com",
        accessToken: "google_access_token",
        refreshToken: "google_refresh_token",
      }),
    );
    expect(await response.text()).toContain("Gmail Connected");
  });

  it("completes Microsoft mailbox creation after token exchange and Graph user lookup", async () => {
    const { ctx, runMutation } = createMockActionCtx();
    runMutation
      .mockResolvedValueOnce({
        userId: "user_123",
        organizationId: "org_456",
      })
      .mockResolvedValueOnce("mailbox-microsoft");

    vi.mocked(fetchWithTimeout)
      .mockResolvedValueOnce(
        mockOkResponse({
          access_token: "microsoft_access_token",
          refresh_token: "microsoft_refresh_token",
          expires_in: 3600,
        }),
      )
      .mockResolvedValueOnce(
        mockOkResponse({
          displayName: "Pat Admin",
          mail: null,
          userPrincipalName: "pat@example.com",
        }),
      );

    const response = await handleMicrosoftCallbackHandler(
      ctx,
      new Request(`${OUTREACH_MICROSOFT_CALLBACK_URL}?code=auth_code&state=microsoft-nonce`, {
        headers: { Cookie: "outreach-oauth-state-microsoft=microsoft-nonce" },
      }),
    );

    expect(response.status).toBe(200);
    expect(runMutation).toHaveBeenNthCalledWith(
      1,
      internal.outreach.oauthNonces.getNonceContextAndDelete,
      {
        provider: "microsoft",
        stateToken: "microsoft-nonce",
      },
    );
    expect(runMutation).toHaveBeenNthCalledWith(
      2,
      internal.outreach.mailboxes.createMailboxFromOAuth,
      expect.objectContaining({
        provider: "microsoft",
        email: "pat@example.com",
        displayName: "Pat Admin",
        accessToken: "microsoft_access_token",
        refreshToken: "microsoft_refresh_token",
      }),
    );
    expect(await response.text()).toContain("Microsoft 365 Connected");
  });

  it("rejects mismatched callback state without consuming a nonce", async () => {
    const { ctx, runMutation } = createMockActionCtx();

    const response = await handleMicrosoftCallbackHandler(
      ctx,
      new Request(`${OUTREACH_MICROSOFT_CALLBACK_URL}?code=auth_code&state=one-state`, {
        headers: { Cookie: "outreach-oauth-state-microsoft=other-state" },
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.text()).toContain("Invalid OAuth state");
    expect(runMutation).not.toHaveBeenCalled();
    expect(fetchWithTimeout).not.toHaveBeenCalled();
  });

  it("returns a safe error page when Microsoft token exchange fails after nonce consumption", async () => {
    const { ctx, runMutation } = createMockActionCtx();
    runMutation.mockResolvedValueOnce({
      userId: "user_123",
      organizationId: "org_456",
    });
    vi.mocked(fetchWithTimeout).mockResolvedValueOnce(mockErrorResponse(400, "invalid_grant"));

    const response = await handleMicrosoftCallbackHandler(
      ctx,
      new Request(`${OUTREACH_MICROSOFT_CALLBACK_URL}?code=auth_code&state=microsoft-nonce`, {
        headers: { Cookie: "outreach-oauth-state-microsoft=microsoft-nonce" },
      }),
    );

    expect(response.status).toBe(500);
    expect(await response.text()).toContain("Failed to connect to Microsoft 365");
    expect(runMutation).toHaveBeenCalledTimes(1);
  });
});
