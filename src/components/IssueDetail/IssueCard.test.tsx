import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TEST_IDS } from "@/lib/test-ids";
import { render, screen } from "@/test/custom-render";
import { IssueCard } from "./IssueCard";

// Create mock icon that's hoisted to be available in vi.mock
const { MockIcon } = vi.hoisted(() => ({
  MockIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
}));

// Mock issue utilities
vi.mock("@/lib/issue-utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/issue-utils")>();
  return {
    ...actual,
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
  };
});

describe("IssueCard", () => {
  const mockIssue = {
    _id: "issue-1" as Id<"issues">,
    key: "TEST-123",
    title: "Fix critical bug in authentication",
    type: "bug" as const,
    priority: "high" as const,
    order: 0,
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
    render(<IssueCard issue={mockIssue} status="todo" />);

    // Story points badge contains "5 pts" - use regex to handle whitespace
    expect(screen.getByText(/5\s*pts/)).toBeInTheDocument();
  });

  it("should not display story points when undefined", () => {
    const issueWithoutPoints = { ...mockIssue, storyPoints: undefined };
    render(<IssueCard issue={issueWithoutPoints} status="todo" />);

    expect(screen.queryByText(/pts/)).not.toBeInTheDocument();
  });

  it("should display decimal story points", () => {
    const issueWithDecimalPoints = { ...mockIssue, storyPoints: 3.5 };
    render(<IssueCard issue={issueWithDecimalPoints} status="todo" />);

    // Story points badge contains "3.5 pts" - use regex to handle whitespace
    expect(screen.getByText(/3\.5\s*pts/)).toBeInTheDocument();
  });

  it("should display tooltip with assignee name on hover", async () => {
    const user = userEvent.setup();
    render(<IssueCard issue={mockIssue} status="todo" />);

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
    render(<IssueCard issue={issueWithManyLabels} status="todo" />);

    // The text "+2" should be present
    const hiddenCount = screen.getByText("+2");
    expect(hiddenCount).toBeInTheDocument();

    await user.hover(hiddenCount);

    const tooltipText = await screen.findByRole("tooltip", { name: "Hidden1, Hidden2" });
    expect(tooltipText).toBeInTheDocument();
  });

  it("should render metadata icons but hide them from accessibility tree (no redundant tab stops)", () => {
    render(<IssueCard issue={mockIssue} status="todo" />);

    // Priority icon (find via Test ID as it is hidden from a11y)
    const priorityIcon = screen.getByTestId(TEST_IDS.ISSUE.PRIORITY);
    expect(priorityIcon).toBeInTheDocument();
    // Ensure it is NOT inside a button
    expect(priorityIcon.closest("button")).not.toBeInTheDocument();
    // Ensure it is hidden from screen readers (part of aria-hidden container)
    expect(priorityIcon.closest('[aria-hidden="true"]')).toBeInTheDocument();

    // Assignee (find via alt text with hidden: true)
    // @ts-expect-error - hidden option is supported by testing-library but types might be strict
    const assigneeImg = screen.getByAltText("Alice Johnson", { hidden: true });
    expect(assigneeImg).toBeInTheDocument();
    expect(assigneeImg.closest("button")).not.toBeInTheDocument();
    expect(assigneeImg.closest('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it("should render fallback assignee avatar hidden from accessibility", () => {
    const issueWithoutAvatar = {
      ...mockIssue,
      // biome-ignore lint/style/noNonNullAssertion: testing mock data
      assignee: { ...mockIssue.assignee!, image: undefined },
    };
    render(<IssueCard issue={issueWithoutAvatar} status="todo" />);

    // Fallback avatar should be hidden from accessibility
    expect(screen.queryByLabelText("Alice Johnson")).not.toBeInTheDocument();
    // But verify it exists in DOM (using querySelector looking for initials)
    const initials = screen.getByText("A", { selector: "div" });
    expect(initials).toBeInTheDocument();
    expect(initials.closest('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it("should trigger onClick when clicking on interactive elements (mouse users)", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<IssueCard issue={mockIssue} status="todo" onClick={handleClick} />);

    // Click Priority Icon (using testId)
    await user.click(screen.getByTestId(TEST_IDS.ISSUE.PRIORITY));
    expect(handleClick).toHaveBeenCalledTimes(1);

    // Click Assignee (using alt text with hidden: true)
    // @ts-expect-error - hidden option is supported by testing-library but types might be strict
    await user.click(screen.getByAltText("Alice Johnson", { hidden: true }));
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it("should have a descriptive accessible label for screen readers including labels", () => {
    render(<IssueCard issue={mockIssue} status="todo" />);

    // Updated expectation to include labels
    const expectedLabel =
      "Bug TEST-123: Fix critical bug in authentication, High priority, assigned to Alice Johnson, 5 points, Labels: backend, urgent";
    const overlayButton = screen.getByLabelText(expectedLabel);
    expect(overlayButton).toBeInTheDocument();
  });

  it("should include 0 story points in the accessible label", () => {
    const issueWithZeroPoints = { ...mockIssue, storyPoints: 0 };
    render(<IssueCard issue={issueWithZeroPoints} status="todo" />);

    const expectedLabel =
      "Bug TEST-123: Fix critical bug in authentication, High priority, assigned to Alice Johnson, 0 points, Labels: backend, urgent";
    expect(screen.getByLabelText(expectedLabel)).toBeInTheDocument();
  });
});
