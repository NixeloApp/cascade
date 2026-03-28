import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { createContext, type ReactNode, useContext } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useOrganization } from "@/hooks/useOrgContext";
import { TEST_IDS } from "@/lib/test-ids";
import { render, screen, waitFor } from "@/test/custom-render";
import { OrganizationCalendarPage } from "../calendar";

const mockNavigate = vi.fn();
const mockUseSearch =
  vi.fn<
    () => {
      team?: string;
      workspace?: string;
    }
  >();

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({
    useNavigate: () => mockNavigate,
    useSearch: () => mockUseSearch(),
  }),
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/hooks/useOrgContext", () => ({
  useOrganization: vi.fn(),
}));

vi.mock("@/hooks/useMediaQuery", () => ({
  useMediaQuery: vi.fn(),
}));

vi.mock("@/components/layout", () => ({
  PageLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PageHeader: ({ title, actions }: { actions?: ReactNode; title: string }) => (
    <div>
      <Typography variant="h1">{title}</Typography>
      <div>{actions}</div>
    </div>
  ),
}));

vi.mock("@/components/Calendar/CalendarView", () => ({
  CalendarView: ({
    colorByScope,
    organizationId,
    teamId,
    workspaceId,
    defaultMode,
  }: {
    colorByScope?: string;
    defaultMode?: string;
    organizationId?: string;
    teamId?: string;
    workspaceId?: string;
  }) => (
    <div data-testid={TEST_IDS.CALENDAR.ROOT}>
      {`calendar:${organizationId ?? "none"}:${workspaceId ?? "none"}:${teamId ?? "none"}:${
        colorByScope ?? "none"
      }:${defaultMode ?? "none"}`}
    </div>
  ),
}));

const SelectContext = createContext<{
  disabled?: boolean;
  onValueChange?: (value: string) => void;
  value?: string;
}>({});

vi.mock("@/components/ui/Select", () => ({
  Select: ({
    children,
    disabled,
    onValueChange,
    value,
  }: {
    children: ReactNode;
    disabled?: boolean;
    onValueChange?: (value: string) => void;
    value?: string;
  }) => (
    <SelectContext.Provider value={{ disabled, onValueChange, value }}>
      <div>{children}</div>
    </SelectContext.Provider>
  ),
  SelectTrigger: ({
    children,
    "aria-label": ariaLabel,
    "data-testid": testId,
  }: {
    children: ReactNode;
    "aria-label"?: string;
    "data-testid"?: string;
  }) => {
    const context = useContext(SelectContext);
    return (
      <button type="button" aria-label={ariaLabel} data-testid={testId} disabled={context.disabled}>
        {children}
      </button>
    );
  },
  SelectValue: ({ placeholder }: { placeholder?: string }) => {
    const context = useContext(SelectContext);
    return <span>{context.value ?? placeholder}</span>;
  },
  SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: ReactNode; value: string }) => {
    const context = useContext(SelectContext);
    return (
      <button
        type="button"
        role="option"
        disabled={context.disabled}
        onClick={() => context.onValueChange?.(value)}
      >
        {children}
      </button>
    );
  },
}));

const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockUseMediaQuery = vi.mocked(useMediaQuery);
const mockUseOrganization = vi.mocked(useOrganization);

const WORKSPACE_ID = "workspace-product" as Id<"workspaces">;
const TEAM_ID = "team-engineering" as Id<"teams">;

const WORKSPACES = [
  {
    _id: WORKSPACE_ID,
    name: "Product",
  },
];

const TEAMS = [
  {
    _id: TEAM_ID,
    name: "Engineering",
    workspaceId: WORKSPACE_ID,
  },
];

describe("OrganizationCalendarPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearch.mockReturnValue({});
    mockUseOrganization.mockReturnValue({
      billingEnabled: true,
      orgSlug: "acme",
      organizationId: "org-1" as Id<"organizations">,
      organizationName: "Acme",
      userRole: "owner",
    });
    mockUseMediaQuery.mockReturnValue(false);
    mockUseAuthenticatedQuery.mockImplementation((_, args) => {
      if (typeof args === "object" && args !== null && "workspaceId" in args) {
        if (args.workspaceId === WORKSPACE_ID) {
          return TEAMS;
        }

        return TEAMS;
      }

      return WORKSPACES;
    });
  });

  it("renders accessible filters and disables the team selector until a workspace is chosen", async () => {
    render(<OrganizationCalendarPage />);

    expect(screen.getByRole("heading", { name: "Organization scope" })).toBeInTheDocument();
    expect(screen.getByLabelText("Workspace filter")).toHaveTextContent("All workspaces");
    expect(screen.getByLabelText("Team filter")).toBeDisabled();
    expect(screen.getByLabelText("Team filter")).toHaveTextContent("Select workspace first");

    expect(await screen.findByTestId(TEST_IDS.CALENDAR.ROOT)).toHaveTextContent(
      "calendar:org-1:none:none:workspace:week",
    );
  });

  it("renders the calendar-shaped loading skeleton while scope queries are unresolved", () => {
    mockUseAuthenticatedQuery.mockReturnValue(undefined);

    render(<OrganizationCalendarPage />);

    expect(screen.getByTestId(TEST_IDS.ORG_CALENDAR.LOADING_STATE)).toBeInTheDocument();
    expect(screen.queryByTestId(TEST_IDS.CALENDAR.ROOT)).not.toBeInTheDocument();
    expect(screen.getAllByTestId(TEST_IDS.LOADING.SKELETON).length).toBeGreaterThanOrEqual(10);
  });

  it("navigates into workspace scope and clears the team search param when the workspace changes", async () => {
    const user = userEvent.setup();

    render(<OrganizationCalendarPage />);

    await user.click(screen.getByRole("option", { name: "Product" }));

    expect(mockNavigate).toHaveBeenCalledWith({
      search: {
        team: undefined,
        workspace: WORKSPACE_ID,
      },
    });
  });

  it("renders team scope from valid workspace and team search params", async () => {
    mockUseSearch.mockReturnValue({
      team: TEAM_ID,
      workspace: WORKSPACE_ID,
    });

    render(<OrganizationCalendarPage />);

    expect(screen.getByRole("heading", { name: "Team scope" })).toBeInTheDocument();
    expect(screen.getByLabelText("Team filter")).not.toBeDisabled();
    expect(await screen.findByTestId(TEST_IDS.CALENDAR.ROOT)).toHaveTextContent(
      `calendar:org-1:${WORKSPACE_ID}:${TEAM_ID}:none:week`,
    );
  });

  it("defaults to month mode on mobile viewports", async () => {
    mockUseMediaQuery.mockReturnValue(true);

    render(<OrganizationCalendarPage />);

    expect(await screen.findByTestId(TEST_IDS.CALENDAR.ROOT)).toHaveTextContent(
      "calendar:org-1:none:none:workspace:month",
    );
  });

  it("normalizes stale team search params that are invalid for the active scope", async () => {
    mockUseSearch.mockReturnValue({
      team: TEAM_ID,
    });

    render(<OrganizationCalendarPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        replace: true,
        search: {
          team: undefined,
          workspace: undefined,
        },
      });
    });
  });
});
