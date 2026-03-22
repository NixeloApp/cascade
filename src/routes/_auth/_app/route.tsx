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
import {
  clearAuthenticatedSessionMarker,
  hasRecoverableAuthenticatedSession,
  markAuthenticatedSession,
  readLocalStorageJson,
  removeLocalStorageValue,
  writeLocalStorageJson,
} from "@/lib/authRecovery";

export const Route = createFileRoute("/_auth/_app")({
  component: AppLayout,
});

type UserOrganization = FunctionReturnType<typeof api.organizations.getUserOrganizations>[number];
const APP_LAYOUT_CACHE_STORAGE_KEY = "nixelo-app-layout-cache";

interface PersistedAppLayoutState {
  redirectPath?: string | null;
  userOrganizations?: UserOrganization[];
}

let cachedRedirectPath: string | null | undefined;
let cachedUserOrganizations: UserOrganization[] | undefined;
let hasAuthenticatedAppSession = false;

/** Synchronous module-level state update (safe in render). */
function updateAppSessionFlags(isAuthenticated: boolean, isAuthLoading: boolean) {
  if (isAuthenticated) {
    hasAuthenticatedAppSession = true;
    return;
  }

  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
  if (!isAuthLoading && !isOffline) {
    hasAuthenticatedAppSession = false;
    cachedRedirectPath = undefined;
    cachedUserOrganizations = undefined;
  }
}

/** Side-effectful localStorage writes (run in useEffect). */
function persistAppSessionState(isAuthenticated: boolean, isAuthLoading: boolean) {
  if (isAuthenticated) {
    markAuthenticatedSession();
    return;
  }

  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
  if (!isAuthLoading && !isOffline) {
    clearAuthenticatedSessionMarker();
    removeLocalStorageValue(APP_LAYOUT_CACHE_STORAGE_KEY);
  }
}

function persistAppLayoutState(partial: Partial<PersistedAppLayoutState>) {
  const existingState = readLocalStorageJson<PersistedAppLayoutState>(APP_LAYOUT_CACHE_STORAGE_KEY);
  writeLocalStorageJson(APP_LAYOUT_CACHE_STORAGE_KEY, {
    ...existingState,
    ...partial,
  });
}

function isGatewayPath(pathname: string) {
  return pathname === ROUTES.app.path || pathname === `${ROUTES.app.path}/`;
}

function getAppRedirectState(pathname: string, redirectPath: string | null) {
  const isGateway = isGatewayPath(pathname);
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
  pathname: string,
  stableRedirectPath: string | null | undefined,
  stableUserOrganizations: UserOrganization[] | undefined,
  canRecoverAuthenticatedSession: boolean,
) {
  if (isAuthLoading && !hasAuthenticatedAppSession && !canRecoverAuthenticatedSession) {
    return true;
  }

  if (!isGatewayPath(pathname)) {
    return stableUserOrganizations === undefined;
  }

  return stableRedirectPath === undefined || stableUserOrganizations === undefined;
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
  const canRecoverAuthenticatedSession = hasRecoverableAuthenticatedSession();
  const persistedAppLayoutState = useRef(
    readLocalStorageJson<PersistedAppLayoutState>(APP_LAYOUT_CACHE_STORAGE_KEY),
  ).current;

  updateAppSessionFlags(isAuthenticated, isAuthLoading);

  useEffect(() => {
    persistAppSessionState(isAuthenticated, isAuthLoading);
  }, [isAuthenticated, isAuthLoading]);

  // Get redirect destination from backend (handles onboarding check)
  const redirectPath = useAuthenticatedQuery(api.auth.getRedirectDestination, {});

  // Get user's organizations to check if we need initialization
  const userOrganizations = useAuthenticatedQuery(api.organizations.getUserOrganizations, {});
  const currentUser = useAuthenticatedQuery(api.users.getCurrent, {});

  useEffect(() => {
    if (redirectPath === undefined) {
      return;
    }

    cachedRedirectPath = redirectPath;
    persistAppLayoutState({ redirectPath });
  }, [redirectPath]);

  useEffect(() => {
    if (userOrganizations === undefined) {
      return;
    }

    cachedUserOrganizations = userOrganizations;
    persistAppLayoutState({ userOrganizations });
  }, [userOrganizations]);

  const stableUserOrganizations =
    userOrganizations ?? cachedUserOrganizations ?? persistedAppLayoutState?.userOrganizations;
  const fallbackOrganization = stableUserOrganizations?.[0];
  const fallbackRedirectPath =
    !persistedAppLayoutState?.redirectPath &&
    !redirectPath &&
    !cachedRedirectPath &&
    fallbackOrganization
      ? ROUTES.dashboard.build(fallbackOrganization.slug)
      : undefined;
  // redirectPath is string | null | undefined:
  //   undefined = still loading, null = backend says "stay here", string = redirect target.
  // Only fall through to cache/persisted when the query hasn't loaded yet (undefined).
  const stableRedirectPath =
    redirectPath !== undefined
      ? redirectPath
      : (cachedRedirectPath ?? persistedAppLayoutState?.redirectPath ?? fallbackRedirectPath);
  const redirectState = getAppRedirectState(pathname, stableRedirectPath ?? null);
  const needsOrganizationBootstrap = (stableUserOrganizations ?? []).length === 0;

  // Redirect to correct destination if not at /app
  useEffect(() => {
    if (stableRedirectPath && redirectState.shouldRedirect) {
      navigate({ to: stableRedirectPath, replace: true });
    }
  }, [navigate, redirectState.shouldRedirect, stableRedirectPath]);

  // Loading state - waiting for queries
  if (
    shouldShowAppLoading(
      isAuthLoading,
      pathname,
      stableRedirectPath,
      stableUserOrganizations,
      canRecoverAuthenticatedSession,
    )
  ) {
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

  // Wait for the authenticated user document to load before attempting org bootstrap.
  // undefined = still loading, null = profile missing (error state)
  if (needsOrganizationBootstrap && currentUser === undefined) {
    return (
      <Flex align="center" justify="center" className="min-h-screen bg-ui-bg-secondary">
        <LoadingSpinner size="lg" />
      </Flex>
    );
  }

  // User profile not found - show error with recovery option
  if (needsOrganizationBootstrap && currentUser === null) {
    return (
      <Flex align="center" justify="center" className="min-h-screen bg-ui-bg-secondary">
        <div className="text-center">
          <Typography variant="authStatusTitle" color="error" className="mb-2">
            Account Error
          </Typography>
          <Typography variant="p" color="secondary" className="mb-4">
            Your user profile could not be found. Please sign out and try again.
          </Typography>
        </div>
      </Flex>
    );
  }

  // User has no organizations - initialize default organization
  if (needsOrganizationBootstrap) {
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
          <Typography variant="authStatusTitle" color="error" className="mb-2">
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
