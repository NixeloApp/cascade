import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { ChevronDown, Play, Plus, Square } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Stack } from "@/components/ui/Stack";
import { formatCurrency, formatDate, formatHours } from "@/lib/formatting";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { TimeEntryModal } from "./TimeTracking/TimeEntryModal";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Typography } from "./ui/Typography";

interface TimeTrackerProps {
  issueId: Id<"issues">;
  projectId?: Id<"projects">;
  estimatedHours?: number;
  /** Whether billing is enabled for the organization */
  billingEnabled?: boolean;
}

/**
 * Time progress section with progress bar
 */
function TimeProgress({
  estimatedHours,
  totalLoggedHours,
}: {
  estimatedHours: number;
  totalLoggedHours: number;
}) {
  const remainingHours = estimatedHours > 0 ? estimatedHours - totalLoggedHours : null;
  const isOverEstimate = remainingHours !== null && remainingHours < 0;

  if (estimatedHours > 0) {
    return (
      <Stack gap="sm">
        <Flex align="center" justify="between">
          <Typography variant="caption">
            {totalLoggedHours.toFixed(1)}h / {estimatedHours}h estimated
          </Typography>
          {remainingHours !== null && (
            <Typography
              variant="caption"
              color={isOverEstimate ? "error" : undefined}
              className={isOverEstimate ? "font-medium" : undefined}
            >
              {isOverEstimate ? "+" : ""}
              {Math.abs(remainingHours).toFixed(1)}h {isOverEstimate ? "over" : "remaining"}
            </Typography>
          )}
        </Flex>
        <div className="w-full bg-ui-bg-tertiary rounded-full h-2">
          <div
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              isOverEstimate ? "bg-status-error" : "bg-brand",
            )}
            style={{
              width: `${Math.min((totalLoggedHours / estimatedHours) * 100, 100)}%`,
            }}
          />
        </div>
      </Stack>
    );
  }

  if (totalLoggedHours > 0) {
    return (
      <Typography variant="caption">
        <Typography variant="label" as="span">
          {totalLoggedHours.toFixed(1)}h
        </Typography>{" "}
        logged (no estimate set)
      </Typography>
    );
  }

  return <Typography variant="caption">No time logged yet</Typography>;
}

/**
 * Time entries list component
 */
function TimeEntriesList({
  entries,
}: {
  entries: (Doc<"timeEntries"> & { totalCost?: number })[];
}) {
  return (
    <Stack gap="sm" className="p-4 border-t border-ui-border bg-ui-bg-secondary">
      {entries.map((entry) => {
        const hours = formatHours(entry.duration);
        const entryDate = formatDate(entry.date);

        return (
          <Card key={entry._id} padding="sm">
            <Flex align="start" justify="between">
              <Stack gap="xs">
                <Typography variant="large" as="div">
                  {hours}h
                </Typography>
                {entry.description && (
                  <Typography variant="caption">{entry.description}</Typography>
                )}
                <Flex align="center" gap="sm">
                  <time
                    className="text-xs text-ui-text-tertiary"
                    dateTime={new Date(entry.date).toISOString()}
                  >
                    {entryDate}
                  </time>
                  {entry.activity && <Badge variant="neutral">{entry.activity}</Badge>}
                  {entry.billable && <Badge variant="success">Billable</Badge>}
                </Flex>
              </Stack>
              {entry.totalCost && (
                <Typography variant="small" as="div" className="font-medium">
                  {formatCurrency(entry.totalCost)}
                </Typography>
              )}
            </Flex>
          </Card>
        );
      })}
    </Stack>
  );
}

export function TimeTracker({
  issueId,
  projectId,
  estimatedHours = 0,
  billingEnabled,
}: TimeTrackerProps) {
  const [showLogModal, setShowLogModal] = useState(false);
  const [showEntries, setShowEntries] = useState(false);

  // Fetch time entries for this issue
  const timeEntries = useQuery(api.timeTracking.listTimeEntries, {
    issueId,
    limit: 100,
  });

  // Check if there's a running timer
  const runningTimer = useQuery(api.timeTracking.getRunningTimer);
  const isTimerRunningForThisIssue = runningTimer && runningTimer.issueId === issueId;

  // Mutations
  const startTimer = useMutation(api.timeTracking.startTimer);
  const stopTimer = useMutation(api.timeTracking.stopTimer);

  // Calculate total hours from entries (convert seconds to hours)
  const totalLoggedHours = timeEntries
    ? timeEntries.reduce(
        (acc: number, entry: Doc<"timeEntries">) => acc + (entry.duration || 0),
        0,
      ) / 3600
    : 0;

  const handleStartTimer = async () => {
    try {
      await startTimer({ projectId, issueId, billable: false });
      showSuccess("Timer started");
    } catch (error) {
      showError(error, "Failed to start timer");
    }
  };

  const handleStopTimer = async () => {
    if (!runningTimer) return;
    try {
      const result = await stopTimer({ entryId: runningTimer._id });
      const hours = formatHours(result.duration);
      showSuccess(`Timer stopped: ${hours}h logged`);
    } catch (error) {
      showError(error, "Failed to stop timer");
    }
  };

  return (
    <Card padding="none" className="border border-ui-border">
      {/* Header */}
      <Stack gap="sm" className="p-4 border-b border-ui-border">
        <Flex align="center" justify="between">
          <Typography variant="label">Time Tracking</Typography>
          <Flex align="center" gap="sm">
            {/* Timer Button */}
            {isTimerRunningForThisIssue ? (
              <Button
                variant="danger"
                size="sm"
                onClick={handleStopTimer}
                leftIcon={<Square className="w-4 h-4" fill="currentColor" />}
              >
                Stop Timer
              </Button>
            ) : (
              <Button
                variant="success"
                size="sm"
                onClick={handleStartTimer}
                disabled={!!runningTimer}
                title={runningTimer ? "Stop the current timer first" : "Start timer for this issue"}
                leftIcon={<Play className="w-4 h-4" fill="currentColor" />}
              >
                Start Timer
              </Button>
            )}

            {/* Log Time Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowLogModal(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Log Time
            </Button>
          </Flex>
        </Flex>

        {/* Progress Bar */}
        <TimeProgress estimatedHours={estimatedHours} totalLoggedHours={totalLoggedHours} />
      </Stack>

      {/* Time Entries Toggle */}
      {totalLoggedHours > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowEntries(!showEntries)}
          className="w-full justify-between min-h-0 rounded-none"
          rightIcon={
            <ChevronDown
              className={cn("w-4 h-4 transition-transform", showEntries ? "rotate-180" : "")}
            />
          }
        >
          View Time Entries ({timeEntries?.length || 0})
        </Button>
      )}

      {/* Time Entries List */}
      {showEntries && timeEntries && <TimeEntriesList entries={timeEntries} />}

      {/* Log Time Modal */}
      <TimeEntryModal
        open={showLogModal}
        onOpenChange={setShowLogModal}
        projectId={projectId}
        issueId={issueId}
        billingEnabled={billingEnabled}
      />
    </Card>
  );
}
