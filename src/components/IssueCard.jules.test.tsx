import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { IssueCard } from "./IssueCard";

// Mock issue utilities
vi.mock("@/lib/issue-utils", () => ({
  getTypeLabel: vi.fn(() => "Task"),
  getPriorityColor: vi.fn(() => "text-priority-medium"),
  getIssueAccessibleLabel: vi.fn(() => "Task TEST-123: Title"),
  ISSUE_TYPE_ICONS: {
    bug: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
    task: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  },
  PRIORITY_ICONS: {
    medium: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  },
}));

describe("IssueCard (Jules additions)", () => {
  const mockIssue = {
    _id: "issue-1" as Id<"issues">,
    key: "TEST-123",
    title: "This is a very long title that should be truncated",
    type: "task" as const,
    priority: "medium" as const,
    order: 0,
    labels: [],
    updatedAt: Date.now(),
  };

  it("should display tooltip with full title on hover", async () => {
    const user = userEvent.setup();
    render(<IssueCard issue={mockIssue} status="todo" />);

    const titleElement = screen.getByText(mockIssue.title);
    expect(titleElement).toBeInTheDocument();

    // Hover over the title
    await user.hover(titleElement);

    // Expect tooltip to appear with the title
    // Note: Radix Tooltip might take some time or need specific setup in tests,
    // but usually finding by role tooltip works if animations are disabled or handled
    // The tooltip is intentionally hidden from the accessibility tree (aria-hidden)
    // because the card's accessible name already includes this information.
    const tooltip = await screen.findByRole("tooltip", { hidden: true });
    expect(tooltip).toHaveTextContent(mockIssue.title);
  });

  it("should trigger onClick when clicking on the title", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<IssueCard issue={mockIssue} status="todo" onClick={handleClick} />);

    const titleElement = screen.getByText(mockIssue.title);

    // Click the title
    await user.click(titleElement);

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(mockIssue._id);
  });
});
