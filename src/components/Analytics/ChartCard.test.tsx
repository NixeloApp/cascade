import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { ChartCard } from "./ChartCard";

describe("ChartCard", () => {
  describe("Rendering", () => {
    it("should render title as string", () => {
      render(
        <ChartCard title="Sprint Burndown">
          <div>Chart content</div>
        </ChartCard>,
      );

      expect(screen.getByText("Sprint Burndown")).toBeInTheDocument();
    });

    it("should render title as ReactNode", () => {
      render(
        <ChartCard
          title={
            <div data-testid="custom-title">
              <span>Custom Title</span>
            </div>
          }
        >
          <div>Chart content</div>
        </ChartCard>,
      );

      expect(screen.getByTestId("custom-title")).toBeInTheDocument();
      expect(screen.getByText("Custom Title")).toBeInTheDocument();
    });

    it("should render children", () => {
      render(
        <ChartCard title="Test Chart">
          <div data-testid="chart-content">Bar chart here</div>
        </ChartCard>,
      );

      expect(screen.getByTestId("chart-content")).toBeInTheDocument();
      expect(screen.getByText("Bar chart here")).toBeInTheDocument();
    });

    it("should have fixed height container for children", () => {
      const { container } = render(
        <ChartCard title="Test Chart">
          <div>Chart content</div>
        </ChartCard>,
      );

      const chartContainer = container.querySelector(".h-64");
      expect(chartContainer).toBeInTheDocument();
    });
  });
});
