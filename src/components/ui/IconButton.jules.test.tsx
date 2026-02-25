import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IconButton } from "./IconButton";
import { TooltipProvider } from "./Tooltip";

const renderWithTooltip = (ui: React.ReactElement) => {
  return render(<TooltipProvider delayDuration={0}>{ui}</TooltipProvider>);
};

describe("IconButton", () => {
  it("renders as button by default", () => {
    render(<IconButton>Icon</IconButton>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("passes aria-label correctly", () => {
    render(<IconButton aria-label="Close">Icon</IconButton>);
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("uses tooltip as aria-label if aria-label is missing", () => {
    renderWithTooltip(<IconButton tooltip="Close Tooltip">Icon</IconButton>);
    expect(screen.getByRole("button", { name: "Close Tooltip" })).toBeInTheDocument();
  });

  it("prefers explicit aria-label over tooltip for the accessible name", () => {
    renderWithTooltip(
      <IconButton tooltip="Close Tooltip" aria-label="Explicit Label">
        Icon
      </IconButton>,
    );
    expect(screen.getByRole("button", { name: "Explicit Label" })).toBeInTheDocument();
  });

  it("renders tooltip trigger attributes when tooltip is provided", () => {
    // Radix UI TooltipTrigger adds data-state attribute
    renderWithTooltip(<IconButton tooltip="Hover me">Icon</IconButton>);
    const button = screen.getByRole("button", { name: "Hover me" });
    expect(button).toHaveAttribute("data-state", "closed");
  });
});
