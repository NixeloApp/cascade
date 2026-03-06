import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { useEffect, useRef } from "react";
import { AppSplashScreen } from "@/components/Auth";
import { ROUTES } from "@/config/routes";

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
  const { isLoading, isAuthenticated } = useConvexAuth();
  const hasAuthenticatedSession = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      hasAuthenticatedSession.current = true;
    } else if (!isLoading) {
      hasAuthenticatedSession.current = false;
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading && !hasAuthenticatedSession.current) {
    return <AppSplashScreen />;
  }

  if (isAuthenticated || (isLoading && hasAuthenticatedSession.current)) {
    return <Outlet />;
  }

  return <Navigate to={ROUTES.home.path} replace />;
}
