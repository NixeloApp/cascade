import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { ScrollArea } from "./ScrollArea";

describe("ScrollArea", () => {
  it("renders the large content-height variant", () => {
    render(
      <ScrollArea size="contentLg" data-testid="scroll-area">
        <div>Content</div>
      </ScrollArea>,
    );

    expect(screen.getByTestId("scroll-area")).toHaveClass("max-h-96");
  });

  it("renders the compact content-height variant", () => {
    render(
      <ScrollArea size="contentSm" data-testid="scroll-area">
        <div>Content</div>
      </ScrollArea>,
    );

    expect(screen.getByTestId("scroll-area")).toHaveClass("max-h-40");
  });
});
