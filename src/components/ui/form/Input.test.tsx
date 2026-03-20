import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "./Input";

describe("Form Input", () => {
  it("applies filePicker variant styling", () => {
    render(<Input variant="filePicker" data-testid="input" type="file" />);
    const input = screen.getByTestId("input");
    expect(input.className).toContain("cursor-pointer");
    expect(input.className).toContain("bg-ui-bg-secondary");
  });

  it("applies twoFactorCode variant styling", () => {
    render(<Input variant="twoFactorCode" data-testid="input" />);
    const input = screen.getByTestId("input");
    expect(input.className).toContain("font-mono");
    expect(input.className).toContain("text-xl");
    expect(input.className).toContain("tracking-widest");
  });
});
