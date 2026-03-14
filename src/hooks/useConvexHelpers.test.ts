import { api } from "@convex/_generated/api";
import type { ReactMutation } from "convex/react";
import {
  useConvexAuth,
  useMutation as useConvexMutation,
  useQuery as useConvexQuery,
} from "convex/react";
import type { FunctionReference } from "convex/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@/test/custom-render";
import {
  useAuthenticatedMutation,
  useAuthenticatedQuery,
  useAuthReady,
  usePublicMutation,
  usePublicQuery,
} from "./useConvexHelpers";

vi.mock("convex/react", () => ({
  useConvexAuth: vi.fn(),
  useMutation: vi.fn(),
  useQuery: vi.fn(),
}));

const mockUseConvexAuth = vi.mocked(useConvexAuth);
const mockUseConvexMutation = vi.mocked(useConvexMutation);
const mockUseConvexQuery = vi.mocked(useConvexQuery);

const protectedQueryReference = api.users.getCurrent;
const publicQueryReference = api.users.getCurrent;
const mutationReference = api.issues.updateStatus;

const protectedArgs = { projectId: "project_1" };
const publicArgs = { token: "invite_1" };
const queryResult = { issues: 3 };

type MutationProcedure = (...args: unknown[]) => Promise<void>;

function createMutationMock(): ReactMutation<FunctionReference<"mutation">> {
  const mutation = Object.assign((..._args: Parameters<MutationProcedure>) => Promise.resolve(), {
    withOptimisticUpdate: () => mutation,
  }) as ReactMutation<FunctionReference<"mutation">>;
  return mutation;
}

describe("useConvexHelpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseConvexAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
    mockUseConvexQuery.mockReturnValue(queryResult);
    mockUseConvexMutation.mockReturnValue(createMutationMock());
  });

  it("runs authenticated queries only when auth is ready and otherwise skips them", () => {
    const { result, rerender } = renderHook(() =>
      useAuthenticatedQuery(protectedQueryReference, protectedArgs),
    );

    expect(result.current).toBe(queryResult);
    expect(mockUseConvexQuery).toHaveBeenLastCalledWith(protectedQueryReference, protectedArgs);

    mockUseConvexAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    rerender();

    expect(mockUseConvexQuery).toHaveBeenLastCalledWith(protectedQueryReference, "skip");
  });

  it("forwards public queries unchanged, including explicit skip", () => {
    renderHook(() => usePublicQuery(publicQueryReference, publicArgs));

    expect(mockUseConvexQuery).toHaveBeenLastCalledWith(publicQueryReference, publicArgs);

    renderHook(() => usePublicQuery(publicQueryReference, "skip"));

    expect(mockUseConvexQuery).toHaveBeenLastCalledWith(publicQueryReference, "skip");
  });

  it("preserves explicit skip for authenticated queries", () => {
    renderHook(() => useAuthenticatedQuery(protectedQueryReference, "skip"));

    expect(mockUseConvexQuery).toHaveBeenLastCalledWith(protectedQueryReference, "skip");
  });

  it("returns mutation wrappers with the derived auth state", () => {
    const mutation = createMutationMock();
    mockUseConvexMutation.mockReturnValue(mutation);

    const { result, rerender } = renderHook(() => ({
      publicMutation: usePublicMutation(mutationReference),
      authenticatedMutation: useAuthenticatedMutation(mutationReference),
      authReady: useAuthReady(),
    }));

    expect(result.current.publicMutation.mutate).toBe(mutation);
    expect(result.current.authenticatedMutation).toEqual({
      mutate: mutation,
      canAct: true,
      isAuthLoading: false,
    });
    expect(result.current.authReady).toEqual({
      isAuthenticated: true,
      isAuthLoading: false,
      canAct: true,
    });

    mockUseConvexAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    act(() => {
      rerender();
    });

    expect(result.current.authenticatedMutation).toEqual({
      mutate: mutation,
      canAct: false,
      isAuthLoading: true,
    });
    expect(result.current.authReady).toEqual({
      isAuthenticated: false,
      isAuthLoading: true,
      canAct: false,
    });
  });
});
