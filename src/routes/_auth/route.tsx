import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { useEffect, useState } from "react";
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
  const [hasAuthenticatedSession, setHasAuthenticatedSession] = useState(isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      setHasAuthenticatedSession(true);
      return;
    }

    if (!isLoading) {
      setHasAuthenticatedSession(false);
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading && !hasAuthenticatedSession) {
    return <AppSplashScreen />;
  }

  if (isAuthenticated || (isLoading && hasAuthenticatedSession)) {
    return <Outlet />;
  }

  return <Navigate to={ROUTES.home.path} replace />;
}
