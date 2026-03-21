import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { PageStack } from "./PageStack";

describe("PageStack", () => {
  it("applies the shared top-level page section rhythm", () => {
    const { container } = render(
      <PageStack>
        <div>Header</div>
        <div>Body</div>
      </PageStack>,
    );

    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("flex", "flex-col", "gap-6");
  });
});
