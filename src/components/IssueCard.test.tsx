import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { IssueCard } from "./IssueCard";

// Create mock icon that's hoisted to be available in vi.mock
const { MockIcon } = vi.hoisted(() => ({
  MockIcon: () => null,
}));

// Mock issue utilities
vi.mock("@/lib/issue-utils", () => ({
  getTypeLabel: vi.fn((type: string) => {
    const labels = {
      bug: "Bug",
      task: "Task",
      story: "Story",
      epic: "Epic",
    };
    return labels[type as keyof typeof labels] || "Task";
  }),
  getPriorityColor: vi.fn((priority: string) => {
    const colors = {
      lowest: "text-priority-lowest",
      low: "text-priority-low",
      medium: "text-priority-medium",
      high: "text-priority-high",
      highest: "text-priority-highest",
    };
    return colors[priority as keyof typeof colors] || "text-ui-text-tertiary";
  }),
  ISSUE_TYPE_ICONS: {
    bug: MockIcon,
    story: MockIcon,
    epic: MockIcon,
    subtask: MockIcon,
    task: MockIcon,
  },
  PRIORITY_ICONS: {
    highest: MockIcon,
    high: MockIcon,
    medium: MockIcon,
    low: MockIcon,
    lowest: MockIcon,
  },
}));

describe("IssueCard", () => {
  const mockOnDragStart = vi.fn();

  const mockIssue = {
    _id: "issue-1" as Id<"issues">,
    key: "TEST-123",
    title: "Fix critical bug in authentication",
    type: "bug" as const,
    priority: "high" as const,
    assignee: {
      _id: "user-1" as Id<"users">,
      name: "Alice Johnson",
      image: "https://example.com/avatar.jpg",
    },
    labels: [
      { name: "backend", color: "#3B82F6" },
      { name: "urgent", color: "#EF4444" },
    ],
    storyPoints: 5,
    updatedAt: Date.now(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display story points when present", () => {
    render(<IssueCard issue={mockIssue} onDragStart={mockOnDragStart} />);

    // Story points badge contains "5 pts" - use regex to handle whitespace
    expect(screen.getByText(/5\s*pts/)).toBeInTheDocument();
  });

  it("should not display story points when undefined", () => {
    const issueWithoutPoints = { ...mockIssue, storyPoints: undefined };
    render(<IssueCard issue={issueWithoutPoints} onDragStart={mockOnDragStart} />);

    expect(screen.queryByText(/pts/)).not.toBeInTheDocument();
  });

  it("should display decimal story points", () => {
    const issueWithDecimalPoints = { ...mockIssue, storyPoints: 3.5 };
    render(<IssueCard issue={issueWithDecimalPoints} onDragStart={mockOnDragStart} />);

    // Story points badge contains "3.5 pts" - use regex to handle whitespace
    expect(screen.getByText(/3\.5\s*pts/)).toBeInTheDocument();
  });

  it("should display tooltip with assignee name on hover", async () => {
    const user = userEvent.setup();
    render(<IssueCard issue={mockIssue} onDragStart={mockOnDragStart} />);

    const avatar = screen.getByAltText("Alice Johnson");
    expect(avatar).toBeInTheDocument();

    await user.hover(avatar);

    const tooltipText = await screen.findByRole("tooltip", { name: "Assigned to: Alice Johnson" });
    expect(tooltipText).toBeInTheDocument();
  });

  it("should display tooltip with hidden labels", async () => {
    const user = userEvent.setup();
    const issueWithManyLabels = {
      ...mockIssue,
      labels: [
        { name: "L1", color: "red" },
        { name: "L2", color: "blue" },
        { name: "L3", color: "green" },
        { name: "Hidden1", color: "yellow" },
        { name: "Hidden2", color: "purple" },
      ],
    };
    render(<IssueCard issue={issueWithManyLabels} onDragStart={mockOnDragStart} />);

    // The text "+2" should be present
    const hiddenCount = screen.getByText("+2");
    expect(hiddenCount).toBeInTheDocument();

    await user.hover(hiddenCount);

    const tooltipText = await screen.findByRole("tooltip", { name: "Hidden1, Hidden2" });
    expect(tooltipText).toBeInTheDocument();
  });
});
