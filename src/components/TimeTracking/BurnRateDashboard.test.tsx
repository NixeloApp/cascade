import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { render, screen } from "@/test/custom-render";
import { BurnRateDashboard } from "./BurnRateDashboard";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/lib/icons", () => ({
  Calendar: "calendar-icon",
  DollarSign: "dollar-icon",
  TrendingUp: "trend-icon",
}));

vi.mock("../ui/Avatar", () => ({
  Avatar: ({ name, email }: { name?: string; email?: string }) => (
    <div>{`avatar:${name ?? "unknown"}:${email ?? "none"}`}</div>
  ),
}));

vi.mock("../ui/Badge", () => ({
  Badge: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/Button", () => ({
  Button: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock("../ui/Card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/EmptyState", () => ({
  EmptyState: ({ title, description }: { title: string; description: string }) => (
    <div>
      <div>{title}</div>
      <div>{description}</div>
    </div>
  ),
}));

vi.mock("../ui/Flex", () => ({
  Flex: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/Grid", () => ({
  Grid: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/Icon", () => ({
  Icon: () => <span data-testid="burn-rate-icon" />,
}));

vi.mock("../ui/LoadingSpinner", () => ({
  LoadingSpinner: () => <div>loading-spinner</div>,
}));

vi.mock("../ui/Progress", () => ({
  Progress: ({ value }: { value: number }) => <div data-testid="burn-rate-progress">{value}</div>,
}));

vi.mock("../ui/Stack", () => ({
  Stack: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/Typography", () => ({
  Typography: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);

const projectId = "project_1" as Id<"projects">;

let currentBurnRate:
  | {
      totalCost: number;
      burnRatePerDay: number;
      burnRatePerWeek: number;
      burnRatePerMonth: number;
      totalHours: number;
      billableHours: number;
      billableCost: number;
      entriesCount: number;
    }
  | undefined;
let currentTeamCosts:
  | Array<{
      cost: number;
      hours: number;
      billableHours: number;
      billableCost: number;
      user: {
        _id: Id<"users">;
        name: string;
        email?: string;
        image?: string;
      } | null;
    }>
  | undefined;

describe("BurnRateDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentBurnRate = {
      totalCost: 4800,
      burnRatePerDay: 160,
      burnRatePerWeek: 1120,
      burnRatePerMonth: 4800,
      totalHours: 60,
      billableHours: 45,
      billableCost: 3600,
      entriesCount: 18,
    };
    currentTeamCosts = [
      {
        cost: 3000,
        hours: 36,
        billableHours: 28,
        billableCost: 2400,
        user: {
          _id: "user_1" as Id<"users">,
          name: "Alex Rivera",
          email: "alex@example.com",
        },
      },
      {
        cost: 1800,
        hours: 24,
        billableHours: 17,
        billableCost: 1200,
        user: null,
      },
    ];

    let queryCallCount = 0;
    mockUseAuthenticatedQuery.mockImplementation(() => {
      queryCallCount += 1;
      return queryCallCount % 2 === 1 ? currentBurnRate : currentTeamCosts;
    });
  });

  it("renders the loading state until burn rate and team cost data are both available", () => {
    currentTeamCosts = undefined;

    render(<BurnRateDashboard projectId={projectId} />);

    expect(screen.getByText("loading-spinner")).toBeInTheDocument();
    expect(screen.queryByText("Burn Rate & Team Costs")).not.toBeInTheDocument();
  });

  it("renders burn rate metrics, team breakdown, and supports date-range switching", async () => {
    const user = userEvent.setup();

    render(<BurnRateDashboard projectId={projectId} />);

    expect(screen.getByText("Burn Rate & Team Costs")).toBeInTheDocument();
    expect(screen.getByText("Total Cost")).toBeInTheDocument();
    expect(screen.getAllByText("$4,800")).toHaveLength(2);
    expect(screen.getByText("Per Day")).toBeInTheDocument();
    expect(screen.getByText("$160")).toBeInTheDocument();
    expect(screen.getByText("Per Week")).toBeInTheDocument();
    expect(screen.getByText("$1,120")).toBeInTheDocument();
    expect(screen.getByText("Per Month")).toBeInTheDocument();
    expect(screen.getByText("60.0h")).toBeInTheDocument();
    expect(screen.getByText("18 time entries")).toBeInTheDocument();
    expect(screen.getByText("45.0h")).toBeInTheDocument();
    expect(screen.getByText("$3,600 billable")).toBeInTheDocument();
    expect(screen.getByText("Team Costs Breakdown")).toBeInTheDocument();
    expect(screen.getByText("Alex Rivera")).toBeInTheDocument();
    expect(screen.getByText("avatar:Alex Rivera:alex@example.com")).toBeInTheDocument();
    expect(screen.getByText("36.0h total (28.0h billable)")).toBeInTheDocument();
    expect(screen.getByText("63% of total")).toBeInTheDocument();
    expect(screen.getByText("Unknown")).toBeInTheDocument();
    expect(screen.getByText("24.0h total (17.0h billable)")).toBeInTheDocument();
    expect(screen.getByText("38% of total")).toBeInTheDocument();
    expect(screen.getAllByTestId("burn-rate-progress")).toHaveLength(2);
    expect(screen.getAllByText("62.5")).toHaveLength(1);
    expect(screen.getAllByText("37.5")).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Last 7 Days" }));

    const rangeCalls = mockUseAuthenticatedQuery.mock.calls.filter(
      ([, args]) => typeof args === "object" && args && "projectId" in args,
    );
    const lastRangeCall = rangeCalls[rangeCalls.length - 1];
    const lastRangeArgs = lastRangeCall?.[1];
    expect(lastRangeArgs).toEqual({
      projectId,
      startDate: expect.any(Number),
      endDate: expect.any(Number),
    });
  });

  it("renders the empty-state message when there are no team costs for the selected period", () => {
    currentTeamCosts = [];

    render(<BurnRateDashboard projectId={projectId} />);

    expect(screen.getByText("No time entries for this period")).toBeInTheDocument();
    expect(
      screen.getByText("Track work during this range to see burn rate and team cost breakdowns."),
    ).toBeInTheDocument();
  });
});
