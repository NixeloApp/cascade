/**
 * Current User Hook
 *
 * Retrieves and caches the authenticated user.
 * Returns loading and authentication states.
 * Used throughout the app for user context.
 */

import { api } from "@convex/_generated/api";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";

/** Returns current user with loading and auth states. */
export function useCurrentUser() {
  const user = useAuthenticatedQuery(api.users.getCurrent, {});

  return {
    user,
    isLoading: user === undefined,
    isAuthenticated: user !== null,
  };
}
