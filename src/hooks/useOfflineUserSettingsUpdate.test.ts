import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { queueUserSettingsUpdate } from "@/lib/offlineUserSettings";
import { showInfo } from "@/lib/toast";
import { renderHook } from "@/test/custom-render";
import { useAuthenticatedMutation } from "./useConvexHelpers";
import { useOnlineStatus } from "./useOffline";
import { useOfflineUserSettingsUpdate } from "./useOfflineUserSettingsUpdate";

vi.mock("./useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
}));

vi.mock("./useOffline", () => ({
  useOnlineStatus: vi.fn(),
}));

vi.mock("@/lib/offlineUserSettings", () => ({
  queueUserSettingsUpdate: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showInfo: vi.fn(),
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockUseOnlineStatus = vi.mocked(useOnlineStatus);
const mockQueueUserSettingsUpdate = vi.mocked(queueUserSettingsUpdate);
const mockShowInfo = vi.mocked(showInfo);
let mockMutation: ReactMutation<FunctionReference<"mutation">>;

function createMutationMock(): ReactMutation<FunctionReference<"mutation">> {
  const mutation = Object.assign(
    vi.fn((..._args: unknown[]) => Promise.resolve(undefined)),
    {
      withOptimisticUpdate: () => mutation,
    },
  ) as ReactMutation<FunctionReference<"mutation">>;

  return mutation;
}

describe("useOfflineUserSettingsUpdate", () => {
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

  it("runs the live mutation when online", async () => {
    vi.mocked(mockMutation).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useOfflineUserSettingsUpdate());
    const response = await result.current.update({ theme: "dark" });

    expect(response).toEqual({ queued: false });
    expect(mockMutation).toHaveBeenCalledWith({ theme: "dark" });
    expect(mockQueueUserSettingsUpdate).not.toHaveBeenCalled();
  });

  it("queues the mutation locally when offline", async () => {
    mockUseOnlineStatus.mockReturnValue(false);
    mockQueueUserSettingsUpdate.mockResolvedValue(7);

    const { result } = renderHook(() => useOfflineUserSettingsUpdate());
    const response = await result.current.update(
      { timezone: "America/Chicago" },
      { queuedMessage: "Timezone change queued for sync when you are back online" },
    );

    expect(response).toEqual({ queued: true });
    expect(mockQueueUserSettingsUpdate).toHaveBeenCalledWith({
      timezone: "America/Chicago",
    });
    expect(mockMutation).not.toHaveBeenCalled();
    expect(mockShowInfo).toHaveBeenCalledWith(
      "Timezone change queued for sync when you are back online",
    );
  });
});
