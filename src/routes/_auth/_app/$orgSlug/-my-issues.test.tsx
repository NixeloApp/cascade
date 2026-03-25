import type { Id } from "@convex/_generated/dataModel";
import { SECOND } from "@convex/lib/timeUtils";
import userEvent from "@testing-library/user-event";
import { usePaginatedQuery } from "convex/react";
import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { TEST_IDS } from "@/lib/test-ids";
import { render, screen, within } from "@/test/custom-render";
import { MyIssuesBoardPage } from "./my-issues";

declare global {
  interface Window {
    __NIXELO_E2E_MY_ISSUES_LOADING__?: boolean;
  }
}

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="/">{children}</a>,
  createFileRoute: () => () => ({}),
}));

vi.mock("convex/react", () => ({
  usePaginatedQuery: vi.fn(),
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/hooks/useOrgContext", () => ({
  useOrganization: vi.fn(),
}));

vi.mock("@/components/layout", () => ({
  PageLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PageHeader: ({ title, actions }: { title: string; actions?: ReactNode }) => (
    <div>
      <div>{title}</div>
      <div>{actions}</div>
    </div>
  ),
  PageContent: ({
    children,
    isLoading,
    isEmpty,
    emptyState,
    className,
  }: {
    children: ReactNode;
    isLoading?: boolean;
    isEmpty?: boolean;
    emptyState?: {
      title: string;
      description?: string;
      actions?: ReactNode;
    };
    className?: string;
  }) =>
    isLoading ? (
      <div>Loading</div>
    ) : isEmpty ? (
      <div data-testid={TEST_IDS.PAGE.EMPTY_STATE}>
        <div>{emptyState?.title}</div>
        {emptyState?.description ? <div>{emptyState.description}</div> : null}
        {emptyState?.actions}
      </div>
    ) : (
      <div className={className}>{children}</div>
    ),
}));

vi.mock("@/components/ui/Badge", () => ({
  Badge: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Button", () => ({
  Button: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/Card", () => ({
  Card: ({ children, "data-testid": testId }: { children: ReactNode; "data-testid"?: string }) => (
    <div data-testid={testId}>{children}</div>
  ),
}));

vi.mock("@/components/ui/CardSection", () => ({
  CardSection: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Flex", () => ({
  Flex: ({ children, "data-testid": testId }: { children: ReactNode; "data-testid"?: string }) => (
    <div data-testid={testId}>{children}</div>
  ),
}));

const SegmentedControlContext = createContext<{
  onValueChange?: (value: string) => void;
  value: string;
} | null>(null);

vi.mock("@/components/ui/SegmentedControl", () => ({
  SegmentedControl: ({
    children,
    onValueChange,
    value,
    "data-testid": testId,
  }: {
    children: ReactNode;
    onValueChange?: (value: string) => void;
    value: string;
    "data-testid"?: string;
  }) => (
    <div data-testid={testId}>
      <SegmentedControlContext.Provider value={{ value, onValueChange }}>
        {children}
      </SegmentedControlContext.Provider>
    </div>
  ),
  SegmentedControlItem: ({ children, value }: { children: ReactNode; value: string }) => {
    const context = useContext(SegmentedControlContext);
    if (!context) {
      return null;
    }

    return (
      <button type="button" onClick={() => context.onValueChange?.(value)}>
        {children}
      </button>
    );
  },
}));

const SelectContext = createContext<{
  onValueChange?: (value: string) => void;
  value: string;
} | null>(null);

vi.mock("@/components/ui/Select", () => ({
  Select: ({
    children,
    onValueChange,
    value,
  }: {
    children: ReactNode;
    onValueChange?: (value: string) => void;
    value: string;
  }) => (
    <SelectContext.Provider value={{ value, onValueChange }}>{children}</SelectContext.Provider>
  ),
  SelectTrigger: ({
    children,
    "data-testid": testId,
  }: {
    children: ReactNode;
    "data-testid"?: string;
  }) => (
    <button type="button" data-testid={testId}>
      {children}
    </button>
  ),
  SelectValue: () => {
    const context = useContext(SelectContext);
    return <span>{context?.value}</span>;
  },
  SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: ReactNode; value: string }) => {
    const context = useContext(SelectContext);
    return (
      <button type="button" role="option" onClick={() => context?.onValueChange?.(value)}>
        {children}
      </button>
    );
  },
}));

vi.mock("@/components/ui/Stack", () => ({
  Stack: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Typography", () => ({
  Typography: ({
    children,
    "data-testid": testId,
  }: {
    children: ReactNode;
    "data-testid"?: string;
  }) => <div data-testid={testId}>{children}</div>,
}));

const mockUsePaginatedQuery = vi.mocked(usePaginatedQuery);
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockUseOrganization = vi.mocked(useOrganization);

const BASE_RESULTS = [
  {
    _id: "issue-1",
    _creationTime: 1,
    assigneeName: "Alex",
    dueDate: Date.now() + SECOND,
    key: "DEMO-1",
    priority: "high",
    projectId: "project-1",
    projectKey: "DEMO",
    projectName: "Demo Project",
    reporterName: "Alex",
    status: "in-progress",
    title: "Fix login timeout on mobile",
    type: "bug",
    updatedAt: 1,
  },
  {
    _id: "issue-2",
    _creationTime: 2,
    assigneeName: "Alex",
    key: "OPS-2",
    priority: "medium",
    projectId: "project-2",
    projectKey: "OPS",
    projectName: "Ops Hub",
    reporterName: "Alex",
    status: "todo",
    title: "Review deployment checklist",
    type: "task",
    updatedAt: 2,
  },
  {
    _id: "issue-3",
    _creationTime: 3,
    assigneeName: "Alex",
    dueDate: Date.now() + 2 * SECOND,
    key: "DEMO-3",
    priority: "highest",
    projectId: "project-1",
    projectKey: "DEMO",
    projectName: "Demo Project",
    reporterName: "Alex",
    status: "todo",
    title: "Ship launch checklist",
    type: "story",
    updatedAt: 3,
  },
];

function mockMyIssuesQueries({
  groupCounts,
  results = BASE_RESULTS,
  status = "Exhausted",
}: {
  groupCounts?: {
    project: Array<{ count: number; key: string; label: string }>;
    status: Array<{ count: number; key: string; label: string }>;
  };
  results?: typeof BASE_RESULTS;
  status?: "CanLoadMore" | "Exhausted" | "LoadingFirstPage";
}) {
  const resolvedGroupCounts = groupCounts ?? {
    project: [
      { key: "DEMO", label: "Demo Project", count: 2 },
      { key: "OPS", label: "Ops Hub", count: 1 },
    ],
    status: [
      { key: "todo", label: "todo", count: 2 },
      { key: "in-progress", label: "in-progress", count: 1 },
    ],
  };

  if (status === "LoadingFirstPage") {
    mockUsePaginatedQuery.mockReturnValue({
      isLoading: true,
      loadMore: vi.fn(),
      results,
      status,
    });
  } else {
    mockUsePaginatedQuery.mockReturnValue({
      isLoading: false,
      loadMore: vi.fn(),
      results,
      status,
    });
  }
  mockUseAuthenticatedQuery.mockImplementation((_query, args) =>
    args?.groupBy === "project" ? resolvedGroupCounts.project : resolvedGroupCounts.status,
  );
}

describe("MyIssuesBoardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.__NIXELO_E2E_MY_ISSUES_LOADING__ = false;

    mockUseOrganization.mockReturnValue({
      billingEnabled: true,
      orgSlug: "acme",
      organizationId: "org-1" as Id<"organizations">,
      organizationName: "Acme",
      userRole: "owner",
    });

    mockMyIssuesQueries({});
  });

  it("shows the true empty state when there are no assigned issues", () => {
    mockMyIssuesQueries({
      groupCounts: {
        project: [],
        status: [],
      },
      results: [],
    });

    render(<MyIssuesBoardPage />);

    expect(screen.getByTestId(TEST_IDS.PAGE.EMPTY_STATE)).toBeInTheDocument();
    expect(screen.getByText("No issues assigned to you yet")).toBeInTheDocument();
  });

  it("shows a filtered empty state and clears filters back to the board", async () => {
    const user = userEvent.setup();

    render(<MyIssuesBoardPage />);

    await user.click(screen.getByRole("option", { name: "Lowest" }));

    const filteredEmptyState = screen.getByTestId(TEST_IDS.PAGE.EMPTY_STATE);
    expect(filteredEmptyState).toBeInTheDocument();
    expect(screen.getByText("No issues match these filters")).toBeInTheDocument();

    await user.click(within(filteredEmptyState).getByRole("button", { name: "Clear filters" }));

    expect(screen.queryByTestId(TEST_IDS.PAGE.EMPTY_STATE)).not.toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.MY_ISSUES.CONTENT)).toBeInTheDocument();
    expect(screen.getAllByTestId(TEST_IDS.MY_ISSUES.COLUMN)).toHaveLength(2);
  });

  it("switches to project grouping and keeps server-backed column labels", async () => {
    const user = userEvent.setup();

    render(<MyIssuesBoardPage />);

    await user.click(screen.getByRole("button", { name: "By Project" }));

    const columns = screen.getAllByTestId(TEST_IDS.MY_ISSUES.COLUMN);
    expect(columns).toHaveLength(2);
    expect(screen.getByText("Demo Project")).toBeInTheDocument();
    expect(screen.getByText("Ops Hub")).toBeInTheDocument();
  });

  it("honors the loading override for screenshot capture", () => {
    window.__NIXELO_E2E_MY_ISSUES_LOADING__ = true;

    render(<MyIssuesBoardPage />);

    expect(screen.getByText("Loading")).toBeInTheDocument();
  });
});
