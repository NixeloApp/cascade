import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { Flex } from "@/components/ui/Flex";
import { Tooltip } from "@/components/ui/Tooltip";
import { getPriorityColor, ISSUE_TYPE_ICONS } from "@/lib/issue-utils";
import { cn } from "@/lib/utils";
import { IssueDetailModal } from "./IssueDetailModal";
import { Badge } from "./ui/Badge";
import { Icon } from "./ui/Icon";
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

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calculate the visible date range (including padding days)
  const { startTimestamp, endTimestamp, firstDayOfMonth, daysInMonth } = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysCount = lastDay.getDate();
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday

    // Start from the beginning of the first week row
    // (subtract days to get to previous Sunday if needed, though here we just render empty cells,
    // but for data fetching we might want to include them if we were rendering them)
    // The current UI renders empty cells for previous month days:
    // for (let i = 0; i < firstDayOfMonth; i++) { ... }
    // So we strictly need data starting from the 1st of the month.
    // However, to be safe and cover full days, we use start of 1st day to end of last day.

    const start = new Date(year, month, 1, 0, 0, 0, 0);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

    return {
      startTimestamp: start.getTime(),
      endTimestamp: end.getTime(),
      firstDayOfMonth: firstDayOfWeek,
      daysInMonth: daysCount,
    };
  }, [year, month]);

  const issues = useQuery(api.issues.listIssuesByDateRange, {
    projectId,
    sprintId,
    from: startTimestamp,
    to: endTimestamp,
  });

  // Group issues by date
  const issuesByDate = useMemo(() => {
    const byDate: Record<string, typeof issues> = {};
    issues?.forEach((issue: Doc<"issues">) => {
      if (issue.dueDate) {
        const dateKey = new Date(issue.dueDate).toDateString();
        if (!byDate[dateKey]) byDate[dateKey] = [];
        byDate[dateKey].push(issue);
      }
    });
    return byDate;
  }, [issues]);

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
      <div
        key={day}
        className={cn(
          "min-h-32 md:min-h-24 border border-ui-border p-2",
          isTodayDate ? "bg-brand-indigo-track" : "bg-ui-bg",
        )}
      >
        <Flex align="center" justify="between" className="mb-1">
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
          {dayIssues.length > 0 && (
            <Badge size="sm" variant="neutral">
              {dayIssues.length}
            </Badge>
          )}
        </Flex>

        <div className="space-y-1">
          {(dayIssues ?? []).slice(0, 3).map((issue: Doc<"issues">) => (
            <Tooltip key={issue._id} content={issue.title}>
              <button
                type="button"
                onClick={() => setSelectedIssue(issue._id)}
                className="w-full text-left p-1.5 rounded hover:bg-ui-bg-secondary transition-colors"
              >
                <Flex align="center" gap="xs">
                  <div className={cn("w-2 h-2 rounded-full", getPriorityColor(issue.priority))} />
                  <Flex align="center" gap="xs" className="flex-1 min-w-0">
                    <Icon icon={ISSUE_TYPE_ICONS[issue.type]} size="xs" className="shrink-0" />
                    <Typography variant="muted" className="text-xs truncate">
                      {issue.title}
                    </Typography>
                  </Flex>
                </Flex>
              </button>
            </Tooltip>
          ))}
          {dayIssues.length > 3 && (
            <Typography variant="muted" className="text-xs pl-1.5">
              +{dayIssues.length - 3} more
            </Typography>
          )}
        </div>
      </div>,
    );
  }

  return (
    <div className="flex-1 p-3 sm:p-6 overflow-auto">
      {/* Header */}
      <Flex
        direction="column"
        align="start"
        justify="between"
        gap="lg"
        className="mb-6 sm:flex-row sm:items-center"
      >
        <Typography variant="h2" className="text-xl sm:text-2xl font-bold">
          Issues Calendar
        </Typography>

        {/* Month Navigation */}
        <Flex
          align="center"
          gap="sm"
          justify="between"
          className="sm:gap-4 w-full sm:w-auto sm:justify-start"
        >
          <Tooltip content="Previous month">
            <button
              type="button"
              onClick={previousMonth}
              className="p-2 hover:bg-ui-bg-secondary rounded-lg transition-colors min-w-11 min-h-11 sm:min-w-0 sm:min-h-0 flex items-center justify-center"
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
            </button>
          </Tooltip>

          <Typography
            variant="h3"
            className="text-lg sm:text-xl font-semibold w-full sm:min-w-48 text-center"
          >
            {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </Typography>

          <Tooltip content="Next month">
            <button
              type="button"
              onClick={nextMonth}
              className="p-2 hover:bg-ui-bg-secondary rounded-lg transition-colors min-w-11 min-h-11 sm:min-w-0 sm:min-h-0 flex items-center justify-center"
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
            </button>
          </Tooltip>

          <button
            type="button"
            onClick={() => setCurrentDate(new Date())}
            className="px-3 sm:px-4 py-2 bg-ui-bg-tertiary hover:bg-ui-bg-secondary rounded-lg text-sm font-medium transition-colors min-w-11 min-h-11 sm:min-w-0 sm:min-h-0"
          >
            Today
          </button>
        </Flex>
      </Flex>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="bg-ui-bg rounded-lg border border-ui-border overflow-hidden min-w-160">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 bg-ui-bg-secondary border-b border-ui-border">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <Typography key={day} variant="label" className="p-2 text-center text-ui-text">
                {day}
              </Typography>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">{calendarDays}</div>
        </div>
      </div>

      {/* Legend */}
      <Flex align="center" gap="xl" className="mt-4 text-sm">
        <Flex align="center" gap="sm">
          <div className="w-3 h-3 rounded-full bg-status-error" />
          <Typography variant="muted">Highest</Typography>
        </Flex>
        <Flex align="center" gap="sm">
          <div className="w-3 h-3 rounded-full bg-status-warning" />
          <Typography variant="muted">High</Typography>
        </Flex>
        <Flex align="center" gap="sm">
          <div className="w-3 h-3 rounded-full bg-accent-ring" />
          <Typography variant="muted">Medium</Typography>
        </Flex>
        <Flex align="center" gap="sm">
          <div className="w-3 h-3 rounded-full bg-brand-ring" />
          <Typography variant="muted">Low</Typography>
        </Flex>
        <Flex align="center" gap="sm">
          <div className="w-3 h-3 rounded-full bg-ui-text-secondary" />
          <Typography variant="muted">Lowest</Typography>
        </Flex>
      </Flex>

      {/* Issue Detail Modal */}
      {selectedIssue && (
        <IssueDetailModal
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
    </div>
  );
}
