import { api, internal } from "../_generated/api";
import { type ActionCtx, httpAction } from "../_generated/server";
import { constantTimeEqual } from "../lib/apiAuth";
import { getGitHubClientId, getGitHubClientSecret, isGitHubOAuthConfigured } from "../lib/env";
import { isAppError, validation } from "../lib/errors";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";
import { escapeHtml, escapeScriptJson } from "../lib/html";
import { logger } from "../lib/logger";

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
 * Initiate GitHub OAuth flow handler
 *
 * Starts the OAuth 2.0 flow by redirecting the user to GitHub's authorization page.
 *
 * Security:
 * - Generates a random `state` token using `crypto.randomUUID()` to prevent CSRF attacks.
 * - Sets an `HttpOnly`, `Secure`, `SameSite=Lax` cookie `github-oauth-state` containing the state token.
 *   - `Path=/` ensures it's available for the callback.
 *   - `Max-Age=3600` ensures it expires after 1 hour if the flow is abandoned.
 *
 * Flow:
 * 1. Checks if GitHub OAuth is configured (client ID/secret).
 * 2. Generates state token.
 * 3. Constructs GitHub authorization URL with:
 *    - `client_id`: App identifier
 *    - `redirect_uri`: Callback URL (`/github/callback`)
 *    - `scope`: Requested permissions (`repo`, `read:user`, `user:email`)
 *    - `state`: CSRF token
 * 4. Returns a 302 Redirect response to the authorization URL.
 *
 * @param _ctx - Convex action context (unused)
 * @param _request - The incoming HTTP request
 * @returns A Promise resolving to a Redirect Response
 */
export const initiateAuthHandler = (_ctx: ActionCtx, _request: Request) => {
  if (!isGitHubOAuthConfigured()) {
    return Promise.resolve(
      new Response(
        JSON.stringify({
          error:
            "GitHub OAuth not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      ),
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

  // Redirect user to GitHub OAuth page
  return Promise.resolve(
    new Response(null, {
      status: 302,
      headers: {
        Location: authUrl.toString(),
        "Set-Cookie": `github-oauth-state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`,
      },
    }),
  );
};

/**
 * Initiate GitHub OAuth flow
 * GET /github/auth
 */
export const initiateAuth = httpAction(initiateAuthHandler);

// Helper to exchange code for tokens
async function exchangeCodeForTokens(
  code: string,
  config: ReturnType<typeof getGitHubOAuthConfig>,
) {
  const tokenResponse = await fetchWithTimeout("https://github.com/login/oauth/access_token", {
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
    let errorText = "Unknown error";
    try {
      errorText = await tokenResponse.text();
      logger.error("GitHub OAuth error: Failed to exchange code", { errorText });
    } catch (e) {
      logger.error("GitHub OAuth error: Failed to exchange code (and failed to read body)", {
        error: e,
      });
    }
    throw validation("oauth", `Failed to exchange GitHub authorization code: ${errorText}`);
  }

  let tokens: Record<string, unknown>;
  try {
    tokens = (await tokenResponse.json()) as Record<string, unknown>;
  } catch (_e) {
    throw validation("oauth", "Invalid JSON response from GitHub token endpoint");
  }

  if (tokens.error) {
    throw validation(
      "oauth",
      (tokens.error_description as string) || (tokens.error as string) || "Unknown OAuth error",
    );
  }

  return tokens.access_token as string;
}

// Helper to fetch user info
async function fetchGitHubUserInfo(accessToken: string) {
  const userResponse = await fetchWithTimeout("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Nixelo-App",
    },
  });

  if (!userResponse.ok) {
    let errorText = "Unknown error";
    try {
      errorText = await userResponse.text();
      logger.error("GitHub OAuth error: Failed to get user info", { errorText });
    } catch (e) {
      logger.error("GitHub OAuth error: Failed to get user info (and failed to read body)", {
        error: e,
      });
    }
    throw validation("github", `Failed to get GitHub user info: ${errorText}`);
  }

  let userInfo: Record<string, unknown>;
  try {
    userInfo = (await userResponse.json()) as Record<string, unknown>;
  } catch (_e) {
    throw validation("github", "Invalid JSON response from GitHub user endpoint");
  }

  // Validate required fields
  if (!userInfo || !userInfo.id || !userInfo.login) {
    // Only log keys to avoid leaking PII
    const keys = userInfo ? Object.keys(userInfo) : "null";
    logger.error(`GitHub OAuth error: Invalid user info structure. Keys: ${keys}`);
    throw validation("github", "Invalid GitHub user info: missing id or login");
  }

  return {
    githubUserId: String(userInfo.id),
    githubUsername: userInfo.login as string,
  };
}

/**
 * Handle OAuth callback from GitHub handler
 *
 * Processes the redirect from GitHub, exchanging the authorization code for an access token.
 *
 * Security:
 * - Implements "Double Submit Cookie" pattern for CSRF protection.
 * - Validates that the `state` query parameter matches the `github-oauth-state` cookie.
 * - Uses `constantTimeEqual` for state comparison to prevent timing attacks.
 * - Clears the state cookie (`Max-Age=0`) immediately after use to prevent reuse.
 *
 * Flow:
 * 1. Parses `code`, `state`, and `error` from query parameters.
 * 2. If `error` is present (user denied access), returns an error page.
 * 3. Validates the `state` against the cookie.
 * 4. Exchanges the `code` for an access token using GitHub's `/login/oauth/access_token` endpoint.
 * 5. Fetches the authenticated user's profile from GitHub API (`/user`) to get the ID and username.
 * 6. Returns an HTML success page that:
 *    - Uses `window.opener.postMessage` to send the connection data back to the main application window.
 *    - Automatically closes the popup window after a short delay.
 *
 * @param _ctx - Convex action context (unused)
 * @param request - The incoming HTTP request containing query params and cookies
 * @returns A Promise resolving to an HTML Response (success or error)
 * @throws {ConvexError} "oauth" - If code exchange fails or state is invalid.
 * @throws {ConvexError} "github" - If user info fetch fails.
 */
export const handleCallbackHandler = async (_ctx: ActionCtx, request: Request) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

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
            <p>Failed to connect to GitHub: ${escapeHtml(errorDescription || error || "")}</p>
            <button onclick="window.close()">Close Window</button>
          </div>
        </body>
      </html>
      `,
      {
        status: 400,
        headers: {
          "Content-Type": "text/html",
          "Set-Cookie": `github-oauth-state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
        },
      },
    );
  }

  // Validate state to prevent CSRF
  const cookieHeader = request.headers.get("Cookie");
  const storedState = cookieHeader
    ?.split(";")
    .find((c) => c.trim().startsWith("github-oauth-state="))
    ?.split("=")[1];

  if (!code || !state || !storedState || !constantTimeEqual(state, storedState)) {
    // Use handleOAuthError to return consistent HTML error page
    return handleOAuthError(validation("oauth", "Invalid state or missing authorization code"));
  }

  const config = getGitHubOAuthConfig();

  try {
    const accessToken = await exchangeCodeForTokens(code, config);
    const { githubUserId, githubUsername } = await fetchGitHubUserInfo(accessToken);

    // Connection data to pass to the frontend
    const connectionData = {
      githubUserId,
      githubUsername,
      accessToken,
    };

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
            <p class="username">@${escapeHtml(githubUsername)}</p>
            <button onclick="window.close()">Close Window</button>
            <script>
              // Pass tokens to opener window for saving via authenticated mutation
              if (window.opener) {
                // Use opener's origin for security instead of wildcard
                const targetOrigin = window.opener.location.origin;
                window.opener.postMessage({
                  type: 'github-connected',
                  data: ${escapeScriptJson(connectionData)}
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
          "Set-Cookie": `github-oauth-state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
        },
      },
    );
  } catch (error) {
    return handleOAuthError(error);
  }
};

const handleOAuthError = (error: unknown) => {
  let status = 500;
  let errorMessage = "An unexpected error occurred";

  if (isAppError(error)) {
    errorMessage = error.data.message || errorMessage;
    switch (error.data.code) {
      case "VALIDATION":
      case "CONFLICT":
        status = 400;
        break;
      case "UNAUTHENTICATED":
        status = 401;
        break;
      case "FORBIDDEN":
        status = 403;
        break;
      case "NOT_FOUND":
        status = 404;
        break;
      case "RATE_LIMITED":
        status = 429;
        break;
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

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
          <p>${escapeHtml(errorMessage)}</p>
          <p>Please try again or contact support if the problem persists.</p>
          <button onclick="window.close()">Close Window</button>
        </div>
      </body>
    </html>
    `,
    {
      status,
      headers: {
        "Content-Type": "text/html",
        "Set-Cookie": `github-oauth-state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
      },
    },
  );
};

/**
 * Handle OAuth callback from GitHub
 * GET /github/callback?code=xxx&state=xxx
 */
export const handleCallback = httpAction(handleCallbackHandler);

/**
 * List user's GitHub repositories handler
 *
 * Fetches the list of repositories for the connected GitHub user.
 *
 * Requirements:
 * - User must be authenticated in the Convex app.
 * - User must have previously connected their GitHub account via the OAuth flow.
 *
 * Flow:
 * 1. Checks if the user has a stored GitHub connection record.
 * 2. Retrieves the encrypted GitHub access token from the database.
 * 3. Decrypts the token using the internal encryption helper.
 * 4. Calls the GitHub API (`/user/repos`) to fetch repositories (sorted by updated time).
 * 5. Transforms the GitHub API response into a simplified format for the frontend.
 *
 * @param ctx - Convex action context
 * @param _request - The incoming HTTP request (unused)
 * @returns A JSON Response containing the list of repositories or an error message.
 */
export const listReposHandler = async (ctx: ActionCtx, _request: Request) => {
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
    const reposResponse = await fetchWithTimeout(
      "https://api.github.com/user/repos?sort=updated&per_page=100",
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Nixelo-App",
        },
      },
      30000,
    );

    if (!reposResponse.ok) {
      let errorMessage = "Failed to fetch repositories";
      try {
        const text = await reposResponse.text();
        try {
          const errorBody = JSON.parse(text);
          errorMessage = errorBody.message || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
      } catch (e) {
        logger.error("Failed to read error response body:", { error: e });
      }

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: reposResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    let repos: unknown[];
    try {
      const json = await reposResponse.json();
      if (!Array.isArray(json)) {
        throw new Error("GitHub repositories response is not an array");
      }
      repos = json;
    } catch (_e) {
      throw validation("github", "Invalid JSON response from GitHub repositories endpoint");
    }

    // Transform to a simpler format
    const simplifiedRepos = repos.map((repo) => {
      const r = repo as Record<string, unknown>;
      const owner = (r.owner as Record<string, unknown>) || {};
      return {
        id: String(r.id),
        name: String(r.name),
        fullName: String(r.full_name),
        owner: String(owner.login || ""),
        private: !!r.private,
        description: r.description ? String(r.description) : null,
      };
    });

    return new Response(JSON.stringify({ repos: simplifiedRepos }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleListReposError(error);
  }
};

const handleListReposError = (error: unknown) => {
  logger.error("GitHub listRepos error:", { error });
  let status = 500;
  let message = "Failed to list repositories";

  if (isAppError(error)) {
    message = error.data.message || message;
    if (error.data.code === "VALIDATION") status = 400;
    else if (error.data.code === "UNAUTHENTICATED") status = 401;
    else if (error.data.code === "FORBIDDEN") status = 403;
    else if (error.data.code === "NOT_FOUND") status = 404;
    else if (error.data.code === "RATE_LIMITED") status = 429;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return new Response(
    JSON.stringify({
      error: message,
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    },
  );
};

/**
 * List user's GitHub repositories
 * GET /github/repos
 *
 * This is called after authentication to fetch available repos
 */
export const listRepos = httpAction(listReposHandler);
