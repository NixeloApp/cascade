import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { IssuesCalendarView } from "./IssuesCalendarView";

// Mock API
vi.mock("@convex/_generated/api", () => ({
  api: {
    issues: {
      listIssuesByDateRange: "api.issues.listIssuesByDateRange",
    },
  },
}));

// Mock Convex React
const mockUseQuery = vi.fn();
vi.mock("convex/react", () => ({
  useQuery: (query: any, args: any) => mockUseQuery(query, args),
}));

// Mock Utils
vi.mock("@/lib/issue-utils", () => ({
  getPriorityColor: vi.fn(() => "bg-red-500"),
}));

// Mock IssueDetailModal to avoid complex rendering
vi.mock("./IssueDetailModal", () => ({
  IssueDetailModal: () => <div data-testid="issue-detail-modal" />,
}));

describe("IssuesCalendarView", () => {
  const projectId = "project-123" as Id<"projects">;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render calendar header and navigation", () => {
    mockUseQuery.mockReturnValue([]);
    render(<IssuesCalendarView projectId={projectId} />);

    expect(screen.getByText("Issues Calendar")).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByLabelText("Previous month")).toBeInTheDocument();
    expect(screen.getByLabelText("Next month")).toBeInTheDocument();
  });

  it("should display tooltip for previous month button", async () => {
    mockUseQuery.mockReturnValue([]);
    const user = userEvent.setup();
    render(<IssuesCalendarView projectId={projectId} />);

    const prevButton = screen.getByLabelText("Previous month");
    await user.hover(prevButton);
    expect(await screen.findByRole("tooltip", { name: "Previous month" })).toBeInTheDocument();
  });

  it("should display tooltip for next month button", async () => {
    mockUseQuery.mockReturnValue([]);
    const user = userEvent.setup();
    render(<IssuesCalendarView projectId={projectId} />);

    const nextButton = screen.getByLabelText("Next month");
    await user.hover(nextButton);
    expect(await screen.findByRole("tooltip", { name: "Next month" })).toBeInTheDocument();
  });

  it("should display issues with tooltips", async () => {
    const today = new Date();
    // Ensure the issue has a dueDate so it appears on the calendar
    const issueDate = today.getTime();

    const mockIssue = {
      _id: "issue-1" as Id<"issues">,
      title: "Test Issue with Tooltip",
      type: "bug",
      priority: "high",
      dueDate: issueDate,
    };

    mockUseQuery.mockReturnValue([mockIssue]);
    const user = userEvent.setup();
    render(<IssuesCalendarView projectId={projectId} />);

    // Issue should be visible (by title text or truncated text)
    // The component renders: <IssueTypeIcon /> {issue.title}
    expect(screen.getByText(/Test Issue with Tooltip/)).toBeInTheDocument();

    const issueButton = screen.getByText(/Test Issue with Tooltip/).closest("button");
    expect(issueButton).toBeInTheDocument();

    if (issueButton) {
      await user.hover(issueButton);
      expect(
        await screen.findByRole("tooltip", { name: "Test Issue with Tooltip" }),
      ).toBeInTheDocument();
    }
  });
});
