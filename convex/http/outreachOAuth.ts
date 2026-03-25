/**
 * Outreach OAuth HTTP Handlers
 *
 * OAuth 2.0 flow for connecting Gmail/Outlook mailboxes for outreach sending.
 * Uses the same Google OAuth credentials as calendar but with Gmail-specific scopes.
 *
 * Flow:
 * 1. User clicks "Connect Gmail" → GET /outreach/google/auth
 * 2. Google redirects back → GET /outreach/google/callback
 * 3. Tokens saved to outreachMailboxes → User can send outreach from their Gmail
 *
 * Microsoft Outlook flow follows the same pattern with Microsoft endpoints.
 */

import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { type ActionCtx, httpAction } from "../_generated/server";
import { constantTimeEqual } from "../lib/apiAuth";

import {
  getConvexSiteUrl,
  getGoogleClientId,
  getGoogleClientSecret,
  isGoogleOAuthConfigured,
} from "../lib/env";
import { validation } from "../lib/errors";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";
import { escapeHtml } from "../lib/html";
import { logger } from "../lib/logger";
import { MINUTE, SECOND } from "../lib/timeUtils";
import { renderOAuthErrorPageHtml } from "./oauthHtml";

// =============================================================================
// Helpers
// =============================================================================

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

// =============================================================================
// Google Gmail OAuth
// =============================================================================

const getGmailOAuthConfig = () => {
  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();
  const convexSiteUrl = getConvexSiteUrl();

  if (!(isGoogleOAuthConfigured() && clientId && clientSecret && convexSiteUrl)) {
    throw validation(
      "oauth",
      "Google OAuth not configured. Set AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, and CONVEX_SITE_URL.",
    );
  }

  return {
    clientId,
    clientSecret,
    redirectUri: `${convexSiteUrl}/outreach/google/callback`,
    scopes: [
      "https://www.googleapis.com/auth/gmail.send", // Send emails as user
      "https://www.googleapis.com/auth/gmail.readonly", // Read inbox for reply detection
      "https://www.googleapis.com/auth/userinfo.email", // Get user's email address
      "https://www.googleapis.com/auth/userinfo.profile", // Get display name
    ].join(" "),
  };
};

function buildOAuthStateCookie(state: string): string {
  return `${OAUTH_STATE_COOKIE_NAME}=${encodeURIComponent(state)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${OAUTH_STATE_MAX_AGE_SECONDS}`;
}

function clearOAuthStateCookie(): string {
  return `${OAUTH_STATE_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function getStoredOAuthState(request: Request): string | undefined {
  const cookieHeader = request.headers.get("Cookie");
  const rawCookie = cookieHeader
    ?.split(";")
    .find((c) => c.trim().startsWith(`${OAUTH_STATE_COOKIE_NAME}=`))
    ?.split("=")
    .slice(1)
    .join("=")
    ?.trim();

  return safeDecode(rawCookie);
}

function hasInvalidOAuthStateInput(params: {
  code: string | null;
  state: string | null;
  storedState: string | undefined;
  error: string | null;
}): boolean {
  const { code, state, storedState, error } = params;
  const hasOversizedParams =
    (code && code.length > MAX_OAUTH_PARAM_LENGTH) ||
    (state && state.length > MAX_OAUTH_PARAM_LENGTH) ||
    (storedState && storedState.length > MAX_OAUTH_PARAM_LENGTH) ||
    (error && error.length > MAX_OAUTH_PARAM_LENGTH);

  return hasOversizedParams || !state || !storedState || !constantTimeEqual(state, storedState);
}

async function consumeOAuthNonce(
  ctx: ActionCtx,
  stateToken: string,
): Promise<{ userId: string; organizationId: string } | null> {
  return await ctx.runMutation(internal.outreach.oauthNonces.getNonceContextAndDelete, {
    provider: "google",
    stateToken,
  });
}

function getGoogleOAuthErrorMessage(error: string): string {
  const messages: Record<string, string> = {
    access_denied: "You declined the Gmail permission request.",
    invalid_scope: "Required Gmail permissions were not granted.",
  };

  return messages[error] ?? `Google returned an error: ${error}`;
}

async function exchangeGmailCodeForTokens(
  code: string,
  config: ReturnType<typeof getGmailOAuthConfig>,
): Promise<{ access_token: string; refresh_token?: string; expires_in?: number } | Response> {
  try {
    return await fetchJSON(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: config.redirectUri,
          grant_type: "authorization_code",
        }),
      },
      10000,
    );
  } catch (error) {
    logger.error("Gmail OAuth token exchange failed", { error });
    return new Response(
      renderOAuthErrorPageHtml(
        "Gmail Connection - Error",
        "Failed to connect to Gmail. Please try again.",
      ),
      {
        status: 500,
        headers: {
          "Content-Type": "text/html",
          "Set-Cookie": clearOAuthStateCookie(),
        },
      },
    );
  }
}

async function fetchGmailUserInfo(
  accessToken: string,
): Promise<{ email: string; name?: string } | Response> {
  try {
    return await fetchJSON("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (error) {
    logger.error("Gmail OAuth user info fetch failed", { error });
    return new Response(
      renderOAuthErrorPageHtml(
        "Gmail Connection - Error",
        "Failed to get your email address from Google.",
      ),
      {
        status: 500,
        headers: {
          "Content-Type": "text/html",
          "Set-Cookie": clearOAuthStateCookie(),
        },
      },
    );
  }
}

/**
 * Initiate Gmail OAuth flow
 * GET /outreach/google/auth
 */
export const initiateGmailAuthHandler = async (ctx: ActionCtx, request: Request) => {
  if (!isGoogleOAuthConfigured()) {
    return new Response(JSON.stringify({ error: "Google OAuth not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Frontend must pass userId and organizationId so the callback can create
  // the mailbox server-side without tokens ever reaching the browser.
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const organizationId = url.searchParams.get("organizationId");
  if (!userId || !organizationId) {
    return new Response(JSON.stringify({ error: "userId and organizationId are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const config = getGmailOAuthConfig();
  const { stateToken } = await ctx.runMutation(internal.outreach.oauthNonces.createNonce, {
    provider: "google",
    userId: userId as Id<"users">,
    organizationId: organizationId as Id<"organizations">,
  });

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", config.clientId);
  authUrl.searchParams.set("redirect_uri", config.redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", config.scopes);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", stateToken);

  return new Response(null, {
    status: 302,
    headers: {
      Location: authUrl.toString(),
      "Set-Cookie": buildOAuthStateCookie(stateToken),
    },
  });
};

export const initiateGmailAuth = httpAction(initiateGmailAuthHandler);

/** Safely decode a URI component, returning undefined on malformed input. */
function safeDecode(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return undefined;
  }
}

/** Build an OAuth error response that clears the state cookie. */
function oauthErrorResponse(title: string, message: string, status = 400): Response {
  return new Response(renderOAuthErrorPageHtml(title, message), {
    status,
    headers: {
      "Content-Type": "text/html",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Set-Cookie": clearOAuthStateCookie(),
    },
  });
}

/**
 * Handle Gmail OAuth callback
 * GET /outreach/google/callback?code=xxx&state=xxx
 */
export const handleGmailCallbackHandler = async (ctx: ActionCtx, request: Request) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const storedState = getStoredOAuthState(request);

  if (hasInvalidOAuthStateInput({ code, state, storedState, error })) {
    return oauthErrorResponse(
      "Gmail Connection - Error",
      "Invalid OAuth state. Please try connecting again.",
    );
  }

  if (!state) {
    return oauthErrorResponse(
      "Gmail Connection - Error",
      "Invalid OAuth state. Please try connecting again.",
    );
  }

  const oauthContext = await consumeOAuthNonce(ctx, state);

  if (!oauthContext) {
    return oauthErrorResponse(
      "Gmail Connection - Error",
      "This Gmail connection request has expired or was already used. Please try again.",
    );
  }

  // Handle errors from Google after the nonce is consumed so callbacks are single-use.
  if (error) {
    return oauthErrorResponse(
      "Gmail Connection - Error",
      escapeHtml(getGoogleOAuthErrorMessage(error)),
    );
  }

  if (!code) {
    return oauthErrorResponse(
      "Gmail Connection - Error",
      "Missing authorization code. Please try connecting again.",
    );
  }

  // Exchange code for tokens
  const config = getGmailOAuthConfig();
  const tokens = await exchangeGmailCodeForTokens(code, config);
  if (tokens instanceof Response) return tokens;

  if (!tokens.refresh_token) {
    return new Response(
      renderOAuthErrorPageHtml(
        "Gmail Connection - Error",
        "No refresh token received. Please revoke Nixelo access in your Google Account settings and try again.",
      ),
      {
        status: 400,
        headers: {
          "Content-Type": "text/html",
          "Set-Cookie": clearOAuthStateCookie(),
        },
      },
    );
  }

  // Get user info (email + name)
  const userInfo = await fetchGmailUserInfo(tokens.access_token);
  if (userInfo instanceof Response) return userInfo;

  // Store tokens and create mailbox server-side — tokens never reach the browser
  let mailboxId: string;
  try {
    mailboxId = await ctx.runMutation(internal.outreach.mailboxes.createMailboxFromOAuth, {
      userId: oauthContext.userId as Id<"users">,
      organizationId: oauthContext.organizationId as Id<"organizations">,
      provider: "google",
      email: userInfo.email,
      displayName: userInfo.name ?? userInfo.email.split("@")[0],
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expires_in ? Date.now() + tokens.expires_in * SECOND : undefined,
    });
  } catch (e) {
    logger.error("Failed to create mailbox from OAuth", { error: e });
    return new Response(
      renderOAuthErrorPageHtml(
        "Gmail Connection - Error",
        "Failed to save mailbox connection. Please try again.",
      ),
      {
        status: 500,
        headers: {
          "Content-Type": "text/html",
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Set-Cookie": clearOAuthStateCookie(),
        },
      },
    );
  }

  const siteUrl = process.env.SITE_URL ?? "http://localhost:5555";
  return new Response(renderOutreachSuccessPageHtml(userInfo.email, mailboxId, siteUrl), {
    status: 200,
    headers: {
      "Content-Type": "text/html",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
      "Set-Cookie": clearOAuthStateCookie(),
    },
  });
};

export const handleGmailCallback = httpAction(handleGmailCallbackHandler);

// =============================================================================
// Success Page HTML
// =============================================================================

function renderOutreachSuccessPageHtml(
  email: string,
  mailboxId: string,
  targetOrigin: string,
): string {
  // Tokens are stored server-side — only the mailbox ID is sent to the browser
  const safeEmail = escapeHtml(email);
  const safeMailboxId = escapeHtml(mailboxId);

  return `<!DOCTYPE html>
<html>
<head><title>Gmail Connected</title></head>
<body style="font-family:system-ui;max-width:600px;margin:100px auto;padding:20px;text-align:center;">
  <h2>Gmail Connected</h2>
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
