import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Inline } from "./Inline";

describe("Inline", () => {
  it("renders a span with the provided content and className", () => {
    render(
      <Inline data-testid="inline" className="truncate">
        Label
      </Inline>,
    );

    const inline = screen.getByTestId("inline");
    expect(inline.tagName).toBe("SPAN");
    expect(inline).toHaveTextContent("Label");
    expect(inline.className).toContain("truncate");
  });
});
