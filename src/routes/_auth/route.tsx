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

  if (isAuthLoading) {
    if (!hasAuthenticatedSession.current && !canRecoverAuthenticatedSession) {
      return <AppSplashScreen />;
    }
    // Confirmed session from this page lifetime — safe to keep rendering
    if (hasAuthenticatedSession.current) {
      return <Outlet />;
    }
    // Recovery signal from localStorage but no confirmed session yet.
    // When offline, render the cached layout since auth can't resolve —
    // this is the graceful-degradation path for connectivity blips.
    // When online, show splash and let auth resolve normally.
    if (canRecoverAuthenticatedSession && typeof navigator !== "undefined" && !navigator.onLine) {
      return <Outlet />;
    }
    return <AppSplashScreen />;
  }

  if (isAuthenticated) {
    return <Outlet />;
  }

  // When offline with a recovery signal, keep rendering instead of redirecting.
  // Auth can't resolve without connectivity, but the user was previously authenticated
  // and the page is served from SW cache — this is graceful degradation.
  if (canRecoverAuthenticatedSession && typeof navigator !== "undefined" && !navigator.onLine) {
    return <Outlet />;
  }

  return <Navigate to={ROUTES.home.path} replace />;
}
