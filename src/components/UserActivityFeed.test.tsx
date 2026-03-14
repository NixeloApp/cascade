import type { Id } from "@convex/_generated/dataModel";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { formatRelativeTime } from "@/lib/dates";
import { DAY, HOUR, MINUTE, WEEK } from "@/lib/time";
import { render, screen } from "@/test/custom-render";
import { UserActivityFeed } from "./UserActivityFeed";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/lib/dates", () => ({
  formatRelativeTime: vi.fn(),
}));

vi.mock("./ui/Card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("./ui/EmptyState", () => ({
  EmptyState: ({ title, description }: { title: string; description: string }) => (
    <div>
      <div>{title}</div>
      <div>{description}</div>
    </div>
  ),
}));

vi.mock("./ui/Flex", () => ({
  Flex: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  FlexItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("./ui/Icon", () => ({
  Icon: () => <span data-testid="activity-icon" />,
}));

vi.mock("./ui/Skeleton", () => ({
  SkeletonList: ({ items }: { items: number }) => <div>{`skeleton-list:${items}`}</div>,
}));

vi.mock("./ui/Stack", () => ({
  Stack: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("./ui/Typography", () => ({
  Typography: ({
    children,
    as,
    className,
  }: {
    children: ReactNode;
    as?: "code" | "span";
    className?: string;
  }) => {
    const Component = as ?? "div";
    return <Component className={className}>{children}</Component>;
  },
}));

const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockFormatRelativeTime = vi.mocked(formatRelativeTime);

const userId = "user_1" as Id<"users">;
const now = Date.UTC(2026, 2, 14, 15, 0, 0);

let currentActivities:
  | Array<{
      _id: Id<"issueActivity">;
      action: string;
      field?: string;
      oldValue?: string;
      newValue?: string;
      _creationTime: number;
      issueKey: string;
      issueTitle: string;
      projectKey: string;
      projectName: string;
    }>
  | undefined;

describe("UserActivityFeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    mockFormatRelativeTime.mockImplementation((timestamp) => `relative:${timestamp}`);
    currentActivities = undefined;
    mockUseAuthenticatedQuery.mockImplementation(() => currentActivities);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the skeleton list while activities are loading", () => {
    render(<UserActivityFeed userId={userId} />);

    expect(screen.getByText("skeleton-list:5")).toBeInTheDocument();
  });

  it("renders the empty state when the user has no recent activity", () => {
    currentActivities = [];

    render(<UserActivityFeed userId={userId} />);

    expect(screen.getByText("No recent activity")).toBeInTheDocument();
    expect(screen.getByText("Updates appear here as work moves.")).toBeInTheDocument();
  });

  it("groups activities by date bucket, formats messages, and hides project info when requested", () => {
    currentActivities = [
      {
        _id: "activity_today" as Id<"issueActivity">,
        action: "created",
        _creationTime: now - 30 * MINUTE,
        issueKey: "CORE-1",
        issueTitle: "Launch billing export",
        projectKey: "CORE",
        projectName: "Core Platform",
      },
      {
        _id: "activity_yesterday" as Id<"issueActivity">,
        action: "updated",
        field: "status",
        oldValue: "Todo",
        newValue: "In Progress",
        _creationTime: now - DAY,
        issueKey: "CORE-2",
        issueTitle: "Triage invoices",
        projectKey: "CORE",
        projectName: "Core Platform",
      },
      {
        _id: "activity_week" as Id<"issueActivity">,
        action: "linked",
        field: "dependency",
        _creationTime: now - (3 * DAY + HOUR),
        issueKey: "PORTAL-4",
        issueTitle: "Coordinate portal release",
        projectKey: "PORTAL",
        projectName: "Client Portal",
      },
      {
        _id: "activity_older" as Id<"issueActivity">,
        action: "updated",
        field: "assignee",
        oldValue: "Alex",
        newValue: "Sam",
        _creationTime: now - WEEK - DAY,
        issueKey: "OPS-8",
        issueTitle: "Audit support load",
        projectKey: "OPS",
        projectName: "Operations",
      },
    ];

    const { rerender } = render(<UserActivityFeed userId={userId} limit={10} />);

    expect(mockUseAuthenticatedQuery).toHaveBeenCalledWith(expect.anything(), {
      userId,
      limit: 10,
    });
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Yesterday")).toBeInTheDocument();
    expect(screen.getByText("This Week")).toBeInTheDocument();
    expect(screen.getByText("Older")).toBeInTheDocument();
    expect(screen.getByText("created")).toBeInTheDocument();
    expect(screen.getByText('changed status from "Todo" to "In Progress"')).toBeInTheDocument();
    expect(screen.getByText("linked dependency")).toBeInTheDocument();
    expect(screen.getByText('reassigned from "Alex" to "Sam"')).toBeInTheDocument();
    expect(screen.getByText("Launch billing export")).toBeInTheDocument();
    expect(screen.getAllByText("in Core Platform").length).toBeGreaterThan(0);
    expect(screen.getByText(`relative:${now - 30 * MINUTE}`)).toBeInTheDocument();
    expect(screen.getAllByTestId("activity-icon")).toHaveLength(4);

    rerender(<UserActivityFeed userId={userId} showProjectInfo={false} />);

    expect(screen.queryByText("in Core Platform")).not.toBeInTheDocument();
  });
});
