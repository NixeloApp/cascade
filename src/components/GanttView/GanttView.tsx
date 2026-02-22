/**
 * GanttView - Timeline visualization for issues
 *
 * A simplified Gantt chart component that shows issues on a timeline.
 * Inspired by Plane's gantt-chart but adapted for Nixelo's patterns.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import {
  addMonths,
  differenceInDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  isToday,
  isWeekend,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { IssueDetailModal } from "@/components/IssueDetailModal";
import { Button } from "@/components/ui/Button";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";
import { useSmartBoardData } from "@/hooks/useSmartBoardData";
import { cn } from "@/lib/utils";
import { GanttBar } from "./GanttBar";
import { GanttSidebar } from "./GanttSidebar";
import { GanttSkeleton } from "./GanttSkeleton";

/** Width of each day column in pixels */
const DAY_WIDTH = 40;
/** Height of each row in pixels */
const ROW_HEIGHT = 44;
/** Width of sidebar in pixels */
const SIDEBAR_WIDTH = 280;

interface GanttViewProps {
  projectId: Id<"projects">;
  sprintId?: Id<"sprints">;
  canEdit?: boolean;
}

export function GanttView({ projectId, sprintId, canEdit = true }: GanttViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedIssue, setSelectedIssue] = useState<Id<"issues"> | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Data fetching
  const { issuesByStatus, isLoading, workflowStates } = useSmartBoardData({
    projectId,
    sprintId,
  });

  // Mutations
  const updateIssue = useMutation(api.issues.update);

  // Flatten issues into a single list
  const allIssues = workflowStates
    ? workflowStates.flatMap((state) => issuesByStatus[state.id] || [])
    : Object.values(issuesByStatus).flat();

  // Filter to issues with dates (for Gantt we need at least a start or due date)
  const ganttIssues = allIssues.filter((issue) => issue.startDate || issue.dueDate);

  // Calculate date range for display (memoized using timestamp to avoid Date object comparison)
  const currentMonthTime = currentMonth.getTime();
  const { viewStartDate, viewEndDate } = useMemo(() => {
    const month = new Date(currentMonthTime);
    return {
      viewStartDate: startOfMonth(subMonths(month, 1)),
      viewEndDate: endOfMonth(addMonths(month, 2)),
    };
  }, [currentMonthTime]);

  // Generate all days in the view range
  const daysInView = useMemo(() => {
    return eachDayOfInterval({ start: viewStartDate, end: viewEndDate });
  }, [viewStartDate, viewEndDate]);

  // Calculate chart width
  const chartWidth = daysInView.length * DAY_WIDTH;

  // Handle date update for an issue
  const handleUpdateDates = useCallback(
    async (issueId: Id<"issues">, startDate?: number, dueDate?: number) => {
      await updateIssue({
        issueId,
        ...(startDate !== undefined && { startDate }),
        ...(dueDate !== undefined && { dueDate }),
      });
    },
    [updateIssue],
  );

  // Navigation handlers
  const handlePrevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));
  const handleToday = () => setCurrentMonth(new Date());

  if (isLoading) {
    return <GanttSkeleton />;
  }

  return (
    <Flex direction="column" className="h-full">
      {/* Toolbar */}
      <Flex
        align="center"
        justify="between"
        className="border-b border-ui-border px-4 py-2 shrink-0"
      >
        <Flex align="center" gap="sm">
          <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleToday}>
            Today
          </Button>
          <Button variant="ghost" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Typography variant="label" className="ml-2">
            {format(currentMonth, "MMMM yyyy")}
          </Typography>
        </Flex>
        <Typography variant="small" color="secondary">
          {ganttIssues.length} issues with dates
        </Typography>
      </Flex>

      {/* Gantt Container */}
      <Flex ref={containerRef} className="flex-1 overflow-auto">
        {/* Sidebar */}
        <GanttSidebar issues={ganttIssues} rowHeight={ROW_HEIGHT} width={SIDEBAR_WIDTH} />

        {/* Chart Area */}
        <FlexItem flex="1" className="overflow-x-auto">
          <div style={{ width: chartWidth, minWidth: "100%" }}>
            {/* Header with dates */}
            <div
              className="sticky top-0 z-10 bg-ui-bg-soft border-b border-ui-border"
              style={{ height: ROW_HEIGHT }}
            >
              <Flex style={{ height: "100%" }}>
                {daysInView.map((day) => (
                  <Flex
                    key={day.toISOString()}
                    direction="column"
                    align="center"
                    justify="center"
                    className={cn(
                      "shrink-0 border-r border-ui-border/30",
                      isToday(day) && "bg-brand-indigo-bg/30",
                      isWeekend(day) && !isToday(day) && "bg-ui-bg-tertiary/30",
                    )}
                    style={{ width: DAY_WIDTH }}
                  >
                    <Typography variant="caption" color="tertiary">
                      {format(day, "EEE")}
                    </Typography>
                    <Typography
                      variant="small"
                      className={cn(isToday(day) && "font-bold text-brand")}
                      color={isToday(day) ? undefined : "secondary"}
                    >
                      {format(day, "d")}
                    </Typography>
                  </Flex>
                ))}
              </Flex>
            </div>

            {/* Chart grid and bars */}
            <div className="relative">
              {/* Grid lines */}
              <Flex className="absolute inset-0 pointer-events-none">
                {daysInView.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "shrink-0 border-r border-ui-border/20",
                      isToday(day) && "bg-brand-indigo-bg/10",
                      isWeekend(day) && !isToday(day) && "bg-ui-bg-tertiary/20",
                    )}
                    style={{ width: DAY_WIDTH, height: ganttIssues.length * ROW_HEIGHT || 200 }}
                  />
                ))}
              </Flex>

              {/* Today line */}
              {daysInView.some((d) => isToday(d)) && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-brand z-10"
                  style={{
                    left:
                      differenceInDays(new Date(), viewStartDate) * DAY_WIDTH + DAY_WIDTH / 2 - 1,
                    height: ganttIssues.length * ROW_HEIGHT || 200,
                  }}
                />
              )}

              {/* Issue bars */}
              {ganttIssues.map((issue, index) => (
                <GanttBar
                  key={issue._id}
                  issue={issue}
                  rowIndex={index}
                  viewStartDate={viewStartDate}
                  dayWidth={DAY_WIDTH}
                  rowHeight={ROW_HEIGHT}
                  onSelect={setSelectedIssue}
                  onUpdateDates={canEdit ? handleUpdateDates : undefined}
                />
              ))}

              {/* Empty state */}
              {ganttIssues.length === 0 && (
                <Flex align="center" justify="center" className="h-64">
                  <Typography variant="small" color="secondary">
                    No issues with start or due dates. Add dates to see them on the timeline.
                  </Typography>
                </Flex>
              )}
            </div>
          </div>
        </FlexItem>
      </Flex>

      {/* Issue Detail Modal */}
      {selectedIssue && (
        <IssueDetailModal
          issueId={selectedIssue}
          open={true}
          onOpenChange={(open) => {
            if (!open) setSelectedIssue(null);
          }}
          canEdit={canEdit}
        />
      )}
    </Flex>
  );
}
