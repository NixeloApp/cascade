import { describe, expect, it } from "vitest";
import {
  getKanbanCollapsedBodyClassName,
  getKanbanCollapsedSectionClassName,
  getKanbanCollapsedShellClassName,
  getKanbanCollapsedTitleClassName,
  getKanbanColumnActionsClassName,
  getKanbanColumnCountBadgeClassName,
  getKanbanColumnTitleClassName,
  getKanbanColumnTitleRowClassName,
  getKanbanExpandedSectionClassName,
  getKanbanExpandedShellClassName,
  getKanbanIssueItemAnimationClassName,
  getKanbanLoadMoreButtonClassName,
} from "./kanbanColumnSurfaceClassNames";

describe("kanbanColumnSurfaceClassNames", () => {
  it("returns the owned collapsed column chrome classes", () => {
    expect(getKanbanIssueItemAnimationClassName()).toBe("animate-scale-in");
    expect(getKanbanCollapsedSectionClassName()).toBe("w-11 shrink-0 snap-start animate-slide-up");
    expect(getKanbanCollapsedShellClassName(false)).toBe("");
    expect(getKanbanCollapsedShellClassName(true)).toBe("bg-brand/5 ring-2 ring-brand/30");
    expect(getKanbanCollapsedBodyClassName()).toBe("h-full");
    expect(getKanbanCollapsedTitleClassName()).toBe("text-sm");
  });

  it("returns the owned expanded column chrome classes", () => {
    expect(getKanbanColumnTitleRowClassName()).toBe("min-w-0");
    expect(getKanbanColumnTitleClassName()).toBe("truncate");
    expect(getKanbanColumnCountBadgeClassName()).toBe("shrink-0");
    expect(getKanbanColumnActionsClassName()).toBe("shrink-0");
    expect(getKanbanExpandedSectionClassName()).toBe("shrink-0 snap-start animate-slide-up");
    expect(getKanbanExpandedShellClassName(false, false, false)).toBe("h-full");
    expect(getKanbanExpandedShellClassName(true, false, false)).toBe(
      "h-full bg-brand/5 ring-2 ring-brand/30",
    );
    expect(getKanbanExpandedShellClassName(false, false, true)).toBe(
      "h-full border-status-warning/50",
    );
    expect(getKanbanExpandedShellClassName(false, true, true)).toBe(
      "h-full border-status-error/50 bg-status-error/5",
    );
    expect(getKanbanLoadMoreButtonClassName()).toBe("w-full");
  });
});
