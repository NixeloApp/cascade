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
import { httpAction } from "../_generated/server";
import { constantTimeEqual } from "../lib/apiAuth";

/** Sign a state string with HMAC-SHA256 using the Google client secret as key. */
async function signState(payload: string): Promise<string> {
  const secret = getGoogleClientSecret();
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${payload}.${hex}`;
}

/** Verify and extract the payload from a signed state string. */
async function verifyState(signed: string): Promise<string | null> {
  const lastDot = signed.lastIndexOf(".");
  if (lastDot === -1) return null;
  const payload = signed.substring(0, lastDot);
  const expected = await signState(payload);
  return constantTimeEqual(signed, expected) ? payload : null;
}

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
import { SECOND } from "../lib/timeUtils";
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

/**
 * Initiate Gmail OAuth flow
 * GET /outreach/google/auth
 */
export const initiateGmailAuth = httpAction(async (ctx, request) => {
  void ctx; // HTTP actions require ctx parameter but initiation doesn't use it
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
  // Sign the state with HMAC so the callback can verify it wasn't forged.
  // An attacker can't create a valid state without the server's secret.
  const nonce = crypto.randomUUID();
  const payload = `${nonce}:${userId}:${organizationId}`;
  const state = await signState(payload);

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", config.clientId);
  authUrl.searchParams.set("redirect_uri", config.redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", config.scopes);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: authUrl.toString(),
      "Set-Cookie": `outreach-oauth-state=${encodeURIComponent(state)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`,
    },
  });
});

/**
 * Handle Gmail OAuth callback
 * GET /outreach/google/callback?code=xxx&state=xxx
 */
export const handleGmailCallback = httpAction(async (ctx, request) => {
  void ctx; // Will be used when callback saves tokens to DB
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  // Handle errors from Google
  if (error) {
    const messages: Record<string, string> = {
      access_denied: "You declined the Gmail permission request.",
      invalid_scope: "Required Gmail permissions were not granted.",
    };
    const userMessage = messages[error] ?? `Google returned an error: ${error}`;
    return new Response(
      renderOAuthErrorPageHtml("Gmail Connection - Error", escapeHtml(userMessage)),
      {
        status: 400,
        headers: {
          "Content-Type": "text/html",
          "Set-Cookie": "outreach-oauth-state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
        },
      },
    );
  }

  // Validate CSRF state
  const cookieHeader = request.headers.get("Cookie");
  const rawCookie = cookieHeader
    ?.split(";")
    .find((c) => c.trim().startsWith("outreach-oauth-state="))
    ?.split("=")
    .slice(1)
    .join("=")
    ?.trim();
  const storedState = rawCookie ? decodeURIComponent(rawCookie) : undefined;

  if (!code || !state || !storedState || !constantTimeEqual(state, storedState)) {
    return new Response(
      renderOAuthErrorPageHtml(
        "Gmail Connection - Error",
        "Invalid state or missing authorization code. Please try again.",
      ),
      {
        status: 400,
        headers: {
          "Content-Type": "text/html",
          "Set-Cookie": "outreach-oauth-state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
        },
      },
    );
  }

  // Exchange code for tokens
  const config = getGmailOAuthConfig();
  let tokens: { access_token: string; refresh_token?: string; expires_in?: number };

  try {
    tokens = await fetchJSON(
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
  } catch (e) {
    logger.error("Gmail OAuth token exchange failed", { error: e });
    return new Response(
      renderOAuthErrorPageHtml(
        "Gmail Connection - Error",
        "Failed to connect to Gmail. Please try again.",
      ),
      {
        status: 500,
        headers: {
          "Content-Type": "text/html",
          "Set-Cookie": "outreach-oauth-state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
        },
      },
    );
  }

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
          "Set-Cookie": "outreach-oauth-state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
        },
      },
    );
  }

  // Get user info (email + name)
  let userInfo: { email: string; name?: string };
  try {
    userInfo = await fetchJSON("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
  } catch (e) {
    logger.error("Gmail OAuth user info fetch failed", { error: e });
    return new Response(
      renderOAuthErrorPageHtml(
        "Gmail Connection - Error",
        "Failed to get your email address from Google.",
      ),
      {
        status: 500,
        headers: {
          "Content-Type": "text/html",
          "Set-Cookie": "outreach-oauth-state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
        },
      },
    );
  }

  // Verify HMAC signature on state to prevent forged userId/organizationId
  const verifiedPayload = await verifyState(state);
  if (!verifiedPayload) {
    return new Response(
      renderOAuthErrorPageHtml(
        "Gmail Connection - Error",
        "Invalid OAuth state signature. Please try connecting again.",
      ),
      { status: 400, headers: { "Content-Type": "text/html" } },
    );
  }

  // Extract user identity from the verified payload (nonce:userId:organizationId)
  const stateParts = verifiedPayload.split(":");
  const userId = stateParts[1] as Id<"users"> | undefined;
  const organizationId = stateParts[2] as Id<"organizations"> | undefined;

  if (!userId || !organizationId) {
    return new Response(
      renderOAuthErrorPageHtml(
        "Gmail Connection - Error",
        "Invalid OAuth state: missing user context.",
      ),
      { status: 400, headers: { "Content-Type": "text/html" } },
    );
  }

  // Store tokens and create mailbox server-side — tokens never reach the browser
  const mailboxId = await ctx.runMutation(internal.outreach.mailboxes.createMailboxFromOAuth, {
    userId,
    organizationId,
    provider: "google",
    email: userInfo.email,
    displayName: userInfo.name ?? userInfo.email.split("@")[0],
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: tokens.expires_in ? Date.now() + tokens.expires_in * SECOND : undefined,
  });

  const siteUrl = process.env.SITE_URL ?? "http://localhost:5555";
  return new Response(renderOutreachSuccessPageHtml(userInfo.email, mailboxId, siteUrl), {
    status: 200,
    headers: {
      "Content-Type": "text/html",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
      "Set-Cookie": "outreach-oauth-state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    },
  });
});

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
