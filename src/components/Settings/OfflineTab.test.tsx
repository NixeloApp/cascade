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
    });
  });

  it("renders the online summary and feature list without a sync queue", () => {
    render(<OfflineTab />);

    expect(screen.getByText("Connection Status")).toBeInTheDocument();
    expect(screen.getByText("You are online")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("IndexedDB")).toBeInTheDocument();
    expect(screen.getByText("Offline Features")).toBeInTheDocument();
    expect(screen.getByText("View Cached Content")).toBeInTheDocument();
    expect(screen.queryByText("Pending Sync Queue")).not.toBeInTheDocument();
  });

  it("shows the loading placeholder for pending changes while sync status loads", () => {
    mockUseOfflineSyncStatus.mockReturnValue({
      pending: [],
      count: 0,
      isLoading: true,
    });

    render(<OfflineTab />);

    expect(screen.getByText("...")).toBeInTheDocument();
    expect(screen.queryByText("Pending Sync Queue")).not.toBeInTheDocument();
  });

  it("renders the offline queue, truncates the list, and triggers manual sync", async () => {
    const user = userEvent.setup();
    const pending = Array.from({ length: 6 }, (_, index) => createPendingItem(index + 1));

    mockUseOnlineStatus.mockReturnValue(false);
    mockUseOfflineSyncStatus.mockReturnValue({
      pending,
      count: pending.length,
      isLoading: false,
    });

    render(<OfflineTab />);

    expect(screen.getByText("You are offline")).toBeInTheDocument();
    expect(screen.getByText("Paused")).toBeInTheDocument();
    expect(screen.getByText("Pending Sync Queue")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();

    for (let index = 1; index <= 5; index += 1) {
      expect(screen.getByText(`mutation-${index}`)).toBeInTheDocument();
    }
    expect(screen.queryByText("mutation-6")).not.toBeInTheDocument();
    expect(screen.getByText("+1 more items")).toBeInTheDocument();
    expect(screen.getAllByText("Pending")).toHaveLength(5);

    await user.click(screen.getByRole("button", { name: "Sync Now" }));

    expect(mockToastInfo).toHaveBeenCalledWith("Manual sync triggered", {
      testId: TEST_IDS.TOAST.INFO,
    });
  });
});
