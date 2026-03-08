/**
 * App Layout Route
 *
 * Gateway route for authenticated app access.
 * Handles onboarding redirects and organization initialization.
 * Resolves user destination based on auth and org state.
 */

import { api } from "@convex/_generated/api";
import { isReservedSlug } from "@convex/shared/constants";
import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";
import { useEffect, useRef, useState } from "react";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import {
  useAuthenticatedMutation,
  useAuthenticatedQuery,
  useAuthReady,
} from "@/hooks/useConvexHelpers";

export const Route = createFileRoute("/_auth/_app")({
  component: AppLayout,
});

type UserOrganization = FunctionReturnType<typeof api.organizations.getUserOrganizations>[number];

let cachedRedirectPath: string | null | undefined;
let cachedUserOrganizations: UserOrganization[] | undefined;
let hasAuthenticatedAppSession = false;

function updateAppSessionState(isAuthenticated: boolean, isAuthLoading: boolean) {
  if (isAuthenticated) {
    hasAuthenticatedAppSession = true;
    return;
  }

  if (!isAuthLoading) {
    hasAuthenticatedAppSession = false;
    cachedRedirectPath = undefined;
    cachedUserOrganizations = undefined;
  }
}

function getAppRedirectState(pathname: string, redirectPath: string | null) {
  const isGateway = pathname === ROUTES.app.path || pathname === `${ROUTES.app.path}/`;
  const isOnboardingTarget = redirectPath?.includes(ROUTES.onboarding.path) ?? false;
  const isOnboardingCurrent = pathname.includes(ROUTES.onboarding.path);
  const shouldRedirect =
    Boolean(redirectPath) &&
    redirectPath !== ROUTES.app.path &&
    ((isOnboardingTarget && !isOnboardingCurrent) || isGateway);

  return {
    shouldRedirect,
  };
}

function shouldShowAppLoading(
  isAuthLoading: boolean,
  stableRedirectPath: string | null | undefined,
  stableUserOrganizations: UserOrganization[] | undefined,
) {
  return (
    (isAuthLoading && !hasAuthenticatedAppSession) ||
    stableRedirectPath === undefined ||
    stableUserOrganizations === undefined
  );
}

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
  const { isAuthLoading, isAuthenticated } = useAuthReady();

  updateAppSessionState(isAuthenticated, isAuthLoading);

  // Get redirect destination from backend (handles onboarding check)
  const redirectPath = useAuthenticatedQuery(api.auth.getRedirectDestination, {});

  // Get user's organizations to check if we need initialization
  const userOrganizations = useAuthenticatedQuery(api.organizations.getUserOrganizations, {});
  const currentUser = useAuthenticatedQuery(api.users.getCurrent, {});

  if (redirectPath !== undefined) {
    cachedRedirectPath = redirectPath;
  }

  if (userOrganizations !== undefined) {
    cachedUserOrganizations = userOrganizations;
  }

  const stableRedirectPath = redirectPath ?? cachedRedirectPath;
  const stableUserOrganizations = userOrganizations ?? cachedUserOrganizations;
  const redirectState = getAppRedirectState(pathname, stableRedirectPath ?? null);

  // Redirect to correct destination if not at /app
  useEffect(() => {
    if (stableRedirectPath && redirectState.shouldRedirect) {
      navigate({ to: stableRedirectPath, replace: true });
    }
  }, [navigate, redirectState.shouldRedirect, stableRedirectPath]);

  // Loading state - waiting for queries
  if (shouldShowAppLoading(isAuthLoading, stableRedirectPath, stableUserOrganizations)) {
    return (
      <Flex align="center" justify="center" className="min-h-screen bg-ui-bg-secondary">
        <LoadingSpinner size="lg" />
      </Flex>
    );
  }

  // If we have a redirect path that's not /app, potentially show loading if we are about to redirect
  if (stableRedirectPath && redirectState.shouldRedirect) {
    return (
      <Flex align="center" justify="center" className="min-h-screen bg-ui-bg-secondary">
        <LoadingSpinner size="lg" />
      </Flex>
    );
  }

  // Wait for the authenticated user document to exist before attempting org bootstrap.
  if (currentUser === undefined || currentUser === null) {
    return (
      <Flex align="center" justify="center" className="min-h-screen bg-ui-bg-secondary">
        <LoadingSpinner size="lg" />
      </Flex>
    );
  }

  // User has no organizations - initialize default organization
  if ((stableUserOrganizations ?? []).length === 0) {
    return <InitializeOrganization />;
  }

  return <Outlet />;
}

// Component to initialize default organization for users without one
function InitializeOrganization() {
  const navigate = useNavigate();
  const { mutate: initializeDefaultOrganization } = useAuthenticatedMutation(
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
