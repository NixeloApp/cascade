/**
 * Issues Calendar View
 *
 * Monthly calendar grid showing issues by their due dates.
 * Supports issue creation, quick viewing, and drag-to-reschedule.
 * Displays priority indicators and issue type icons on calendar cells.
 */

import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Stack } from "@/components/ui/Stack";
import { Tooltip } from "@/components/ui/Tooltip";
import { Plus } from "@/lib/icons";
import { getPriorityColor, ISSUE_TYPE_ICONS } from "@/lib/issue-utils";
import { showError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { CreateIssueModal } from "./IssueDetail";
import { IssueDetailViewer } from "./IssueDetailViewer";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Icon } from "./ui/Icon";
import { IconButton } from "./ui/IconButton";
import { Typography } from "./ui/Typography";

interface IssuesCalendarViewProps {
  projectId: Id<"projects">;
  sprintId?: Id<"sprints">;
  canEdit?: boolean;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const PRIORITY_LEGEND_ITEMS = [
  { label: "Highest", className: "bg-status-error" },
  { label: "High", className: "bg-status-warning" },
  { label: "Medium", className: "bg-accent-ring" },
  { label: "Low", className: "bg-brand-ring" },
  { label: "Lowest", className: "bg-ui-text-secondary" },
] as const;
const DAY_CELL_HEIGHT_CLASS = "min-h-32 md:min-h-24";
const MAX_VISIBLE_ISSUES_PER_DAY = 3;

function getMonthRangeTimestamps(year: number, month: number): { from: number; to: number } {
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { from: start.getTime(), to: end.getTime() };
}

function getDayDateKey(year: number, month: number, day: number): string {
  return new Date(year, month, day).toDateString();
}

function getDayDueTimestamp(year: number, month: number, day: number): number {
  // Set to end of day (23:59:59.999) for due date.
  return new Date(year, month, day, 23, 59, 59, 999).getTime();
}

function shiftMonth(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function groupIssuesByDate(issues: Doc<"issues">[] | undefined): Record<string, Doc<"issues">[]> {
  const byDate: Record<string, Doc<"issues">[]> = {};
  issues?.forEach((issue) => {
    if (!issue.dueDate) return;
    const dateKey = new Date(issue.dueDate).toDateString();
    if (!byDate[dateKey]) byDate[dateKey] = [];
    byDate[dateKey].push(issue);
  });
  return byDate;
}

function isSameCalendarDay(date: Date, year: number, month: number, day: number): boolean {
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
}

/**
 * IssuesCalendarView Component
 *
 * Renders a full-month calendar view of issues for a project.
 * Supports navigation between months, highlighting today, and displaying issues
 * on their respective due dates with priority-colored indicators.
 *
 * @param props.projectId - The ID of the project to view issues for
 * @param props.sprintId - Optional sprint ID to filter issues by sprint
 * @param props.canEdit - Whether the user has permission to edit issues (default: true)
 */
export function IssuesCalendarView({
  projectId,
  sprintId,
  canEdit = true,
}: IssuesCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedIssue, setSelectedIssue] = useState<Id<"issues"> | null>(null);
  const [createForDate, setCreateForDate] = useState<number | null>(null);
  const [draggedIssue, setDraggedIssue] = useState<Id<"issues"> | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);

  const updateIssue = useMutation(api.issues.update);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calculate the visible date range (including padding days)
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstDayOfMonth = firstDay.getDay(); // 0 = Sunday
  const daysInMonth = lastDay.getDate();

  const { from: startTimestamp, to: endTimestamp } = getMonthRangeTimestamps(year, month);

  const issues = useQuery(api.issues.listIssuesByDateRange, {
    projectId,
    sprintId,
    from: startTimestamp,
    to: endTimestamp,
  });

  const issuesByDate = groupIssuesByDate(issues);

  const navigateMonth = (delta: number) => {
    setCurrentDate(shiftMonth(currentDate, delta));
  };

  const today = new Date();
  const isToday = (day: number) => isSameCalendarDay(today, year, month, day);

  const resetDragState = () => {
    setDraggedIssue(null);
    setDragOverDay(null);
  };

  // Drag and drop handlers for rescheduling issues
  const handleDragStart = (e: React.DragEvent, issueId: Id<"issues">) => {
    if (!canEdit) return;
    setDraggedIssue(issueId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", issueId);
  };

  const handleDragEnd = () => {
    resetDragState();
  };

  const handleDragOver = (e: React.DragEvent, day: number) => {
    if (!canEdit || !draggedIssue) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDay(day);
  };

  const handleDragLeave = () => {
    setDragOverDay(null);
  };

  const handleDrop = async (e: React.DragEvent, day: number) => {
    e.preventDefault();
    if (!canEdit || !draggedIssue) return;

    const newDueDate = getDayDueTimestamp(year, month, day);
    try {
      await updateIssue({
        issueId: draggedIssue,
        dueDate: newDueDate,
      });
    } catch (error) {
      showError(error, "Failed to reschedule issue");
    }

    resetDragState();
  };

  // Generate calendar grid
  const calendarDays = [];
  // Add empty cells for days before first day of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(
      <div key={`empty-${i}`} className={cn(DAY_CELL_HEIGHT_CLASS, "bg-ui-bg-secondary")} />,
    );
  }
  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayDueTimestamp = getDayDueTimestamp(year, month, day);
    const dayIssues = issuesByDate[getDayDateKey(year, month, day)] || [];
    const isTodayDate = isToday(day);

    calendarDays.push(
      // biome-ignore lint/a11y/noStaticElementInteractions: Calendar cells are drag-drop targets; interaction is via child buttons
      <div
        key={day}
        data-testid={`calendar-day-${day}`}
        className={cn(
          "group border border-ui-border p-2 transition-colors",
          DAY_CELL_HEIGHT_CLASS,
          isTodayDate ? "bg-brand-indigo-track" : "bg-ui-bg",
          dragOverDay === day && "bg-brand-subtle ring-2 ring-inset ring-brand-ring",
        )}
        onDragOver={(e) => handleDragOver(e, day)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, day)}
      >
        <Flex align="center" justify="between" className="mb-1">
          <Flex align="center" gap="xs">
            <Typography
              variant="label"
              className={cn(
                "text-sm font-medium",
                isTodayDate
                  ? "bg-brand text-brand-foreground w-6 h-6 rounded-full flex items-center justify-center"
                  : "text-ui-text",
              )}
            >
              {day}
            </Typography>
            {canEdit && (
              <Tooltip content="Create issue">
                <IconButton
                  variant="ghost"
                  size="xs"
                  onClick={() => setCreateForDate(dayDueTimestamp)}
                  aria-label={`Create issue for ${day}`}
                  className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 sm:focus:opacity-100 transition-opacity"
                >
                  <Plus className="w-3 h-3" />
                </IconButton>
              </Tooltip>
            )}
          </Flex>
          {dayIssues.length > 0 && (
            <Badge size="sm" variant="neutral">
              {dayIssues.length}
            </Badge>
          )}
        </Flex>

        <Stack gap="xs">
          {(dayIssues ?? []).slice(0, MAX_VISIBLE_ISSUES_PER_DAY).map((issue: Doc<"issues">) => (
            <Tooltip
              key={issue._id}
              content={canEdit ? `${issue.title} - Drag to reschedule` : issue.title}
            >
              <Button
                variant="ghost"
                onClick={() => setSelectedIssue(issue._id)}
                className={cn(
                  "w-full justify-start text-left p-1.5 h-auto",
                  canEdit && "cursor-grab active:cursor-grabbing",
                  draggedIssue === issue._id && "opacity-50",
                )}
                draggable={canEdit}
                onDragStart={(e) => handleDragStart(e, issue._id)}
                onDragEnd={handleDragEnd}
              >
                <Flex align="center" gap="xs" className="w-full">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      getPriorityColor(issue.priority),
                    )}
                  />
                  <FlexItem flex="1" className="min-w-0">
                    <Flex align="center" gap="xs">
                      <Icon icon={ISSUE_TYPE_ICONS[issue.type]} size="xs" className="shrink-0" />
                      <Typography variant="caption" className="truncate">
                        {issue.title}
                      </Typography>
                    </Flex>
                  </FlexItem>
                </Flex>
              </Button>
            </Tooltip>
          ))}
          {dayIssues.length > MAX_VISIBLE_ISSUES_PER_DAY && (
            <Typography variant="caption" color="secondary" className="pl-1.5">
              +{dayIssues.length - MAX_VISIBLE_ISSUES_PER_DAY} more
            </Typography>
          )}
        </Stack>
      </div>,
    );
  }

  return (
    <FlexItem flex="1" className="p-3 sm:p-6 overflow-auto">
      {/* Header */}
      <Flex
        direction="column"
        align="start"
        justify="between"
        gap="lg"
        className="mb-6 sm:flex-row sm:items-center"
      >
        <Typography variant="h2">Issues Calendar</Typography>

        {/* Month Navigation */}
        <Flex
          align="center"
          gap="sm"
          justify="between"
          className="sm:gap-4 w-full sm:w-auto sm:justify-start"
        >
          <Tooltip content="Previous month">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth(-1)}
              className="min-w-11 min-h-11 sm:min-w-0 sm:min-h-0"
              aria-label="Previous month"
            >
              <svg
                aria-hidden="true"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Button>
          </Tooltip>

          <Typography variant="h3" className="w-full sm:min-w-48 text-center">
            {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </Typography>

          <Tooltip content="Next month">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth(1)}
              className="min-w-11 min-h-11 sm:min-w-0 sm:min-h-0"
              aria-label="Next month"
            >
              <svg
                aria-hidden="true"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
          </Tooltip>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
            className="min-w-11 min-h-11 sm:min-w-0 sm:min-h-0"
          >
            Today
          </Button>
        </Flex>
      </Flex>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <Card padding="none" className="overflow-hidden min-w-160">
          {/* Weekday Headers */}
          <Grid cols={7} className="bg-ui-bg-secondary border-b border-ui-border">
            {WEEKDAY_LABELS.map((day) => (
              <Typography key={day} variant="label" className="p-2 text-center text-ui-text">
                {day}
              </Typography>
            ))}
          </Grid>

          {/* Calendar Days */}
          <Grid cols={7}>{calendarDays}</Grid>
        </Card>
      </div>

      {/* Legend */}
      <Flex align="center" gap="xl" className="mt-4">
        {PRIORITY_LEGEND_ITEMS.map((item) => (
          <Flex key={item.label} align="center" gap="sm">
            <div className={cn("w-3 h-3 rounded-full", item.className)} />
            <Typography variant="small" color="secondary">
              {item.label}
            </Typography>
          </Flex>
        ))}
      </Flex>

      {/* Issue Detail */}
      {selectedIssue && (
        <IssueDetailViewer
          issueId={selectedIssue}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedIssue(null);
            }
          }}
          canEdit={canEdit}
        />
      )}

      {/* Create Issue Modal (from calendar quick add) */}
      {createForDate !== null && (
        <CreateIssueModal
          projectId={projectId}
          sprintId={sprintId}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setCreateForDate(null);
            }
          }}
          defaultDueDate={createForDate}
        />
      )}
    </FlexItem>
  );
}
