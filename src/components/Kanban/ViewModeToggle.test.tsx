import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useIssueViewMode } from "@/contexts/IssueViewModeContext";
import { render, screen } from "@/test/custom-render";
import { ViewModeToggle } from "./ViewModeToggle";

vi.mock("@/contexts/IssueViewModeContext", () => ({
  useIssueViewMode: vi.fn(),
}));

vi.mock("../ui/IconButton", () => ({
  IconButton: ({
    children,
    onClick,
    "aria-label": ariaLabel,
    "aria-pressed": ariaPressed,
  }: {
    children: ReactNode;
    onClick?: () => void;
    "aria-label": string;
    "aria-pressed"?: boolean;
  }) => (
    <button type="button" onClick={onClick} aria-label={ariaLabel} aria-pressed={ariaPressed}>
      {children}
    </button>
  ),
}));

vi.mock("../ui/Tooltip", () => ({
  TooltipProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  Tooltip: ({ children, content }: { children: ReactNode; content: string }) => (
    <div>
      <div>{content}</div>
      {children}
    </div>
  ),
}));

const mockUseIssueViewMode = vi.mocked(useIssueViewMode);
const toggleViewMode = vi.fn();

describe("ViewModeToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseIssueViewMode.mockReturnValue({
      viewMode: "modal",
      setViewMode: vi.fn(),
      toggleViewMode,
    });
  });

  it("renders the modal-state tooltip and toggles into peek mode", async () => {
    const user = userEvent.setup();

    render(<ViewModeToggle />);

    const button = screen.getByRole("button", { name: "Switch to side panel view" });
    expect(screen.getByText("Switch to side panel view")).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-pressed", "false");

    await user.click(button);

    expect(toggleViewMode).toHaveBeenCalledTimes(1);
  });

  it("renders the peek-state tooltip and pressed state", () => {
    mockUseIssueViewMode.mockReturnValue({
      viewMode: "peek",
      setViewMode: vi.fn(),
      toggleViewMode,
    });

    render(<ViewModeToggle />);

    const button = screen.getByRole("button", { name: "Switch to modal view" });
    expect(screen.getByText("Switch to modal view")).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-pressed", "true");
  });
});
