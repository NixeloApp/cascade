import type { Id } from "@convex/_generated/dataModel";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { formatRelativeTime } from "@/lib/dates";
import { TEST_IDS } from "@/lib/test-ids";
import { render, screen } from "@/test/custom-render";
import { ActivityFeed } from "./ActivityFeed";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/lib/dates", () => ({
  formatRelativeTime: vi.fn(),
}));

vi.mock("./ui/Card", () => ({
  Card: ({
    children,
    className,
    "data-testid": testId,
  }: {
    children: ReactNode;
    className?: string;
    "data-testid"?: string;
    recipe?: string;
    padding?: string;
    radius?: string;
  }) => (
    <div className={className} data-testid={testId}>
      {children}
    </div>
  ),
  getCardRecipeClassName: (recipe: string) => `recipe-${recipe}`,
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
  Flex: ({
    children,
    className,
    "data-testid": testId,
  }: {
    children: ReactNode;
    className?: string;
    "data-testid"?: string;
    direction?: string;
    gap?: string;
    align?: string;
    justify?: string;
  }) => (
    <div className={className} data-testid={testId}>
      {children}
    </div>
  ),
  FlexItem: ({
    children,
    className,
  }: {
    children: ReactNode;
    className?: string;
    flex?: string;
  }) => <div className={className}>{children}</div>,
}));

vi.mock("./ui/Icon", () => ({
  Icon: ({ icon }: { icon: LucideIcon; size?: string }) => (
    <span>{icon.displayName ?? "icon"}</span>
  ),
}));

vi.mock("./ui/Skeleton", () => ({
  SkeletonList: ({ items }: { items: number }) => <div>{`skeleton-list:${items}`}</div>,
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
    variant?: string;
  }) => {
    const Component = as ?? "div";
    return <Component className={className}>{children}</Component>;
  },
}));

const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockFormatRelativeTime = vi.mocked(formatRelativeTime);

const projectId = "project_1" as Id<"projects">;

let activities:
  | Array<{
      _id: string;
      action: string;
      field?: string;
      oldValue?: string;
      newValue?: string;
      issueKey?: string;
      userName: string;
      _creationTime: number;
    }>
  | undefined;

describe("ActivityFeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    activities = undefined;
    mockUseAuthenticatedQuery.mockImplementation(() => activities);
    mockFormatRelativeTime.mockImplementation((timestamp) => `relative:${timestamp}`);
  });

  it("renders the loading skeleton list while activity is unresolved", () => {
    render(<ActivityFeed projectId={projectId} />);

    expect(screen.getByText("skeleton-list:5")).toBeInTheDocument();
    expect(mockUseAuthenticatedQuery).toHaveBeenCalledWith(expect.anything(), {
      projectId,
      limit: 50,
    });
  });

  it("renders the empty state when there is no project activity", () => {
    activities = [];

    render(<ActivityFeed projectId={projectId} compact={true} />);

    expect(screen.getByTestId(TEST_IDS.ACTIVITY.EMPTY_STATE)).toBeInTheDocument();
    expect(screen.getByText("No activity yet")).toBeInTheDocument();
    expect(screen.getByText("Activity will appear here as work progresses")).toBeInTheDocument();
  });

  it("renders activity entries, formats messages, and hides the rail/details in compact mode", () => {
    activities = [
      {
        _id: "activity_created",
        action: "created",
        issueKey: "APP-1",
        userName: "Taylor Rivera",
        _creationTime: 1_700_000_000_000,
      },
      {
        _id: "activity_status",
        action: "updated",
        field: "status",
        oldValue: "Todo",
        newValue: "In Progress",
        issueKey: "APP-2",
        userName: "Avery Stone",
        _creationTime: 1_700_000_100_000,
      },
      {
        _id: "activity_assignee",
        action: "updated",
        field: "assignee",
        newValue: "Sam Lee",
        issueKey: "APP-3",
        userName: "Jordan Kim",
        _creationTime: 1_700_000_200_000,
      },
      {
        _id: "activity_linked",
        action: "linked",
        field: "dependency",
        issueKey: "APP-4",
        userName: "Morgan Blake",
        _creationTime: 1_700_000_300_000,
      },
    ];

    const { container, rerender } = render(<ActivityFeed projectId={projectId} limit={10} />);

    expect(mockUseAuthenticatedQuery).toHaveBeenCalledWith(expect.anything(), {
      projectId,
      limit: 10,
    });
    expect(screen.getByTestId(TEST_IDS.ACTIVITY.FEED)).toBeInTheDocument();
    expect(screen.getAllByTestId(TEST_IDS.ACTIVITY.ENTRY)).toHaveLength(4);
    expect(screen.getByText("Taylor Rivera")).toBeInTheDocument();
    expect(screen.getByText("created")).toBeInTheDocument();
    expect(screen.getByText("APP-1")).toBeInTheDocument();
    expect(screen.getByText("changed status from Todo to In Progress")).toBeInTheDocument();
    expect(screen.getByText("status: In Progress")).toBeInTheDocument();
    expect(screen.getByText("assigned to Sam Lee")).toBeInTheDocument();
    expect(screen.getByText("assignee: Sam Lee")).toBeInTheDocument();
    expect(screen.getByText("linked dependency")).toBeInTheDocument();
    expect(screen.getByText("relative:1700000000000")).toBeInTheDocument();
    expect(
      container.querySelector(".absolute.left-3.top-6.bottom-6.w-px.bg-ui-border"),
    ).toBeInTheDocument();

    rerender(<ActivityFeed projectId={projectId} compact={true} />);

    expect(
      container.querySelector(".absolute.left-3.top-6.bottom-6.w-px.bg-ui-border"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("status: In Progress")).not.toBeInTheDocument();
    expect(screen.queryByText("assignee: Sam Lee")).not.toBeInTheDocument();
  });
});
