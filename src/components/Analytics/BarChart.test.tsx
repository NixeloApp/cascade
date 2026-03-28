import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { BarChart } from "./BarChart";

describe("BarChart", () => {
  it("renders labels and values for each data point", () => {
    render(
      <BarChart
        data={[
          { label: "Bug", value: 5 },
          { label: "Feature", value: 10 },
        ]}
        tone="brand"
      />,
    );

    expect(screen.getByText("Bug")).toBeInTheDocument();
    expect(screen.getByText("Feature")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("handles empty data", () => {
    const { container } = render(<BarChart data={[]} tone="brand" />);
    // With no data items, no bars should render
    expect(container.querySelectorAll("[title]")).toHaveLength(0);
  });

  it("handles all-zero values without division errors", () => {
    render(
      <BarChart
        data={[
          { label: "A", value: 0 },
          { label: "B", value: 0 },
        ]}
        tone="brand"
      />,
    );

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("applies the semantic tone to the rendered fill", () => {
    const { container } = render(
      <BarChart
        data={[
          { label: "Critical", value: 3 },
          { label: "Low", value: 1 },
        ]}
        tone="warning"
      />,
    );

    expect(container.querySelector(".bg-status-warning")).toBeInTheDocument();
  });
});
