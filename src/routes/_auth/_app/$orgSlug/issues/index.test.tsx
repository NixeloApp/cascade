import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { usePaginatedQuery } from "convex/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IssueViewModeProvider, useIssueViewMode } from "@/contexts/IssueViewModeContext";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
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
    isEmpty,
    emptyState,
  }: {
    children: ReactNode;
    isEmpty?: boolean;
    emptyState?: { title: string };
  }) => <div>{isEmpty ? emptyState?.title : children}</div>,
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
    value,
    onChange,
    placeholder,
    "aria-label": ariaLabel,
  }: {
    value?: string;
    onChange?: (event: { target: { value: string } }) => void;
    placeholder?: string;
    "aria-label"?: string;
  }) => (
    <input
      aria-label={ariaLabel}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange?.({ target: { value: event.target.value } })}
    />
  ),
}));

vi.mock("@/components/ui/Select", () => ({
  Select: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: ReactNode }) => (
    <button type="button">{children}</button>
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
  CreateIssueModal: ({ open }: { open: boolean }) => (open ? <div>Create issue modal</div> : null),
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
    mockUseAuthenticatedQuery.mockReturnValue([{ id: "todo", name: "To Do" }]);
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
});
