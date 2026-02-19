import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { toast } from "sonner";
import { Calendar, DollarSign, Trash2 } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Flex, FlexItem } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Icon } from "../ui/Icon";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Progress } from "../ui/Progress";
import { Stack } from "../ui/Stack";
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
      <Card padding="xl" variant="ghost">
        <Flex justify="center" align="center">
          <LoadingSpinner />
        </Flex>
      </Card>
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
    <Card padding="lg" variant="ghost">
      <Stack gap="lg">
        {/* Header */}
        <Stack gap="md">
          <Flex justify="between" align="center">
            <Stack gap="xs">
              <Typography variant="h2">My Timesheet</Typography>
              <Typography variant="small" color="tertiary">
                Week of {formatDate(timesheet.startDate)}
              </Typography>
            </Stack>
            <Flex gap="lg">
              <Stack align="end" gap="none">
                <Typography variant="small" color="tertiary">
                  Total Hours
                </Typography>
                <Typography variant="h3">{formatHours(timesheet.totalHours)}</Typography>
              </Stack>
              <Stack align="end" gap="none">
                <Typography variant="small" color="tertiary">
                  Billable
                </Typography>
                <Typography variant="h3" color="success">
                  {formatHours(timesheet.billableHours)}
                </Typography>
              </Stack>
              {billableRevenue > 0 && (
                <Stack align="end" gap="none">
                  <Typography variant="small" color="tertiary">
                    Revenue
                  </Typography>
                  <Typography variant="h3" color="brand">
                    ${billableRevenue.toFixed(2)}
                  </Typography>
                </Stack>
              )}
            </Flex>
          </Flex>

          {/* Progress bar */}
          <Stack gap="xs">
            <Progress value={Math.min((timesheet.totalHours / 40) * 100, 100)} />
            <Typography variant="caption" color="tertiary">
              {formatHours(timesheet.totalHours)} / 40 hours (full-time week)
            </Typography>
          </Stack>
        </Stack>

        {/* Calendar Grid */}
        <Grid cols={7} gap="lg">
          {weekDays.map((day) => {
            const isToday = day.date.toDateString() === new Date().toDateString();
            const dayHours = day.entries.reduce(
              (sum: number, e: TimeEntryWithHours) => sum + e.hours,
              0,
            );

            return (
              <Card
                key={day.dayKey}
                padding="sm"
                className={cn(isToday && "border-brand-ring bg-brand-subtle")}
              >
                {/* Day header */}
                <Stack gap="none" className="mb-2">
                  <Typography variant="label">
                    {day.date.toLocaleDateString("en-US", { weekday: "short" })}
                  </Typography>
                  <Typography variant="caption" color="tertiary">
                    {day.date.getDate()}
                  </Typography>
                  {dayHours > 0 && (
                    <Typography variant="caption" color="brand" className="mt-1">
                      {formatHours(dayHours)}h
                    </Typography>
                  )}
                </Stack>

                {/* Time entries */}
                <Stack gap="sm">
                  {day.entries.map((entry: TimeEntryWithHours) => (
                    <Card key={entry._id} padding="sm" className="bg-ui-bg-secondary">
                      <Flex justify="between" align="start" className="mb-1">
                        <FlexItem flex="1" className="min-w-0">
                          <Typography variant="mono" className="truncate block">
                            {entry.projectKey}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="secondary"
                            className="truncate block"
                          >
                            {entry.issueKey}
                          </Typography>
                        </FlexItem>
                        {entry.billable && (
                          <DollarSign className="w-3 h-3 text-status-success shrink-0" />
                        )}
                      </Flex>
                      <Flex justify="between" align="center">
                        <Typography variant="mono" className="text-sm font-medium">
                          {formatHours(entry.hours)}h
                        </Typography>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(entry._id)}
                          className="p-1 min-w-0 text-ui-text-tertiary hover:text-status-error"
                          aria-label="Delete entry"
                        >
                          <Icon icon={Trash2} size="xs" />
                        </Button>
                      </Flex>
                      {entry.description && (
                        <Typography
                          variant="caption"
                          color="tertiary"
                          className="mt-1 line-clamp-1"
                        >
                          {entry.description}
                        </Typography>
                      )}
                    </Card>
                  ))}
                </Stack>
              </Card>
            );
          })}
        </Grid>

        {/* Empty state */}
        {timesheet.totalHours === 0 && (
          <Card padding="xl" variant="ghost">
            <Stack gap="md" align="center">
              <Calendar className="w-12 h-12 text-ui-text-tertiary" />
              <Typography color="secondary">
                No time entries this week. Start a timer to begin tracking!
              </Typography>
            </Stack>
          </Card>
        )}
      </Stack>
    </Card>
  );
}
