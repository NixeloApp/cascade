/**
 * GanttBar - Issue bar in the Gantt chart
 *
 * Renders an issue as a horizontal bar positioned based on its dates.
 * Supports drag-to-resize for changing dates.
 */

import type { Id } from "@convex/_generated/dataModel";
import { addDays, differenceInDays, format } from "date-fns";
import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { Typography } from "@/components/ui/Typography";
import type { IssuePriority } from "@/lib/issue-utils";
import { getPriorityColor } from "@/lib/issue-utils";
import { cn } from "@/lib/utils";
import type { EnrichedIssue } from "../../../convex/lib/issueHelpers";

interface GanttBarProps {
  issue: EnrichedIssue;
  rowIndex: number;
  viewStartDate: Date;
  dayWidth: number;
  rowHeight: number;
  onSelect: (issueId: Id<"issues">) => void;
  onUpdateDates?: (issueId: Id<"issues">, startDate?: number, dueDate?: number) => Promise<void>;
}

export function GanttBar({
  issue,
  rowIndex,
  viewStartDate,
  dayWidth,
  rowHeight,
  onSelect,
  onUpdateDates,
}: GanttBarProps) {
  const barRef = useRef<HTMLButtonElement>(null);
  const [isDragging, setIsDragging] = useState<"left" | "right" | "move" | null>(null);
  const [dragOffset, setDragOffset] = useState({ start: 0, end: 0 });

  // Calculate dates
  const startDate = issue.startDate ? new Date(issue.startDate) : null;
  const dueDate = issue.dueDate ? new Date(issue.dueDate) : null;
  const hasDates = startDate || dueDate;

  // Calculate effective dates (use same date if only one is set)
  const effectiveStart = useMemo(
    () => (hasDates ? startDate || dueDate : null),
    [hasDates, startDate, dueDate],
  );
  const effectiveEnd = useMemo(
    () => (hasDates ? dueDate || startDate : null),
    [hasDates, startDate, dueDate],
  );

  // Calculate position and width
  const metrics = useMemo(() => {
    if (!effectiveStart || !effectiveEnd) {
      return { startOffset: 0, duration: 0, left: 0, width: 0, top: 0, height: 0 };
    }

    const startOffset = differenceInDays(effectiveStart, viewStartDate);
    const duration = differenceInDays(effectiveEnd, effectiveStart) + 1;

    // Apply drag offsets
    const adjustedStartOffset = startOffset + dragOffset.start;
    const adjustedDuration = Math.max(1, duration - dragOffset.start + dragOffset.end);

    return {
      startOffset,
      duration,
      left: adjustedStartOffset * dayWidth,
      width: adjustedDuration * dayWidth - 4, // 4px gap
      top: rowIndex * rowHeight + 6, // 6px vertical padding
      height: rowHeight - 12,
    };
  }, [effectiveStart, effectiveEnd, viewStartDate, dayWidth, rowHeight, rowIndex, dragOffset]);

  // Handle mouse down for dragging
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, type: "left" | "right" | "move") => {
      if (!onUpdateDates || !effectiveStart || !effectiveEnd) return;
      e.stopPropagation();
      e.preventDefault();

      setIsDragging(type);

      const startX = e.clientX;
      const initialOffset = { ...dragOffset };
      const { duration } = metrics;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const daysDelta = Math.round(deltaX / dayWidth);

        if (type === "left") {
          setDragOffset({
            start: Math.min(daysDelta, duration - 1 + initialOffset.end),
            end: initialOffset.end,
          });
        } else if (type === "right") {
          setDragOffset({
            start: initialOffset.start,
            end: Math.max(daysDelta, -(duration - 1) - initialOffset.start),
          });
        } else {
          setDragOffset({
            start: daysDelta,
            end: daysDelta,
          });
        }
      };

      const handleMouseUp = async () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        setIsDragging(null);

        // Calculate new dates
        const newStartDate = addDays(effectiveStart, dragOffset.start);
        const newEndDate = addDays(effectiveEnd, dragOffset.end);

        // Only update if dates changed
        if (dragOffset.start !== 0 || dragOffset.end !== 0) {
          await onUpdateDates(
            issue._id,
            startDate ? newStartDate.getTime() : undefined,
            dueDate ? newEndDate.getTime() : undefined,
          );
        }

        setDragOffset({ start: 0, end: 0 });
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [
      onUpdateDates,
      dayWidth,
      metrics,
      effectiveStart,
      effectiveEnd,
      issue._id,
      startDate,
      dueDate,
      dragOffset,
    ],
  );

  // If no dates, don't render (after hooks)
  if (!hasDates || !effectiveStart || !effectiveEnd) {
    return null;
  }

  const priorityColor = getPriorityColor(issue.priority as IssuePriority, "badge");
  const dateRange = `${format(effectiveStart, "MMM d")} - ${format(effectiveEnd, "MMM d, yyyy")}`;
  const { left, top, width, height } = metrics;

  return (
    <Tooltip content={`${issue.key}: ${issue.title}\n${dateRange}`}>
      <Button
        ref={barRef}
        variant="unstyled"
        className={cn(
          "absolute flex items-center rounded cursor-pointer transition-shadow border-0 text-left",
          "hover:shadow-md hover:z-20",
          isDragging && "shadow-lg z-30",
          priorityColor,
        )}
        style={{
          left,
          top,
          width: Math.max(width, 20),
          height,
        }}
        onClick={() => onSelect(issue._id)}
      >
        {/* Left resize handle */}
        {onUpdateDates && (
          <span
            role="slider"
            aria-label="Resize start date"
            aria-valuenow={0}
            tabIndex={0}
            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/10 rounded-l"
            onMouseDown={(e) => handleMouseDown(e, "left")}
          />
        )}

        {/* Bar content */}
        <Typography variant="caption" className="flex-1 truncate px-2 font-medium">
          {width > 60 && issue.key}
        </Typography>

        {/* Right resize handle */}
        {onUpdateDates && (
          <span
            role="slider"
            aria-label="Resize end date"
            aria-valuenow={0}
            tabIndex={0}
            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/10 rounded-r"
            onMouseDown={(e) => handleMouseDown(e, "right")}
          />
        )}
      </Button>
    </Tooltip>
  );
}
