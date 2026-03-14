import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { Greeting } from "./Greeting";

describe("Greeting", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a morning greeting with the user's first name and singular completion copy", () => {
    vi.setSystemTime(new Date(2026, 2, 14, 9, 0, 0));

    render(<Greeting userName="Taylor Rivera" completedCount={1} />);

    expect(screen.getByText("Command Center")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Good morning, Taylor\./i })).toBeInTheDocument();
    expect(screen.getByText("1 task")).toBeInTheDocument();
    expect(
      screen.getByText(/Keep the highest-impact work moving and the rest visible\./),
    ).toBeInTheDocument();
  });

  it("renders an afternoon greeting with plural completion copy", () => {
    vi.setSystemTime(new Date(2026, 2, 14, 15, 0, 0));

    render(<Greeting userName="Avery Stone" completedCount={3} />);

    expect(screen.getByRole("heading", { name: /Good afternoon, Avery\./i })).toBeInTheDocument();
    expect(screen.getByText("3 tasks")).toBeInTheDocument();
  });

  it("falls back to the generic greeting and default workload message", () => {
    vi.setSystemTime(new Date(2026, 2, 14, 21, 0, 0));

    render(<Greeting completedCount={0} />);

    expect(screen.getByRole("heading", { name: /Good evening, there\./i })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your current workload, workspaces, and recent activity are all visible in one place.",
      ),
    ).toBeInTheDocument();
  });
});
