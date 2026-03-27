import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { usePaginatedQuery } from "convex/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IssueViewModeProvider, useIssueViewMode } from "@/contexts/IssueViewModeContext";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { TEST_IDS } from "@/lib/test-ids";
import { render, screen } from "@/test/custom-render";
import { AllIssuesPage } from "./index";

vi.mock("@tanstack/react-router", () => ({
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
  PageStack: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PageControls: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PageControlsRow: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PageControlsGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PageHeader: ({
    title,
    description,
    actions,
  }: {
    title: string;
    description?: string;
    actions?: ReactNode;
  }) => (
    <div>
      <div>{title}</div>
      {description ? <div>{description}</div> : null}
      <div>{actions}</div>
    </div>
  ),
  PageContent: ({
    children,
    isLoading,
    emptyState,
  }: {
    children: ReactNode;
    isLoading?: boolean;
    emptyState?: { title: string } | null;
  }) =>
    isLoading ? (
      <div data-testid="issues-page-loading">Loading</div>
    ) : (
      <div data-testid={emptyState ? TEST_IDS.PAGE.EMPTY_STATE : undefined}>
        {emptyState ? emptyState.title : children}
      </div>
    ),
}));

vi.mock("@/components/ui/Button", () => ({
  Button: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/Card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Flex", () => ({
  Flex: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  FlexItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Grid", () => ({
  Grid: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Input", () => ({
  Input: ({
    "data-testid": testId,
    value,
    onChange,
    placeholder,
    "aria-label": ariaLabel,
  }: {
    "data-testid"?: string;
    value?: string;
    onChange?: (event: { target: { value: string } }) => void;
    placeholder?: string;
    "aria-label"?: string;
  }) => (
    <input
      data-testid={testId}
      aria-label={ariaLabel}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange?.({ target: { value: event.target.value } })}
    />
  ),
}));

vi.mock("@/components/ui/Select", () => ({
  Select: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({
    children,
    "aria-label": ariaLabel,
    "data-testid": testId,
  }: {
    children: ReactNode;
    "aria-label"?: string;
    "data-testid"?: string;
  }) => (
    <button type="button" aria-label={ariaLabel} data-testid={testId}>
      {children}
    </button>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/Kanban/ViewModeToggle", () => ({
  ViewModeToggle: () => {
    const { viewMode, toggleViewMode } = useIssueViewMode();
    return (
      <button type="button" onClick={toggleViewMode}>
        {viewMode === "modal" ? "Switch to side panel view" : "Switch to modal view"}
      </button>
    );
  },
}));

vi.mock("@/components/IssueDetail", () => ({
  CreateIssueModal: ({ open }: { open: boolean }) =>
    open ? (
      <div data-testid={TEST_IDS.ISSUE.CREATE_MODAL}>
        <input data-testid={TEST_IDS.ISSUE.CREATE_TITLE_INPUT} />
        Create issue modal
      </div>
    ) : null,
  IssueCard: ({
    issue,
    onClick,
  }: {
    issue: { _id: Id<"issues">; key: string; title: string };
    onClick?: (id: Id<"issues">) => void;
  }) => (
    <button type="button" onClick={() => onClick?.(issue._id)}>
      {`${issue.key}: ${issue.title}`}
    </button>
  ),
}));

vi.mock("@/components/IssueDetailViewer", () => ({
  IssueDetailViewer: ({ issueId, open }: { issueId: Id<"issues">; open: boolean }) => {
    const { viewMode } = useIssueViewMode();
    return open ? <div>{`viewer:${viewMode}:${issueId}`}</div> : null;
  },
}));

const mockUsePaginatedQuery = vi.mocked(usePaginatedQuery);
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockUseOrganization = vi.mocked(useOrganization);

describe("AllIssuesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    mockUseOrganization.mockReturnValue({
      orgSlug: "acme",
      organizationId: "org-1" as Id<"organizations">,
      organizationName: "Acme",
      userRole: "owner",
      billingEnabled: true,
    });
    mockUseAuthenticatedQuery.mockImplementation((_, args) => {
      if (args === "skip") {
        return undefined;
      }

      if (typeof args === "object" && args !== null && "query" in args) {
        return [
          {
            _id: "issue-1" as Id<"issues">,
            key: "ACME-1",
            title: "Capture issues side panel",
            status: { name: "To Do", color: "gray" },
          },
        ];
      }

      return [{ id: "todo", name: "To Do" }];
    });
    mockUsePaginatedQuery.mockReturnValue({
      results: [
        {
          _id: "issue-1" as Id<"issues">,
          key: "ACME-1",
          title: "Capture issues side panel",
          status: { name: "To Do", color: "gray" },
        },
      ],
      status: "Exhausted",
      loadMore: vi.fn(),
      isLoading: false,
    });
  });

  it("renders the view-mode toggle in the issues page header actions", () => {
    render(
      <IssueViewModeProvider>
        <AllIssuesPage />
      </IssueViewModeProvider>,
    );

    expect(screen.getByRole("button", { name: "Switch to side panel view" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Issue" })).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.ISSUE.SEARCH_INPUT)).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.ISSUE.STATUS_FILTER)).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.ISSUE.PRIORITY_FILTER)).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.ISSUE.TYPE_FILTER)).toBeInTheDocument();
  });

  it("opens the selected issue through the peek viewer when the stored preference is side panel", async () => {
    localStorage.setItem("issue-view-mode", "peek");
    const user = userEvent.setup();

    render(
      <IssueViewModeProvider>
        <AllIssuesPage />
      </IssueViewModeProvider>,
    );

    await user.click(screen.getByRole("button", { name: "ACME-1: Capture issues side panel" }));

    expect(screen.getByText("viewer:peek:issue-1")).toBeInTheDocument();
  });

  it("shows the filtered empty-state hook and summary when search returns no issues", async () => {
    mockUseAuthenticatedQuery.mockImplementation((_, args) => {
      if (args === "skip") {
        return undefined;
      }

      if (typeof args === "object" && args !== null && "query" in args) {
        return [];
      }

      return [{ id: "todo", name: "To Do" }];
    });
    const user = userEvent.setup();

    render(
      <IssueViewModeProvider>
        <AllIssuesPage />
      </IssueViewModeProvider>,
    );

    await user.type(screen.getByTestId(TEST_IDS.ISSUE.SEARCH_INPUT), "zzzz-no-results");

    expect(await screen.findByTestId(TEST_IDS.ISSUE.FILTER_SUMMARY)).toHaveTextContent(
      "0 issues matching filters",
    );
    expect(await screen.findByTestId(TEST_IDS.PAGE.EMPTY_STATE)).toBeInTheDocument();
  });

  it("renders the loading state while the first issues page is unresolved", () => {
    mockUsePaginatedQuery.mockReturnValue({
      results: [],
      status: "LoadingFirstPage",
      loadMore: vi.fn(),
      isLoading: true,
    });

    render(
      <IssueViewModeProvider>
        <AllIssuesPage />
      </IssueViewModeProvider>,
    );

    expect(screen.getByTestId("issues-page-loading")).toBeInTheDocument();
  });
});
