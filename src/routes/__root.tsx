import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ConvexReactClient, useConvex } from "convex/react";
import { useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PwaBanners } from "@/components/Pwa/PwaBanners";
import { Button } from "@/components/ui/Button";
import { Flex } from "@/components/ui/Flex";
import { IconCircle } from "@/components/ui/IconCircle";
import { Toaster } from "@/components/ui/Sonner";
import { useAuthReady } from "@/hooks/useConvexHelpers";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { CloudOff } from "@/lib/icons";
import {
  type OfflineQueueResult,
  processOfflineQueue,
  registerOfflineReplayHandler,
} from "@/lib/offline";
import { COMMENT_ADD_OFFLINE_MUTATION_TYPE, replayAddComment } from "@/lib/offlineComments";
import {
  ISSUE_UPDATE_STATUS_OFFLINE_MUTATION_TYPE,
  replayIssueUpdateStatus,
} from "@/lib/offlineIssues";
import {
  NOTIFICATION_MARK_READ_OFFLINE_MUTATION_TYPE,
  replayNotificationMarkAsRead,
} from "@/lib/offlineNotifications";
import {
  replayUserSettingsUpdate,
  USER_SETTINGS_OFFLINE_MUTATION_TYPE,
} from "@/lib/offlineUserSettings";
import { showInfo } from "@/lib/toast";
import { getVapidPublicKey, WebPushProvider } from "@/lib/webPush";
import { LazyPostHog } from "../components/LazyPostHog";
import { NotFoundPage } from "../components/NotFoundPage";
import { TooltipProvider } from "../components/ui/Tooltip";
import { Typography } from "../components/ui/Typography";
import { ThemeProvider } from "../contexts/ThemeContext";
import { register as registerServiceWorker } from "../lib/serviceWorker";

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
      // Expose for E2E helpers (waitForConvexConnectionReady, etc.).
      // Harmless in production — just a reference on window.
      window.__convex_test_client = convex;
    }
  } catch (error) {
    console.info("[app] Failed to initialize Convex client", { error });
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
  // Mark app as hydrated for E2E tests (best practice: single global indicator)
  // This fires after React hydration completes, making it safe for tests to interact
  useEffect(() => {
    document.body.classList.add("app-hydrated");
  }, []);

  // Register service worker for PWA (production only)
  useEffect(() => {
    if (import.meta.env.PROD) {
      registerServiceWorker();
    }
  }, []);

  return (
    <ThemeProvider>
      <LazyPostHog apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY} options={posthogOptions}>
        <TooltipProvider delayDuration={200}>
          {convex ? (
            <ConvexAuthProvider client={convex}>
              <ErrorBoundary>
                <OfflineReplayBootstrap />
                <WebPushProvider vapidPublicKey={getVapidPublicKey()}>
                  <Outlet />
                </WebPushProvider>
              </ErrorBoundary>
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
                <IconCircle size="xl" variant="soft" className="mb-8">
                  <CloudOff className="size-10 text-ui-text-tertiary" />
                </IconCircle>

                {/* Large error code with tight tracking */}
                <Typography variant="errorCodeDisplay">503</Typography>

                {/* Message with secondary text styling */}
                <Typography variant="large" color="secondary" className="mt-4">
                  Service Unavailable
                </Typography>
                <Typography color="tertiary" className="mt-2">
                  The application could not connect to the backend services. Please try again later.
                </Typography>

                {/* Retry button */}
                <Button onClick={() => window.location.reload()} size="lg" className="mt-8">
                  Try again
                </Button>
              </Flex>
            </Flex>
          )}
          <PwaBanners />
          <Toaster />
        </TooltipProvider>
      </LazyPostHog>
    </ThemeProvider>
  );
}

function OfflineReplayBootstrap() {
  const convexClient = useConvex();
  const { isAuthenticated, isAuthLoading } = useAuthReady();
  const { user } = useCurrentUser();
  const userId = user?._id;

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated || !userId) {
      return;
    }

    registerOfflineReplayHandler(USER_SETTINGS_OFFLINE_MUTATION_TYPE, (args) =>
      replayUserSettingsUpdate(convexClient, args),
    );
    registerOfflineReplayHandler(NOTIFICATION_MARK_READ_OFFLINE_MUTATION_TYPE, (args) =>
      replayNotificationMarkAsRead(convexClient, args),
    );
    registerOfflineReplayHandler(ISSUE_UPDATE_STATUS_OFFLINE_MUTATION_TYPE, (args) =>
      replayIssueUpdateStatus(convexClient, args),
    );
    registerOfflineReplayHandler(COMMENT_ADD_OFFLINE_MUTATION_TYPE, (args) =>
      replayAddComment(convexClient, args),
    );

    const flushQueue = (showReconnectToast: boolean) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        return;
      }
      processOfflineQueue(userId)
        .then((result: OfflineQueueResult) => {
          if (showReconnectToast && result.synced > 0) {
            const label = result.synced === 1 ? "change" : "changes";
            showInfo(`Back online — ${result.synced} ${label} synced`);
          }
        })
        .catch((error: unknown) => {
          console.info("[offline] Failed to flush queued mutations", { error });
        });
    };

    // Initial flush on mount — no toast (user just loaded the app)
    flushQueue(false);

    const handleOnline = () => {
      // Reconnect flush — show toast if items were synced
      flushQueue(true);
    };

    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [convexClient, isAuthenticated, isAuthLoading, userId]);

  return null;
}
