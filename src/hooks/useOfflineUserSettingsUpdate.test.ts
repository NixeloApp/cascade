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
const mockMutate = vi.fn();

describe("useOfflineUserSettingsUpdate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthenticatedMutation.mockReturnValue({
      mutate: mockMutate,
      canAct: true,
      isAuthLoading: false,
    });
    mockUseOnlineStatus.mockReturnValue(true);
  });

  it("runs the live mutation when online", async () => {
    mockMutate.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useOfflineUserSettingsUpdate());
    const response = await result.current.update({ theme: "dark" });

    expect(response).toEqual({ queued: false });
    expect(mockMutate).toHaveBeenCalledWith({ theme: "dark" });
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
    expect(mockMutate).not.toHaveBeenCalled();
    expect(mockShowInfo).toHaveBeenCalledWith(
      "Timezone change queued for sync when you are back online",
    );
  });
});
