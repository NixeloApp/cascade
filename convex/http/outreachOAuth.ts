/**
 * Outreach OAuth HTTP Handlers
 *
 * OAuth 2.0 flows for connecting Gmail and Microsoft 365 mailboxes for outreach
 * sending. The browser only receives mailbox-connected completion events; access
 * and refresh tokens are stored server-side in Convex.
 */

import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { type ActionCtx, httpAction } from "../_generated/server";
import { constantTimeEqual } from "../lib/apiAuth";
import {
  getConvexSiteUrl,
  getGoogleClientId,
  getGoogleClientSecret,
  getMicrosoftClientId,
  getMicrosoftClientSecret,
  isGoogleOAuthConfigured,
  isMicrosoftOAuthConfigured,
} from "../lib/env";
import { validation } from "../lib/errors";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";
import { escapeHtml } from "../lib/html";
import { logger } from "../lib/logger";
import { MINUTE, SECOND } from "../lib/timeUtils";
import { renderOAuthErrorPageHtml } from "./oauthHtml";

type OutreachOAuthProvider = "google" | "microsoft";

type OutreachOAuthConfig = {
  authorizationUrl: string;
  connectionLabel: string;
  getClientId: () => string;
  getClientSecret: () => string;
  isConfigured: () => boolean;
  provider: OutreachOAuthProvider;
  redirectPath: string;
  scopes: string;
  tokenUrl: string;
};

type OAuthTokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
};

type OAuthMailboxProfile = {
  email: string;
  name?: string;
};

class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`HTTP ${status}: ${body.slice(0, 100)}`);
    this.name = "HttpError";
  }
}

const OAUTH_STATE_COOKIE_NAME = "outreach-oauth-state";
const OAUTH_STATE_MAX_AGE_SECONDS = (10 * MINUTE) / SECOND;
const MAX_OAUTH_PARAM_LENGTH = 2048;
const MICROSOFT_GRAPH_API_BASE = "https://graph.microsoft.com/v1.0";
const MICROSOFT_AUTHORIZATION_URL =
  "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
const MICROSOFT_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";

async function fetchJSON<T>(url: string, init?: RequestInit, timeoutMs = 10000): Promise<T> {
  const response = await fetchWithTimeout(url, init, timeoutMs);
  const text = await response.text();

  if (!response.ok) {
    throw new HttpError(response.status, text);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw validation("oauth", `Invalid JSON response from ${url}`);
  }
}

function getOutreachOAuthConfig(provider: OutreachOAuthProvider): OutreachOAuthConfig {
  if (provider === "google") {
    return {
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      connectionLabel: "Gmail",
      getClientId: getGoogleClientId,
      getClientSecret: getGoogleClientSecret,
      isConfigured: isGoogleOAuthConfigured,
      provider,
      redirectPath: "/outreach/google/callback",
      scopes: [
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ].join(" "),
      tokenUrl: "https://oauth2.googleapis.com/token",
    };
  }

  return {
    authorizationUrl: MICROSOFT_AUTHORIZATION_URL,
    connectionLabel: "Microsoft 365",
    getClientId: getMicrosoftClientId,
    getClientSecret: getMicrosoftClientSecret,
    isConfigured: isMicrosoftOAuthConfigured,
    provider,
    redirectPath: "/outreach/microsoft/callback",
    scopes: ["offline_access", "User.Read", "Mail.Send", "Mail.Read"].join(" "),
    tokenUrl: MICROSOFT_TOKEN_URL,
  };
}

function getOAuthRedirectUri(config: OutreachOAuthConfig): string {
  return `${getConvexSiteUrl()}${config.redirectPath}`;
}

function buildOAuthStateCookie(state: string): string {
  return `${OAUTH_STATE_COOKIE_NAME}=${encodeURIComponent(state)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${OAUTH_STATE_MAX_AGE_SECONDS}`;
}

function clearOAuthStateCookie(): string {
  return `${OAUTH_STATE_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function safeDecode(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return undefined;
  }
}

function getStoredOAuthState(request: Request): string | undefined {
  const cookieHeader = request.headers.get("Cookie");
  const rawCookie = cookieHeader
    ?.split(";")
    .find((candidate) => candidate.trim().startsWith(`${OAUTH_STATE_COOKIE_NAME}=`))
    ?.split("=")
    .slice(1)
    .join("=")
    ?.trim();

  return safeDecode(rawCookie);
}

function hasInvalidOAuthStateInput(params: {
  code: string | null;
  error: string | null;
  state: string | null;
  storedState: string | undefined;
}): boolean {
  const { code, error, state, storedState } = params;
  const hasOversizedParams =
    (code && code.length > MAX_OAUTH_PARAM_LENGTH) ||
    (state && state.length > MAX_OAUTH_PARAM_LENGTH) ||
    (storedState && storedState.length > MAX_OAUTH_PARAM_LENGTH) ||
    (error && error.length > MAX_OAUTH_PARAM_LENGTH);

  return hasOversizedParams || !state || !storedState || !constantTimeEqual(state, storedState);
}

async function consumeOAuthNonce(
  ctx: ActionCtx,
  provider: OutreachOAuthProvider,
  stateToken: string,
): Promise<{ organizationId: string; userId: string } | null> {
  return await ctx.runMutation(internal.outreach.oauthNonces.getNonceContextAndDelete, {
    provider,
    stateToken,
  });
}

function getOAuthErrorTitle(provider: OutreachOAuthProvider): string {
  return `${getOutreachOAuthConfig(provider).connectionLabel} Connection - Error`;
}

function getProviderOAuthErrorMessage(provider: OutreachOAuthProvider, error: string): string {
  if (provider === "google") {
    const messages: Record<string, string> = {
      access_denied: "You declined the Gmail permission request.",
      invalid_scope: "Required Gmail permissions were not granted.",
    };
    return messages[error] ?? `Google returned an error: ${error}`;
  }

  const messages: Record<string, string> = {
    access_denied: "You declined the Microsoft 365 permission request.",
    invalid_scope: "Required Microsoft 365 permissions were not granted.",
  };

  return messages[error] ?? `Microsoft returned an error: ${error}`;
}

function getOAuthConfigurationError(provider: OutreachOAuthProvider): string {
  if (provider === "google") {
    return "Google OAuth not configured. Set AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, and CONVEX_SITE_URL.";
  }

  return "Microsoft 365 OAuth not configured. Set AUTH_MICROSOFT_ID, AUTH_MICROSOFT_SECRET, and CONVEX_SITE_URL.";
}

function getOAuthDisconnectInstructions(provider: OutreachOAuthProvider): string {
  return provider === "google"
    ? "No refresh token received. Please revoke Nixelo access in your Google Account settings and try again."
    : "No refresh token received. Please revoke Nixelo access in your Microsoft account settings and try again.";
}

function oauthErrorResponse(
  provider: OutreachOAuthProvider,
  message: string,
  status = 400,
): Response {
  return new Response(renderOAuthErrorPageHtml(getOAuthErrorTitle(provider), message), {
    status,
    headers: {
      "Content-Type": "text/html",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Set-Cookie": clearOAuthStateCookie(),
    },
  });
}

async function exchangeCodeForTokens(
  provider: OutreachOAuthProvider,
  code: string,
  config: OutreachOAuthConfig,
): Promise<OAuthTokenResponse | Response> {
  try {
    return await fetchJSON<OAuthTokenResponse>(
      config.tokenUrl,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: config.getClientId(),
          client_secret: config.getClientSecret(),
          code,
          grant_type: "authorization_code",
          redirect_uri: getOAuthRedirectUri(config),
        }),
      },
      10000,
    );
  } catch (error) {
    logger.error("Outreach OAuth token exchange failed", { error, provider });
    return oauthErrorResponse(
      provider,
      `Failed to connect to ${config.connectionLabel}. Please try again.`,
      500,
    );
  }
}

async function fetchGoogleMailboxProfile(
  accessToken: string,
): Promise<OAuthMailboxProfile | Response> {
  try {
    const userInfo = await fetchJSON<{ email?: string; name?: string }>(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!userInfo.email || !userInfo.email.includes("@")) {
      throw validation("oauth", "Invalid email received from Google");
    }

    return {
      email: userInfo.email,
      name: userInfo.name,
    };
  } catch (error) {
    logger.error("Gmail OAuth user info fetch failed", { error });
    return oauthErrorResponse("google", "Failed to get your email address from Google.", 500);
  }
}

async function fetchMicrosoftMailboxProfile(
  accessToken: string,
): Promise<OAuthMailboxProfile | Response> {
  try {
    const userInfo = await fetchJSON<{
      displayName?: string;
      mail?: string | null;
      userPrincipalName?: string;
    }>(`${MICROSOFT_GRAPH_API_BASE}/me?$select=displayName,mail,userPrincipalName`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const email = userInfo.mail ?? userInfo.userPrincipalName;
    if (!email || !email.includes("@")) {
      throw validation("oauth", "Invalid email received from Microsoft");
    }

    return {
      email,
      name: userInfo.displayName,
    };
  } catch (error) {
    logger.error("Microsoft OAuth user info fetch failed", { error });
    return oauthErrorResponse(
      "microsoft",
      "Failed to get your email address from Microsoft 365.",
      500,
    );
  }
}

async function fetchMailboxProfile(
  provider: OutreachOAuthProvider,
  accessToken: string,
): Promise<OAuthMailboxProfile | Response> {
  return provider === "google"
    ? await fetchGoogleMailboxProfile(accessToken)
    : await fetchMicrosoftMailboxProfile(accessToken);
}

function renderOutreachSuccessPageHtml(
  provider: OutreachOAuthProvider,
  email: string,
  mailboxId: string,
  targetOrigin: string,
): string {
  const providerLabel = getOutreachOAuthConfig(provider).connectionLabel;
  const safeEmail = escapeHtml(email);
  const safeMailboxId = escapeHtml(mailboxId);
  const safeProviderLabel = escapeHtml(providerLabel);

  return `<!DOCTYPE html>
<html>
<head><title>${safeProviderLabel} Connected</title></head>
<body style="font-family:system-ui;max-width:600px;margin:100px auto;padding:20px;text-align:center;">
  <h2>${safeProviderLabel} Connected</h2>
  <p>Successfully connected <strong>${safeEmail}</strong> for outreach.</p>
  <p>This window will close automatically...</p>
  <script>
    (function() {
      if (window.opener) {
        window.opener.postMessage({ type: 'outreach-mailbox-connected', mailboxId: '${safeMailboxId}' }, '${targetOrigin}');
        setTimeout(function() { window.close(); }, 1500);
      } else {
        document.body.innerHTML += '<p>Please close this window and refresh the app.</p>';
      }
    })();
  </script>
</body>
</html>`;
}

async function initiateMailboxAuthHandler(
  ctx: ActionCtx,
  request: Request,
  provider: OutreachOAuthProvider,
) {
  const config = getOutreachOAuthConfig(provider);
  if (!config.isConfigured()) {
    return new Response(
      JSON.stringify({ error: `${config.connectionLabel} OAuth not configured` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const organizationId = url.searchParams.get("organizationId");
  if (!userId || !organizationId) {
    return new Response(JSON.stringify({ error: "userId and organizationId are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { stateToken } = await ctx.runMutation(internal.outreach.oauthNonces.createNonce, {
    provider,
    userId: userId as Id<"users">,
    organizationId: organizationId as Id<"organizations">,
  });

  const authUrl = new URL(config.authorizationUrl);
  authUrl.searchParams.set("client_id", config.getClientId());
  authUrl.searchParams.set("redirect_uri", getOAuthRedirectUri(config));
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", config.scopes);
  authUrl.searchParams.set("state", stateToken);
  authUrl.searchParams.set("prompt", "consent");

  if (provider === "google") {
    authUrl.searchParams.set("access_type", "offline");
  } else {
    authUrl.searchParams.set("response_mode", "query");
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: authUrl.toString(),
      "Set-Cookie": buildOAuthStateCookie(stateToken),
    },
  });
}

async function handleMailboxCallbackHandler(
  ctx: ActionCtx,
  request: Request,
  provider: OutreachOAuthProvider,
) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const storedState = getStoredOAuthState(request);

  if (hasInvalidOAuthStateInput({ code, error, state, storedState })) {
    return oauthErrorResponse(provider, "Invalid OAuth state. Please try connecting again.");
  }

  if (!state) {
    return oauthErrorResponse(provider, "Invalid OAuth state. Please try connecting again.");
  }

  const oauthContext = await consumeOAuthNonce(ctx, provider, state);
  if (!oauthContext) {
    return oauthErrorResponse(
      provider,
      `This ${getOutreachOAuthConfig(provider).connectionLabel} connection request has expired or was already used. Please try again.`,
    );
  }

  if (error) {
    return oauthErrorResponse(provider, escapeHtml(getProviderOAuthErrorMessage(provider, error)));
  }

  if (!code) {
    return oauthErrorResponse(provider, "Missing authorization code. Please try connecting again.");
  }

  const config = getOutreachOAuthConfig(provider);
  if (!config.isConfigured()) {
    throw validation("oauth", getOAuthConfigurationError(provider));
  }

  const tokens = await exchangeCodeForTokens(provider, code, config);
  if (tokens instanceof Response) {
    return tokens;
  }

  if (!tokens.refresh_token) {
    return oauthErrorResponse(provider, getOAuthDisconnectInstructions(provider));
  }

  const mailboxProfile = await fetchMailboxProfile(provider, tokens.access_token);
  if (mailboxProfile instanceof Response) {
    return mailboxProfile;
  }

  let mailboxId: string;
  try {
    mailboxId = await ctx.runMutation(internal.outreach.mailboxes.createMailboxFromOAuth, {
      userId: oauthContext.userId as Id<"users">,
      organizationId: oauthContext.organizationId as Id<"organizations">,
      provider,
      email: mailboxProfile.email,
      displayName: mailboxProfile.name ?? mailboxProfile.email.split("@")[0],
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expires_in ? Date.now() + tokens.expires_in * SECOND : undefined,
    });
  } catch (error) {
    logger.error("Failed to create outreach mailbox from OAuth", { error, provider });
    return oauthErrorResponse(
      provider,
      "Failed to save mailbox connection. Please try again.",
      500,
    );
  }

  const siteUrl = process.env.SITE_URL ?? "http://localhost:5555";
  return new Response(
    renderOutreachSuccessPageHtml(provider, mailboxProfile.email, mailboxId, siteUrl),
    {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
        "Set-Cookie": clearOAuthStateCookie(),
      },
    },
  );
}

export const initiateGmailAuthHandler = async (ctx: ActionCtx, request: Request) =>
  await initiateMailboxAuthHandler(ctx, request, "google");

export const initiateMicrosoftAuthHandler = async (ctx: ActionCtx, request: Request) =>
  await initiateMailboxAuthHandler(ctx, request, "microsoft");

export const handleGmailCallbackHandler = async (ctx: ActionCtx, request: Request) =>
  await handleMailboxCallbackHandler(ctx, request, "google");

export const handleMicrosoftCallbackHandler = async (ctx: ActionCtx, request: Request) =>
  await handleMailboxCallbackHandler(ctx, request, "microsoft");

export const initiateGmailAuth = httpAction(initiateGmailAuthHandler);
export const initiateMicrosoftAuth = httpAction(initiateMicrosoftAuthHandler);
export const handleGmailCallback = httpAction(handleGmailCallbackHandler);
export const handleMicrosoftCallback = httpAction(handleMicrosoftCallbackHandler);
