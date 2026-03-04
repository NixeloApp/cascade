/**
 * Slack OAuth HTTP Handler
 *
 * HTTP endpoints for Slack OAuth 2.0 authentication flow.
 * Handles authorization redirect, callback processing, and token exchange.
 * Integrates with Slack API for workspace connection setup.
 */

import { type ActionCtx, httpAction } from "../_generated/server";
import { constantTimeEqual } from "../lib/apiAuth";
import {
  getConvexSiteUrl,
  getSlackClientId,
  getSlackClientSecret,
  isSlackOAuthConfigured,
} from "../lib/env";
import { upstream, validation } from "../lib/errors";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";
import { escapeHtml, escapeScriptJson } from "../lib/html";

const MAX_OAUTH_PARAM_LENGTH = 1024;
const MAX_OAUTH_ERROR_LENGTH = 200;

const getSlackOAuthConfig = () => {
  const clientId = getSlackClientId();
  const clientSecret = getSlackClientSecret();

  if (!(isSlackOAuthConfigured() && clientId && clientSecret)) {
    throw validation(
      "oauth",
      "Slack OAuth not configured. Set SLACK_CLIENT_ID and SLACK_CLIENT_SECRET.",
    );
  }

  return {
    clientId,
    clientSecret,
    redirectUri: `${getConvexSiteUrl()}/slack/callback`,
    scopes: ["incoming-webhook", "chat:write"],
  };
};

export const initiateAuthHandler = (_ctx: ActionCtx, _request: Request) => {
  if (!isSlackOAuthConfigured()) {
    return Promise.resolve(
      new Response(
        JSON.stringify({
          error: "Slack OAuth not configured. Please set SLACK_CLIENT_ID and SLACK_CLIENT_SECRET.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
  }

  const config = getSlackOAuthConfig();
  const state = crypto.randomUUID();

  const authUrl = new URL("https://slack.com/oauth/v2/authorize");
  authUrl.searchParams.set("client_id", config.clientId);
  authUrl.searchParams.set("redirect_uri", config.redirectUri);
  authUrl.searchParams.set("scope", config.scopes.join(","));
  authUrl.searchParams.set("state", state);

  return Promise.resolve(
    new Response(null, {
      status: 302,
      headers: {
        Location: authUrl.toString(),
        "Set-Cookie": `slack-oauth-state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`,
      },
    }),
  );
};

export const initiateAuth = httpAction(initiateAuthHandler);

interface SlackTokenResponse {
  ok: boolean;
  error?: string;
  access_token?: string;
  scope?: string;
  bot_user_id?: string;
  authed_user?: {
    id?: string;
  };
  team?: {
    id?: string;
    name?: string;
  };
  incoming_webhook?: {
    url?: string;
    channel?: string;
  };
}

async function exchangeCodeForToken(
  code: string,
  config: ReturnType<typeof getSlackOAuthConfig>,
): Promise<SlackTokenResponse> {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: config.redirectUri,
  });

  const response = await fetchWithTimeout("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    throw upstream("Slack", `Token exchange failed (${response.status})`);
  }

  const tokenData = (await response.json()) as SlackTokenResponse;
  if (!tokenData.ok || !tokenData.access_token || !tokenData.team?.id || !tokenData.team.name) {
    throw upstream("Slack", tokenData.error || "Invalid OAuth token response");
  }

  return tokenData;
}

export const handleCallbackHandler = async (_ctx: ActionCtx, request: Request) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error && error.length > MAX_OAUTH_ERROR_LENGTH) {
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head><title>Slack - Error</title></head>
        <body style="font-family: system-ui; max-width: 560px; margin: 60px auto; text-align: center;">
          <h1>Connection Failed</h1>
          <p>Slack OAuth request was invalid.</p>
          <button onclick="window.close()">Close Window</button>
        </body>
      </html>
      `,
      {
        status: 400,
        headers: {
          "Content-Type": "text/html",
          "Set-Cookie": "slack-oauth-state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
        },
      },
    );
  }

  if (error) {
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head><title>Slack - Error</title></head>
        <body style="font-family: system-ui; max-width: 560px; margin: 60px auto; text-align: center;">
          <h1>Connection Failed</h1>
          <p>Slack returned: ${escapeHtml(error)}</p>
          <button onclick="window.close()">Close Window</button>
        </body>
      </html>
      `,
      {
        status: 400,
        headers: {
          "Content-Type": "text/html",
          "Set-Cookie": "slack-oauth-state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
        },
      },
    );
  }

  const cookieHeader = request.headers.get("Cookie");
  const storedState = cookieHeader
    ?.split(";")
    .find((chunk) => chunk.trim().startsWith("slack-oauth-state="))
    ?.split("=")[1];

  if (
    (code && code.length > MAX_OAUTH_PARAM_LENGTH) ||
    (state && state.length > MAX_OAUTH_PARAM_LENGTH) ||
    (storedState && storedState.length > MAX_OAUTH_PARAM_LENGTH)
  ) {
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head><title>Slack - Error</title></head>
        <body style="font-family: system-ui; max-width: 560px; margin: 60px auto; text-align: center;">
          <h1>Connection Failed</h1>
          <p>Invalid OAuth state.</p>
          <button onclick="window.close()">Close Window</button>
        </body>
      </html>
      `,
      {
        status: 400,
        headers: {
          "Content-Type": "text/html",
          "Set-Cookie": "slack-oauth-state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
        },
      },
    );
  }

  if (!code || !state || !storedState || !constantTimeEqual(state, storedState)) {
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head><title>Slack - Error</title></head>
        <body style="font-family: system-ui; max-width: 560px; margin: 60px auto; text-align: center;">
          <h1>Connection Failed</h1>
          <p>Invalid OAuth state.</p>
          <button onclick="window.close()">Close Window</button>
        </body>
      </html>
      `,
      {
        status: 400,
        headers: {
          "Content-Type": "text/html",
          "Set-Cookie": "slack-oauth-state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
        },
      },
    );
  }

  try {
    const config = getSlackOAuthConfig();
    const tokenData = await exchangeCodeForToken(code, config);

    const connectionData = {
      slackUserId: tokenData.authed_user?.id,
      teamId: tokenData.team?.id,
      teamName: tokenData.team?.name,
      accessToken: tokenData.access_token,
      botUserId: tokenData.bot_user_id,
      scope: tokenData.scope,
      incomingWebhookUrl: tokenData.incoming_webhook?.url,
      incomingWebhookChannel: tokenData.incoming_webhook?.channel,
    };

    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head><title>Slack - Connected</title></head>
        <body style="font-family: system-ui; max-width: 560px; margin: 60px auto; text-align: center;">
          <h1>Slack Connected</h1>
          <p>Workspace <strong>${escapeHtml(tokenData.team?.name ?? "")}</strong> is ready.</p>
          <p>You can close this window.</p>
          <script>
            (function() {
              if (window.opener) {
                window.opener.postMessage({
                  type: "slack-connected",
                  data: ${escapeScriptJson(connectionData)}
                }, window.location.origin);
              }
              setTimeout(function() { window.close(); }, 1200);
            })();
          </script>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html",
          "Set-Cookie": "slack-oauth-state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
        },
      },
    );
  } catch {
    // Security: avoid leaking internal backend details.
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head><title>Slack - Error</title></head>
        <body style="font-family: system-ui; max-width: 560px; margin: 60px auto; text-align: center;">
          <h1>Connection Failed</h1>
          <p>Something went wrong. Please try again later.</p>
          <button onclick="window.close()">Close Window</button>
        </body>
      </html>
      `,
      {
        status: 500,
        headers: {
          "Content-Type": "text/html",
          "Set-Cookie": "slack-oauth-state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
        },
      },
    );
  }
};

export const handleCallback = httpAction(handleCallbackHandler);
