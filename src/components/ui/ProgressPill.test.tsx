import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { ProgressPill } from "./ProgressPill";

describe("ProgressPill", () => {
  it("renders active and extended variants", () => {
    render(<ProgressPill tone="active" length="extended" data-testid="progress-pill" />);

    expect(screen.getByTestId("progress-pill")).toHaveClass("bg-brand", "w-6", "h-1.5");
  });
});
