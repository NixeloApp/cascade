import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { AnalyticsSection } from "./AnalyticsSection";

describe("AnalyticsSection", () => {
  it("renders the shared analytics heading and description", () => {
    render(
      <AnalyticsSection title="Issues by Status" description="Breakdown of current issue flow.">
        <div>Chart body</div>
      </AnalyticsSection>,
    );

    expect(screen.getByText("Issues by Status")).toBeInTheDocument();
    expect(screen.getByText("Breakdown of current issue flow.")).toBeInTheDocument();
    expect(screen.getByText("Chart body")).toBeInTheDocument();
  });

  it("renders section actions when provided", () => {
    render(
      <AnalyticsSection title="Issues by Type" actions={<button type="button">Export</button>}>
        <div>Chart body</div>
      </AnalyticsSection>,
    );

    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
  });
});
