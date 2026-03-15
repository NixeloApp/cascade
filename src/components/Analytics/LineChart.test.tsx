import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { LineChart } from "./LineChart";

describe("LineChart", () => {
  it("renders the SVG with aria-label", () => {
    render(
      <LineChart
        data={[
          { label: "Sprint 1", value: 10 },
          { label: "Sprint 2", value: 8 },
          { label: "Sprint 3", value: 3 },
        ]}
      />,
    );

    expect(screen.getByRole("img", { name: "Line chart" })).toBeInTheDocument();
  });

  it("renders data point labels", () => {
    render(
      <LineChart
        data={[
          { label: "Day 1", value: 20 },
          { label: "Day 2", value: 15 },
          { label: "Day 3", value: 5 },
        ]}
      />,
    );

    expect(screen.getByText("Day 1")).toBeInTheDocument();
    expect(screen.getByText("Day 3")).toBeInTheDocument();
  });

  it("shows empty state when data is empty", () => {
    render(<LineChart data={[]} />);

    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  it("renders ideal line when showIdealLine is true and data has idealValues", () => {
    const { container } = render(
      <LineChart
        data={[
          { label: "Day 1", value: 20, idealValue: 20 },
          { label: "Day 2", value: 18, idealValue: 10 },
          { label: "Day 3", value: 12, idealValue: 0 },
        ]}
        showIdealLine
      />,
    );

    // Ideal line uses dashed stroke
    const dashedPaths = container.querySelectorAll("path[stroke-dasharray]");
    expect(dashedPaths.length).toBeGreaterThan(0);
  });
});
