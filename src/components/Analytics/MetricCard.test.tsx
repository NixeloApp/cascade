import { Activity } from "lucide-react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { MetricCard } from "./MetricCard";

describe("MetricCard", () => {
  describe("Rendering", () => {
    it("should render title", () => {
      render(<MetricCard title="Total Issues" value={42} icon="📊" />);

      expect(screen.getByText("Total Issues")).toBeInTheDocument();
    });

    it("should render value", () => {
      render(<MetricCard title="Total Issues" value={42} icon="📊" />);

      expect(screen.getByText("42")).toBeInTheDocument();
    });

    it("should render subtitle when provided", () => {
      render(<MetricCard title="Total Issues" value={42} icon="📊" subtitle="Last 7 days" />);

      expect(screen.getByText("Last 7 days")).toBeInTheDocument();
    });

    it("should not render subtitle when not provided", () => {
      render(<MetricCard title="Total Issues" value={42} icon="📊" />);

      expect(screen.queryByText("Last 7 days")).not.toBeInTheDocument();
    });

    it("should render string icon", () => {
      render(<MetricCard title="Total Issues" value={42} icon="📊" />);

      expect(screen.getByText("📊")).toBeInTheDocument();
    });

    it("should render Lucide icon", () => {
      const { container } = render(<MetricCard title="Total Issues" value={42} icon={Activity} />);

      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should hide icon from screen readers", () => {
      const { container } = render(<MetricCard title="Total Issues" value={42} icon="📊" />);

      const iconContainer = container.querySelector('[aria-hidden="true"]');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe("Highlight", () => {
    it("should apply highlight ring when highlight is true", () => {
      const { container } = render(
        <MetricCard title="Total Issues" value={42} icon="📊" highlight />,
      );

      const card = container.firstChild;
      expect(card).toHaveClass("ring-2");
      expect(card).toHaveClass("ring-status-warning");
    });

    it("should not apply highlight ring when highlight is false", () => {
      const { container } = render(
        <MetricCard title="Total Issues" value={42} icon="📊" highlight={false} />,
      );

      const card = container.firstChild;
      expect(card).not.toHaveClass("ring-2");
    });
  });

  describe("TestId", () => {
    it("should apply testId when provided", () => {
      render(<MetricCard title="Total Issues" value={42} icon="📊" testId="metric-card-issues" />);

      expect(screen.getByTestId("metric-card-issues")).toBeInTheDocument();
    });
  });

  describe("Value Formatting", () => {
    it("should display zero value", () => {
      render(<MetricCard title="Total Issues" value={0} icon="📊" />);

      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("should display large values", () => {
      render(<MetricCard title="Total Issues" value={9999} icon="📊" />);

      expect(screen.getByText("9999")).toBeInTheDocument();
    });

    it("should display negative values", () => {
      render(<MetricCard title="Change" value={-15} icon="📉" />);

      expect(screen.getByText("-15")).toBeInTheDocument();
    });
  });
});
