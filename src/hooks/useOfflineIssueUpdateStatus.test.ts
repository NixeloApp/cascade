import type { Id } from "@convex/_generated/dataModel";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { queueIssueUpdateStatus } from "@/lib/offlineIssues";
import { renderHook } from "@/test/custom-render";
import { useAuthenticatedMutation } from "./useConvexHelpers";
import { useCurrentUser } from "./useCurrentUser";
import { useOnlineStatus } from "./useOffline";
import { useOfflineIssueUpdateStatus } from "./useOfflineIssueUpdateStatus";

vi.mock("./useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
}));

vi.mock("./useOffline", () => ({
  useOnlineStatus: vi.fn(),
}));

vi.mock("./useCurrentUser", () => ({
  useCurrentUser: vi.fn(() => ({
    user: { _id: "test-user-id" },
    isLoading: false,
    isAuthenticated: true,
  })),
}));

vi.mock("@/lib/offlineIssues", () => ({
  queueIssueUpdateStatus: vi.fn(),
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockUseOnlineStatus = vi.mocked(useOnlineStatus);
const mockQueueIssueUpdateStatus = vi.mocked(queueIssueUpdateStatus);

function createMutationMock(): ReactMutation<FunctionReference<"mutation">> {
  const mutation = Object.assign(
    vi.fn((..._args: unknown[]) => Promise.resolve({ success: true })),
    { withOptimisticUpdate: () => mutation },
  ) as ReactMutation<FunctionReference<"mutation">>;
  return mutation;
}

describe("useOfflineIssueUpdateStatus", () => {
  let mockMutation: ReactMutation<FunctionReference<"mutation">>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutation = createMutationMock();
    mockUseAuthenticatedMutation.mockReturnValue({
      mutate: mockMutation,
      canAct: true,
      isAuthLoading: false,
    });
    mockUseOnlineStatus.mockReturnValue(true);
  });

  it("calls the live mutation when online", async () => {
    const { result } = renderHook(() => useOfflineIssueUpdateStatus());
    const response = await result.current.updateStatus(
      "issue-123" as Id<"issues">,
      "in-progress",
      0,
    );

    expect(response).toEqual({ queued: false });
    expect(mockMutation).toHaveBeenCalledWith({
      issueId: "issue-123",
      newStatus: "in-progress",
      newOrder: 0,
    });
    expect(mockQueueIssueUpdateStatus).not.toHaveBeenCalled();
  });

  it("queues the mutation when offline", async () => {
    mockUseOnlineStatus.mockReturnValue(false);
    mockQueueIssueUpdateStatus.mockResolvedValue(1);

    const { result } = renderHook(() => useOfflineIssueUpdateStatus());
    const response = await result.current.updateStatus("issue-456" as Id<"issues">, "done");

    expect(response).toEqual({ queued: true });
    expect(mockQueueIssueUpdateStatus).toHaveBeenCalledWith(
      { issueId: "issue-456", newStatus: "done", newOrder: 0 },
      "test-user-id",
    );
    expect(mockMutation).not.toHaveBeenCalled();
  });

  it("throws when offline without authenticated user", async () => {
    mockUseOnlineStatus.mockReturnValue(false);
    vi.mocked(useCurrentUser).mockReturnValue({
      user: undefined,
      isLoading: false,
      isAuthenticated: false,
    });

    const { result } = renderHook(() => useOfflineIssueUpdateStatus());
    await expect(result.current.updateStatus("issue-789" as Id<"issues">, "todo")).rejects.toThrow(
      "Cannot queue offline mutation without an authenticated user",
    );
  });
});
