import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ConvexReactClient } from "convex/react";
import { CloudOff } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Flex } from "@/components/ui/Flex";
import { Toaster } from "@/components/ui/Sonner";
import { getVapidPublicKey, WebPushProvider } from "@/contexts/WebPushContext";
import { register as registerServiceWorker } from "@/lib/service-worker";
import { LazyPostHog } from "../components/LazyPostHog";
import { NotFoundPage } from "../components/NotFoundPage";
import { TooltipProvider } from "../components/ui/Tooltip";
import { Typography } from "../components/ui/Typography";
import { ThemeProvider } from "../contexts/ThemeContext";

declare global {
  interface Window {
    __convex_test_client: ConvexReactClient | undefined;
  }
}

// Initialize Convex client (only on client-side)
let convex: ConvexReactClient | null = null;
if (typeof window !== "undefined") {
  try {
    const convexUrl = import.meta.env.VITE_CONVEX_URL as string;
    if (convexUrl) {
      convex = new ConvexReactClient(convexUrl);
      // Expose convex client globally for E2E testing
      window.__convex_test_client = convex;
    }
  } catch (_e) {
    // Convex Init Failed - fail silently on server or log appropriately if needed
  }
}

const posthogOptions = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
};

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
});

function RootComponent() {
  // Register service worker for PWA (client-side only, production only)
  useEffect(() => {
    // DO NOT register service worker in E2E tests as it can interfere with LocalStorage/Auth
    if (import.meta.env.PROD && !window.__convex_test_client) {
      registerServiceWorker();
    }
  }, []);

  return (
    <ThemeProvider>
      <LazyPostHog apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY} options={posthogOptions}>
        <TooltipProvider delayDuration={200}>
          {convex ? (
            <ConvexAuthProvider client={convex}>
              <WebPushProvider vapidPublicKey={getVapidPublicKey()}>
                <Outlet />
              </WebPushProvider>
            </ConvexAuthProvider>
          ) : (
            <Flex
              direction="column"
              align="center"
              justify="center"
              className="min-h-screen bg-ui-bg animate-fade-in"
            >
              <Flex direction="column" align="center" className="max-w-md text-center px-6">
                {/* Subtle icon */}
                <Flex
                  align="center"
                  justify="center"
                  className="mb-8 h-20 w-20 rounded-full bg-ui-bg-soft"
                >
                  <CloudOff className="h-10 w-10 text-ui-text-tertiary" />
                </Flex>

                {/* Large error code with tight tracking */}
                <Typography
                  variant="h1"
                  className="text-8xl font-bold tracking-tightest text-ui-text"
                >
                  503
                </Typography>

                {/* Message with secondary text styling */}
                <Typography className="mt-4 text-lg text-ui-text-secondary">
                  Service Unavailable
                </Typography>
                <Typography className="mt-2 text-ui-text-tertiary">
                  The application could not connect to the backend services. Please try again later.
                </Typography>

                {/* Retry button */}
                <Button onClick={() => window.location.reload()} size="lg" className="mt-8">
                  Try again
                </Button>
              </Flex>
            </Flex>
          )}
          <Toaster />
        </TooltipProvider>
      </LazyPostHog>
    </ThemeProvider>
  );
}
