import { cn } from "@/lib/utils";

export function getKanbanIssueItemAnimationClassName() {
  return "animate-scale-in";
}

export function getKanbanCollapsedSectionClassName() {
  return "w-11 shrink-0 snap-start animate-slide-up";
}

export function getKanbanCollapsedShellClassName(isDraggedOver: boolean) {
  return cn(isDraggedOver && "bg-brand/5 ring-2 ring-brand/30");
}

export function getKanbanCollapsedBodyClassName() {
  return "h-full";
}

export function getKanbanCollapsedTitleClassName() {
  return "text-sm";
}

export function getKanbanColumnTitleRowClassName() {
  return "min-w-0";
}

export function getKanbanColumnTitleClassName() {
  return "truncate";
}

export function getKanbanColumnCountBadgeClassName() {
  return "shrink-0";
}

export function getKanbanColumnActionsClassName() {
  return "shrink-0";
}

export function getKanbanExpandedSectionClassName() {
  return "shrink-0 snap-start animate-slide-up";
}

export function getKanbanExpandedShellClassName(
  isDraggedOver: boolean,
  isOverWipLimit: boolean,
  isAtWipLimit: boolean,
) {
  return cn(
    "h-full",
    isDraggedOver && "bg-brand/5 ring-2 ring-brand/30",
    isOverWipLimit && "border-status-error/50 bg-status-error/5",
    isAtWipLimit && !isOverWipLimit && "border-status-warning/50",
  );
}

export function getKanbanLoadMoreButtonClassName() {
  return "w-full";
}
