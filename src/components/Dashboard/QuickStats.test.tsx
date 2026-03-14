import { render, screen } from "@/test/custom-render";
import { QuickStats } from "./QuickStats";

describe("QuickStats", () => {
  it("renders four loading stat cards when stats are unavailable", () => {
    const { container } = render(<QuickStats stats={undefined} />);

    expect(container.querySelectorAll(".animate-shimmer")).toHaveLength(12);
    expect(screen.queryByText("Active Load")).not.toBeInTheDocument();
  });

  it("renders all stat cards with the computed completion progress", () => {
    render(
      <QuickStats
        stats={{
          assignedToMe: 6,
          completedThisWeek: 4,
          highPriority: 2,
          createdByMe: 9,
        }}
      />,
    );

    expect(screen.getByText("Active Load")).toBeInTheDocument();
    expect(screen.getByText("Assigned tasks")).toBeInTheDocument();
    expect(screen.getByText("Velocity")).toBeInTheDocument();
    expect(screen.getByText("Done this week")).toBeInTheDocument();
    expect(screen.getByText("Attention Needed")).toBeInTheDocument();
    expect(screen.getByText("High Priority")).toBeInTheDocument();
    expect(screen.getByText("Contribution")).toBeInTheDocument();
    expect(screen.getByText("Reported issues")).toBeInTheDocument();

    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar.firstElementChild).toHaveStyle({ transform: "translateX(-60%)" });

    const warningCard = screen.getByText("Attention Needed").closest("[class*='border']");
    expect(warningCard?.className).toContain("border-status-warning/30");
  });

  it("renders zero-state values without the warning accent or progress", () => {
    const { container } = render(
      <QuickStats
        stats={{
          assignedToMe: 0,
          completedThisWeek: 0,
          highPriority: 0,
          createdByMe: 0,
        }}
      />,
    );

    expect(screen.getAllByText("0")).toHaveLength(4);
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar.firstElementChild).toHaveStyle({ transform: "translateX(-100%)" });

    const warningCard = screen.getByText("Attention Needed").closest("[class*='border']");
    expect(warningCard?.className).not.toContain("border-status-warning/30");
    expect(container.querySelector(".bg-status-warning")).toBeNull();
  });
});
