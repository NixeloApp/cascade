import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { getClientIp } from "./lib/ssrf";
import router from "./router";

const http = router;

// Monkey-patch http.route to intercept auth routes
const originalRoute = http.route.bind(http);

http.route = (options) => {
  // Intercept the sign-in route to add IP-based rate limiting
  if (options?.path?.startsWith("/api/auth/signin") && options.method === "POST") {
    const originalHandler = options.handler;

    // Wrap the handler with rate limiting logic
    options.handler = httpAction(async (ctx, request) => {
      const clientIp = getClientIp(request);

      if (clientIp) {
        try {
          // Cast internal to any because checkAuthRateLimit is newly added
          // and types might not be regenerated yet in this environment
          const authWrapper = (internal as any).authWrapper;

          if (authWrapper?.checkAuthRateLimit) {
            await ctx.runMutation(authWrapper.checkAuthRateLimit, {
              ip: clientIp,
            });
          }
        } catch (error) {
          // Rate limit exceeded
          return new Response(
            JSON.stringify({ success: false, error: "Too many requests" }),
            {
              status: 429,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      }

      // Proceed to original handler
      return originalHandler(ctx, request);
    });
  }

  return originalRoute(options);
};

auth.addHttpRoutes(http);

export default http;
