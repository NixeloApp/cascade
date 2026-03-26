import type { Doc, Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TEST_IDS } from "@/lib/test-ids";
import { render, screen, within } from "@/test/custom-render";

interface InboxIssueWithDetails {
  _id: Id<"inboxIssues">;
  projectId: Id<"projects">;
  issueId: Id<"issues">;
  status: "pending" | "accepted" | "declined" | "snoozed" | "duplicate";
  source: "api" | "email" | "form" | "in_app";
  sourceEmail?: string;
  snoozedUntil?: number;
  duplicateOfId?: Id<"issues">;
  declineReason?: string;
  triageNotes?: string;
  triagedAt?: number;
  createdAt: number;
  updatedAt: number;
  issue: Doc<"issues">;
  createdByUser: { _id: Id<"users">; name?: string; image?: string } | null;
  triagedByUser: { _id: Id<"users">; name?: string; image?: string } | null;
  duplicateOfIssue: { _id: Id<"issues">; key: string; title: string } | null;
}

const ONE_DAY_MS = 86_400_000;
const OPEN_TAB_COUNT = 4;
const CLOSED_TAB_COUNT = 3;

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

const mockData = {
  counts: undefined as ReturnType<typeof createMockCounts> | undefined,
  duplicateSearch: undefined as { page: Doc<"issues">[]; total: number } | undefined,
  inboxIssues: undefined as InboxIssueWithDetails[] | undefined,
};

const mockMutation = vi.fn().mockResolvedValue({
  accepted: 1,
  declined: 1,
  snoozed: 1,
  success: true,
});

vi.mock("convex/react", () => ({
  useConvexAuth: vi.fn(() => ({ isAuthenticated: true, isLoading: false })),
  useMutation: vi.fn(() => mockMutation),
  useQuery: vi.fn((_query: unknown, args: unknown) => {
    const queryArgs = args as Record<string, unknown> | "skip";
    if (queryArgs === "skip") {
      return undefined;
    }

    if ("tab" in queryArgs) {
      return mockData.inboxIssues;
    }

    if ("excludeIssueId" in queryArgs) {
      return mockData.duplicateSearch;
    }

    return mockData.counts;
  }),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

import { InboxList } from "./InboxList";

function createMockIssueDoc(
  overrides: Partial<Doc<"issues">> = {},
  key = "TEST-1",
  title = "Test Issue",
): Doc<"issues"> {
  return {
    _creationTime: Date.now(),
    _id: `${key.toLowerCase()}-id` as Id<"issues">,
    attachments: [],
    key,
    labels: [],
    linkedDocuments: [],
    order: 0,
    organizationId: "org-1" as Id<"organizations">,
    priority: "medium",
    projectId: "proj-1" as Id<"projects">,
    reporterId: "user-1" as Id<"users">,
    status: "todo",
    title,
    type: "bug",
    version: 1,
    workspaceId: "workspace-1" as Id<"workspaces">,
    ...overrides,
  } as Doc<"issues">;
}

function createMockInboxIssue(
  overrides: Partial<InboxIssueWithDetails> = {},
): InboxIssueWithDetails {
  return {
    _id: "inbox-1" as Id<"inboxIssues">,
    projectId: "proj-1" as Id<"projects">,
    issueId: "issue-1" as Id<"issues">,
    status: "pending",
    source: "in_app",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    issue: createMockIssueDoc(),
    createdByUser: { _id: "user-1" as Id<"users">, name: "John Doe" },
    triagedByUser: null,
    duplicateOfIssue: null,
    ...overrides,
  };
}

function setupMocks({
  counts,
  duplicateSearch,
  inboxIssues,
}: {
  counts?: ReturnType<typeof createMockCounts>;
  duplicateSearch?: { page: Doc<"issues">[]; total: number };
  inboxIssues?: InboxIssueWithDetails[];
}) {
  mockData.counts = counts;
  mockData.duplicateSearch = duplicateSearch;
  mockData.inboxIssues = inboxIssues;
}

describe("InboxList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutation.mockResolvedValue({
      accepted: 1,
      declined: 1,
      snoozed: 1,
      success: true,
    });
    setupMocks({
      counts: undefined,
      duplicateSearch: undefined,
      inboxIssues: undefined,
    });
  });

  it("renders a loading spinner while inbox data loads", () => {
    render(<InboxList projectId={"proj-1" as Id<"projects">} />);

    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("transitions from loading to loaded data without crashing", () => {
    const view = render(<InboxList projectId={"proj-1" as Id<"projects">} />);

    expect(document.querySelector(".animate-spin")).toBeInTheDocument();

    setupMocks({
      counts: createMockCounts({ open: 1, pending: 1 }),
      inboxIssues: [createMockInboxIssue()],
    });

    view.rerender(<InboxList projectId={"proj-1" as Id<"projects">} />);

    expect(screen.getByTestId(TEST_IDS.PROJECT_INBOX.SEARCH_INPUT)).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  it("renders open and closed tabs with counts", () => {
    setupMocks({
      counts: createMockCounts({ open: OPEN_TAB_COUNT, closed: CLOSED_TAB_COUNT }),
      inboxIssues: [],
    });

    render(<InboxList projectId={"proj-1" as Id<"projects">} />);

    expect(
      screen.getByRole("tab", { name: new RegExp(`open.*${OPEN_TAB_COUNT}`, "i") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: new RegExp(`closed.*${CLOSED_TAB_COUNT}`, "i") }),
    ).toBeInTheDocument();
  });

  it("renders inbox source metadata", () => {
    setupMocks({
      counts: createMockCounts({ open: 1, closed: 1, duplicate: 1 }),
      inboxIssues: [
        createMockInboxIssue({
          source: "email",
          sourceEmail: "alerts@example.com",
        }),
      ],
    });

    render(<InboxList projectId={"proj-1" as Id<"projects">} />);

    expect(screen.getByText(/received via email from alerts@example.com/i)).toBeInTheDocument();
    expect(screen.getByText("Email intake")).toBeInTheDocument();
  });

  it("renders closed-state badges in the closed tab", async () => {
    const user = userEvent.setup();
    setupMocks({
      counts: createMockCounts({ open: 1, closed: 1, duplicate: 1 }),
      inboxIssues: [
        createMockInboxIssue({
          _id: "inbox-closed" as Id<"inboxIssues">,
          duplicateOfIssue: {
            _id: "duplicate-1" as Id<"issues">,
            key: "TEST-9",
            title: "Existing duplicate target",
          },
          issue: createMockIssueDoc({}, "TEST-2", "Duplicate candidate"),
          status: "duplicate",
        }),
      ],
    });

    render(<InboxList projectId={"proj-1" as Id<"projects">} />);
    await user.click(screen.getByTestId(TEST_IDS.PROJECT_INBOX.CLOSED_TAB));

    expect(screen.getByText("Duplicate of TEST-9")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reopen/i })).toBeInTheDocument();
  });

  it("shows the bulk actions bar when triageable items are selected", async () => {
    const user = userEvent.setup();
    setupMocks({
      counts: createMockCounts({ open: 1, pending: 1 }),
      inboxIssues: [createMockInboxIssue()],
    });

    render(<InboxList projectId={"proj-1" as Id<"projects">} />);

    const rowCheckbox = screen.getAllByRole("checkbox")[1];
    await user.click(rowCheckbox);

    expect(screen.getByTestId(TEST_IDS.PROJECT_INBOX.BULK_ACTIONS)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /accept all/i })).toBeInTheDocument();
    expect(
      within(screen.getByTestId(TEST_IDS.PROJECT_INBOX.BULK_ACTIONS)).getByRole("button", {
        name: /^snooze$/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /decline all/i })).toBeInTheDocument();
  });

  it("uses a full-width responsive action bar for mobile inbox rows", () => {
    setupMocks({
      counts: createMockCounts({ open: 1, pending: 1 }),
      inboxIssues: [createMockInboxIssue()],
    });

    render(<InboxList projectId={"proj-1" as Id<"projects">} />);

    const row = screen.getByTestId(TEST_IDS.PROJECT_INBOX.ROW);
    const acceptButton = within(row).getByRole("button", { name: /accept/i });
    const actionBar = acceptButton.closest("div");

    expect(actionBar).not.toBeNull();
    expect(actionBar).toHaveClass("w-full", "border-t", "sm:w-auto");
    expect(within(row).getByText("Test Issue")).toHaveClass("break-words");
  });

  it("opens the decline dialog from the row action", async () => {
    const user = userEvent.setup();
    setupMocks({
      counts: createMockCounts({ open: 1, pending: 1 }),
      inboxIssues: [
        createMockInboxIssue({ issue: createMockIssueDoc({}, "TEST-3", "Needs triage") }),
      ],
    });

    render(<InboxList projectId={"proj-1" as Id<"projects">} />);

    await user.click(screen.getByRole("button", { name: /decline/i }));

    const dialog = await screen.findByTestId(TEST_IDS.PROJECT_INBOX.DECLINE_DIALOG);
    expect(within(dialog).getByText(/needs triage/i)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /^decline$/i })).toBeInTheDocument();
  });

  it("opens the custom snooze dialog from the snooze menu", async () => {
    const user = userEvent.setup();
    setupMocks({
      counts: createMockCounts({ open: 1, pending: 1 }),
      inboxIssues: [createMockInboxIssue()],
    });

    render(<InboxList projectId={"proj-1" as Id<"projects">} />);

    await user.click(screen.getByRole("button", { name: /^snooze$/i }));
    await user.click(await screen.findByText("Pick a date…"));

    expect(
      await screen.findByTestId(TEST_IDS.PROJECT_INBOX.CUSTOM_SNOOZE_DIALOG),
    ).toBeInTheDocument();
  });

  it("opens the duplicate dialog and shows project issue matches", async () => {
    const user = userEvent.setup();
    setupMocks({
      counts: createMockCounts({ open: 1, pending: 1 }),
      duplicateSearch: {
        page: [
          createMockIssueDoc(
            { _id: "issue-2" as Id<"issues">, status: "in-progress" },
            "TEST-4",
            "Existing issue",
          ),
        ],
        total: 1,
      },
      inboxIssues: [
        createMockInboxIssue({ issue: createMockIssueDoc({}, "TEST-5", "Possible duplicate") }),
      ],
    });

    render(<InboxList projectId={"proj-1" as Id<"projects">} />);

    await user.click(screen.getByRole("button", { name: /more actions for test-5/i }));
    await user.click(await screen.findByText(/mark duplicate/i));

    const dialog = await screen.findByTestId(TEST_IDS.PROJECT_INBOX.DUPLICATE_DIALOG);
    expect(within(dialog).getByText("TEST-4")).toBeInTheDocument();
    expect(within(dialog).getByText("Existing issue")).toBeInTheDocument();
  });

  it("filters inbox rows using issue and source text", async () => {
    const user = userEvent.setup();
    setupMocks({
      counts: createMockCounts({ open: 2, pending: 2 }),
      inboxIssues: [
        createMockInboxIssue({
          _id: "inbox-1" as Id<"inboxIssues">,
          issue: createMockIssueDoc({}, "TEST-6", "Payment webhook failure"),
          source: "api",
          sourceEmail: "hooks@example.com",
        }),
        createMockInboxIssue({
          _id: "inbox-2" as Id<"inboxIssues">,
          issue: createMockIssueDoc({}, "TEST-7", "Customer feedback"),
          source: "in_app",
        }),
      ],
    });

    render(<InboxList projectId={"proj-1" as Id<"projects">} />);

    await user.type(screen.getByTestId(TEST_IDS.PROJECT_INBOX.SEARCH_INPUT), "hooks@example.com");

    expect(screen.getByText("Payment webhook failure")).toBeInTheDocument();
    expect(screen.queryByText("Customer feedback")).not.toBeInTheDocument();
  });

  it("clears search from the empty-state action", async () => {
    const user = userEvent.setup();
    setupMocks({
      counts: createMockCounts({ open: 1, pending: 1 }),
      inboxIssues: [
        createMockInboxIssue({
          issue: createMockIssueDoc({}, "TEST-8", "Webhook delivery failure"),
        }),
      ],
    });

    render(<InboxList projectId={"proj-1" as Id<"projects">} />);

    const searchInput = screen.getByTestId(TEST_IDS.PROJECT_INBOX.SEARCH_INPUT);
    await user.type(searchInput, "no-match");

    expect(screen.getByText("No matching items")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /clear search/i }));

    expect(searchInput).toHaveValue("");
    expect(screen.getByText("Webhook delivery failure")).toBeInTheDocument();
  });

  it("links the open empty state to the closed tab when resolved items exist", async () => {
    const user = userEvent.setup();
    setupMocks({
      counts: createMockCounts({ closed: 2, declined: 1, duplicate: 1 }),
      inboxIssues: [],
    });

    render(<InboxList projectId={"proj-1" as Id<"projects">} />);

    expect(screen.getByText("No pending items")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /view closed items/i }));

    expect(screen.getByText("No closed items")).toBeInTheDocument();
  });

  it("renders the snoozed badge for deferred issues", () => {
    setupMocks({
      counts: createMockCounts({ open: 1, snoozed: 1 }),
      inboxIssues: [
        createMockInboxIssue({
          snoozedUntil: Date.now() + ONE_DAY_MS,
          status: "snoozed",
        }),
      ],
    });

    render(<InboxList projectId={"proj-1" as Id<"projects">} />);

    expect(screen.getByText(/until/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /unsnooze/i })).toBeInTheDocument();
  });
});
