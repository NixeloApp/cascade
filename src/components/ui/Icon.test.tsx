import { describe, expect, it } from "vitest";
import { CheckCircle } from "@/lib/icons";
import { render, screen } from "@/test/custom-render";
import { Icon } from "./Icon";

describe("Icon", () => {
  it("applies the configured size class", () => {
    render(<Icon icon={CheckCircle} size="sm" data-testid="icon" />);

    expect(screen.getByTestId("icon")).toHaveClass("w-4", "h-4");
  });

  it("supports the compact chevron size preset", () => {
    render(<Icon icon={CheckCircle} size="xsPlus" data-testid="icon" />);

    expect(screen.getByTestId("icon")).toHaveClass("w-3.5", "h-3.5");
  });

  it("applies the configured semantic tone class", () => {
    render(<Icon icon={CheckCircle} tone="success" data-testid="icon" />);

    expect(screen.getByTestId("icon")).toHaveClass("text-status-success");
  });

  it("applies the configured animation class", () => {
    render(<Icon icon={CheckCircle} animation="pulse" data-testid="icon" />);

    expect(screen.getByTestId("icon")).toHaveClass("animate-pulse");
  });
});
