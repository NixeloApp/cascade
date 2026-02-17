import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { getClientIp } from "./lib/ssrf";
import router from "./router";

const http = router;

// Intercept the route registration for auth endpoints to add rate limiting
const originalRoute = http.route.bind(http);

// @ts-expect-error - overriding route method to add middleware
http.route = (options) => {
  // Check if this is an auth route we want to protect
  // We target /api/auth endpoints, specifically POST requests (Sign In, Sign Up, Verify, etc.)
  if (options.pathPrefix === "/api/auth" && options.method === "POST") {
    const originalHandler = options.handler;

    // Create a wrapped handler that checks rate limits
    const wrappedHandler = httpAction(async (ctx, request) => {
      let clientIp = getClientIp(request);

      if (!clientIp) {
        const isTestOrDev =
          process.env.NODE_ENV === "test" ||
          process.env.NODE_ENV === "development" ||
          process.env.E2E_TEST_MODE ||
          process.env.CI;

        if (isTestOrDev) {
          clientIp = "127.0.0.1";
        } else {
          return new Response("Could not determine client IP for security-sensitive action", {
            status: 400,
          });
        }
      }

      try {
        await ctx.runMutation(internal.authWrapper.checkAuthRateLimit, { ip: clientIp });
      } catch (_e) {
        return new Response(JSON.stringify({ success: false, error: "Rate limit exceeded" }), {
          status: 429,
          headers: { "Content-Type": "application/json" },
        });
      }

      return originalHandler(ctx, request);
    });

    return originalRoute({
      ...options,
      handler: wrappedHandler,
    });
  }

  return originalRoute(options);
};

auth.addHttpRoutes(http);

export default http;
