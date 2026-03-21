import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { PageControls, PageControlsGroup, PageControlsRow } from "./PageControls";

describe("PageControls", () => {
  it("renders the shared filter-bar shell with the default page rhythm spacing", () => {
    const { container } = render(
      <PageControls>
        <div>Page controls</div>
      </PageControls>,
    );

    expect(screen.getByText("Page controls")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("mb-6");
    expect(container.firstChild).toHaveClass("from-ui-bg-elevated/98", "shadow-card");
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
});
