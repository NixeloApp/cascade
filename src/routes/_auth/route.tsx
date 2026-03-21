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
    // While auth is loading, use localStorage markers only to skip the splash screen,
    // NOT to render protected content. Show the splash screen if we have no recovery signal.
    if (!hasAuthenticatedSession.current && !canRecoverAuthenticatedSession) {
      return <AppSplashScreen />;
    }
    // Recovery signal exists — render Outlet to avoid layout flash for likely-authenticated users
    if (hasAuthenticatedSession.current) {
      return <Outlet />;
    }
    // canRecoverAuthenticatedSession is true but no confirmed session yet — show splash
    // instead of rendering protected content based on a best-effort localStorage marker
    return <AppSplashScreen />;
  }

  if (isAuthenticated) {
    return <Outlet />;
  }

  return <Navigate to={ROUTES.home.path} replace />;
}
