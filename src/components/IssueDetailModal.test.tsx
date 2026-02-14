import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { useQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IssuePriority, IssueType } from "@/lib/issue-utils";
import { render, screen, waitFor } from "@/test/custom-render";
import { IssueDetailModal } from "./IssueDetailModal";

// Create a mock mutation function that matches ReactMutation shape
const mockMutationFn = vi.fn();
Object.assign(mockMutationFn, {
  withOptimisticUpdate: vi.fn().mockReturnValue(mockMutationFn),
});

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => mockMutationFn),
}));

// Mock toast utilities
vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

// Mock organization context
vi.mock("@/hooks/useOrgContext", () => ({
  useOrganization: vi.fn(() => ({
    orgSlug: "test-organization",
    organizationName: "Test organization",
    billingEnabled: false,
  })),
}));

// Mock accessibility utilities
vi.mock("@/lib/accessibility", () => ({
  handleKeyboardClick: vi.fn((callback) => callback),
}));

// Mock issue utilities
vi.mock("@/lib/issue-utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/issue-utils")>();
  return {
    ...actual,
    getPriorityColor: vi.fn((priority: string, type: string) => {
      if (type === "badge") {
        const colors = {
          urgent: "bg-status-error-bg text-status-error-text",
          high: "bg-status-warning-bg text-status-warning-text",
          medium: "bg-status-warning-bg text-status-warning-text",
          low: "bg-status-info-bg text-status-info-text",
        };
        return (
          colors[priority as keyof typeof colors] || "bg-ui-bg-tertiary text-ui-text-secondary"
        );
      }
      return "";
    }),
  };
});

// Mock child components
vi.mock("./TimeTracker", () => ({
  TimeTracker: ({ issueKey }: { issueKey: string }) => <div>TimeTracker for {issueKey}</div>,
}));

vi.mock("./CustomFieldValues", () => ({
  CustomFieldValues: () => <div>CustomFieldValues</div>,
}));

vi.mock("./FileAttachments", () => ({
  FileAttachments: () => <div>FileAttachments</div>,
}));

vi.mock("./IssueComments", () => ({
  IssueComments: () => <div>IssueComments</div>,
}));

vi.mock("./IssueDependencies", () => ({
  IssueDependencies: () => <div>IssueDependencies</div>,
}));

vi.mock("./IssueWatchers", () => ({
  IssueWatchers: () => <div>IssueWatchers</div>,
}));

describe("IssueDetailModal", () => {
  const mockOnOpenChange = vi.fn();
  const mockIssueId = "issue-123" as Id<"issues">;

  const renderModal = () =>
    render(<IssueDetailModal issueId={mockIssueId} open={true} onOpenChange={mockOnOpenChange} />);

  interface MockIssue {
    _id: Id<"issues">;
    key: string;
    title: string;
    description: string;
    type: IssueType;
    priority: IssuePriority;
    status: string;
    assignee: { name: string } | null;
    reporter: { name: string } | null;
    labels: { name: string; color: string }[];
    estimatedHours: number;
    loggedHours: number;
    storyPoints?: number;
    projectId: Id<"projects">;
  }

  const mockIssue: MockIssue = {
    _id: mockIssueId,
    key: "TEST-123",
    title: "Fix authentication bug",
    description: "Users cannot login with valid credentials",
    type: "bug",
    priority: "high",
    status: "in-progress",
    assignee: { name: "John Doe" },
    reporter: { name: "Jane Smith" },
    labels: [
      { name: "backend", color: "#3B82F6" },
      { name: "urgent", color: "#EF4444" },
    ],
    estimatedHours: 8,
    loggedHours: 3.5,
    storyPoints: 5,
    projectId: "project-123" as Id<"projects">,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupMockQuery = (
    issueData: MockIssue | undefined = mockIssue,
    subtasksData: MockIssue[] = [],
  ) => {
    vi.mocked(useQuery).mockImplementation(
      <T,>(
        _query: FunctionReference<"query">,
        args?: Record<string, unknown> | "skip",
      ): T | undefined => {
        if (args === "skip") return undefined;
        // Identify query by arguments
        if (args && "id" in args && args.id === mockIssueId) return issueData as T;
        if (args && "parentId" in args && args.parentId === mockIssueId) return subtasksData as T;

        // Fallback to undefined (loading)
        return undefined;
      },
    );
  };

  it("should show loading state when issue is undefined", () => {
    vi.mocked(useQuery).mockReturnValue(undefined);

    renderModal();

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("should render issue details", () => {
    setupMockQuery();

    renderModal();

    expect(screen.getByText("TEST-123")).toBeInTheDocument();
    // Title appears in modal header - use getAllByText since it may appear multiple times
    expect(screen.getAllByText(/Fix authentication bug/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Users cannot login/i).length).toBeGreaterThan(0);
  });

  it("should display issue metadata", () => {
    setupMockQuery();

    renderModal();

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("in-progress")).toBeInTheDocument();
  });

  it("should display labels", () => {
    setupMockQuery();

    renderModal();

    // Use queryByText to find text within other elements
    expect(screen.getByText("Story Points")).toBeInTheDocument();
    expect(screen.getByText("urgent")).toBeInTheDocument();
  });

  it("should show correct type icon", () => {
    setupMockQuery();

    renderModal();

    // Icon is rendered as SVG for bug type - the modal uses a portal
    // so we search document.body instead of container
    expect(document.body.querySelector("svg")).toBeInTheDocument();
  });

  it("should show priority badge with correct color", () => {
    setupMockQuery();

    renderModal();

    const priorityBadge = screen.getByText("high");
    expect(priorityBadge.className).toContain("bg-status-warning-bg");
    expect(priorityBadge.className).toContain("text-status-warning-text");
  });

  it("should render TimeTracker component", () => {
    setupMockQuery();

    renderModal();

    expect(screen.getByText(/Time Tracking/i)).toBeInTheDocument();
  });

  it("should close modal when close button is clicked", async () => {
    const user = userEvent.setup();
    setupMockQuery();

    renderModal();

    // Radix Dialog provides a close button with "Close" text in sr-only span
    const closeButton = screen.getByRole("button", { name: /^Close$/i });
    await user.click(closeButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("should enter edit mode when Edit button is clicked", async () => {
    const user = userEvent.setup();
    setupMockQuery();

    renderModal();

    const editButton = screen.getByRole("button", { name: /Edit/i });
    await user.click(editButton);

    expect(screen.getByRole("button", { name: /Save/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
  });

  it("should allow editing title and description", async () => {
    const user = userEvent.setup();
    setupMockQuery();

    renderModal();

    const editButton = screen.getByRole("button", { name: /Edit/i });
    await user.click(editButton);

    const titleInput = screen.getByPlaceholderText(/Issue title/i) as HTMLInputElement;
    const descriptionInput = screen.getByPlaceholderText(
      /Add a description/i,
    ) as HTMLTextAreaElement;

    expect(titleInput.value).toBe("Fix authentication bug");
    expect(descriptionInput.value).toBe("Users cannot login with valid credentials");

    await user.clear(titleInput);
    await user.type(titleInput, "New title");
    await user.clear(descriptionInput);
    await user.type(descriptionInput, "New description");

    expect(titleInput.value).toBe("New title");
    expect(descriptionInput.value).toBe("New description");
  });

  it("should call update mutation when Save is clicked", async () => {
    const user = userEvent.setup();
    setupMockQuery();
    mockMutationFn.mockResolvedValue(undefined);

    renderModal();

    const editButton = screen.getByRole("button", { name: /Edit/i });
    await user.click(editButton);

    const titleInput = screen.getByPlaceholderText(/Issue title/i);
    await user.clear(titleInput);
    await user.type(titleInput, "Updated title");

    const saveButton = screen.getByRole("button", { name: /Save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockMutationFn).toHaveBeenCalledWith({
        issueId: mockIssueId,
        title: "Updated title",
        description: "Users cannot login with valid credentials",
      });
    });
  });

  it("should exit edit mode when Cancel is clicked", async () => {
    const user = userEvent.setup();
    setupMockQuery();

    renderModal();

    const editButton = screen.getByRole("button", { name: /Edit/i });
    await user.click(editButton);

    expect(screen.getByRole("button", { name: /Save/i })).toBeInTheDocument();

    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /Save/i })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Edit/i })).toBeInTheDocument();
    });
  });

  it("should show No description provided when description is empty", () => {
    const issueWithoutDescription = { ...mockIssue, description: "" };
    setupMockQuery(issueWithoutDescription);

    renderModal();

    expect(screen.getByText(/No description provided/i)).toBeInTheDocument();
  });

  it("should show Unassigned when no assignee", () => {
    const issueWithoutAssignee = { ...mockIssue, assignee: null };
    setupMockQuery(issueWithoutAssignee);

    renderModal();

    expect(screen.getByText(/Unassigned/i)).toBeInTheDocument();
  });

  it("should not show Labels section when no labels", () => {
    const issueWithoutLabels = { ...mockIssue, labels: [] };
    setupMockQuery(issueWithoutLabels);

    renderModal();

    expect(screen.queryByText(/Labels/i)).not.toBeInTheDocument();
  });

  it("should handle save error gracefully", async () => {
    const user = userEvent.setup();
    setupMockQuery();
    mockMutationFn.mockRejectedValue(new Error("Network error"));

    const { showError } = await import("@/lib/toast");

    renderModal();

    const editButton = screen.getByRole("button", { name: /Edit/i });
    await user.click(editButton);

    const titleInput = screen.getByPlaceholderText(/Issue title/i);
    await user.clear(titleInput);
    await user.type(titleInput, "New title");

    const saveButton = screen.getByRole("button", { name: /Save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(showError).toHaveBeenCalledWith(expect.any(Error), "Failed to update issue");
    });
  });

  it("should display story points in metadata", () => {
    setupMockQuery();

    renderModal();

    expect(screen.getByText("Story Points")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("should show 'Not set' when story points is undefined", () => {
    const issueWithoutStoryPoints = { ...mockIssue, storyPoints: undefined };
    setupMockQuery(issueWithoutStoryPoints);

    renderModal();

    expect(screen.getByText("Story Points")).toBeInTheDocument();
    expect(screen.getByText("Not set")).toBeInTheDocument();
  });

  it("should display decimal story points correctly", () => {
    const issueWithDecimalPoints = { ...mockIssue, storyPoints: 3.5 };
    setupMockQuery(issueWithDecimalPoints);

    renderModal();

    expect(screen.getByText("Story Points")).toBeInTheDocument();
    expect(screen.getByText("3.5")).toBeInTheDocument();
  });
});
