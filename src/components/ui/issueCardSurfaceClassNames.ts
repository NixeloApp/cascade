import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { cn } from "@/lib/utils";

export function getIssueCardRootClassName(options?: {
  isDragging?: boolean;
  closestEdge?: Edge | null;
}) {
  const { isDragging = false, closestEdge = null } = options ?? {};

  return cn(
    "group relative w-full text-left",
    isDragging && "opacity-50 scale-95",
    closestEdge === "top" &&
      "before:absolute before:left-0 before:right-0 before:-top-1 before:h-0.5 before:bg-brand before:rounded-full",
    closestEdge === "bottom" &&
      "after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-0.5 after:bg-brand after:rounded-full",
  );
}

export function getIssueCardHeaderClassName() {
  return "mb-1 sm:mb-2";
}

export function getIssueCardAssigneeFallbackClassName() {
  return "inline-flex size-5 items-center justify-center text-xs font-medium";
}

export function getIssueCardDragHandleIconClassName() {
  return "size-3 shrink-0 -ml-0.5 text-ui-text-tertiary opacity-40";
}

export function getIssueCardLabelsClassName() {
  return "mb-1.5 sm:mb-2";
}

export function getIssueCardTitleClassName() {
  return "mb-1 line-clamp-2 pointer-events-auto leading-snug sm:mb-2";
}
