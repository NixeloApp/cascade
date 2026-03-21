import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OfflineMutation } from "@/lib/offline";
import { TEST_IDS } from "@/lib/test-ids";
import { render, screen } from "@/test/custom-render";
import { useOfflineQueue, useOnlineStatus } from "../../hooks/useOffline";
import { OfflineTab } from "./OfflineTab";

vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
  },
}));

vi.mock("../../hooks/useOffline", () => ({
  useOnlineStatus: vi.fn(),
  useOfflineQueue: vi.fn(),
}));

vi.mock("../../hooks/useCurrentUser", () => ({
  useCurrentUser: vi.fn(() => ({
    user: { _id: "test-user-id" },
    isLoading: false,
    isAuthenticated: true,
  })),
}));

const mockUseOnlineStatus = vi.mocked(useOnlineStatus);
const mockUseOfflineQueue = vi.mocked(useOfflineQueue);
const mockToastInfo = vi.mocked(toast.info);

function createQueueItem(
  id: number,
  status: OfflineMutation["status"] = "pending",
  error?: string,
): OfflineMutation {
  return {
    id,
    mutationType: `mutation-${id}`,
    mutationArgs: "{}",
    status,
    attempts: 0,
    timestamp: 1_700_000_000_000 + id * 1_000,
    error,
  };
}

describe("OfflineTab", () => {
  const originalServiceWorkerDescriptor = Object.getOwnPropertyDescriptor(
    navigator,
    "serviceWorker",
  );

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOnlineStatus.mockReturnValue(true);
    mockUseOfflineQueue.mockReturnValue({
      queue: [],
      count: 0,
      pendingCount: 0,
      syncingCount: 0,
      failedCount: 0,
      lastSuccessfulReplayAt: null,
      isLoading: false,
      refresh: vi.fn(),
      processNow: vi.fn(),
      retryMutation: vi.fn(),
      deleteMutation: vi.fn(),
      clearSynced: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();

    if (originalServiceWorkerDescriptor) {
      Object.defineProperty(navigator, "serviceWorker", originalServiceWorkerDescriptor);
      return;
    }

    Reflect.deleteProperty(navigator, "serviceWorker");
  });

  it("renders the online summary and feature list without a sync queue", () => {
    render(<OfflineTab />);

    expect(screen.getByText("Connection Status")).toBeInTheDocument();
    expect(screen.getByText("You are online")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("IndexedDB")).toBeInTheDocument();
    expect(screen.getByText("Last Successful Replay")).toBeInTheDocument();
    expect(screen.getByText("Never")).toBeInTheDocument();
    expect(screen.getByText("Service Worker Support")).toBeInTheDocument();
    expect(screen.getAllByText("Unavailable")).toHaveLength(2);
    expect(screen.getByText("Service worker features are unavailable here")).toBeInTheDocument();
    expect(screen.getByText("Current Verified Capabilities")).toBeInTheDocument();
    expect(screen.getByText("Local Queue Visibility")).toBeInTheDocument();
    expect(screen.queryByText("Local Offline Queue")).not.toBeInTheDocument();
  });

  it("warns when background sync is unavailable even if service workers exist", () => {
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {},
    });
    vi.stubGlobal("ServiceWorkerRegistration", class ServiceWorkerRegistration {});

    render(<OfflineTab />);

    expect(screen.getByText("Detected")).toBeInTheDocument();
    expect(screen.getByText("Background sync is best-effort only")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Queued changes replay only while the app is open: on reconnect, on startup, or when you use Process Queue manually.",
      ),
    ).toBeInTheDocument();
  });

  it("shows the loading placeholder for pending changes while sync status loads", () => {
    mockUseOfflineQueue.mockReturnValue({
      queue: [],
      count: 0,
      pendingCount: 0,
      syncingCount: 0,
      failedCount: 0,
      lastSuccessfulReplayAt: null,
      isLoading: true,
      refresh: vi.fn(),
      processNow: vi.fn(),
      retryMutation: vi.fn(),
      deleteMutation: vi.fn(),
      clearSynced: vi.fn(),
    });

    render(<OfflineTab />);

    expect(screen.getByText("...")).toBeInTheDocument();
    expect(screen.queryByText("Local Offline Queue")).not.toBeInTheDocument();
  });

  it("renders queue states, truncates the list, and supports refresh plus failed-item actions", async () => {
    const user = userEvent.setup();
    const queue = [
      createQueueItem(1, "pending"),
      createQueueItem(2, "syncing"),
      createQueueItem(3, "failed", "Unsupported offline mutation type: mutation-3"),
      createQueueItem(4, "pending"),
      createQueueItem(5, "pending"),
      createQueueItem(6, "pending"),
    ];
    const refresh = vi.fn().mockResolvedValue(undefined);
    const processNow = vi.fn().mockResolvedValue(undefined);
    const retryMutation = vi.fn().mockResolvedValue(undefined);
    const deleteMutation = vi.fn().mockResolvedValue(undefined);
    const lastSuccessfulReplayAt = 1_700_000_123_456;

    mockUseOnlineStatus.mockReturnValue(false);
    mockUseOfflineQueue.mockReturnValue({
      queue,
      count: queue.length,
      pendingCount: 4,
      syncingCount: 1,
      failedCount: 1,
      lastSuccessfulReplayAt,
      isLoading: false,
      refresh,
      processNow,
      retryMutation,
      deleteMutation,
      clearSynced: vi.fn(),
    });

    render(<OfflineTab />);

    expect(screen.getByText("You are offline")).toBeInTheDocument();
    expect(screen.getByText("Needs attention")).toBeInTheDocument();
    expect(screen.getByText("Local Offline Queue")).toBeInTheDocument();
    expect(screen.getByText(new Date(lastSuccessfulReplayAt).toLocaleString())).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getAllByText("1")).toHaveLength(2);

    for (let index = 1; index <= 5; index += 1) {
      expect(screen.getByText(`mutation-${index}`)).toBeInTheDocument();
    }
    expect(screen.queryByText("mutation-6")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show all (6 items)" })).toBeInTheDocument();
    expect(screen.getAllByText("Pending")).toHaveLength(4);
    expect(screen.getAllByText("Syncing")).toHaveLength(2);
    expect(screen.getAllByText("Failed")).toHaveLength(2);
    expect(screen.getByText("Unsupported offline mutation type: mutation-3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Refresh Queue" }));

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(mockToastInfo).toHaveBeenCalledWith("Local offline queue refreshed", {
      testId: TEST_IDS.TOAST.INFO,
    });

    // Process Queue is hidden while offline to prevent exhausting retries
    expect(screen.queryByRole("button", { name: "Process Queue" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(retryMutation).toHaveBeenCalledWith(3);

    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(deleteMutation).toHaveBeenCalledWith(3);
  });
});
