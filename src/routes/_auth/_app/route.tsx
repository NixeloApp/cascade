import { api } from "@convex/_generated/api";
import { isReservedSlug } from "@convex/shared/constants";
import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute("/_auth/_app")({
  component: AppLayout,
});

/**
 * AppLayout - The /app gateway route.
 *
 * This is the SOLE redirect resolver for authenticated users:
 * 1. If onboarding incomplete -> redirect to /onboarding
 * 2. If user has org -> redirect to /$orgSlug/dashboard
 * 3. If user has no org -> Initialize one, then redirect
 *
 * Google OAuth and other auth flows land here, and this gateway
 * ensures users end up in the right place.
 */
function AppLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();

  // Get redirect destination from backend (handles onboarding check)
  const redirectPath = useQuery(
    api.auth.getRedirectDestination,
    isAuthenticated ? undefined : "skip",
  );

  // Get user's organizations to check if we need initialization
  const userOrganizations = useQuery(
    api.organizations.getUserOrganizations,
    isAuthenticated ? undefined : "skip",
  );

  // Redirect to correct destination if not at /app
  useEffect(() => {
    if (redirectPath && redirectPath !== ROUTES.app.path) {
      const isGateway = pathname === "/app" || pathname === "/app/";
      const isOnboardingTarget = redirectPath.includes("/onboarding");
      const isOnboardingCurrent = pathname.includes("/onboarding");

      if (isOnboardingTarget && !isOnboardingCurrent) {
        navigate({ to: redirectPath, replace: true });
      } else if (isGateway) {
        navigate({ to: redirectPath, replace: true });
      }
    }
  }, [redirectPath, navigate, pathname]);

  // Loading state - waiting for queries
  if (isAuthLoading || redirectPath === undefined || userOrganizations === undefined) {
    return (
      <Flex align="center" justify="center" className="min-h-screen bg-ui-bg-secondary">
        <LoadingSpinner size="lg" />
      </Flex>
    );
  }

  // If we have a redirect path that's not /app, potentially show loading if we are about to redirect
  if (redirectPath && redirectPath !== ROUTES.app.path) {
    const isGateway = pathname === "/app" || pathname === "/app/";
    const isOnboardingTarget = redirectPath.includes("/onboarding");
    const isOnboardingCurrent = pathname.includes("/onboarding");

    const willRedirect = (isOnboardingTarget && !isOnboardingCurrent) || isGateway;

    if (willRedirect) {
      return (
        <Flex align="center" justify="center" className="min-h-screen bg-ui-bg-secondary">
          <LoadingSpinner size="lg" />
        </Flex>
      );
    }
  }

  // User has no organizations - initialize default organization
  if (userOrganizations.length === 0) {
    return <InitializeOrganization />;
  }

  return <Outlet />;
}

// Component to initialize default organization for users without one
function InitializeOrganization() {
  const navigate = useNavigate();
  const initializeDefaultOrganization = useMutation(
    api.organizations.initializeDefaultOrganization,
  );
  const initRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleInitResult = (result: { slug?: string }) => {
      // Navigate to the new organization's dashboard
      if (result.slug) {
        // Safety check: ensure we don't attempt to navigate to a reserved-word slug
        if (isReservedSlug(result.slug)) {
          throw new Error(`Server returned reserved slug "${result.slug}"`);
        }

        navigate({
          to: ROUTES.dashboard.path,
          params: { orgSlug: result.slug },
          replace: true,
        });
      } else {
        // Fallback: reload to trigger organization query refresh
        window.location.reload();
      }
    };

    const init = async () => {
      // Use ref to prevent duplicate initialization calls (survives re-renders)
      if (initRef.current) return;
      initRef.current = true;
      try {
        const result = await initializeDefaultOrganization({});
        handleInitResult(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create organization");
        initRef.current = false; // Allow retry on error
      }
    };
    init();
  }, [initializeDefaultOrganization, navigate]);

  if (error) {
    return (
      <Flex align="center" justify="center" className="min-h-screen bg-ui-bg-secondary">
        <div className="text-center">
          <Typography variant="h2" className="text-xl font-medium mb-2 text-status-error">
            Error
          </Typography>
          <Typography variant="p" color="secondary">
            {error}
          </Typography>
        </div>
      </Flex>
    );
  }

  return (
    <Flex align="center" justify="center" className="min-h-screen bg-ui-bg-secondary">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <Typography variant="p" color="secondary" className="mt-4">
          Setting up your project...
        </Typography>
      </div>
    </Flex>
  );
}
