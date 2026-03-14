import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { PortalTimeline } from "./PortalTimeline";

describe("PortalTimeline", () => {
  it("renders an empty state when no timeline items are provided", () => {
    render(<PortalTimeline items={[]} />);

    expect(screen.getByText("Timeline")).toBeInTheDocument();
    expect(screen.getByText("No timeline events available.")).toBeInTheDocument();
  });

  it("renders each timeline item with its label and timestamp", () => {
    render(
      <PortalTimeline
        items={[
          {
            id: "event_1",
            label: "Kickoff call completed",
            timestamp: "2026-03-01 09:00",
          },
          {
            id: "event_2",
            label: "Requirements approved",
            timestamp: "2026-03-03 14:30",
          },
        ]}
      />,
    );

    expect(screen.getByText("Kickoff call completed")).toBeInTheDocument();
    expect(screen.getByText("2026-03-01 09:00")).toBeInTheDocument();
    expect(screen.getByText("Requirements approved")).toBeInTheDocument();
    expect(screen.getByText("2026-03-03 14:30")).toBeInTheDocument();
  });
});
