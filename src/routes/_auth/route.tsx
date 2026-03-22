import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { AppSplashScreen } from "@/components/Auth";
import { ROUTES } from "@/config/routes";
import { useAuthReady } from "@/hooks/useConvexHelpers";
import {
  clearAuthenticatedSessionMarker,
  hasRecoverableAuthenticatedSession,
  markAuthenticatedSession,
} from "@/lib/authRecovery";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
  ssr: false,
});

/**
 * AuthLayout - Protected route layout using standard Convex auth components.
 *
 * - Shows splash during initial auth check
 * - Keeps protected content mounted during transient auth refresh/loading
 * - Redirects to home/signin only after auth has definitively resolved unauthenticated
 */
function AuthLayout() {
  const { isAuthLoading, isAuthenticated } = useAuthReady();
  const hasAuthenticatedSession = useRef(false);
  const canRecoverAuthenticatedSession = hasRecoverableAuthenticatedSession();

  useEffect(() => {
    if (isAuthenticated) {
      hasAuthenticatedSession.current = true;
      markAuthenticatedSession();
    } else if (!isAuthLoading) {
      hasAuthenticatedSession.current = false;
      clearAuthenticatedSessionMarker();
    }
  }, [isAuthenticated, isAuthLoading]);

  // Offline with recovery signal: render immediately regardless of auth state.
  // Auth can't resolve without connectivity, but the user was previously
  // authenticated and the page is served from SW cache.
  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
  if (isOffline && canRecoverAuthenticatedSession) {
    return <Outlet />;
  }

  if (isAuthLoading) {
    if (hasAuthenticatedSession.current) {
      return <Outlet />;
    }
    return <AppSplashScreen />;
  }

  if (isAuthenticated) {
    return <Outlet />;
  }

  return <Navigate to={ROUTES.home.path} replace />;
}
