import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";

// Mock child components to avoid deep dependency chains
vi.mock("./CalendarView", () => ({
  CalendarView: () => <div data-testid="mock-calendar-view">CalendarView</div>,
}));

vi.mock("./RoadmapView", () => ({
  RoadmapView: () => <div data-testid="mock-roadmap-view">RoadmapView</div>,
}));

import type { Id } from "@convex/_generated/dataModel";
import { UnifiedCalendarView } from "./UnifiedCalendarView";

describe("UnifiedCalendarView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the calendar view switcher with Calendar and Roadmap tabs", () => {
    render(<UnifiedCalendarView />);

    expect(screen.getByText("Calendar (Events)")).toBeInTheDocument();
    expect(screen.getByText("Roadmap (Issues)")).toBeInTheDocument();
  });

  it("renders CalendarView by default", () => {
    render(<UnifiedCalendarView />);

    expect(screen.getByTestId("mock-calendar-view")).toBeInTheDocument();
  });

  it("disables Roadmap tab when no projectId is provided", () => {
    render(<UnifiedCalendarView />);

    // The roadmap segmented control item should be disabled
    const roadmapButton = screen.getByRole("radio", { name: /roadmap/i });
    expect(roadmapButton).toBeDisabled();
  });

  it("enables Roadmap tab when a projectId is provided", () => {
    render(<UnifiedCalendarView projectId={"project-1" as Id<"projects">} />);

    const roadmapButton = screen.getByRole("radio", { name: /roadmap/i });
    expect(roadmapButton).not.toBeDisabled();
  });
});
