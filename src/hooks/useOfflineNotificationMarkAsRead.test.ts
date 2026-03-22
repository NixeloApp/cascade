import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { queueNotificationMarkAsRead } from "@/lib/offlineNotifications";
import { renderHook } from "@/test/custom-render";
import { useAuthenticatedMutation } from "./useConvexHelpers";
import { useCurrentUser } from "./useCurrentUser";
import { useOnlineStatus } from "./useOffline";
import { useOfflineNotificationMarkAsRead } from "./useOfflineNotificationMarkAsRead";

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

vi.mock("@/lib/offlineNotifications", () => ({
  queueNotificationMarkAsRead: vi.fn(),
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockUseOnlineStatus = vi.mocked(useOnlineStatus);
const mockQueueNotificationMarkAsRead = vi.mocked(queueNotificationMarkAsRead);

function createMutationMock(): ReactMutation<FunctionReference<"mutation">> {
  const mutation = Object.assign(
    vi.fn((..._args: unknown[]) => Promise.resolve({ success: true })),
    { withOptimisticUpdate: () => mutation },
  ) as ReactMutation<FunctionReference<"mutation">>;
  return mutation;
}

describe("useOfflineNotificationMarkAsRead", () => {
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
    const { result } = renderHook(() => useOfflineNotificationMarkAsRead());
    const response = await result.current.markAsRead("notification-123" as never);

    expect(response).toEqual({ queued: false });
    expect(mockMutation).toHaveBeenCalledWith({ id: "notification-123" });
    expect(mockQueueNotificationMarkAsRead).not.toHaveBeenCalled();
  });

  it("queues the mutation when offline", async () => {
    mockUseOnlineStatus.mockReturnValue(false);
    mockQueueNotificationMarkAsRead.mockResolvedValue(1);

    const { result } = renderHook(() => useOfflineNotificationMarkAsRead());
    const response = await result.current.markAsRead("notification-456" as never);

    expect(response).toEqual({ queued: true });
    expect(mockQueueNotificationMarkAsRead).toHaveBeenCalledWith(
      { id: "notification-456" },
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

    const { result } = renderHook(() => useOfflineNotificationMarkAsRead());
    await expect(result.current.markAsRead("notification-789" as never)).rejects.toThrow(
      "Cannot queue offline mutation without an authenticated user",
    );
  });
});
