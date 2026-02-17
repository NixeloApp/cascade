import { api, internal } from "../_generated/api";
import { httpAction } from "../_generated/server";
import { getGitHubClientId, getGitHubClientSecret, isGitHubOAuthConfigured } from "../lib/env";
import { validation } from "../lib/errors";

/**
 * GitHub OAuth Integration
 *
 * Handles OAuth flow for GitHub repository integration (not authentication)
 *
 * Flow:
 * 1. User clicks "Connect GitHub" → GET /github/auth (initiates OAuth)
 * 2. GitHub redirects back → GET /github/callback (exchanges code for token)
 * 3. Save tokens to database → User can link repositories
 */

// Helper to parse cookies from header
function parseCookies(header: string | null): Map<string, string> {
  const cookies = new Map();
  if (!header) return cookies;
  header.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    const name = parts[0]?.trim();
    const value = parts[1]?.trim();
    if (name && value) {
      cookies.set(name, value);
    }
  });
  return cookies;
}

// OAuth configuration - throws if not configured
const getGitHubOAuthConfig = () => {
  const clientId = getGitHubClientId();
  const clientSecret = getGitHubClientSecret();

  if (!(isGitHubOAuthConfigured() && clientId && clientSecret)) {
    throw validation(
      "oauth",
      "GitHub OAuth not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.",
    );
  }
  return {
    clientId,
    clientSecret,
    // Must use CONVEX_SITE_URL - this is a Convex HTTP action, not a frontend route
    redirectUri: `${process.env.CONVEX_SITE_URL}/github/callback`,
    // Scopes for repository access
    scopes: ["repo", "read:user", "user:email"].join(" "),
  };
};

/**
 * Initiate GitHub OAuth flow logic
 * Exported for testing
 */
export const initiateAuthHandler = async (_ctx: any, _request: Request) => {
  if (!isGitHubOAuthConfigured()) {
    return new Response(
      JSON.stringify({
        error:
          "GitHub OAuth not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const config = getGitHubOAuthConfig();
  const state = crypto.randomUUID();

  // Build OAuth authorization URL
  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.set("client_id", config.clientId);
  authUrl.searchParams.set("redirect_uri", config.redirectUri);
  authUrl.searchParams.set("scope", config.scopes);
  authUrl.searchParams.set("state", state); // CSRF protection

  const isSecure = process.env.CONVEX_SITE_URL?.startsWith("https");
  const cookieAttributes = `HttpOnly; Path=/; SameSite=Lax; Max-Age=600${isSecure ? "; Secure" : ""}`;

  // Redirect user to GitHub OAuth page
  return new Response(null, {
    status: 302,
    headers: {
      Location: authUrl.toString(),
      "Set-Cookie": `github_oauth_state=${state}; ${cookieAttributes}`,
    },
  });
};

/**
 * Initiate GitHub OAuth flow
 * GET /github/auth
 */
export const initiateAuth = httpAction(initiateAuthHandler);

/**
 * Handle OAuth callback logic
 * Exported for testing
 */
export const handleCallbackHandler = async (_ctx: any, request: Request) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  // Verify state for CSRF protection
  const cookies = parseCookies(request.headers.get("Cookie"));
  const storedState = cookies.get("github_oauth_state");

  if (!state || !storedState || state !== storedState) {
    return new Response(JSON.stringify({ error: "Invalid state parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (error) {
    // User denied access or error occurred
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>GitHub - Error</title>
          <style>
            body { font-family: system-ui; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; }
            .error { background: #fee; border: 1px solid #fcc; padding: 20px; border-radius: 8px; }
            button { background: #6b7280; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; margin-top: 20px; }
            button:hover { background: #4b5563; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>Connection Failed</h1>
            <p>Failed to connect to GitHub: ${errorDescription || error}</p>
            <button onclick="window.close()">Close Window</button>
          </div>
        </body>
      </html>
      `,
      {
        status: 400,
        headers: { "Content-Type": "text/html" },
      },
    );
  }

  if (!code) {
    return new Response("Missing authorization code", { status: 400 });
  }

  const config = getGitHubOAuthConfig();

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      throw validation("oauth", "Failed to exchange GitHub authorization code");
    }

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      throw validation("oauth", tokens.error_description || tokens.error);
    }

    const { access_token } = tokens;

    // Get user info from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Nixelo-App",
      },
    });

    if (!userResponse.ok) {
      throw validation("github", "Failed to get GitHub user info");
    }

    const userInfo = await userResponse.json();
    const githubUserId = String(userInfo.id);
    const githubUsername = userInfo.login;

    // Connection data to pass to the frontend
    const connectionData = {
      githubUserId,
      githubUsername,
      accessToken: access_token,
    };

    const isSecure = process.env.CONVEX_SITE_URL?.startsWith("https");
    const clearCookieAttributes = `HttpOnly; Path=/; Max-Age=0${isSecure ? "; Secure" : ""}`;

    // Return success page that passes tokens to opener window
    // The frontend will save these via the authenticated connectGitHub mutation
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>GitHub - Connected</title>
          <style>
            body { font-family: system-ui; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; background: #0d1117; color: #c9d1d9; }
            .success { background: #161b22; border: 1px solid #30363d; padding: 20px; border-radius: 8px; }
            .github-icon { font-size: 48px; margin-bottom: 16px; }
            button { background: #238636; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; margin-top: 20px; }
            button:hover { background: #2ea043; }
            .username { color: #58a6ff; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="success">
            <div class="github-icon">&#128025;</div>
            <h1>Connected Successfully</h1>
            <p>Your GitHub account has been connected to Nixelo.</p>
            <p class="username">@${githubUsername}</p>
            <button onclick="window.close()">Close Window</button>
            <script>
              // Pass tokens to opener window for saving via authenticated mutation
              if (window.opener) {
                // Use opener's origin for security instead of wildcard
                const targetOrigin = window.opener.location.origin;
                window.opener.postMessage({
                  type: 'github-connected',
                  data: ${JSON.stringify(connectionData)}
                }, targetOrigin);
              }
              // Auto-close after 3 seconds
              setTimeout(() => {
                window.opener?.location.reload();
                window.close();
              }, 3000);
            </script>
          </div>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html",
          "Set-Cookie": `github_oauth_state=; ${clearCookieAttributes}`,
        },
      },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>GitHub - Error</title>
          <style>
            body { font-family: system-ui; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; }
            .error { background: #fee; border: 1px solid #fcc; padding: 20px; border-radius: 8px; }
            button { background: #6b7280; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; margin-top: 20px; }
            button:hover { background: #4b5563; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>Connection Failed</h1>
            <p>${errorMessage}</p>
            <p>Please try again or contact support if the problem persists.</p>
            <button onclick="window.close()">Close Window</button>
          </div>
        </body>
      </html>
      `,
      {
        status: 500,
        headers: { "Content-Type": "text/html" },
      },
    );
  }
};

/**
 * Handle OAuth callback from GitHub
 * GET /github/callback?code=xxx&state=xxx
 */
export const handleCallback = httpAction(handleCallbackHandler);

/**
 * List user's GitHub repositories
 * GET /github/repos
 *
 * This is called after authentication to fetch available repos
 */
export const listRepos = httpAction(async (ctx, _request) => {
  try {
    // Get user's GitHub connection (metadata only, no tokens)
    const connection = await ctx.runQuery(api.github.getConnection);

    if (!connection) {
      return new Response(JSON.stringify({ error: "Not connected to GitHub" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get decrypted tokens for API call
    const tokens = await ctx.runMutation(internal.github.getDecryptedGitHubTokens, {
      userId: connection.userId,
    });

    if (!tokens) {
      return new Response(JSON.stringify({ error: "Failed to get GitHub tokens" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch repositories from GitHub API
    const reposResponse = await fetch(
      "https://api.github.com/user/repos?sort=updated&per_page=100",
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Nixelo-App",
        },
      },
    );

    if (!reposResponse.ok) {
      throw validation("github", "Failed to fetch repositories");
    }

    const repos = await reposResponse.json();

    // Transform to a simpler format
    const simplifiedRepos = repos.map(
      (repo: {
        id: number;
        name: string;
        full_name: string;
        owner: { login: string };
        private: boolean;
        description: string | null;
      }) => ({
        id: String(repo.id),
        name: repo.name,
        fullName: repo.full_name,
        owner: repo.owner.login,
        private: repo.private,
        description: repo.description,
      }),
    );

    return new Response(JSON.stringify({ repos: simplifiedRepos }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to list repositories",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
