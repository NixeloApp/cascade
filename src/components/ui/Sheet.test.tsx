import { describe, expect, it, vi } from "vitest";

import { render, screen } from "@/test/custom-render";
import { Sheet } from "./Sheet";

describe("Sheet", () => {
  it("renders custom header content inside shared sheet chrome and preserves accessible metadata", () => {
    render(
      <Sheet
        open={true}
        onOpenChange={vi.fn()}
        title="Issue details"
        description="View and edit issue details"
        header={<div>Custom issue header</div>}
        bodyClassName="p-0"
        footer={<button type="button">Save changes</button>}
        data-testid="sheet-content"
      >
        <div>Sheet body</div>
      </Sheet>,
    );

    expect(screen.getByTestId("sheet-content")).toBeInTheDocument();
    expect(screen.getByText("Custom issue header")).toBeInTheDocument();
    expect(screen.getByText("Issue details")).toBeInTheDocument();
    expect(screen.getByText("View and edit issue details")).toBeInTheDocument();
    expect(screen.getByText("Sheet body").parentElement).toHaveClass("p-0");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });
});
