import type { Id } from "@convex/_generated/dataModel";
import { act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { showError } from "@/lib/toast";
import { render, screen } from "@/test/custom-render";
import { IssuesCalendarView } from "./IssuesCalendarView";

// Mock API
vi.mock("@convex/_generated/api", () => ({
  api: {
    issues: {
      listIssuesByDateRange: "api.issues.listIssuesByDateRange",
      update: "api.issues.update",
    },
  },
}));

// Mock Convex React
const mockUseQuery = vi.fn();
const mockUpdateIssue = vi.fn();
const mockUseMutation = vi.fn(() => mockUpdateIssue);
vi.mock("convex/react", () => ({
  useQuery: (query: unknown, args: unknown) => mockUseQuery(query, args),
  useMutation: () => mockUseMutation(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
}));

// Mock Utils
vi.mock("@/lib/issue-utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/issue-utils")>();
  return {
    ...actual,
    getPriorityColor: vi.fn(() => "bg-red-500"),
  };
});

// Mock IssueDetailModal to avoid complex rendering
vi.mock("./IssueDetailModal", () => ({
  IssueDetailModal: () => <div data-testid="issue-detail-modal" />,
}));

describe("IssuesCalendarView", () => {
  const projectId = "project-123" as Id<"projects">;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateIssue.mockResolvedValue(undefined);
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
    // The component renders: <Icon /> {issue.title}
    expect(screen.getByText(/Test Issue with Tooltip/)).toBeInTheDocument();

    const issueButton = screen.getByText(/Test Issue with Tooltip/).closest("button");
    expect(issueButton).toBeInTheDocument();

    if (issueButton) {
      await user.hover(issueButton);
      // canEdit defaults to true, so tooltip shows "title - Drag to reschedule"
      expect(
        await screen.findByRole("tooltip", {
          name: "Test Issue with Tooltip - Drag to reschedule",
        }),
      ).toBeInTheDocument();
    }
  });

  it("shows an error toast when rescheduling fails", async () => {
    const today = new Date();
    const todayDay = today.getDate();
    const issueDate = today.getTime();
    const error = new Error("Update failed");
    mockUpdateIssue.mockRejectedValueOnce(error);

    const mockIssue = {
      _id: "issue-1" as Id<"issues">,
      title: "Draggable Issue",
      type: "bug",
      priority: "high",
      dueDate: issueDate,
    };

    mockUseQuery.mockReturnValue([mockIssue]);
    render(<IssuesCalendarView projectId={projectId} />);

    const issueButton = screen.getByText("Draggable Issue").closest("button");
    expect(issueButton).toBeInTheDocument();
    const dayCell = screen.getByTestId(`calendar-day-${todayDay}`);

    const dataTransfer = {
      effectAllowed: "move",
      dropEffect: "move",
      setData: vi.fn(),
      getData: vi.fn(),
    };

    if (issueButton) {
      await act(async () => {
        fireEvent.dragStart(issueButton, { dataTransfer });
      });
      await act(async () => {
        await Promise.resolve();
      });
      await act(async () => {
        fireEvent.drop(dayCell, { dataTransfer });
      });
    }

    expect(showError).toHaveBeenCalledWith(error, "Failed to reschedule issue");
  });
});
