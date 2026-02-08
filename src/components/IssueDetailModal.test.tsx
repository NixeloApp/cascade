import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { useMutation, useQuery } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@/test/custom-render";
import { IssueDetailModal } from "./IssueDetailModal";

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
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
vi.mock("@/lib/issue-utils", () => ({
  getPriorityColor: vi.fn((priority: string, type: string) => {
    if (type === "badge") {
      const colors = {
        urgent: "bg-status-error-bg text-status-error-text",
        high: "bg-status-warning-bg text-status-warning-text",
        medium: "bg-status-warning-bg text-status-warning-text",
        low: "bg-status-info-bg text-status-info-text",
      };
      return colors[priority as keyof typeof colors] || "bg-ui-bg-tertiary text-ui-text-secondary";
    }
    return "";
  }),
}));

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
  const mockUpdateIssue = vi.fn();
  const _mockCreateIssue = vi.fn();
  const mockOnOpenChange = vi.fn();
  const mockIssueId = "issue-123" as Id<"issues">;

  const renderModal = () =>
    render(<IssueDetailModal issueId={mockIssueId} open={true} onOpenChange={mockOnOpenChange} />);

  const mockIssue = {
    _id: mockIssueId,
    key: "TEST-123",
    title: "Fix authentication bug",
    description: "Users cannot login with valid credentials",
    type: "bug" as const,
    priority: "high" as const,
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
    vi.mocked(useMutation).mockReturnValue(mockUpdateIssue as any);
  });

  const setupMockQuery = (issueData: any = mockIssue, subtasksData: any = []) => {
    vi.mocked(useQuery).mockImplementation((_query: any, args: any) => {
      // Identify query by arguments
      if (args && args.id === mockIssueId) return issueData;
      if (args && args.parentId === mockIssueId) return subtasksData;

      // Fallback to undefined (loading)
      return undefined;
    });
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
    expect(screen.getByText(/Fix authentication bug/i)).toBeInTheDocument();
    expect(screen.getByText(/Users cannot login/i)).toBeInTheDocument();
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

    expect(screen.getByText("🐛")).toBeInTheDocument(); // Bug icon
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

  it("should close modal when close button is clicked via dialog-close", async () => {
    const user = userEvent.setup();
    setupMockQuery();

    renderModal();

    // Radix Dialog uses data-slot="dialog-close" for close buttons
    const closeButton = document.querySelector('[data-slot="dialog-close"]');
    expect(closeButton).toBeTruthy();
    await user.click(closeButton as Element);

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
    mockUpdateIssue.mockResolvedValue(undefined);

    renderModal();

    const editButton = screen.getByRole("button", { name: /Edit/i });
    await user.click(editButton);

    const titleInput = screen.getByPlaceholderText(/Issue title/i);
    await user.clear(titleInput);
    await user.type(titleInput, "Updated title");

    const saveButton = screen.getByRole("button", { name: /Save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateIssue as any).toHaveBeenCalledWith({
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
    mockUpdateIssue.mockRejectedValue(new Error("Network error"));

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
