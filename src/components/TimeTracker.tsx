/**
 * Time Tracker
 *
 * Issue-level time tracking component with timer and entry management.
 * Shows active timer, logged hours, and time progress against estimates.
 * Supports manual entry creation and billing rate calculations.
 */

import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { Card, getCardRecipeClassName } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { MetadataTimestamp } from "@/components/ui/Metadata";
import { Progress } from "@/components/ui/Progress";
import { Stack } from "@/components/ui/Stack";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { formatCurrency, formatHours } from "@/lib/formatting";
import { ChevronDown, Play, Plus, Square } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { TimeEntryModal } from "./TimeTracking/TimeEntryModal";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { LargeText, Typography } from "./ui/Typography";

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
              variant={isOverEstimate ? "label" : "caption"}
              color={isOverEstimate ? "error" : undefined}
            >
              {isOverEstimate ? "+" : ""}
              {Math.abs(remainingHours).toFixed(1)}h {isOverEstimate ? "over" : "remaining"}
            </Typography>
          )}
        </Flex>
        <Progress
          value={Math.min((totalLoggedHours / estimatedHours) * 100, 100)}
          variant={isOverEstimate ? "error" : "default"}
        />
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
    <Card recipe="timeTrackerEntries" padding="md" radius="none" variant="ghost">
      <Stack gap="sm">
        {entries.map((entry) => {
          const hours = formatHours(entry.duration);

          return (
            <div key={entry._id}>
              <Flex align="start" justify="between">
                <Stack gap="xs">
                  <LargeText as="div">{hours}h</LargeText>
                  {entry.description && (
                    <Typography variant="caption">{entry.description}</Typography>
                  )}
                  <Flex align="center" gap="sm">
                    <MetadataTimestamp date={entry.date} format="absolute" />
                    {entry.activity && <Badge variant="neutral">{entry.activity}</Badge>}
                    {entry.billable && <Badge variant="success">Billable</Badge>}
                  </Flex>
                </Stack>
                {entry.totalCost !== undefined && (
                  <Typography variant="label" as="div">
                    {formatCurrency(entry.totalCost)}
                  </Typography>
                )}
              </Flex>
            </div>
          );
        })}
      </Stack>
    </Card>
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

  // Fetch time entries for this issue (auto-skips when not authenticated)
  const timeEntries = useAuthenticatedQuery(api.timeTracking.listTimeEntries, {
    issueId,
    limit: 100,
  });

  // Check if there's a running timer
  const runningTimer = useAuthenticatedQuery(api.timeTracking.getRunningTimer, {});
  const isTimerRunningForThisIssue = runningTimer && runningTimer.issueId === issueId;

  // Mutations
  const { mutate: startTimer } = useAuthenticatedMutation(api.timeTracking.startTimer);
  const { mutate: stopTimer } = useAuthenticatedMutation(api.timeTracking.stopTimer);

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
    <Card recipe="timeTrackerShell" padding="none">
      {/* Header */}
      <div className={cn(getCardRecipeClassName("timeTrackerHeader"), "p-4")}>
        <Stack gap="sm">
          <Flex align="center" justify="between">
            <Typography variant="label">Time Tracking</Typography>
            <Flex align="center" gap="sm">
              {/* Timer Button */}
              {isTimerRunningForThisIssue ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleStopTimer}
                  leftIcon={<Icon icon={Square} size="sm" fill="currentColor" />}
                >
                  Stop Timer
                </Button>
              ) : (
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleStartTimer}
                  disabled={!!runningTimer}
                  title={
                    runningTimer ? "Stop the current timer first" : "Start timer for this issue"
                  }
                  leftIcon={<Icon icon={Play} size="sm" fill="currentColor" />}
                >
                  Start Timer
                </Button>
              )}

              {/* Log Time Button */}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowLogModal(true)}
                leftIcon={<Icon icon={Plus} size="sm" />}
              >
                Log Time
              </Button>
            </Flex>
          </Flex>

          {/* Progress Bar */}
          <TimeProgress estimatedHours={estimatedHours} totalLoggedHours={totalLoggedHours} />
        </Stack>
      </div>

      {/* Time Entries Toggle */}
      {totalLoggedHours > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowEntries(!showEntries)}
          chromeSize="sectionToggle"
          rightIcon={
            <Icon
              icon={ChevronDown}
              size="sm"
              className={cn("transition-transform", showEntries ? "rotate-180" : "")}
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
