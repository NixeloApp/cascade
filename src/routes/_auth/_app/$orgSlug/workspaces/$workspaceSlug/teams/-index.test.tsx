import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { usePaginatedQuery } from "convex/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOrganization } from "@/hooks/useOrgContext";
import { TEST_IDS } from "@/lib/test-ids";
import { render, screen } from "@/test/custom-render";
import { useWorkspaceLayout } from "../route";
import { TeamsList } from "./index";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    activeOptions: _activeOptions,
    activeProps: _activeProps,
    ...props
  }: {
    to: string;
    children: ReactNode;
    activeOptions?: unknown;
    activeProps?: unknown;
  } & AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  createFileRoute: () => () => ({
    useParams: () => ({
      workspaceSlug: "platform",
    }),
  }),
}));

vi.mock("convex/react", () => ({
  usePaginatedQuery: vi.fn(),
}));

vi.mock("@/hooks/useOrgContext", () => ({
  useOrganization: vi.fn(),
}));

vi.mock("../route", () => ({
  useWorkspaceLayout: vi.fn(),
}));

vi.mock("@/components/CreateTeamModal", () => ({
  CreateTeamModal: ({
    isOpen,
    workspaceId,
    workspaceSlug,
  }: {
    isOpen: boolean;
    workspaceId?: Id<"workspaces">;
    workspaceSlug?: string;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label="Create Team">
        {`Create team modal:${workspaceId ?? "missing"}:${workspaceSlug ?? "missing"}`}
      </div>
    ) : null,
}));

vi.mock("@/components/ui/Button", () => ({
  Button: ({
    children,
    onClick,
    "data-testid": testId,
  }: {
    children: ReactNode;
    onClick?: () => void;
    "data-testid"?: string;
  }) => (
    <button type="button" onClick={onClick} data-testid={testId}>
      {children}
    </button>
  ),
}));

const mockUsePaginatedQuery = vi.mocked(usePaginatedQuery);
const mockUseOrganization = vi.mocked(useOrganization);
const mockUseWorkspaceLayout = vi.mocked(useWorkspaceLayout);

const loadMore = vi.fn();

describe("TeamsList", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseOrganization.mockReturnValue({
      orgSlug: "acme",
      organizationId: "org-1" as Id<"organizations">,
      organizationName: "Acme",
      userRole: "owner",
      billingEnabled: true,
    });

    mockUseWorkspaceLayout.mockReturnValue({
      workspaceId: "workspace-1" as Id<"workspaces">,
    });

    mockUsePaginatedQuery.mockReturnValue({
      results: [
        {
          _id: "team-1" as Id<"teams">,
          name: "Delivery",
          slug: "delivery",
          icon: "🚚",
          description: "Core product team",
          memberCount: 2,
          projectCount: 3,
        },
      ],
      status: "CanLoadMore",
      loadMore,
      isLoading: false,
    });
  });

  it("renders the lighter teams intro instead of the old nested hero copy", () => {
    render(<TeamsList />);

    expect(screen.getByRole("heading", { level: 3, name: "Teams" })).toBeInTheDocument();
    expect(
      screen.getByText("Group workspace members around shared boards, calendars, and wiki docs."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Organize your workspace into focused teams"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Delivery")).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.WORKSPACE.CREATE_TEAM_BUTTON)).toBeInTheDocument();
  });

  it("opens the create-team modal from the populated teams header action", async () => {
    const user = userEvent.setup();

    render(<TeamsList />);

    await user.click(screen.getByTestId(TEST_IDS.WORKSPACE.CREATE_TEAM_BUTTON));

    expect(screen.getByRole("dialog", { name: "Create Team" })).toHaveTextContent(
      "Create team modal:workspace-1:platform",
    );
  });

  it("opens the create-team modal from the empty-state action", async () => {
    const user = userEvent.setup();

    mockUsePaginatedQuery.mockReturnValue({
      results: [],
      status: "Exhausted",
      loadMore,
      isLoading: false,
    });

    render(<TeamsList />);

    await user.click(screen.getByTestId(TEST_IDS.WORKSPACE.CREATE_TEAM_BUTTON));

    expect(screen.getByRole("dialog", { name: "Create Team" })).toBeInTheDocument();
    expect(screen.getByText("No teams yet")).toBeInTheDocument();
  });

  it("loads more teams from the shared footer action", async () => {
    const user = userEvent.setup();

    render(<TeamsList />);

    await user.click(screen.getByRole("button", { name: /load more teams/i }));

    expect(loadMore).toHaveBeenCalledWith(20);
  });
});
