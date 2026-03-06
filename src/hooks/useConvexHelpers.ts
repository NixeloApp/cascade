/**
 * Convex Query Helpers
 *
 * Provides auth-aware wrappers around Convex hooks to ensure
 * consistent handling of authentication state across the app.
 *
 * USE THESE INSTEAD OF RAW useQuery:
 * - useAuthenticatedQuery: For queries requiring auth (most queries)
 * - usePublicQuery: For public queries that don't need auth
 * - useAuthReady: For checking auth state in mutations/UI
 */

import { useConvexAuth, useQuery as useConvexQuery } from "convex/react";
import type { FunctionArgs, FunctionReference, FunctionReturnType } from "convex/server";

type QueryReference = FunctionReference<"query">;

/**
 * Query that automatically skips when auth is not ready.
 * Use for any query that requires authentication.
 *
 * @example
 * // Instead of:
 * const { isAuthenticated } = useConvexAuth();
 * const data = useQuery(api.users.getCurrent, isAuthenticated ? undefined : "skip");
 *
 * // Use:
 * const data = useAuthenticatedQuery(api.users.getCurrent, {});
 */
export function useAuthenticatedQuery<Query extends QueryReference>(
  query: Query,
  args: FunctionArgs<Query> | "skip",
): FunctionReturnType<Query> | undefined {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const canQuery = isAuthenticated && !isLoading;

  // Cast needed because useConvexQuery expects rest args but we're passing single arg
  return useConvexQuery(
    query,
    (canQuery && args !== "skip" ? args : "skip") as FunctionArgs<Query> | "skip",
  );
}

/**
 * Query for public endpoints that don't require auth.
 * Explicit marker that this is intentionally unauthenticated.
 *
 * @example
 * // For truly public queries (landing page data, public documents, etc.)
 * const publicData = usePublicQuery(api.public.getLandingStats, {});
 */
export function usePublicQuery<Query extends QueryReference>(
  query: Query,
  args: FunctionArgs<Query>,
): FunctionReturnType<Query> | undefined {
  return useConvexQuery(query, args as FunctionArgs<Query>);
}

/**
 * Auth state hook for mutations and UI that needs to check auth.
 * Returns derived `canAct` boolean for disabling buttons/actions.
 *
 * @example
 * const { canAct } = useAuthReady();
 * const doSomething = useMutation(api.foo.bar);
 *
 * <Button disabled={!canAct} onClick={() => doSomething(args)}>
 *   Do Something
 * </Button>
 */
export function useAuthReady() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  return {
    isAuthenticated,
    isAuthLoading: isLoading,
    /** True when auth is settled AND user is authenticated. Safe to query/mutate. */
    canAct: isAuthenticated && !isLoading,
  };
}
