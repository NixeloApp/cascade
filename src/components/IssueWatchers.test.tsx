import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { useMutation, useQuery } from "convex/react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen } from "@/test/custom-render";
import { IssueWatchers } from "./IssueWatchers";

// Mock convex/react
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

// Mock toast notifications
vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

const mockWatch = vi.fn();
const mockUnwatch = vi.fn();

const createMockWatcher = (
  overrides: Partial<{ _id: string; userName: string; userEmail?: string }> = {},
) => ({
  _id: `watcher-${Math.random().toString(36).slice(2)}`,
  userName: "Test User",
  userEmail: "test@example.com",
  ...overrides,
});

describe("IssueWatchers", () => {
  const mockIssueId = "issue-123" as Id<"issues">;

  beforeEach(() => {
    vi.clearAllMocks();
    (useMutation as Mock).mockImplementation((api) => {
      if (api === undefined) return mockWatch;
      // Return appropriate mock based on which mutation is requested
      return mockWatch;
    });
    // Default: set up mutations
    (useMutation as Mock).mockReturnValueOnce(mockWatch).mockReturnValueOnce(mockUnwatch);
    mockWatch.mockResolvedValue(undefined);
    mockUnwatch.mockResolvedValue(undefined);
  });

  describe("watch button", () => {
    it("should render Watch button when not watching", () => {
      (useQuery as Mock)
        .mockReturnValueOnce([]) // watchers
        .mockReturnValueOnce(false); // isWatching

      render(<IssueWatchers issueId={mockIssueId} />);

      expect(screen.getByRole("button", { name: /watch/i })).toBeInTheDocument();
      expect(screen.queryByText("Watching")).not.toBeInTheDocument();
    });

    it("should render Watching button when already watching", () => {
      (useQuery as Mock)
        .mockReturnValueOnce([]) // watchers
        .mockReturnValueOnce(true); // isWatching

      render(<IssueWatchers issueId={mockIssueId} />);

      expect(screen.getByRole("button", { name: /watching/i })).toBeInTheDocument();
    });

    it("should call watch mutation when clicking Watch", async () => {
      const user = userEvent.setup();
      (useQuery as Mock)
        .mockReturnValueOnce([]) // watchers
        .mockReturnValueOnce(false); // isWatching

      render(<IssueWatchers issueId={mockIssueId} />);

      await user.click(screen.getByRole("button", { name: /watch/i }));

      expect(mockWatch).toHaveBeenCalledWith({ issueId: mockIssueId });
      expect(showSuccess).toHaveBeenCalledWith("Now watching this issue");
    });

    it("should call unwatch mutation when clicking Watching", async () => {
      const user = userEvent.setup();
      (useQuery as Mock)
        .mockReturnValueOnce([]) // watchers
        .mockReturnValueOnce(true); // isWatching

      render(<IssueWatchers issueId={mockIssueId} />);

      await user.click(screen.getByRole("button", { name: /watching/i }));

      expect(mockUnwatch).toHaveBeenCalledWith({ issueId: mockIssueId });
      expect(showSuccess).toHaveBeenCalledWith("Stopped watching this issue");
    });

    it("should show error toast when watch mutation fails", async () => {
      const user = userEvent.setup();
      const error = new Error("Network error");
      mockWatch.mockRejectedValue(error);

      (useQuery as Mock)
        .mockReturnValueOnce([]) // watchers
        .mockReturnValueOnce(false); // isWatching

      render(<IssueWatchers issueId={mockIssueId} />);

      await user.click(screen.getByRole("button", { name: /watch/i }));

      expect(showError).toHaveBeenCalledWith(error, "Failed to update watch status");
    });

    it("should show error toast when unwatch mutation fails", async () => {
      const user = userEvent.setup();
      const error = new Error("Network error");
      mockUnwatch.mockRejectedValue(error);

      (useQuery as Mock)
        .mockReturnValueOnce([]) // watchers
        .mockReturnValueOnce(true); // isWatching

      render(<IssueWatchers issueId={mockIssueId} />);

      await user.click(screen.getByRole("button", { name: /watching/i }));

      expect(showError).toHaveBeenCalledWith(error, "Failed to update watch status");
    });
  });

  describe("watchers list", () => {
    it("should render watchers with names", () => {
      const watchers = [
        createMockWatcher({ userName: "Alice Johnson" }),
        createMockWatcher({ userName: "Bob Smith" }),
      ];

      (useQuery as Mock)
        .mockReturnValueOnce(watchers) // watchers
        .mockReturnValueOnce(false); // isWatching

      render(<IssueWatchers issueId={mockIssueId} />);

      expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
      expect(screen.getByText("Bob Smith")).toBeInTheDocument();
    });

    it("should show watcher count in header", () => {
      const watchers = [
        createMockWatcher({ userName: "User 1" }),
        createMockWatcher({ userName: "User 2" }),
        createMockWatcher({ userName: "User 3" }),
      ];

      (useQuery as Mock)
        .mockReturnValueOnce(watchers) // watchers
        .mockReturnValueOnce(false); // isWatching

      render(<IssueWatchers issueId={mockIssueId} />);

      expect(screen.getByText("Watchers (3)")).toBeInTheDocument();
    });

    it("should render watcher emails when provided", () => {
      const watchers = [
        createMockWatcher({ userName: "Test User", userEmail: "test@example.com" }),
      ];

      (useQuery as Mock)
        .mockReturnValueOnce(watchers) // watchers
        .mockReturnValueOnce(false); // isWatching

      render(<IssueWatchers issueId={mockIssueId} />);

      expect(screen.getByText("test@example.com")).toBeInTheDocument();
    });

    it("should not render email when not provided", () => {
      const watchers = [createMockWatcher({ userName: "Test User", userEmail: undefined })];

      (useQuery as Mock)
        .mockReturnValueOnce(watchers) // watchers
        .mockReturnValueOnce(false); // isWatching

      render(<IssueWatchers issueId={mockIssueId} />);

      expect(screen.getByText("Test User")).toBeInTheDocument();
      expect(screen.queryByText("@")).not.toBeInTheDocument();
    });

    it("should render avatar containers for each watcher", () => {
      const watchers = [
        createMockWatcher({ userName: "Alice Johnson" }),
        createMockWatcher({ userName: "Bob Smith" }),
      ];

      (useQuery as Mock)
        .mockReturnValueOnce(watchers) // watchers
        .mockReturnValueOnce(false); // isWatching

      const { container } = render(<IssueWatchers issueId={mockIssueId} />);

      // Avatar uses rounded-full class for avatar containers
      const avatarContainers = container.querySelectorAll(".rounded-full");
      expect(avatarContainers.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("empty state", () => {
    it("should show empty state message when no watchers", () => {
      (useQuery as Mock)
        .mockReturnValueOnce([]) // watchers
        .mockReturnValueOnce(false); // isWatching

      render(<IssueWatchers issueId={mockIssueId} />);

      expect(screen.getByText(/no watchers yet/i)).toBeInTheDocument();
      expect(screen.getByText(/be the first to watch/i)).toBeInTheDocument();
    });

    it("should not show empty state when there are watchers", () => {
      const watchers = [createMockWatcher({ userName: "Test User" })];

      (useQuery as Mock)
        .mockReturnValueOnce(watchers) // watchers
        .mockReturnValueOnce(false); // isWatching

      render(<IssueWatchers issueId={mockIssueId} />);

      expect(screen.queryByText(/no watchers yet/i)).not.toBeInTheDocument();
    });

    it("should not show watchers header when list is empty", () => {
      (useQuery as Mock)
        .mockReturnValueOnce([]) // watchers
        .mockReturnValueOnce(false); // isWatching

      render(<IssueWatchers issueId={mockIssueId} />);

      expect(screen.queryByText(/watchers \(/i)).not.toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("should handle undefined watchers (loading)", () => {
      (useQuery as Mock)
        .mockReturnValueOnce(undefined) // watchers loading
        .mockReturnValueOnce(false); // isWatching

      render(<IssueWatchers issueId={mockIssueId} />);

      // Should render without crashing
      expect(screen.getByRole("button", { name: /watch/i })).toBeInTheDocument();
      // No watchers list shown
      expect(screen.queryByText(/watchers \(/i)).not.toBeInTheDocument();
      // No empty state shown either (since watchers is undefined, not empty array)
      expect(screen.queryByText(/no watchers yet/i)).not.toBeInTheDocument();
    });

    it("should handle undefined isWatching (loading)", () => {
      (useQuery as Mock)
        .mockReturnValueOnce([]) // watchers
        .mockReturnValueOnce(undefined); // isWatching loading

      render(<IssueWatchers issueId={mockIssueId} />);

      // Button should show Watch state when undefined (falsy)
      expect(screen.getByRole("button", { name: /watch/i })).toBeInTheDocument();
    });
  });
});
