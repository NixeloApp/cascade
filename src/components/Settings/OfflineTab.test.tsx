import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OfflineMutation } from "@/lib/offline";
import { TEST_IDS } from "@/lib/test-ids";
import { render, screen } from "@/test/custom-render";
import { useOfflineSyncStatus, useOnlineStatus } from "../../hooks/useOffline";
import { OfflineTab } from "./OfflineTab";

vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
  },
}));

vi.mock("../../hooks/useOffline", () => ({
  useOnlineStatus: vi.fn(),
  useOfflineSyncStatus: vi.fn(),
}));

const mockUseOnlineStatus = vi.mocked(useOnlineStatus);
const mockUseOfflineSyncStatus = vi.mocked(useOfflineSyncStatus);
const mockToastInfo = vi.mocked(toast.info);

function createPendingItem(id: number): OfflineMutation {
  return {
    id,
    mutationType: `mutation-${id}`,
    mutationArgs: "{}",
    status: "pending",
    attempts: 0,
    timestamp: 1_700_000_000_000 + id * 1_000,
  };
}

describe("OfflineTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOnlineStatus.mockReturnValue(true);
    mockUseOfflineSyncStatus.mockReturnValue({
      pending: [],
      count: 0,
      isLoading: false,
      refresh: vi.fn(),
    });
  });

  it("renders the online summary and feature list without a sync queue", () => {
    render(<OfflineTab />);

    expect(screen.getByText("Connection Status")).toBeInTheDocument();
    expect(screen.getByText("You are online")).toBeInTheDocument();
    expect(screen.getByText("Local only")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("IndexedDB")).toBeInTheDocument();
    expect(screen.getByText("Service Worker Support")).toBeInTheDocument();
    expect(screen.getAllByText("Unavailable")).toHaveLength(2);
    expect(screen.getByText("Current Verified Capabilities")).toBeInTheDocument();
    expect(screen.getByText("Local Queue Visibility")).toBeInTheDocument();
    expect(screen.queryByText("Local Offline Queue")).not.toBeInTheDocument();
  });

  it("shows the loading placeholder for pending changes while sync status loads", () => {
    mockUseOfflineSyncStatus.mockReturnValue({
      pending: [],
      count: 0,
      isLoading: true,
      refresh: vi.fn(),
    });

    render(<OfflineTab />);

    expect(screen.getByText("...")).toBeInTheDocument();
    expect(screen.queryByText("Local Offline Queue")).not.toBeInTheDocument();
  });

  it("renders the offline queue, truncates the list, and refreshes local queue state", async () => {
    const user = userEvent.setup();
    const pending = Array.from({ length: 6 }, (_, index) => createPendingItem(index + 1));
    const refresh = vi.fn().mockResolvedValue(undefined);

    mockUseOnlineStatus.mockReturnValue(false);
    mockUseOfflineSyncStatus.mockReturnValue({
      pending,
      count: pending.length,
      isLoading: false,
      refresh,
    });

    render(<OfflineTab />);

    expect(screen.getByText("You are offline")).toBeInTheDocument();
    expect(screen.getByText("Offline")).toBeInTheDocument();
    expect(screen.getByText("Local Offline Queue")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();

    for (let index = 1; index <= 5; index += 1) {
      expect(screen.getByText(`mutation-${index}`)).toBeInTheDocument();
    }
    expect(screen.queryByText("mutation-6")).not.toBeInTheDocument();
    expect(screen.getByText("+1 more items")).toBeInTheDocument();
    expect(screen.getAllByText("Pending")).toHaveLength(5);

    await user.click(screen.getByRole("button", { name: "Refresh Queue" }));

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(mockToastInfo).toHaveBeenCalledWith("Local offline queue refreshed", {
      testId: TEST_IDS.TOAST.INFO,
    });
  });
});
