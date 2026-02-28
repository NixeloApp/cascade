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
import { cn } from "@/lib/utils";
import { CreateIssueModal } from "./CreateIssueModal";
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

  // Start from the beginning of the first week row
  // (subtract days to get to previous Sunday if needed, though here we just render empty cells,
  // but for data fetching we might want to include them if we were rendering them)
  // The current UI renders empty cells for previous month days:
  // for (let i = 0; i < firstDayOfMonth; i++) { ... }
  // So we strictly need data starting from the 1st of the month.
  // However, to be safe and cover full days, we use start of 1st day to end of last day.

  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const startTimestamp = start.getTime();
  const endTimestamp = end.getTime();

  const issues = useQuery(api.issues.listIssuesByDateRange, {
    projectId,
    sprintId,
    from: startTimestamp,
    to: endTimestamp,
  });

  // Group issues by date
  const issuesByDate = (() => {
    const byDate: Record<string, typeof issues> = {};
    issues?.forEach((issue: Doc<"issues">) => {
      if (issue.dueDate) {
        const dateKey = new Date(issue.dueDate).toDateString();
        if (!byDate[dateKey]) byDate[dateKey] = [];
        byDate[dateKey].push(issue);
      }
    });
    return byDate;
  })();

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const today = new Date();
  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const getIssuesForDay = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateKey = date.toDateString();
    return issuesByDate[dateKey] || [];
  };

  const getDayTimestamp = (day: number) => {
    // Set to end of day (23:59:59.999) for due date
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day, 23, 59, 59, 999);
    return date.getTime();
  };

  // Drag and drop handlers for rescheduling issues
  const handleDragStart = (e: React.DragEvent, issueId: Id<"issues">) => {
    if (!canEdit) return;
    setDraggedIssue(issueId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", issueId);
  };

  const handleDragEnd = () => {
    setDraggedIssue(null);
    setDragOverDay(null);
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

    const newDueDate = getDayTimestamp(day);
    try {
      await updateIssue({
        issueId: draggedIssue,
        dueDate: newDueDate,
      });
    } catch {
      // Error handling - mutation will show toast on failure
    }

    setDraggedIssue(null);
    setDragOverDay(null);
  };

  // Generate calendar grid
  const calendarDays = [];
  // Add empty cells for days before first day of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(
      <div key={`empty-${i}`} className="min-h-32 md:min-h-24 bg-ui-bg-secondary" />,
    );
  }
  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayIssues = getIssuesForDay(day);
    const isTodayDate = isToday(day);

    calendarDays.push(
      // biome-ignore lint/a11y/noStaticElementInteractions: Calendar cells are drag-drop targets; interaction is via child buttons
      <div
        key={day}
        className={cn(
          "group min-h-32 md:min-h-24 border border-ui-border p-2 transition-colors",
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
                  onClick={() => setCreateForDate(getDayTimestamp(day))}
                  aria-label={`Create issue for ${day}`}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
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
          {(dayIssues ?? []).slice(0, 3).map((issue: Doc<"issues">) => (
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
          {dayIssues.length > 3 && (
            <Typography variant="caption" color="secondary" className="pl-1.5">
              +{dayIssues.length - 3} more
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
              onClick={previousMonth}
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
              onClick={nextMonth}
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
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
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
        <Flex align="center" gap="sm">
          <div className="w-3 h-3 rounded-full bg-status-error" />
          <Typography variant="small" color="secondary">
            Highest
          </Typography>
        </Flex>
        <Flex align="center" gap="sm">
          <div className="w-3 h-3 rounded-full bg-status-warning" />
          <Typography variant="small" color="secondary">
            High
          </Typography>
        </Flex>
        <Flex align="center" gap="sm">
          <div className="w-3 h-3 rounded-full bg-accent-ring" />
          <Typography variant="small" color="secondary">
            Medium
          </Typography>
        </Flex>
        <Flex align="center" gap="sm">
          <div className="w-3 h-3 rounded-full bg-brand-ring" />
          <Typography variant="small" color="secondary">
            Low
          </Typography>
        </Flex>
        <Flex align="center" gap="sm">
          <div className="w-3 h-3 rounded-full bg-ui-text-secondary" />
          <Typography variant="small" color="secondary">
            Lowest
          </Typography>
        </Flex>
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
