import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { PageControls, PageControlsGroup, PageControlsRow, SectionControls } from "./PageControls";

describe("PageControls", () => {
  it("renders the shared filter-bar shell with the default page rhythm spacing", () => {
    const { container } = render(
      <PageControls>
        <div>Page controls</div>
      </PageControls>,
    );

    expect(screen.getByText("Page controls")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("mb-6");
    expect(container.firstChild?.firstChild).toHaveClass("from-ui-bg-elevated/98", "shadow-card");
  });

  it("stacks rows on small screens and splits them at md+", () => {
    render(
      <PageControlsRow>
        <div>Primary</div>
        <div>Secondary</div>
      </PageControlsRow>,
    );

    const row = screen.getByText("Primary").parentElement;
    expect(row).toHaveClass("flex", "flex-col", "md:flex-row", "items-stretch", "md:items-center");
    expect(row).toHaveClass("md:justify-between");
  });

  it("wraps compact control groups by default", () => {
    render(
      <PageControlsGroup>
        <button type="button">One</button>
        <button type="button">Two</button>
      </PageControlsGroup>,
    );

    const group = screen.getByRole("button", { name: "One" }).parentElement;
    expect(group).toHaveClass("flex", "flex-wrap", "gap-2", "items-center");
  });

  it("renders the lighter section controls shell for in-panel filters and tabs", () => {
    const { container } = render(
      <SectionControls>
        <div>Section controls</div>
      </SectionControls>,
    );

    expect(screen.getByText("Section controls")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("shadow-soft");
    expect(container.firstChild).toHaveClass(
      "from-ui-bg-elevated/98",
      "border-ui-border-secondary/80",
    );
  });

  it("drops standalone margin when the controls live inside a shared page stack", () => {
    const { container } = render(
      <PageControls spacing="stack">
        <div>Stacked controls</div>
      </PageControls>,
    );

    expect(screen.getByText("Stacked controls")).toBeInTheDocument();
    expect(container.firstChild).not.toHaveClass("mb-6");
  });

  it("renders a lighter strip shell for shared section navigation bands", () => {
    const { container } = render(
      <PageControls tone="strip" padding="sm">
        <div>Section tabs</div>
      </PageControls>,
    );

    expect(screen.getByText("Section tabs")).toBeInTheDocument();
    expect(container.firstChild?.firstChild).toHaveClass(
      "border-b",
      "bg-transparent",
      "shadow-none",
    );
    expect(container.firstChild?.firstChild).not.toHaveClass("from-ui-bg-elevated/98");
  });
});
