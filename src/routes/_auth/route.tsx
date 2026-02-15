import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { AppSplashScreen } from "@/components/Auth";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
  ssr: false,
});

/**
 * AuthLayout - Protected route layout using standard Convex auth components.
 *
 * - AuthLoading: Shows splash during initial auth check
 * - Authenticated: Renders protected content (checks for verification)
 * - Unauthenticated: Redirects to home/signin
 */
function AuthLayout() {
  return (
    <>
      <AuthLoading>
        <AppSplashScreen />
      </AuthLoading>
      <Authenticated>
        <Outlet />
      </Authenticated>
      <Unauthenticated>
        <Navigate to={ROUTES.home.path} replace />
      </Unauthenticated>
    </>
  );
}
