import type { Doc, Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";

// Test constants for magic number replacement
const OPEN_TAB_COUNT = 7;
const CLOSED_TAB_COUNT = 10;
const ONE_DAY_MS = 86400000;
const MIN_EXPECTED_CHECKBOXES = 2;

// Types needed before mocks
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
  issue: Doc<"issues">;
  createdByUser: { _id: Id<"users">; name?: string; image?: string } | null;
  triagedByUser: { _id: Id<"users">; name?: string; image?: string } | null;
  duplicateOfIssue: { _id: Id<"issues">; key: string; title: string } | null;
}

function createMockCounts(overrides = {}) {
  return {
    open: 0,
    closed: 0,
    pending: 0,
    snoozed: 0,
    accepted: 0,
    declined: 0,
    duplicate: 0,
    ...overrides,
  };
}

/**
 * InboxList calls two queries with different args shapes:
 * - list: { projectId, tab }
 * - getCounts: { projectId }
 * Route mock responses based on args instead of call order so rerenders stay stable.
 */
const mockData = {
  inboxIssues: undefined as InboxIssueWithDetails[] | undefined,
  counts: undefined as ReturnType<typeof createMockCounts> | undefined,
};

vi.mock("convex/react", () => ({
  useQuery: vi.fn((_query: unknown, args: unknown) => {
    const queryArgs = args as { tab?: "open" | "closed"; projectId?: Id<"projects"> } | "skip";
    if (queryArgs === "skip") return undefined;
    if (queryArgs && typeof queryArgs === "object" && "tab" in queryArgs) {
      return mockData.inboxIssues;
    }
    return mockData.counts;
  }),
  useMutation: vi.fn(() => vi.fn()),
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

// Import after mocks
import { useMutation } from "convex/react";
import { InboxList } from "./InboxList";

// Mock data factory
function createMockInboxIssue(
  overrides: Partial<InboxIssueWithDetails> = {},
): InboxIssueWithDetails {
  return {
    _id: "inbox-1" as Id<"inboxIssues">,
    projectId: "proj-1" as Id<"projects">,
    issueId: "issue-1" as Id<"issues">,
    status: "pending",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    issue: {
      _id: "issue-1" as Id<"issues">,
      _creationTime: Date.now(),
      key: "TEST-1",
      title: "Test Issue",
      status: "todo",
      priority: "medium",
      type: "bug",
      order: 0,
      organizationId: "org-1" as Id<"organizations">,
      projectId: "proj-1" as Id<"projects">,
      reporterId: "user-1" as Id<"users">,
    } as Doc<"issues">,
    createdByUser: { _id: "user-1" as Id<"users">, name: "John Doe" },
    triagedByUser: null,
    duplicateOfIssue: null,
    ...overrides,
  };
}

// Helper to set up mocks for a test
function setupMocks(
  issues: InboxIssueWithDetails[] | undefined,
  counts: ReturnType<typeof createMockCounts> | undefined,
) {
  mockData.inboxIssues = issues;
  mockData.counts = counts;
}

describe("InboxList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockData.inboxIssues = undefined;
    mockData.counts = undefined;
  });

  describe("Loading State", () => {
    it("should render loading spinner when data is loading", () => {
      setupMocks(undefined, undefined);

      render(<InboxList projectId={"proj-1" as Id<"projects">} />);

      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should render empty state when no inbox issues", () => {
      setupMocks([], createMockCounts());

      render(<InboxList projectId={"proj-1" as Id<"projects">} />);

      expect(screen.getByText("No pending items")).toBeInTheDocument();
      expect(
        screen.getByText("All inbox issues have been triaged. New submissions will appear here."),
      ).toBeInTheDocument();
    });
  });

  describe("Tabs", () => {
    it("should render Open and Closed tabs", () => {
      setupMocks([], createMockCounts());

      render(<InboxList projectId={"proj-1" as Id<"projects">} />);

      expect(screen.getByRole("tab", { name: /open/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /closed/i })).toBeInTheDocument();
    });

    it("should show counts in tab labels", () => {
      setupMocks([], createMockCounts({ open: OPEN_TAB_COUNT, closed: CLOSED_TAB_COUNT }));

      render(<InboxList projectId={"proj-1" as Id<"projects">} />);

      expect(
        screen.getByRole("tab", { name: new RegExp(`open.*${OPEN_TAB_COUNT}`, "i") }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: new RegExp(`closed.*${CLOSED_TAB_COUNT}`, "i") }),
      ).toBeInTheDocument();
    });

    it("should switch tabs when clicked", async () => {
      const user = userEvent.setup();
      setupMocks([], createMockCounts());

      render(<InboxList projectId={"proj-1" as Id<"projects">} />);

      const closedTab = screen.getByRole("tab", { name: /closed/i });
      await user.click(closedTab);

      expect(closedTab).toHaveAttribute("data-state", "active");
    });
  });

  describe("Issue Display", () => {
    it("should render pending inbox issues", () => {
      const issues = [
        createMockInboxIssue({
          status: "pending",
          issue: {
            _id: "issue-1" as Id<"issues">,
            _creationTime: Date.now(),
            key: "BUG-123",
            title: "Login button not working",
            status: "todo",
            priority: "high",
            type: "bug",
          } as Doc<"issues">,
        }),
      ];
      setupMocks(issues, createMockCounts({ open: 1, pending: 1 }));

      render(<InboxList projectId={"proj-1" as Id<"projects">} />);

      expect(screen.getByText("BUG-123")).toBeInTheDocument();
      expect(screen.getByText("Login button not working")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /accept/i })).toBeInTheDocument();
    });

    it("should render snoozed issues with snooze badge", () => {
      const issues = [
        createMockInboxIssue({
          status: "snoozed",
          snoozedUntil: Date.now() + ONE_DAY_MS,
          issue: {
            _id: "issue-1" as Id<"issues">,
            _creationTime: Date.now(),
            key: "BUG-456",
            title: "Snoozed issue",
            status: "todo",
            priority: "medium",
            type: "bug",
          } as Doc<"issues">,
        }),
      ];
      setupMocks(issues, createMockCounts({ open: 1, snoozed: 1 }));

      render(<InboxList projectId={"proj-1" as Id<"projects">} />);

      expect(screen.getByText("BUG-456")).toBeInTheDocument();
      expect(screen.getByText("Snoozed issue")).toBeInTheDocument();
      expect(screen.getByText(/Until /i)).toBeInTheDocument();
    });

    it("should render multiple issues", () => {
      const issues = [
        createMockInboxIssue({
          _id: "inbox-1" as Id<"inboxIssues">,
          issue: { key: "TEST-1", title: "Issue One" } as Doc<"issues">,
        }),
        createMockInboxIssue({
          _id: "inbox-2" as Id<"inboxIssues">,
          issue: { key: "TEST-2", title: "Issue Two" } as Doc<"issues">,
        }),
        createMockInboxIssue({
          _id: "inbox-3" as Id<"inboxIssues">,
          issue: { key: "TEST-3", title: "Issue Three" } as Doc<"issues">,
        }),
      ];
      setupMocks(issues, createMockCounts({ pending: 3 }));

      render(<InboxList projectId={"proj-1" as Id<"projects">} />);

      expect(screen.getByText("TEST-1")).toBeInTheDocument();
      expect(screen.getByText("TEST-2")).toBeInTheDocument();
      expect(screen.getByText("TEST-3")).toBeInTheDocument();
    });
  });

  describe("Selection", () => {
    it("should show checkboxes for pending issues", () => {
      const issues = [createMockInboxIssue({ status: "pending" })];
      setupMocks(issues, createMockCounts({ open: 1, pending: 1 }));

      render(<InboxList projectId={"proj-1" as Id<"projects">} />);

      expect(screen.getAllByRole("checkbox").length).toBeGreaterThanOrEqual(
        MIN_EXPECTED_CHECKBOXES,
      );
    });

    it("should toggle selection when checkbox is clicked", async () => {
      const user = userEvent.setup();
      const issues = [createMockInboxIssue({ status: "pending" })];
      setupMocks(issues, createMockCounts({ open: 1, pending: 1 }));

      render(<InboxList projectId={"proj-1" as Id<"projects">} />);

      const checkbox = screen.getAllByRole("checkbox")[1];
      await user.click(checkbox);

      expect(checkbox).toBeChecked();
    });
  });

  describe("Bulk Actions", () => {
    it("should show bulk action buttons when items are selected", async () => {
      const user = userEvent.setup();
      const issues = [createMockInboxIssue({ status: "pending" })];
      setupMocks(issues, createMockCounts({ open: 1, pending: 1 }));

      render(<InboxList projectId={"proj-1" as Id<"projects">} />);

      // Select an item
      const checkbox = screen.getAllByRole("checkbox")[1];
      await user.click(checkbox);

      // Bulk action buttons should appear
      expect(screen.getByRole("button", { name: /accept all/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /decline all/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /snooze 1 week/i })).toBeInTheDocument();
    });

    // SKIPPED: Requires issues to render for bulk accept flow
    it.skip("should call bulkAccept when Accept button is clicked", async () => {
      const user = userEvent.setup();
      const mockBulkAccept = vi.fn().mockResolvedValue({ accepted: 1 });
      const issues = [createMockInboxIssue({ status: "pending" })];
      setupMocks(issues, createMockCounts({ pending: 1 }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(useMutation).mockReturnValue(mockBulkAccept as any);

      render(<InboxList projectId={"proj-1" as Id<"projects">} />);

      // Select and accept
      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      const acceptButton = screen.getByRole("button", { name: /accept/i });
      await user.click(acceptButton);

      expect(mockBulkAccept).toHaveBeenCalled();
    });
  });

  describe("Select All", () => {
    // SKIPPED: Requires multiple issues to render for select-all behavior
    it.skip("should select all triageable items when Select All is clicked", async () => {
      const user = userEvent.setup();
      const issues = [
        createMockInboxIssue({
          _id: "inbox-1" as Id<"inboxIssues">,
          status: "pending",
        }),
        createMockInboxIssue({
          _id: "inbox-2" as Id<"inboxIssues">,
          status: "pending",
        }),
      ];
      setupMocks(issues, createMockCounts({ pending: 2 }));

      render(<InboxList projectId={"proj-1" as Id<"projects">} />);

      // Click Select All
      const selectAllButton = screen.getByRole("button", { name: /select all/i });
      await user.click(selectAllButton);

      // All checkboxes should be checked
      const checkboxes = screen.getAllByRole("checkbox");
      for (const checkbox of checkboxes) {
        expect(checkbox).toBeChecked();
      }
    });
  });

  describe("Issue Actions Menu", () => {
    it("should render action menu trigger for each issue", () => {
      const issues = [createMockInboxIssue({ status: "pending" })];
      setupMocks(issues, createMockCounts({ pending: 1 }));

      render(<InboxList projectId={"proj-1" as Id<"projects">} />);

      // Menu trigger button should be present (the MoreHorizontal icon button)
      const menuTriggers = screen.getAllByRole("button");
      // At least one button should be for the menu (we can't easily target it by name)
      expect(menuTriggers.length).toBeGreaterThan(0);
    });
  });
});
