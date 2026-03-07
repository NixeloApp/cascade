import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { AppSplashScreen } from "@/components/Auth";
import { ROUTES } from "@/config/routes";
import { useAuthReady } from "@/hooks/useConvexHelpers";

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

  useEffect(() => {
    if (isAuthenticated) {
      hasAuthenticatedSession.current = true;
    } else if (!isAuthLoading) {
      hasAuthenticatedSession.current = false;
    }
  }, [isAuthenticated, isAuthLoading]);

  if (isAuthLoading && !hasAuthenticatedSession.current) {
    return <AppSplashScreen />;
  }

  if (isAuthenticated || (isAuthLoading && hasAuthenticatedSession.current)) {
    return <Outlet />;
  }

  return <Navigate to={ROUTES.home.path} replace />;
}
