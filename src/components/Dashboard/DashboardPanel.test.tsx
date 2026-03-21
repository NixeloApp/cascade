import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import {
  DashboardPanel,
  DashboardPanelBody,
  DashboardPanelFooter,
  DashboardPanelHeader,
} from "./DashboardPanel";

describe("DashboardPanel", () => {
  it("renders shared header, body, and footer content", () => {
    render(
      <DashboardPanel>
        <DashboardPanelHeader
          title="Active feed"
          description="Assigned and created issues stay in one queue."
          badge={<span>Live queue</span>}
          controls={<button type="button">Assigned</button>}
        />
        <DashboardPanelBody>
          <div>Issue content</div>
        </DashboardPanelBody>
        <DashboardPanelFooter>
          <button type="button">Load more</button>
        </DashboardPanelFooter>
      </DashboardPanel>,
    );

    expect(screen.getByText("Active feed")).toBeInTheDocument();
    expect(screen.getByText("Assigned and created issues stay in one queue.")).toBeInTheDocument();
    expect(screen.getByText("Live queue")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Assigned" })).toBeInTheDocument();
    expect(screen.getByText("Issue content")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Load more" })).toBeInTheDocument();
  });

  it("uses the inset surface when requested", () => {
    const { container } = render(
      <DashboardPanel surface="inset">
        <DashboardPanelBody>Inset content</DashboardPanelBody>
      </DashboardPanel>,
    );

    expect(container.firstChild).toHaveClass("backdrop-blur-sm");
    expect(screen.getByText("Inset content")).toBeInTheDocument();
  });
});
