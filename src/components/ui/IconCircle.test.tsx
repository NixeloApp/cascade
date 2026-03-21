import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { IconCircle } from "./IconCircle";

describe("IconCircle", () => {
  it("defaults the foreground tone from the semantic variant", () => {
    render(<IconCircle variant="success" data-testid="icon-circle" />);

    expect(screen.getByTestId("icon-circle")).toHaveClass(
      "bg-status-success-bg",
      "text-status-success-text",
    );
  });

  it("lets callers override the foreground tone without bypassing the primitive", () => {
    render(<IconCircle variant="soft" tone="brand" data-testid="icon-circle" />);

    expect(screen.getByTestId("icon-circle")).toHaveClass("bg-ui-bg-soft", "text-brand");
  });
});
