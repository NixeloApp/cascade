import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { toast } from "sonner";
import { Calendar, DollarSign, Trash2 } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Flex } from "../ui/Flex";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Progress } from "../ui/progress";
import { Typography } from "../ui/Typography";

// Type for time entry with computed hours field
type TimesheetData = FunctionReturnType<typeof api.timeTracking.getCurrentWeekTimesheet>;
// Extract the entry type from the byDay record
type TimeEntryWithHours = NonNullable<TimesheetData>["byDay"][string][number];

export function Timesheet() {
  const timesheet = useQuery(api.timeTracking.getCurrentWeekTimesheet);
  const _updateEntry = useMutation(api.timeTracking.updateTimeEntry);
  const deleteEntry = useMutation(api.timeTracking.deleteTimeEntry);

  const [_editingEntry, _setEditingEntry] = useState<string | null>(null);

  if (!timesheet) {
    return (
      <Flex justify="center" align="center" className="p-8">
        <LoadingSpinner />
      </Flex>
    );
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const formatHours = (hours: number) => {
    return hours.toFixed(2);
  };

  const getDaysOfWeek = () => {
    const days = [];
    const start = new Date(timesheet.startDate);
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      const dayKey = day.toISOString().split("T")[0];
      days.push({
        date: day,
        dayKey,
        entries: timesheet.byDay[dayKey] || [],
      });
    }
    return days;
  };

  const handleDelete = async (entryId: Id<"timeEntries">) => {
    if (!confirm("Delete this time entry?")) return;

    try {
      await deleteEntry({ entryId });
      toast.success("Time entry deleted");
    } catch (_error) {
      toast.error("Failed to delete entry");
    }
  };

  const weekDays = getDaysOfWeek();
  const billableRevenue = Object.values(timesheet.byDay)
    .flat()
    .filter((e: TimeEntryWithHours) => e.billable && e.hourlyRate)
    .reduce((sum: number, e: TimeEntryWithHours) => sum + e.hours * (e.hourlyRate ?? 0), 0);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Flex justify="between" align="center" className="mb-4">
          <div>
            <Typography variant="h2" className="text-2xl font-bold text-ui-text">
              My Timesheet
            </Typography>
            <Typography className="text-sm text-ui-text-tertiary">
              Week of {formatDate(timesheet.startDate)}
            </Typography>
          </div>
          <Flex gap="lg">
            <div className="text-right">
              <div className="text-sm text-ui-text-tertiary">Total Hours</div>
              <div className="text-2xl font-bold text-ui-text">
                {formatHours(timesheet.totalHours)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-ui-text-tertiary">Billable</div>
              <div className="text-2xl font-bold text-status-success">
                {formatHours(timesheet.billableHours)}
              </div>
            </div>
            {billableRevenue > 0 && (
              <div className="text-right">
                <div className="text-sm text-ui-text-tertiary">Revenue</div>
                <div className="text-2xl font-bold text-brand">${billableRevenue.toFixed(2)}</div>
              </div>
            )}
          </Flex>
        </Flex>

        {/* Progress bar */}
        <Progress value={Math.min((timesheet.totalHours / 40) * 100, 100)} />
        <div className="text-xs text-ui-text-tertiary mt-1">
          {formatHours(timesheet.totalHours)} / 40 hours (full-time week)
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((day) => {
          const isToday = day.date.toDateString() === new Date().toDateString();
          const dayHours = day.entries.reduce(
            (sum: number, e: TimeEntryWithHours) => sum + e.hours,
            0,
          );

          return (
            <div
              key={day.dayKey}
              className={cn(
                "border rounded-lg p-3",
                isToday ? "border-brand-ring bg-brand-subtle" : "border-ui-border bg-ui-bg",
              )}
            >
              {/* Day header */}
              <div className="mb-2">
                <div className="font-semibold text-ui-text">
                  {day.date.toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div className="text-xs text-ui-text-tertiary">{day.date.getDate()}</div>
                {dayHours > 0 && (
                  <div className="text-xs font-medium text-brand mt-1">
                    {formatHours(dayHours)}h
                  </div>
                )}
              </div>

              {/* Time entries */}
              <Flex direction="column" gap="sm">
                {day.entries.map((entry: TimeEntryWithHours) => (
                  <div
                    key={entry._id}
                    className="p-2 bg-ui-bg-secondary rounded border border-ui-border"
                  >
                    <Flex justify="between" align="start" className="mb-1">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono font-medium text-ui-text truncate">
                          {entry.projectKey}
                        </div>
                        <div className="text-xs text-ui-text-secondary truncate">
                          {entry.issueKey}
                        </div>
                      </div>
                      {entry.billable && (
                        <DollarSign className="w-3 h-3 text-status-success shrink-0" />
                      )}
                    </Flex>
                    <Flex justify="between" align="center">
                      <Typography variant="mono" className="text-sm font-medium">
                        {formatHours(entry.hours)}h
                      </Typography>
                      <button
                        type="button"
                        onClick={() => handleDelete(entry._id)}
                        className="p-1 text-ui-text-tertiary hover:text-status-error rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </Flex>
                    {entry.description && (
                      <div className="text-xs text-ui-text-tertiary mt-1 line-clamp-1">
                        {entry.description}
                      </div>
                    )}
                  </div>
                ))}
              </Flex>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {timesheet.totalHours === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-ui-text-tertiary mx-auto mb-3" />
          <Typography className="text-ui-text-secondary">
            No time entries this week. Start a timer to begin tracking!
          </Typography>
        </div>
      )}
    </div>
  );
}
