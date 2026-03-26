import type { Id } from "@convex/_generated/dataModel";
import { HOUR, MINUTE } from "@convex/lib/timeUtils";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import { useConvexAuth, useMutation, usePaginatedQuery, useQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { Mock } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useQueuedOfflineNotificationReadIds } from "@/hooks/useOfflineOptimisticState";
import { TEST_IDS } from "@/lib/test-ids";
import { render, screen, waitFor, within } from "@/test/custom-render";
import { NotificationCenter } from "./NotificationCenter";

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useConvexAuth: vi.fn(() => ({ isAuthenticated: true, isLoading: false })),
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  usePaginatedQuery: vi.fn(),
}));

// Mock accessibility utilities
vi.mock("@/lib/accessibility", () => ({
  handleKeyboardClick: vi.fn((callback) => callback),
}));

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock("@/hooks/useOfflineOptimisticState", () => ({
  useQueuedOfflineNotificationReadIds: vi.fn(),
}));

describe("NotificationCenter", () => {
  const mockUseCurrentUser = vi.mocked(useCurrentUser);
  const mockUseQueuedOfflineNotificationReadIds = vi.mocked(useQueuedOfflineNotificationReadIds);
  const mockMarkAsRead = Object.assign(vi.fn(), {
    withOptimisticUpdate: vi.fn().mockReturnThis(),
  }) as Mock & ReactMutation<FunctionReference<"mutation">>;
  const mockMarkAllAsRead = Object.assign(vi.fn(), {
    withOptimisticUpdate: vi.fn().mockReturnThis(),
  }) as Mock & ReactMutation<FunctionReference<"mutation">>;
  const mockArchive = Object.assign(vi.fn(), {
    withOptimisticUpdate: vi.fn().mockReturnThis(),
  }) as Mock & ReactMutation<FunctionReference<"mutation">>;
  const mockSnooze = Object.assign(vi.fn(), {
    withOptimisticUpdate: vi.fn().mockReturnThis(),
  }) as Mock & ReactMutation<FunctionReference<"mutation">>;
  const mockRemove = Object.assign(vi.fn(), {
    withOptimisticUpdate: vi.fn().mockReturnThis(),
  }) as Mock & ReactMutation<FunctionReference<"mutation">>;
  let _queryCallCount = 0;
  let mutationCallCount = 0;

  function mockUnreadQueries(args: {
    unreadCount: number | undefined;
    unreadIds?: Id<"notifications">[];
  }) {
    let authenticatedQueryCallCount = 0;
    vi.mocked(useQuery).mockImplementation(() => {
      authenticatedQueryCallCount += 1;
      if (authenticatedQueryCallCount % 2 === 1) {
        return args.unreadCount;
      }

      return args.unreadIds ?? [];
    });
  }

  beforeEach(async () => {
    _queryCallCount = 0;
    mutationCallCount = 0;
    mockMarkAsRead.mockReset();
    mockMarkAllAsRead.mockReset();
    mockArchive.mockReset();
    mockSnooze.mockReset();
    mockRemove.mockReset();
    mockUseCurrentUser.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: true,
    });
    mockUseQueuedOfflineNotificationReadIds.mockReturnValue(new Set());

    // Set up mutation mocks to persist across re-renders
    // Order matches component: markAsRead, markAllAsRead, archiveNotification, snoozeNotification, removeNotification
    vi.mocked(useMutation).mockImplementation(() => {
      mutationCallCount++;
      const idx = ((mutationCallCount - 1) % 5) + 1;
      if (idx === 1) return mockMarkAsRead;
      if (idx === 2) return mockMarkAllAsRead;
      if (idx === 3) return mockArchive;
      if (idx === 4) return mockSnooze;
      return mockRemove; // 5th
    });

    // Default mock for useQuery
    vi.mocked(useConvexAuth).mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUnreadQueries({ unreadCount: 0, unreadIds: [] });
    // Default mock for usePaginatedQuery
    vi.mocked(usePaginatedQuery).mockReturnValue({
      results: [],
      status: "Exhausted",
      isLoading: false,
      loadMore: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render notification bell button", () => {
    mockUnreadQueries({ unreadCount: undefined, unreadIds: [] });

    render(<NotificationCenter />);

    // Check for aria-label since we added one
    expect(screen.getByRole("button", { name: /notifications/i })).toBeInTheDocument();
  });

  it("should show unread count badge when there are unread notifications", () => {
    // Component calls usePaginatedQuery for list, useQuery for unread count
    vi.mocked(usePaginatedQuery).mockReturnValue({
      results: [],
      status: "Exhausted",
      isLoading: false,
      loadMore: vi.fn(),
    });
    mockUnreadQueries({ unreadCount: 5, unreadIds: [] });

    render(<NotificationCenter />);

    expect(screen.getByText("5")).toBeInTheDocument();
    // Also check dynamic aria-label
    expect(screen.getByRole("button", { name: "Notifications, 5 unread" })).toBeInTheDocument();
  });

  it("should not show badge when unread count is 0", () => {
    vi.mocked(usePaginatedQuery).mockReturnValue({
      results: [],
      status: "Exhausted",
      isLoading: false,
      loadMore: vi.fn(),
    });
    mockUnreadQueries({ unreadCount: 0, unreadIds: [] });

    render(<NotificationCenter />);

    // Badge should not be visible at all when count is 0
    const badge = document.querySelector(".bg-red-500");
    expect(badge).not.toBeInTheDocument();
    // Check default aria-label
    expect(screen.getByRole("button", { name: "Notifications" })).toBeInTheDocument();
  });

  it("should show 99+ when unread count exceeds 99", () => {
    vi.mocked(usePaginatedQuery).mockReturnValue({
      results: [],
      status: "Exhausted",
      isLoading: false,
      loadMore: vi.fn(),
    });
    mockUnreadQueries({ unreadCount: 150, unreadIds: [] });

    render(<NotificationCenter />);

    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("should open dropdown when bell is clicked", async () => {
    const user = userEvent.setup();
    vi.mocked(usePaginatedQuery).mockReturnValue({
      results: [],
      status: "Exhausted",
      isLoading: false,
      loadMore: vi.fn(),
    });
    mockUnreadQueries({ unreadCount: 0, unreadIds: [] });

    render(<NotificationCenter />);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(screen.getByRole("heading", { name: "Notifications" })).toBeInTheDocument();
  });

  it("should show empty state when no notifications", async () => {
    const user = userEvent.setup();
    vi.mocked(usePaginatedQuery).mockReturnValue({
      results: [],
      status: "Exhausted",
      isLoading: false,
      loadMore: vi.fn(),
    });
    mockUnreadQueries({ unreadCount: 0, unreadIds: [] });

    render(<NotificationCenter />);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(screen.getByText(/No notifications/i)).toBeInTheDocument();
  });

  it("should display notification list", async () => {
    const user = userEvent.setup();
    const mockNotifications = [
      {
        _id: "1",
        type: "issue_assigned",
        title: "Issue assigned",
        message: "You were assigned to TEST-123",
        isRead: false,
        _creationTime: Date.now(),
      },
      {
        _id: "2",
        type: "issue_commented",
        title: "New comment",
        message: "Someone commented on your issue",
        isRead: true,
        _creationTime: Date.now() - HOUR,
      },
    ];

    vi.mocked(usePaginatedQuery).mockReturnValue({
      results: mockNotifications,
      status: "Exhausted",
      isLoading: false,
      loadMore: vi.fn(),
    });
    mockUnreadQueries({
      unreadCount: 1,
      unreadIds: [mockNotifications[0]._id as Id<"notifications">],
    });

    render(<NotificationCenter />);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(screen.getByText("Issue assigned")).toBeInTheDocument();
    expect(screen.getByText("New comment")).toBeInTheDocument();
    expect(screen.getByText("You were assigned to TEST-123")).toBeInTheDocument();
    expect(screen.getByText("Someone commented on your issue")).toBeInTheDocument();
  });

  it("applies queued offline reads to the unread badge immediately", () => {
    vi.mocked(usePaginatedQuery).mockReturnValue({
      results: [
        {
          _id: "1",
          type: "issue_assigned",
          title: "Issue assigned",
          message: "You were assigned to TEST-123",
          isRead: false,
          _creationTime: Date.now(),
        },
      ],
      status: "Exhausted",
      isLoading: false,
      loadMore: vi.fn(),
    });
    mockUnreadQueries({
      unreadCount: 2,
      unreadIds: ["1" as Id<"notifications">, "2" as Id<"notifications">],
    });
    mockUseQueuedOfflineNotificationReadIds.mockReturnValue(new Set(["1" as Id<"notifications">]));

    render(<NotificationCenter />);

    expect(screen.getByRole("button", { name: "Notifications, 1 unread" })).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("does not subtract queued reads that are outside the active inbox unread set", () => {
    vi.mocked(usePaginatedQuery).mockReturnValue({
      results: [
        {
          _id: "1",
          type: "issue_assigned",
          title: "Issue assigned",
          message: "You were assigned to TEST-123",
          isRead: false,
          _creationTime: Date.now(),
        },
      ],
      status: "Exhausted",
      isLoading: false,
      loadMore: vi.fn(),
    });
    mockUnreadQueries({ unreadCount: 1, unreadIds: ["1" as Id<"notifications">] });
    mockUseQueuedOfflineNotificationReadIds.mockReturnValue(
      new Set(["archived-1" as Id<"notifications">]),
    );

    render(<NotificationCenter />);

    expect(screen.getByRole("button", { name: "Notifications, 1 unread" })).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("should highlight unread notifications", async () => {
    const user = userEvent.setup();
    const mockNotifications = [
      {
        _id: "1",
        type: "issue_assigned",
        title: "Unread",
        message: "Test",
        isRead: false,
        _creationTime: Date.now(),
      },
    ];

    vi.mocked(usePaginatedQuery).mockReturnValue({
      results: mockNotifications,
      status: "Exhausted",
      isLoading: false,
      loadMore: vi.fn(),
    });
    mockUnreadQueries({ unreadCount: 1, unreadIds: ["1" as Id<"notifications">] });

    render(<NotificationCenter />);

    const button = screen.getByRole("button");
    await user.click(button);

    // Find the notification container by traversing up from the title
    const titleElement = screen.getByText("Unread");
    // The notification div is a few levels up - it has the bg-brand-subtle/10 class for unread notifications
    // Note: Tailwind classes might be compiled, but let's check for the partial class match or structure
    // Since we can't reliably check compiled tailwind classes by exact string if they are complex,
    // we can check if it has the background color class we added.
    // In our implementation: !notification.isRead && "bg-brand-subtle/10"
    // However, escaping special characters in class selection is tricky.
    // Let's assume the render output contains the class string.

    // Alternative: check if the container has the class.
    // We can't use closest(".bg-brand-subtle/10") easily because of the slash.
    // Let's check parent elements.

    let parent = titleElement.parentElement;
    while (parent && !parent.className.includes("bg-brand-subtle/10")) {
      parent = parent.parentElement;
    }

    expect(parent).toBeInTheDocument();
  });

  it("should call markAsRead when mark as read button is clicked", async () => {
    const user = userEvent.setup();
    const mockNotifications = [
      {
        _id: "notif-1",
        type: "issue_assigned",
        title: "Test",
        message: "Message",
        isRead: false,
        _creationTime: Date.now(),
      },
    ];

    vi.mocked(usePaginatedQuery).mockReturnValue({
      results: mockNotifications,
      status: "Exhausted",
      isLoading: false,
      loadMore: vi.fn(),
    });
    mockUnreadQueries({ unreadCount: 1, unreadIds: ["notif-1" as Id<"notifications">] });
    mockMarkAsRead.mockResolvedValue(undefined);

    render(<NotificationCenter />);

    const bellButton = screen.getByRole("button");
    await user.click(bellButton);

    const markReadButton = screen.getByRole("button", { name: "Mark as read" });
    await user.click(markReadButton);

    await waitFor(() => {
      expect(mockMarkAsRead).toHaveBeenCalledWith({ id: "notif-1" });
    });
  });

  it("should call markAllAsRead when mark all read button is clicked", async () => {
    const user = userEvent.setup();
    const mockNotifications = [
      {
        _id: "1",
        type: "issue_assigned",
        title: "Test",
        message: "Message",
        isRead: false,
        _creationTime: Date.now(),
      },
    ];

    vi.mocked(usePaginatedQuery).mockReturnValue({
      results: mockNotifications,
      status: "Exhausted",
      isLoading: false,
      loadMore: vi.fn(),
    });
    mockUnreadQueries({ unreadCount: 1, unreadIds: ["1" as Id<"notifications">] });
    mockMarkAllAsRead.mockResolvedValue(undefined);

    render(<NotificationCenter />);

    const bellButton = screen.getByRole("button");
    await user.click(bellButton);

    const markAllButton = screen.getByText("Mark all read");
    await user.click(markAllButton);

    await waitFor(() => {
      expect(mockMarkAllAsRead).toHaveBeenCalledWith({});
    });
  });

  it("should call remove when delete button is clicked", async () => {
    const user = userEvent.setup();
    const mockNotifications = [
      {
        _id: "notif-2",
        type: "issue_assigned",
        title: "Test",
        message: "Message",
        isRead: true,
        _creationTime: Date.now(),
      },
    ];

    vi.mocked(usePaginatedQuery).mockReturnValue({
      results: mockNotifications,
      status: "Exhausted",
      isLoading: false,
      loadMore: vi.fn(),
    });
    mockUnreadQueries({ unreadCount: 0, unreadIds: [] });
    mockRemove.mockResolvedValue(undefined);

    render(<NotificationCenter />);

    const bellButton = screen.getByRole("button");
    await user.click(bellButton);

    const deleteButton = screen.getByRole("button", { name: "Delete notification" });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockRemove).toHaveBeenCalledWith({ id: "notif-2" });
    });
  });

  it("should snooze a notification from the snooze popover", async () => {
    const user = userEvent.setup();
    const FIXED_NOW = 1_700_000_000_000;
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(FIXED_NOW);
    const mockNotifications = [
      {
        _id: "notif-3",
        type: "issue_assigned",
        title: "Snooze me",
        message: "Reminder",
        isRead: false,
        _creationTime: Date.now(),
      },
    ];

    vi.mocked(usePaginatedQuery).mockReturnValue({
      results: mockNotifications,
      status: "Exhausted",
      isLoading: false,
      loadMore: vi.fn(),
    });
    mockUnreadQueries({ unreadCount: 1, unreadIds: ["notif-3" as Id<"notifications">] });
    mockSnooze.mockResolvedValue(undefined);

    render(<NotificationCenter />);

    await user.click(screen.getByRole("button", { name: /notifications/i }));
    await user.click(screen.getByRole("button", { name: "Snooze notification" }));
    await user.click(screen.getByRole("button", { name: "3 hours" }));

    await waitFor(() => {
      expect(mockSnooze).toHaveBeenCalledWith({
        id: "notif-3",
        snoozedUntil: FIXED_NOW + 3 * HOUR,
      });
    });

    nowSpy.mockRestore();
  });

  it("should format time correctly", async () => {
    const user = userEvent.setup();
    const now = Date.now();
    const mockNotifications = [
      {
        _id: "1",
        type: "issue_assigned",
        title: "Notification 1",
        message: "Test",
        isRead: false,
        _creationTime: now,
      },
      {
        _id: "2",
        type: "issue_assigned",
        title: "Notification 2",
        message: "Test",
        isRead: false,
        _creationTime: now - 5 * MINUTE,
      },
      {
        _id: "3",
        type: "issue_assigned",
        title: "Notification 3",
        message: "Test",
        isRead: false,
        _creationTime: now - 2 * HOUR, // 2 hours
      },
    ];

    vi.mocked(usePaginatedQuery).mockReturnValue({
      results: mockNotifications,
      status: "Exhausted",
      isLoading: false,
      loadMore: vi.fn(),
    });
    mockUnreadQueries({
      unreadCount: 3,
      unreadIds: [
        "1" as Id<"notifications">,
        "2" as Id<"notifications">,
        "3" as Id<"notifications">,
      ],
    });

    render(<NotificationCenter />);

    const button = screen.getByRole("button");
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText("Notification 1")).toBeInTheDocument();
    });

    expect(screen.getByText("just now")).toBeInTheDocument();
    expect(screen.getByText("5m ago")).toBeInTheDocument();
    expect(screen.getByText("2h ago")).toBeInTheDocument();
  });

  it("should show correct icon for notification type", async () => {
    const user = userEvent.setup();
    const mockNotifications = [
      {
        _id: "1",
        type: "issue_assigned",
        title: "Assigned",
        message: "Test",
        isRead: false,
        _creationTime: Date.now(),
      },
      {
        _id: "2",
        type: "sprint_started",
        title: "Sprint",
        message: "Test",
        isRead: false,
        _creationTime: Date.now(),
      },
    ];

    vi.mocked(usePaginatedQuery).mockReturnValue({
      results: mockNotifications,
      status: "Exhausted",
      isLoading: false,
      loadMore: vi.fn(),
    });
    mockUnreadQueries({ unreadCount: 2, unreadIds: ["1" as Id<"notifications">] });

    render(<NotificationCenter />);

    // Click the notification bell button (has aria-label "Notifications, 2 unread")
    const bellButton = screen.getByRole("button", { name: /notifications/i });
    await user.click(bellButton);

    // Wait for notification panel to appear and show the notification title "Assigned"
    // Note: There's also a filter tab called "Assigned", so we look specifically within the notifications
    await waitFor(() => {
      // The notification's title "Assigned" should appear as a label/heading in the notification item
      const panel = screen.getByTestId(TEST_IDS.HEADER.NOTIFICATION_PANEL);
      // Find the notification content, not the filter button
      expect(within(panel).getAllByText("Assigned").length).toBeGreaterThanOrEqual(1);
    });

    // Check that Lucide icons are rendered by looking for their SVG class names
    // issue_assigned -> User icon -> .lucide-user
    expect(document.querySelector(".lucide-user")).toBeInTheDocument();

    // sprint_started -> Rocket icon -> .lucide-rocket
    expect(document.querySelector(".lucide-rocket")).toBeInTheDocument();
  });

  it("should close dropdown when backdrop is clicked", async () => {
    const user = userEvent.setup();
    vi.mocked(usePaginatedQuery).mockReturnValue({
      results: [],
      status: "Exhausted",
      isLoading: false,
      loadMore: vi.fn(),
    });
    mockUnreadQueries({ unreadCount: 0, unreadIds: [] });

    render(<NotificationCenter />);

    const button = screen.getByRole("button");
    await user.click(button);

    const heading = screen.getByRole("heading", { name: "Notifications" });
    expect(heading).toBeInTheDocument();

    // Close popover by pressing Escape (Radix popovers close on Escape)
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Notifications" })).not.toBeInTheDocument();
    });
  });

  it("subtracts queued reads that target unread inbox items outside the current page", () => {
    vi.mocked(usePaginatedQuery).mockReturnValue({
      results: [
        {
          _id: "1",
          type: "issue_assigned",
          title: "Visible unread",
          message: "Visible",
          isRead: false,
          _creationTime: Date.now(),
        },
      ],
      status: "Exhausted",
      isLoading: false,
      loadMore: vi.fn(),
    });
    mockUnreadQueries({
      unreadCount: 2,
      unreadIds: ["1" as Id<"notifications">, "off-page-2" as Id<"notifications">],
    });
    mockUseQueuedOfflineNotificationReadIds.mockReturnValue(
      new Set(["off-page-2" as Id<"notifications">]),
    );

    render(<NotificationCenter />);

    expect(screen.getByRole("button", { name: "Notifications, 1 unread" })).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});
