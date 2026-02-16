import type { Doc, Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { useMutation, useQuery } from "convex/react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, within } from "@/test/custom-render";
import { InboxList } from "./InboxList";

// Mock dependencies
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

// Single mock for all mutations - we'll configure per-test as needed
const mockMutation = vi.fn();

interface InboxIssueWithDetails {
  _id: Id<"inboxIssues">;
  projectId: Id<"projects">;
  issueId: Id<"issues">;
  status: "pending" | "accepted" | "declined" | "snoozed" | "duplicate";
  snoozedUntil?: number;
  duplicateOfId?: Id<"issues">;
  declineReason?: string;
  triageNotes?: string;
  createdAt: number;
  updatedAt: number;
  issue: Partial<Doc<"issues">>;
  createdByUser: { _id: Id<"users">; name?: string; image?: string } | null;
  triagedByUser: { _id: Id<"users">; name?: string; image?: string } | null;
  duplicateOfIssue: { _id: Id<"issues">; key: string; title: string } | null;
}

const createMockInboxIssue = (
  overrides: Partial<InboxIssueWithDetails> = {},
): InboxIssueWithDetails => ({
  _id: `inbox-${Math.random().toString(36).slice(2)}` as Id<"inboxIssues">,
  projectId: "project-1" as Id<"projects">,
  issueId: "issue-1" as Id<"issues">,
  status: "pending",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  issue: {
    _id: "issue-1" as Id<"issues">,
    key: "PROJ-1",
    title: "Test Issue",
    status: "todo",
    type: "task",
    priority: "medium",
  } as Partial<Doc<"issues">>,
  createdByUser: null,
  triagedByUser: null,
  duplicateOfIssue: null,
  ...overrides,
});

describe("InboxList", () => {
  const defaultProps = {
    projectId: "project-1" as Id<"projects">,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Use a single mutation mock for all mutations
    (useMutation as Mock).mockReturnValue(mockMutation);

    // Default response - empty success
    mockMutation.mockResolvedValue({});
  });

  describe("loading state", () => {
    it("should render loading spinner when data is undefined", () => {
      (useQuery as Mock).mockReturnValue(undefined);

      render(<InboxList {...defaultProps} />);

      expect(screen.getByRole("status")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("should show empty state for open tab with no items", () => {
      let callCount = 0;
      (useQuery as Mock).mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 1) return []; // list
        return { open: 0, closed: 0 }; // counts
      });

      render(<InboxList {...defaultProps} />);

      expect(screen.getByText("No pending items")).toBeInTheDocument();
    });

    it("should show empty state for closed tab", async () => {
      const user = userEvent.setup();
      let callCount = 0;
      (useQuery as Mock).mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 1) return []; // list
        return { open: 0, closed: 0 }; // counts
      });

      render(<InboxList {...defaultProps} />);

      await user.click(screen.getByRole("tab", { name: /closed/i }));

      expect(screen.getByText("No closed items")).toBeInTheDocument();
    });
  });

  describe("issue list", () => {
    it("should render inbox issues", () => {
      const issues = [
        createMockInboxIssue({ issue: { key: "PROJ-1", title: "First Issue" } as Doc<"issues"> }),
        createMockInboxIssue({ issue: { key: "PROJ-2", title: "Second Issue" } as Doc<"issues"> }),
      ];
      let callCount = 0;
      (useQuery as Mock).mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 1) return issues;
        return { open: 2, closed: 0 };
      });

      render(<InboxList {...defaultProps} />);

      expect(screen.getByText("First Issue")).toBeInTheDocument();
      expect(screen.getByText("Second Issue")).toBeInTheDocument();
    });

    it("should show issue key", () => {
      const issues = [
        createMockInboxIssue({ issue: { key: "PROJ-123", title: "Test" } as Doc<"issues"> }),
      ];
      let callCount = 0;
      (useQuery as Mock).mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 1) return issues;
        return { open: 1, closed: 0 };
      });

      render(<InboxList {...defaultProps} />);

      expect(screen.getByText("PROJ-123")).toBeInTheDocument();
    });

    it("should show submitter name", () => {
      const issues = [
        createMockInboxIssue({
          createdByUser: { _id: "user-1" as Id<"users">, name: "Alice" },
        }),
      ];
      let callCount = 0;
      (useQuery as Mock).mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 1) return issues;
        return { open: 1, closed: 0 };
      });

      render(<InboxList {...defaultProps} />);

      expect(screen.getByText(/by Alice/)).toBeInTheDocument();
    });
  });

  describe("tabs", () => {
    it("should show open count badge", () => {
      let callCount = 0;
      (useQuery as Mock).mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 1) return [];
        return { open: 5, closed: 2 };
      });

      render(<InboxList {...defaultProps} />);

      const openTab = screen.getByRole("tab", { name: /open/i });
      expect(within(openTab).getByText("5")).toBeInTheDocument();
    });

    it("should show closed count badge", () => {
      let callCount = 0;
      (useQuery as Mock).mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 1) return [];
        return { open: 3, closed: 7 };
      });

      render(<InboxList {...defaultProps} />);

      const closedTab = screen.getByRole("tab", { name: /closed/i });
      expect(within(closedTab).getByText("7")).toBeInTheDocument();
    });

    it("should show review count in header", () => {
      let callCount = 0;
      (useQuery as Mock).mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 1) return [];
        return { open: 4, closed: 0 };
      });

      render(<InboxList {...defaultProps} />);

      expect(screen.getByText("4 to review")).toBeInTheDocument();
    });
  });

  describe("quick actions", () => {
    it("should show Accept and Decline buttons for pending items", () => {
      const issues = [createMockInboxIssue({ status: "pending" })];
      let callCount = 0;
      (useQuery as Mock).mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 1) return issues;
        return { open: 1, closed: 0 };
      });

      render(<InboxList {...defaultProps} />);

      expect(screen.getByRole("button", { name: /accept/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /decline/i })).toBeInTheDocument();
    });

    it("should call accept mutation when Accept clicked", async () => {
      const user = userEvent.setup();
      const issues = [
        createMockInboxIssue({ _id: "inbox-1" as Id<"inboxIssues">, status: "pending" }),
      ];
      let callCount = 0;
      (useQuery as Mock).mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 1) return issues;
        return { open: 1, closed: 0 };
      });

      render(<InboxList {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: /accept/i }));

      expect(mockMutation).toHaveBeenCalledWith({
        id: "inbox-1",
        projectId: "project-1",
      });
      expect(showSuccess).toHaveBeenCalledWith("Issue accepted");
    });

    it("should call decline mutation when Decline clicked", async () => {
      const user = userEvent.setup();
      const issues = [
        createMockInboxIssue({ _id: "inbox-1" as Id<"inboxIssues">, status: "pending" }),
      ];
      let callCount = 0;
      (useQuery as Mock).mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 1) return issues;
        return { open: 1, closed: 0 };
      });

      render(<InboxList {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: /decline/i }));

      expect(mockMutation).toHaveBeenCalledWith({
        id: "inbox-1",
        projectId: "project-1",
      });
      expect(showSuccess).toHaveBeenCalledWith("Issue declined");
    });
  });

  describe("selection", () => {
    it("should show checkbox for pending items", () => {
      const issues = [createMockInboxIssue({ status: "pending" })];
      let callCount = 0;
      (useQuery as Mock).mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 1) return issues;
        return { open: 1, closed: 0 };
      });

      render(<InboxList {...defaultProps} />);

      expect(screen.getByRole("checkbox", { name: /select test issue/i })).toBeInTheDocument();
    });

    it("should show selection count when items selected", async () => {
      const user = userEvent.setup();
      const issues = [
        createMockInboxIssue({
          status: "pending",
          issue: { key: "P-1", title: "Issue 1" } as Doc<"issues">,
        }),
        createMockInboxIssue({
          status: "pending",
          issue: { key: "P-2", title: "Issue 2" } as Doc<"issues">,
        }),
      ];
      let callCount = 0;
      (useQuery as Mock).mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 1) return issues;
        return { open: 2, closed: 0 };
      });

      render(<InboxList {...defaultProps} />);

      const checkbox = screen.getByRole("checkbox", { name: /select issue 1/i });
      await user.click(checkbox);

      expect(screen.getByText("1 selected")).toBeInTheDocument();
    });

    it("should show bulk action buttons when items selected", async () => {
      const user = userEvent.setup();
      const issues = [createMockInboxIssue({ status: "pending" })];
      let callCount = 0;
      (useQuery as Mock).mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 1) return issues;
        return { open: 1, closed: 0 };
      });

      render(<InboxList {...defaultProps} />);

      const checkbox = screen.getByRole("checkbox", { name: /select test issue/i });
      await user.click(checkbox);

      expect(screen.getByRole("button", { name: /accept all/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /snooze 1 week/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /decline all/i })).toBeInTheDocument();
    });
  });

  describe("bulk actions", () => {
    it("should call bulkAccept when Accept All clicked", async () => {
      const user = userEvent.setup();
      mockMutation.mockResolvedValue({ accepted: 1 });
      const issues = [
        createMockInboxIssue({ _id: "inbox-1" as Id<"inboxIssues">, status: "pending" }),
      ];
      let callCount = 0;
      (useQuery as Mock).mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 1) return issues;
        return { open: 1, closed: 0 };
      });

      render(<InboxList {...defaultProps} />);

      // Select item
      const checkbox = screen.getByRole("checkbox", { name: /select test issue/i });
      await user.click(checkbox);

      // Click Accept All
      await user.click(screen.getByRole("button", { name: /accept all/i }));

      expect(mockMutation).toHaveBeenCalledWith({
        ids: ["inbox-1"],
        projectId: "project-1",
      });
      expect(showSuccess).toHaveBeenCalledWith("Accepted 1 issue(s)");
    });

    it("should clear selection after bulk action", async () => {
      const user = userEvent.setup();
      const issues = [createMockInboxIssue({ status: "pending" })];
      let callCount = 0;
      (useQuery as Mock).mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 1) return issues;
        return { open: 1, closed: 0 };
      });

      render(<InboxList {...defaultProps} />);

      // Select and accept
      const checkbox = screen.getByRole("checkbox", { name: /select test issue/i });
      await user.click(checkbox);
      await user.click(screen.getByRole("button", { name: /accept all/i }));

      // Selection count should be gone
      expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
    });
  });

  describe("status badges", () => {
    it("should show snoozed until date", () => {
      const snoozedUntil = new Date("2026-03-01").getTime();
      const issues = [createMockInboxIssue({ status: "snoozed", snoozedUntil })];
      let callCount = 0;
      (useQuery as Mock).mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 1) return issues;
        return { open: 1, closed: 0 };
      });

      render(<InboxList {...defaultProps} />);

      // The badge shows "Until {date}" format
      expect(screen.getByText(/Until/)).toBeInTheDocument();
    });

    it("should show duplicate of badge", () => {
      const issues = [
        createMockInboxIssue({
          status: "duplicate",
          duplicateOfIssue: { _id: "dup-1" as Id<"issues">, key: "PROJ-99", title: "Original" },
        }),
      ];
      let callCount = 0;
      (useQuery as Mock).mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 1) return issues;
        return { open: 0, closed: 1 };
      });

      render(<InboxList {...defaultProps} />);

      expect(screen.getByText(/duplicate of PROJ-99/i)).toBeInTheDocument();
    });

    it("should show decline reason", () => {
      const issues = [
        createMockInboxIssue({
          status: "declined",
          declineReason: "Not in scope",
        }),
      ];
      let callCount = 0;
      (useQuery as Mock).mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 1) return issues;
        return { open: 0, closed: 1 };
      });

      render(<InboxList {...defaultProps} />);

      expect(screen.getByText("Not in scope")).toBeInTheDocument();
    });
  });

  describe("error handling", () => {
    it("should show error toast when accept fails", async () => {
      const user = userEvent.setup();
      const error = new Error("Network error");
      mockMutation.mockRejectedValue(error);

      const issues = [createMockInboxIssue({ status: "pending" })];
      let callCount = 0;
      (useQuery as Mock).mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 1) return issues;
        return { open: 1, closed: 0 };
      });

      render(<InboxList {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: /accept/i }));

      expect(showError).toHaveBeenCalledWith(error, "Failed to accept issue");
    });
  });
});
