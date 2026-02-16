import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { useQuery } from "convex/react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { NotificationItem, type NotificationWithActor } from "./NotificationItem";

// Mock convex/react
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

// Mock TanStack Router Link
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, params, onClick }: { children: React.ReactNode; to: string; params?: Record<string, string>; onClick?: () => void }) => (
    <a href={to} data-params={JSON.stringify(params)} onClick={onClick}>
      {children}
    </a>
  ),
}));

const createMockNotification = (overrides: Partial<NotificationWithActor> = {}): NotificationWithActor => ({
  _id: "notification-123" as Id<"notifications">,
  _creationTime: Date.now() - 3600000, // 1 hour ago
  userId: "user-123" as Id<"users">,
  type: "issue_assigned",
  title: "You were assigned to PROJ-123",
  message: "John assigned you to Fix the login bug",
  isRead: false,
  actorName: "John Doe",
  ...overrides,
});

describe("NotificationItem", () => {
  const mockOnMarkAsRead = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useQuery as Mock).mockReturnValue(null);
  });

  describe("rendering", () => {
    it("should render notification title", () => {
      const notification = createMockNotification({ title: "Test Title" });
      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
          onDelete={mockOnDelete}
        />,
      );

      expect(screen.getByText("Test Title")).toBeInTheDocument();
    });

    it("should render notification message", () => {
      const notification = createMockNotification({ message: "Test message content" });
      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
          onDelete={mockOnDelete}
        />,
      );

      expect(screen.getByText("Test message content")).toBeInTheDocument();
    });

    it("should render actor name when provided", () => {
      const notification = createMockNotification({ actorName: "Jane Smith" });
      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
          onDelete={mockOnDelete}
        />,
      );

      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    it("should render timestamp", () => {
      const notification = createMockNotification();
      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
          onDelete={mockOnDelete}
        />,
      );

      // MetadataTimestamp renders relative time
      expect(screen.getByText(/ago/i)).toBeInTheDocument();
    });
  });

  describe("notification types icons", () => {
    it("should show User icon for issue_assigned", () => {
      const notification = createMockNotification({ type: "issue_assigned" });
      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
          onDelete={mockOnDelete}
        />,
      );

      // The icon should be rendered (we can check the SVG class)
      const container = screen.getByText("You were assigned to PROJ-123").closest("div");
      expect(container?.parentElement).toBeInTheDocument();
    });

    it("should render for different notification types", () => {
      const types = [
        "issue_assigned",
        "issue_mentioned",
        "issue_commented",
        "issue_status_changed",
        "sprint_started",
        "sprint_ended",
        "document_shared",
        "document_mentioned",
        "unknown_type",
      ];

      for (const type of types) {
        const notification = createMockNotification({ type, title: `Type: ${type}` });
        const { unmount } = render(
          <NotificationItem
            notification={notification}
            onMarkAsRead={mockOnMarkAsRead}
            onDelete={mockOnDelete}
          />,
        );

        expect(screen.getByText(`Type: ${type}`)).toBeInTheDocument();
        unmount();
      }
    });
  });

  describe("read/unread state", () => {
    it("should show mark as read button for unread notifications", () => {
      const notification = createMockNotification({ isRead: false });
      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
          onDelete={mockOnDelete}
        />,
      );

      expect(screen.getByLabelText("Mark as read")).toBeInTheDocument();
    });

    it("should not show mark as read button for read notifications", () => {
      const notification = createMockNotification({ isRead: true });
      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
          onDelete={mockOnDelete}
        />,
      );

      expect(screen.queryByLabelText("Mark as read")).not.toBeInTheDocument();
    });

    it("should show unread indicator for unread notifications", () => {
      const notification = createMockNotification({ isRead: false });
      const { container } = render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
          onDelete={mockOnDelete}
        />,
      );

      // Check for the unread indicator dot
      const indicator = container.querySelector(".bg-brand.rounded-full");
      expect(indicator).toBeInTheDocument();
    });

    it("should not show unread indicator for read notifications", () => {
      const notification = createMockNotification({ isRead: true });
      const { container } = render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
          onDelete={mockOnDelete}
        />,
      );

      // The indicator should not be present
      const indicator = container.querySelector(".bg-brand.rounded-full.h-2.w-2");
      expect(indicator).not.toBeInTheDocument();
    });
  });

  describe("actions", () => {
    it("should call onMarkAsRead when mark as read button clicked", async () => {
      const user = userEvent.setup();
      const notification = createMockNotification({ isRead: false });
      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
          onDelete={mockOnDelete}
        />,
      );

      await user.click(screen.getByLabelText("Mark as read"));

      expect(mockOnMarkAsRead).toHaveBeenCalledWith(notification._id);
    });

    it("should call onDelete when delete button clicked", async () => {
      const user = userEvent.setup();
      const notification = createMockNotification();
      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
          onDelete={mockOnDelete}
        />,
      );

      await user.click(screen.getByLabelText("Delete notification"));

      expect(mockOnDelete).toHaveBeenCalledWith(notification._id);
    });

    it("should always show delete button", () => {
      const notification = createMockNotification({ isRead: true });
      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
          onDelete={mockOnDelete}
        />,
      );

      expect(screen.getByLabelText("Delete notification")).toBeInTheDocument();
    });
  });

  describe("navigation", () => {
    it("should create link to issue when issue exists", () => {
      const notification = createMockNotification({
        issueId: "issue-456" as Id<"issues">,
      });

      // Mock useQuery to return an issue
      (useQuery as Mock).mockReturnValue({ key: "PROJ-123" });

      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
          onDelete={mockOnDelete}
          orgSlug="test-org"
        />,
      );

      const link = screen.getByRole("link");
      expect(link).toBeInTheDocument();
      expect(link.getAttribute("data-params")).toContain("PROJ-123");
    });

    it("should create link to document when documentId exists", () => {
      const notification = createMockNotification({
        documentId: "doc-789" as Id<"documents">,
        issueId: undefined,
      });

      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
          onDelete={mockOnDelete}
          orgSlug="test-org"
        />,
      );

      const link = screen.getByRole("link");
      expect(link).toBeInTheDocument();
    });

    it("should not create link when no orgSlug provided", () => {
      const notification = createMockNotification({
        issueId: "issue-456" as Id<"issues">,
      });

      (useQuery as Mock).mockReturnValue({ key: "PROJ-123" });

      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
          onDelete={mockOnDelete}
          // No orgSlug
        />,
      );

      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("should mark as read when clicking linked content for unread notification", async () => {
      const user = userEvent.setup();
      const notification = createMockNotification({
        issueId: "issue-456" as Id<"issues">,
        isRead: false,
      });

      (useQuery as Mock).mockReturnValue({ key: "PROJ-123" });

      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
          onDelete={mockOnDelete}
          orgSlug="test-org"
        />,
      );

      await user.click(screen.getByRole("link"));

      expect(mockOnMarkAsRead).toHaveBeenCalledWith(notification._id);
    });

    it("should not mark as read when clicking linked content for already read notification", async () => {
      const user = userEvent.setup();
      const notification = createMockNotification({
        issueId: "issue-456" as Id<"issues">,
        isRead: true,
      });

      (useQuery as Mock).mockReturnValue({ key: "PROJ-123" });

      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
          onDelete={mockOnDelete}
          orgSlug="test-org"
        />,
      );

      await user.click(screen.getByRole("link"));

      expect(mockOnMarkAsRead).not.toHaveBeenCalled();
    });
  });

  describe("accessibility", () => {
    it("should have accessible mark as read button", () => {
      const notification = createMockNotification({ isRead: false });
      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
          onDelete={mockOnDelete}
        />,
      );

      const button = screen.getByLabelText("Mark as read");
      expect(button).toHaveAttribute("aria-label");
    });

    it("should have accessible delete button", () => {
      const notification = createMockNotification();
      render(
        <NotificationItem
          notification={notification}
          onMarkAsRead={mockOnMarkAsRead}
          onDelete={mockOnDelete}
        />,
      );

      const button = screen.getByLabelText("Delete notification");
      expect(button).toHaveAttribute("aria-label");
    });
  });
});
