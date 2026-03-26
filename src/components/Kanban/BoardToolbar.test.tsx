import { describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { IssueViewModeProvider } from "@/contexts/IssueViewModeContext";
import { TEST_IDS } from "@/lib/test-ids";
import { render, screen } from "@/test/custom-render";
import { BoardToolbar } from "./BoardToolbar";

describe("BoardToolbar", () => {
  const mockProps = {
    selectionMode: false,
    historyStack: [],
    redoStack: [],
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    onToggleSelectionMode: vi.fn(),
  };

  it("renders undo and redo buttons", () => {
    render(
      <IssueViewModeProvider>
        <TooltipProvider>
          <BoardToolbar {...mockProps} historyStack={[1]} redoStack={[1]} />
        </TooltipProvider>
      </IssueViewModeProvider>,
    );

    expect(screen.getByRole("button", { name: /Undo/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Redo/i })).toBeInTheDocument();
  });

  it("keeps the mobile toolbar in flow instead of overlaying the selector row", () => {
    render(
      <IssueViewModeProvider>
        <TooltipProvider>
          <BoardToolbar {...mockProps} mobileActions={<span>mobile-actions</span>} />
        </TooltipProvider>
      </IssueViewModeProvider>,
    );

    const toolbar = screen.getByTestId(TEST_IDS.BOARD.TOOLBAR);
    expect(toolbar).toHaveClass("mx-2", "mb-2");
    expect(toolbar).not.toHaveClass("absolute", "right-2", "top-2");
    expect(screen.getByText("mobile-actions")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /enable selection mode/i })).toHaveLength(2);
  });
});
