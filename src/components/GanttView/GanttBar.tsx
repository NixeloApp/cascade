/**
 * GanttBar - Issue bar in the Gantt chart
 *
 * Renders an issue as a horizontal bar positioned based on its dates.
 * Supports drag-to-resize for changing dates.
 */

import type { Id } from "@convex/_generated/dataModel";
import { addDays, differenceInDays, format } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const [isDragging, setIsDragging] = useState<"left" | "right" | null>(null);
  const [dragOffset, setDragOffset] = useState({ start: 0, end: 0 });
  // Ref to track current dragOffset for use in event handlers (avoids stale closure)
  const dragOffsetRef = useRef(dragOffset);
  dragOffsetRef.current = dragOffset;
  // Ref to store cleanup function for event listeners (handles unmount during drag)
  const cleanupRef = useRef<(() => void) | null>(null);

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

  // Handle mouse down for dragging (resize handles only)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, type: "left" | "right") => {
      if (!onUpdateDates || !effectiveStart || !effectiveEnd) return;
      e.stopPropagation();
      e.preventDefault();

      setIsDragging(type);

      const startX = e.clientX;
      // Use ref to capture initial offset (avoids stale closure and unnecessary re-renders)
      const initialOffset = { ...dragOffsetRef.current };
      const { duration } = metrics;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const daysDelta = Math.round(deltaX / dayWidth);

        if (type === "left") {
          setDragOffset({
            start: Math.min(daysDelta, duration - 1 + initialOffset.end),
            end: initialOffset.end,
          });
        } else {
          setDragOffset({
            start: initialOffset.start,
            end: Math.max(daysDelta, -(duration - 1) - initialOffset.start),
          });
        }
      };

      const handleMouseUp = async () => {
        cleanup();
        setIsDragging(null);

        // Use ref to get current dragOffset (avoids stale closure)
        const currentOffset = dragOffsetRef.current;

        // Calculate new dates
        const newStartDate = addDays(effectiveStart, currentOffset.start);
        const newEndDate = addDays(effectiveEnd, currentOffset.end);

        // Only update if dates changed
        if (currentOffset.start !== 0 || currentOffset.end !== 0) {
          await onUpdateDates(
            issue._id,
            startDate ? newStartDate.getTime() : undefined,
            dueDate ? newEndDate.getTime() : undefined,
          );
        }

        setDragOffset({ start: 0, end: 0 });
      };

      // Cleanup function to remove event listeners
      const cleanup = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        cleanupRef.current = null;
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      cleanupRef.current = cleanup;
    },
    [onUpdateDates, dayWidth, metrics, effectiveStart, effectiveEnd, issue._id, startDate, dueDate],
  );

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);

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
          <Button
            variant="unstyled"
            aria-label={`Adjust start date for ${issue.key}`}
            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-ui-bg-hover rounded-l"
            onMouseDown={(e) => handleMouseDown(e, "left")}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                onUpdateDates(
                  issue._id,
                  startDate ? addDays(startDate, -1).getTime() : undefined,
                  undefined,
                );
              } else if (e.key === "ArrowRight") {
                e.preventDefault();
                onUpdateDates(
                  issue._id,
                  startDate ? addDays(startDate, 1).getTime() : undefined,
                  undefined,
                );
              }
            }}
          />
        )}

        {/* Bar content */}
        <Typography variant="caption" className="flex-1 truncate px-2 font-medium">
          {width > 60 && issue.key}
        </Typography>

        {/* Right resize handle */}
        {onUpdateDates && (
          <Button
            variant="unstyled"
            aria-label={`Adjust due date for ${issue.key}`}
            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-ui-bg-hover rounded-r"
            onMouseDown={(e) => handleMouseDown(e, "right")}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                onUpdateDates(
                  issue._id,
                  undefined,
                  dueDate ? addDays(dueDate, -1).getTime() : undefined,
                );
              } else if (e.key === "ArrowRight") {
                e.preventDefault();
                onUpdateDates(
                  issue._id,
                  undefined,
                  dueDate ? addDays(dueDate, 1).getTime() : undefined,
                );
              }
            }}
          />
        )}
      </Button>
    </Tooltip>
  );
}
