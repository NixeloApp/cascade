import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { useAction, useMutation, useQuery } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@/test/custom-render";
import { CreateIssueModal } from "./CreateIssueModal";

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useAction: vi.fn(),
}));

vi.mock("@/hooks/useOrgContext", () => ({
  useOrganization: vi.fn(() => ({
    organizationId: "org-123",
    billingEnabled: false,
  })),
}));

// Mock toast utilities
vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

// Mock array utilities
vi.mock("@/lib/array-utils", () => ({
  toggleInArray: vi.fn((arr: unknown[], item: unknown) => {
    if (arr.includes(item)) {
      return arr.filter((i) => i !== item);
    }
    return [...arr, item];
  }),
}));

describe("CreateIssueModal", () => {
  const mockCreateIssue = vi.fn();
  const mockOnOpenChange = vi.fn();
  const mockProjectId = "project-123" as Id<"projects">;
  const _mockSprintId = "sprint-456" as Id<"sprints">;

  const mockProject = {
    _id: mockProjectId,
    name: "Test Project",
    key: "TEST",
    members: [
      { _id: "user-1" as Id<"users">, name: "Alice" },
      { _id: "user-2" as Id<"users">, name: "Bob" },
    ],
  };

  const mockTemplates = [
    {
      _id: "template-1" as Id<"issueTemplates">,
      name: "Bug Template",
      type: "bug" as const,
      titleTemplate: "Bug: ",
      descriptionTemplate: "## Steps to reproduce\n1. ",
      defaultPriority: "high" as const,
      defaultLabels: ["bug"],
    },
  ];

  const mockLabels = [
    { _id: "label-1" as Id<"labels">, name: "bug", color: "#EF4444" },
    { _id: "label-2" as Id<"labels">, name: "feature", color: "#10B981" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useMutation as any).mockReturnValue(mockCreateIssue);
    (useAction as any).mockReturnValue(vi.fn());
    // Mock useQuery to return values in order:
    // 1st call: api.projects.getCurrentUserProjects -> undefined (skipped)
    // 2nd call: api.projects.getProject -> mockProject
    // 3rd call: api.templates.listByProject -> mockTemplates
    // 4th call: api.labels.list -> mockLabels
    (useQuery as any)
      .mockReturnValueOnce(undefined) // orgProjects (skipped)
      .mockReturnValueOnce(mockProject)
      .mockReturnValueOnce(mockTemplates)
      .mockReturnValueOnce(mockLabels);
  });

  it("should render story points input field", () => {
    render(
      <CreateIssueModal projectId={mockProjectId} open={true} onOpenChange={mockOnOpenChange} />,
    );

    const storyPointsInput = screen.getByPlaceholderText(/Enter story points/i);
    expect(storyPointsInput).toBeInTheDocument();
    expect(storyPointsInput).toHaveAttribute("type", "number");
    expect(storyPointsInput).toHaveAttribute("min", "0");
    expect(storyPointsInput).toHaveAttribute("step", "0.5");
  });

  it("should allow user to enter story points", async () => {
    const user = userEvent.setup();
    render(
      <CreateIssueModal projectId={mockProjectId} open={true} onOpenChange={mockOnOpenChange} />,
    );

    const storyPointsInput = screen.getByPlaceholderText(/Enter story points/i);
    await user.type(storyPointsInput, "5");

    expect(storyPointsInput).toHaveValue(5);
  });

  it("should create issue with story points", async () => {
    const user = userEvent.setup();
    mockCreateIssue.mockResolvedValue("new-issue-id");

    // Use mockImplementation to handle re-renders from user interactions
    let callCount = 0;
    (useQuery as any).mockImplementation(() => {
      callCount++;
      const callIndex = (callCount - 1) % 4; // Cycle through 4 queries
      return [undefined, mockProject, mockTemplates, mockLabels][callIndex];
    });

    render(
      <CreateIssueModal projectId={mockProjectId} open={true} onOpenChange={mockOnOpenChange} />,
    );

    const titleInput = screen.getByPlaceholderText(/Enter issue title/i);
    const storyPointsInput = screen.getByPlaceholderText(/Enter story points/i);

    await user.type(titleInput, "Test Issue");
    await user.type(storyPointsInput, "8");

    const submitButton = screen.getByRole("button", { name: /Create Issue/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreateIssue).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: mockProjectId,
          title: "Test Issue",
          storyPoints: 8,
        }),
      );
    });
  });

  it("should have accessible labels with aria-pressed state", async () => {
    // Reset mock calls for this test to ensure clean state
    (useQuery as any).mockReset();
    (useQuery as any)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(mockProject)
      .mockReturnValueOnce(mockTemplates)
      .mockReturnValueOnce(mockLabels);

    render(
      <CreateIssueModal projectId={mockProjectId} open={true} onOpenChange={mockOnOpenChange} />,
    );

    // Find label buttons
    const bugLabel = screen.getByRole("button", { name: /bug/i });
    const featureLabel = screen.getByRole("button", { name: /feature/i });

    // Initially not selected (assuming no default template selects them)
    expect(bugLabel).toHaveAttribute("aria-pressed", "false");
    expect(featureLabel).toHaveAttribute("aria-pressed", "false");
  });

  it("should group labels with semantic role and label", () => {
    // Reset mock calls for this test to ensure clean state
    (useQuery as any).mockReset();
    (useQuery as any)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(mockProject)
      .mockReturnValueOnce(mockTemplates)
      .mockReturnValueOnce(mockLabels);

    render(
      <CreateIssueModal projectId={mockProjectId} open={true} onOpenChange={mockOnOpenChange} />,
    );

    // Find the group
    const group = screen.getByRole("group", { name: /labels/i });
    expect(group).toBeInTheDocument();

    // Verify buttons are inside the group
    const bugLabel = screen.getByRole("button", { name: /bug/i });
    expect(group).toContainElement(bugLabel);
  });
});
