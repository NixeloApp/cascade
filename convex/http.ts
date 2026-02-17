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
  // Use unknown casting to avoid any, then safely check properties
  const routePath = (options as unknown as { path?: string }).path;
  if (routePath?.startsWith("/api/auth/signin") && options.method === "POST") {
    const originalHandler = options.handler;

    // Wrap the handler with rate limiting logic
    options.handler = httpAction(async (ctx, request) => {
      const clientIp = getClientIp(request);

      if (clientIp) {
        try {
          // Cast internal to unknown then to the expected type
          // This avoids 'any' and ensures we are accessing the property safely
          const internalApi = internal as unknown as {
            authWrapper?: {
              checkAuthRateLimit?: FunctionReference<"mutation">;
            };
          };
          const authWrapper = internalApi.authWrapper;

          if (authWrapper?.checkAuthRateLimit) {
            await ctx.runMutation(authWrapper.checkAuthRateLimit, {
              ip: clientIp,
            });
          }
        } catch (_error) {
          // Rate limit exceeded
          return new Response(JSON.stringify({ success: false, error: "Too many requests" }), {
            status: 429,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      // Proceed to original handler
      // Cast to unknown then Function to avoid any
      return (originalHandler as unknown as (ctx: unknown, request: Request) => Promise<Response>)(
        ctx,
        request,
      );
    });
  }

  return originalRoute(options);
};

auth.addHttpRoutes(http);

export default http;
