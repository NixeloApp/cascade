import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { TEST_IDS } from "@/lib/test-ids";
import { render, screen } from "@/test/custom-render";
import { SprintBurnChart } from "./SprintBurnChart";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("../ui/Card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../ui/Skeleton", () => ({
  Skeleton: ({ className }: { className: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const sprintId = "sprint_1" as Id<"sprints">;

describe("SprintBurnChart", () => {
  it("renders loading skeleton when data is undefined", () => {
    mockUseAuthenticatedQuery.mockReturnValue(undefined);

    render(<SprintBurnChart sprintId={sprintId} />);

    expect(screen.getAllByTestId("skeleton")).toHaveLength(2);
  });

  it("shows empty state when no story points exist", () => {
    mockUseAuthenticatedQuery.mockReturnValue({
      totalPoints: 0,
      completedPoints: 0,
      idealBurndown: [],
      daysElapsed: 0,
      totalDays: 0,
    });

    render(<SprintBurnChart sprintId={sprintId} />);

    expect(screen.getByText("No story points in this sprint")).toBeInTheDocument();
  });

  it("renders burndown chart with stats", () => {
    mockUseAuthenticatedQuery.mockReturnValue({
      totalPoints: 20,
      completedPoints: 8,
      idealBurndown: [
        { day: 1, points: 20 },
        { day: 2, points: 15 },
        { day: 3, points: 10 },
        { day: 4, points: 5 },
        { day: 5, points: 0 },
      ],
      daysElapsed: 2,
      totalDays: 5,
    });

    render(<SprintBurnChart sprintId={sprintId} />);

    expect(screen.getByText("Burndown Chart")).toBeInTheDocument();
    expect(screen.getByText("Total Points")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Remaining")).toBeInTheDocument();
    expect(screen.getByText("2/5")).toBeInTheDocument(); // Days
  });

  it("exposes stable chart toggle test ids and can switch to burnup", async () => {
    const user = userEvent.setup();
    mockUseAuthenticatedQuery.mockReturnValue({
      totalPoints: 20,
      completedPoints: 8,
      idealBurndown: [
        { day: 1, points: 20 },
        { day: 2, points: 15 },
      ],
      daysElapsed: 1,
      totalDays: 2,
    });

    render(<SprintBurnChart sprintId={sprintId} />);

    await user.click(screen.getByTestId(TEST_IDS.SPRINT.CHART_BURNUP_TOGGLE));

    expect(screen.getByTestId(TEST_IDS.SPRINT.CHART_BURNDOWN_TOGGLE)).toBeInTheDocument();
    expect(screen.getByText("Burnup Chart")).toBeInTheDocument();
  });
});
