import { HOUR } from "@convex/lib/timeUtils";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { Mock } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@/test/custom-render";
import { NotificationCenter } from "./NotificationCenter";

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  usePaginatedQuery: vi.fn(),
}));

// Mock accessibility utilities
vi.mock("@/lib/accessibility", () => ({
  handleKeyboardClick: vi.fn((callback) => callback),
}));

describe("NotificationCenter", () => {
  const mockMarkAsRead = Object.assign(vi.fn(), {
    withOptimisticUpdate: vi.fn().mockReturnThis(),
  }) as Mock & ReactMutation<FunctionReference<"mutation">>;
  const mockMarkAllAsRead = Object.assign(vi.fn(), {
    withOptimisticUpdate: vi.fn().mockReturnThis(),
  }) as Mock & ReactMutation<FunctionReference<"mutation">>;
  const mockRemove = Object.assign(vi.fn(), {
    withOptimisticUpdate: vi.fn().mockReturnThis(),
  }) as Mock & ReactMutation<FunctionReference<"mutation">>;
  let _queryCallCount = 0;
  let mutationCallCount = 0;

  beforeEach(async () => {
    _queryCallCount = 0;
    mutationCallCount = 0;
    mockMarkAsRead.mockReset();
    mockMarkAllAsRead.mockReset();
    mockRemove.mockReset();

    // Set up mutation mocks to persist across re-renders
    vi.mocked(useMutation).mockImplementation(() => {
      mutationCallCount++;
      if (mutationCallCount % 3 === 1) return mockMarkAsRead; // 1st, 4th, 7th calls
      if (mutationCallCount % 3 === 2) return mockMarkAllAsRead; // 2nd, 5th, 8th calls
      return mockRemove; // 3rd, 6th, 9th calls
    });

    // Default mock for useQuery
    vi.mocked(useQuery).mockReturnValue(undefined);
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
    vi.mocked(useQuery).mockReturnValue(undefined);

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
    vi.mocked(useQuery).mockReturnValue(5); // Unread count

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
    vi.mocked(useQuery).mockReturnValue(0); // Unread count

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
    vi.mocked(useQuery).mockReturnValue(150); // Unread count

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
    vi.mocked(useQuery).mockReturnValue(0); // Unread count

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
    vi.mocked(useQuery).mockReturnValue(0); // Unread count

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
        _creationTime: Date.now() - 3600000,
      },
    ];

    vi.mocked(usePaginatedQuery).mockReturnValue({
      results: mockNotifications,
      status: "Exhausted",
      isLoading: false,
      loadMore: vi.fn(),
    });
    vi.mocked(useQuery).mockReturnValue(1); // Unread count

    render(<NotificationCenter />);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(screen.getByText("Issue assigned")).toBeInTheDocument();
    expect(screen.getByText("New comment")).toBeInTheDocument();
    expect(screen.getByText("You were assigned to TEST-123")).toBeInTheDocument();
    expect(screen.getByText("Someone commented on your issue")).toBeInTheDocument();
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
    vi.mocked(useQuery).mockReturnValue(1); // Unread count

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
    vi.mocked(useQuery).mockReturnValue(1); // Unread count
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
    vi.mocked(useQuery).mockReturnValue(1); // Unread count
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
    vi.mocked(useQuery).mockReturnValue(0); // Unread count
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
        _creationTime: now - 5 * 60 * 1000, // 5 minutes
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
    vi.mocked(useQuery).mockReturnValue(3); // Unread count

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
    vi.mocked(useQuery).mockReturnValue(2); // Unread count

    const { container } = render(<NotificationCenter />);

    const button = screen.getByRole("button");
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText("Assigned")).toBeInTheDocument();
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
    vi.mocked(useQuery).mockReturnValue(0); // Unread count

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
});
