import { api, internal } from "../_generated/api";
import { httpAction } from "../_generated/server";
import { constantTimeEqual } from "../lib/apiAuth";
import {
  getGoogleClientId,
  getGoogleClientSecret,
  isGoogleOAuthConfigured,
  isLocalhost,
} from "../lib/env";
import { validation } from "../lib/errors";

/** Generic error page HTML - no internal details exposed */
const errorPageHtml = `
<!DOCTYPE html>
<html>
  <head>
    <title>Google Calendar - Error</title>
    <style>
      body { font-family: system-ui; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; }
      .error { background: #fee; border: 1px solid #fcc; padding: 20px; border-radius: 8px; }
    </style>
  </head>
  <body>
    <div class="error">
      <h1>Connection Failed</h1>
      <p>An error occurred while connecting to Google Calendar.</p>
      <p>Please try again or contact support if the problem persists.</p>
      <button onclick="window.close()">Close Window</button>
    </div>
  </body>
</html>
`;

/**
 * Validate E2E API key for TEST_* codes
 * Same security pattern as other /e2e/* endpoints
 *
 * Returns false if invalid (logs warning), true if valid
 */
function validateE2EApiKey(request: Request): boolean {
  const apiKey = process.env.E2E_API_KEY;

  // If no API key is configured, only allow on localhost
  if (!apiKey) {
    if (isLocalhost()) {
      return true;
    }
    console.warn("[SECURITY] TEST_* code attempted but E2E_API_KEY not configured");
    return false;
  }

  const providedKey = request.headers.get("x-e2e-api-key");
  if (!providedKey || !constantTimeEqual(providedKey, apiKey)) {
    console.warn("[SECURITY] TEST_* code with invalid/missing E2E API key");
    return false;
  }

  return true;
}

/**
 * Handle TEST_* codes for E2E testing
 *
 * Security:
 * - Requires E2E_API_KEY env var (or localhost)
 * - Requires x-e2e-api-key header to match
 * - Only creates @inbox.mailtrap.io emails (auto-cleaned by cron)
 *
 * Returns null if auth fails (caller should show generic error page)
 */
function handleTestCode(
  code: string,
  request: Request,
): { email: string; accessToken: string; refreshToken: string; expiresAt: number } | null {
  // Validate E2E API key - returns false if invalid (already logged)
  if (!validateE2EApiKey(request)) {
    return null;
  }

  // Extract scenario from code (e.g., TEST_new_user -> new_user)
  const scenario = code.replace("TEST_", "").replace(/_/g, "-");
  const timestamp = Date.now();

  // Only create test emails (auto-cleaned by cron)
  const email = `test-oauth-${scenario}-${timestamp}@inbox.mailtrap.io`;

  console.log(`[E2E] Processing TEST_* OAuth code for scenario: ${scenario}, email: ${email}`);

  return {
    email,
    accessToken: `mock_access_${scenario}_${timestamp}`,
    refreshToken: `mock_refresh_${scenario}_${timestamp}`,
    expiresAt: timestamp + 3600 * 1000, // 1 hour
  };
}

/**
 * Google OAuth Integration
 *
 * Handles OAuth flow for Google Calendar integration
 *
 * Flow:
 * 1. User clicks "Connect Google" → GET /google/auth (initiates OAuth)
 * 2. Google redirects back → GET /google/callback (exchanges code for token)
 * 3. Save tokens to database → User is connected
 */

// Google Calendar API Types
interface GoogleCalendarEventDateTime {
  dateTime?: string;
  date?: string;
  timeZone?: string;
}

interface GoogleCalendarAttendee {
  email: string;
  displayName?: string;
  responseStatus?: string;
}

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start: GoogleCalendarEventDateTime;
  end: GoogleCalendarEventDateTime;
  location?: string;
  attendees?: GoogleCalendarAttendee[];
}

// OAuth configuration - throws if not configured
const getGoogleOAuthConfig = () => {
  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();

  if (!(isGoogleOAuthConfigured() && clientId && clientSecret)) {
    throw validation(
      "oauth",
      "Google OAuth not configured. Set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET.",
    );
  }
  return {
    clientId,
    clientSecret,
    // Must use CONVEX_SITE_URL - this is a Convex HTTP action, not a frontend route
    redirectUri: `${process.env.CONVEX_SITE_URL}/google/callback`,
    scopes: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
  };
};

/**
 * Initiate Google OAuth flow
 * GET /google/auth
 */
export const initiateAuth = httpAction((_ctx, _request) => {
  const config = getGoogleOAuthConfig();

  if (!config.clientId) {
    return Promise.resolve(
      new Response(
        JSON.stringify({
          error:
            "Google OAuth not configured. Please set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET environment variables.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
  }

  // Build OAuth authorization URL
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", config.clientId);
  authUrl.searchParams.set("redirect_uri", config.redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", config.scopes);
  authUrl.searchParams.set("access_type", "offline"); // Get refresh token
  authUrl.searchParams.set("prompt", "consent"); // Force consent to get refresh token

  // Redirect user to Google OAuth page
  return Promise.resolve(
    new Response(null, {
      status: 302,
      headers: {
        Location: authUrl.toString(),
      },
    }),
  );
});

/**
 * Handle OAuth callback from Google
 * GET /google/callback?code=xxx
 */
export const handleCallback = httpAction(async (_ctx, request) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    // User denied access or error occurred - don't expose error details
    return new Response(errorPageHtml, {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  if (!code) {
    return new Response("Missing authorization code", { status: 400 });
  }

  let email: string;
  let accessToken: string;
  let refreshToken: string;
  let expiresAt: number | undefined;

  // TEST_* code handling for E2E tests - tests the real callback code path
  if (code.startsWith("TEST_")) {
    const testResult = handleTestCode(code, request);
    if (!testResult) {
      // Auth failed - show generic error (details logged server-side)
      return new Response(errorPageHtml, {
        status: 403,
        headers: { "Content-Type": "text/html" },
      });
    }
    email = testResult.email;
    accessToken = testResult.accessToken;
    refreshToken = testResult.refreshToken;
    expiresAt = testResult.expiresAt;
  } else {
    // Real OAuth flow - exchange code with Google
    const config = getGoogleOAuthConfig();

    try {
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: config.redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const _errorData = await tokenResponse.text();
        throw validation("oauth", "Failed to exchange Google authorization code");
      }

      const tokens = await tokenResponse.json();
      const { access_token, refresh_token, expires_in } = tokens;

      // Get user info from Google
      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const userInfo = await userInfoResponse.json();
      email = userInfo.email;
      accessToken = access_token;
      refreshToken = refresh_token;
      expiresAt = expires_in ? Date.now() + expires_in * 1000 : undefined;
    } catch (_error) {
      return new Response(errorPageHtml, {
        status: 500,
        headers: { "Content-Type": "text/html" },
      });
    }
  }

  // SAME code path from here - tests real HTML, JS, postMessage
  const connectionData = {
    providerAccountId: email,
    accessToken,
    refreshToken,
    expiresAt,
  };

  // Return success page that passes tokens to opener window
  // The frontend will save these via the authenticated connectGoogle mutation
  return new Response(
    `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Google Calendar - Connected</title>
        <style>
          body { font-family: system-ui; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; }
          .success { background: #efe; border: 1px solid #cfc; padding: 20px; border-radius: 8px; }
          button { background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; margin-top: 20px; }
          button:hover { background: #2563eb; }
        </style>
      </head>
      <body>
        <div class="success">
          <h1>Connected Successfully</h1>
          <p>Your Google Calendar has been connected to Nixelo.</p>
          <p><strong>${email}</strong></p>
          <button onclick="window.close()">Close Window</button>
          <script>
            // Pass tokens to opener window for saving via authenticated mutation
            if (window.opener) {
              // Use opener's origin for security instead of wildcard
              const targetOrigin = window.opener.location.origin;
              window.opener.postMessage({
                type: 'google-calendar-connected',
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
      headers: { "Content-Type": "text/html" },
    },
  );
});

/**
 * Trigger manual sync
 * POST /google/sync
 *
 * Fetches events from Google Calendar and syncs them to Nixelo.
 * Requires an authenticated user with a connected Google Calendar.
 */
export const triggerSync = httpAction(async (ctx, _request) => {
  try {
    // Get user's Google Calendar connection (metadata only, no tokens)
    const connection = await ctx.runQuery(api.googleCalendar.getConnection);

    if (!connection) {
      return new Response(JSON.stringify({ error: "Not connected to Google Calendar" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!connection.syncEnabled) {
      return new Response(JSON.stringify({ error: "Sync is disabled" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get decrypted tokens for API call
    const tokens = await ctx.runMutation(internal.googleCalendar.getDecryptedTokens, {
      connectionId: connection._id,
    });

    if (!tokens) {
      return new Response(JSON.stringify({ error: "Failed to get Google tokens" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch events from Google Calendar API
    const eventsResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&maxResults=100`,
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      },
    );

    if (!eventsResponse.ok) {
      throw validation("googleCalendar", "Failed to fetch Google Calendar events");
    }

    const data = await eventsResponse.json();
    const events = data.items || [];

    // Transform Google Calendar events to Nixelo format
    // Filter out events with missing or invalid dates
    const nixeloEvents = events
      .filter((event: GoogleCalendarEvent) => {
        const hasValidStart = event.start?.dateTime || event.start?.date;
        const hasValidEnd = event.end?.dateTime || event.end?.date;
        return hasValidStart && hasValidEnd;
      })
      .map((event: GoogleCalendarEvent) => ({
        googleEventId: event.id,
        title: event.summary || "Untitled Event",
        description: event.description,
        startTime: new Date(event.start.dateTime || event.start.date || "").getTime(),
        endTime: new Date(event.end.dateTime || event.end.date || "").getTime(),
        allDay: !!event.start.date, // If date instead of dateTime, it's all-day
        location: event.location,
        attendees: event.attendees?.map((a: GoogleCalendarAttendee) => a.email) || [],
      }));

    // Sync events to Nixelo
    const result = await ctx.runMutation(api.googleCalendar.syncFromGoogle, {
      connectionId: connection._id,
      events: nixeloEvents,
    });

    return new Response(
      JSON.stringify({
        success: true,
        imported: result.imported,
        message: `Successfully imported ${result.imported} events from Google Calendar`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Sync failed",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
