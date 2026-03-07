/**
 * Convex Auth-Aware Hooks
 *
 * Provides auth-aware wrappers around Convex hooks to ensure
 * consistent handling of authentication state across the app.
 *
 * USE THESE INSTEAD OF RAW useQuery/useMutation:
 * - useAuthenticatedQuery: For queries requiring auth (most queries)
 * - useAuthenticatedMutation: For mutations requiring auth (most mutations)
 * - usePublicQuery: For public queries that don't need auth
 * - useAuthReady: For checking auth state in UI
 */

import type { ReactMutation } from "convex/react";
import {
  useConvexAuth,
  useMutation as useConvexMutation,
  useQuery as useConvexQuery,
} from "convex/react";
import type { FunctionArgs, FunctionReference, FunctionReturnType } from "convex/server";

type QueryReference = FunctionReference<"query">;
type MutationReference = FunctionReference<"mutation">;

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
 * Supports "skip" for conditional queries (e.g., modal not open).
 *
 * @example
 * // For truly public queries (landing page data, public documents, etc.)
 * const publicData = usePublicQuery(api.public.getLandingStats, {});
 *
 * // With conditional skip
 * const data = usePublicQuery(api.invites.getByToken, open ? { token } : "skip");
 */
export function usePublicQuery<Query extends QueryReference>(
  query: Query,
  args: FunctionArgs<Query> | "skip",
): FunctionReturnType<Query> | undefined {
  return useConvexQuery(query, args as FunctionArgs<Query> | "skip");
}

/**
 * Mutation for public endpoints that don't require auth.
 * Use for mutations like unsubscribe-by-token, magic link verification, etc.
 *
 * @example
 * const { mutate } = usePublicMutation(api.unsubscribe.unsubscribe);
 * await mutate({ token });
 */
export function usePublicMutation<Mutation extends MutationReference>(
  mutation: Mutation,
): {
  mutate: ReactMutation<Mutation>;
} {
  const mutate = useConvexMutation(mutation);
  return { mutate };
}

/**
 * Mutation with auth state bundled for easy button disabling.
 * Use for any mutation that requires authentication.
 *
 * @example
 * const { mutate, canAct } = useAuthenticatedMutation(api.issues.create);
 *
 * <Button disabled={!canAct} onClick={() => mutate({ title: "New issue" })}>
 *   Create Issue
 * </Button>
 */
export function useAuthenticatedMutation<Mutation extends MutationReference>(
  mutation: Mutation,
): {
  mutate: ReactMutation<Mutation>;
  canAct: boolean;
  isAuthLoading: boolean;
} {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const mutate = useConvexMutation(mutation);

  return {
    mutate,
    /** True when auth is settled AND user is authenticated. Safe to call mutate. */
    canAct: isAuthenticated && !isLoading,
    isAuthLoading: isLoading,
  };
}

/**
 * Auth state hook for UI that needs to check auth without a specific mutation.
 * Returns derived `canAct` boolean for disabling buttons/actions.
 *
 * @example
 * const { canAct } = useAuthReady();
 *
 * <Button disabled={!canAct} onClick={handleClick}>
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
