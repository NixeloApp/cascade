import type { Id } from "@convex/_generated/dataModel";
import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { TEST_IDS } from "@/lib/test-ids";
import { render, screen } from "@/test/custom-render";
import { WorkspacesList } from "./index";

const mockNavigate = vi.fn();
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockUseOrganization = vi.mocked(useOrganization);

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({}),
  useNavigate: () => mockNavigate,
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/hooks/useOrgContext", () => ({
  useOrganization: vi.fn(),
}));

vi.mock("@/components/layout", () => ({
  PageLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
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
      {actions}
    </div>
  ),
  PageContent: ({
    children,
    isLoading,
    isEmpty,
    emptyState,
  }: {
    children: ReactNode;
    isLoading?: boolean;
    isEmpty?: boolean;
    emptyState?: {
      title: string;
      description?: string;
      action?: ReactNode;
      "data-testid"?: string;
    };
  }) =>
    isLoading ? (
      <div>Loading</div>
    ) : isEmpty ? (
      <div data-testid={emptyState?.["data-testid"]}>
        <div>{emptyState?.title}</div>
        <div>{emptyState?.description}</div>
        {emptyState?.action}
      </div>
    ) : (
      <div>{children}</div>
    ),
}));

vi.mock("@/components/CreateWorkspaceModal", () => ({
  CreateWorkspaceModal: ({
    isOpen,
    onClose,
    onCreated,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onCreated?: (slug: string) => void;
  }) =>
    isOpen ? (
      <div data-testid="create-workspace-modal">
        <button type="button" onClick={() => onCreated?.("new-workspace")}>
          Simulate workspace created
        </button>
        <button type="button" onClick={onClose}>
          Close create workspace modal
        </button>
      </div>
    ) : null,
}));

vi.mock("@/components/Workspaces/WorkspaceCard", () => ({
  WorkspaceCard: ({ workspace }: { workspace: { name: string } }) => (
    <div data-testid={TEST_IDS.WORKSPACE.CARD}>{workspace.name}</div>
  ),
}));

vi.mock("@/components/ui/Button", () => ({
  Button: ({
    children,
    onClick,
    "aria-label": ariaLabel,
  }: {
    children: ReactNode;
    onClick?: () => void;
    "aria-label"?: string;
  }) => (
    <button type="button" onClick={onClick} aria-label={ariaLabel}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/Input", () => ({
  Input: ({
    value,
    onChange,
    placeholder,
    "data-testid": testId,
  }: {
    value?: string;
    onChange?: (event: { target: { value: string } }) => void;
    placeholder?: string;
    "data-testid"?: string;
  }) => (
    <input
      data-testid={testId}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange?.({ target: { value: event.target.value } })}
    />
  ),
}));

vi.mock("@/components/ui/OverviewBand", () => ({
  OverviewBand: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock("@/components/ui/EmptyState", () => ({
  EmptyState: ({
    title,
    description,
    action,
    "data-testid": testId,
  }: {
    title: string;
    description?: string;
    action?: ReactNode | { label: string; onClick: () => void };
    "data-testid"?: string;
  }) => (
    <div data-testid={testId}>
      <div>{title}</div>
      <div>{description}</div>
      {typeof action === "object" && action !== null && "label" in action && "onClick" in action ? (
        <button type="button" onClick={action.onClick}>
          {action.label}
        </button>
      ) : (
        action
      )}
    </div>
  ),
}));

vi.mock("@/components/ui/Flex", () => ({
  Flex: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Grid", () => ({
  Grid: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Stack", () => ({
  Stack: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/Typography", () => ({
  Typography: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const WORKSPACES = [
  {
    _id: "workspace-1" as Id<"workspaces">,
    name: "Platform Operations",
    slug: "platform-operations",
    description: "Core systems",
    teamCount: 3,
    projectCount: 7,
  },
  {
    _id: "workspace-2" as Id<"workspaces">,
    name: "Revenue",
    slug: "revenue",
    description: "Sales and billing",
    teamCount: 2,
    projectCount: 4,
  },
] as const;

describe("WorkspacesList", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      orgSlug: "acme",
      organizationId: "org-1" as Id<"organizations">,
      organizationName: "Acme",
      userRole: "owner",
      billingEnabled: true,
    });

    mockUseAuthenticatedQuery.mockReturnValue([...WORKSPACES]);
  });

  it("shows the workspace empty state when no workspaces exist", () => {
    mockUseAuthenticatedQuery.mockReturnValue([]);

    render(<WorkspacesList />);

    expect(screen.getByTestId(TEST_IDS.WORKSPACE.EMPTY_STATE)).toBeInTheDocument();
    expect(screen.getByText("No workspaces yet")).toBeInTheDocument();
  });

  it("filters workspaces and clears the search-empty state", async () => {
    const user = userEvent.setup();

    render(<WorkspacesList />);

    await user.type(screen.getByTestId(TEST_IDS.WORKSPACE.SEARCH_INPUT), "platform");
    expect(screen.getByText("Platform Operations")).toBeInTheDocument();
    expect(screen.queryByText("Revenue")).not.toBeInTheDocument();

    await user.clear(screen.getByTestId(TEST_IDS.WORKSPACE.SEARCH_INPUT));
    await user.type(screen.getByTestId(TEST_IDS.WORKSPACE.SEARCH_INPUT), "unknown");

    const searchEmptyState = screen.getByTestId(TEST_IDS.WORKSPACE.SEARCH_EMPTY_STATE);
    expect(searchEmptyState).toBeInTheDocument();
    expect(screen.getByText('No workspaces match "unknown"')).toBeInTheDocument();

    await user.click(within(searchEmptyState).getByRole("button", { name: "Clear search" }));

    expect(screen.queryByTestId(TEST_IDS.WORKSPACE.SEARCH_EMPTY_STATE)).not.toBeInTheDocument();
    expect(screen.getByText("Platform Operations")).toBeInTheDocument();
    expect(screen.getByText("Revenue")).toBeInTheDocument();
  });

  it("navigates to the workspace detail flow after creation", async () => {
    const user = userEvent.setup();

    render(<WorkspacesList />);

    await user.click(screen.getByRole("button", { name: "+ Create Workspace" }));
    await user.click(screen.getByRole("button", { name: "Simulate workspace created" }));

    expect(mockNavigate).toHaveBeenCalledWith({
      to: ROUTES.workspaces.detail.path,
      params: { orgSlug: "acme", workspaceSlug: "new-workspace" },
    });
  });
});
