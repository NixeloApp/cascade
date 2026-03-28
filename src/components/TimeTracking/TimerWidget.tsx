import { api } from "@convex/_generated/api";
import { useEffect, useState } from "react";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { formatDuration, formatHours } from "@/lib/formatting";
import { Play } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import {
  getStartTimerButtonClassName,
  getStopTimerButtonClassName,
} from "../ui/buttonSurfaceClassNames";
import { Card } from "../ui/Card";
import { Dot } from "../ui/Dot";
import { Flex } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import { Inline } from "../ui/Inline";
import { Tooltip } from "../ui/Tooltip";
import { Typography } from "../ui/Typography";
import { TimeEntryModal } from "./TimeEntryModal";
/** Real-time timer widget for tracking work on issues. */
export function TimerWidget() {
  const runningTimer = useAuthenticatedQuery(api.timeTracking.getRunningTimer, {});
  const { mutate: stopTimer } = useAuthenticatedMutation(api.timeTracking.stopTimer);

  // Get billing setting from organization context
  const { billingEnabled } = useOrganization();

  const [currentDuration, setCurrentDuration] = useState(0);
  const [showTimeEntryModal, setShowTimeEntryModal] = useState(false);

  // Update duration every second if timer is running
  useEffect(() => {
    if (!runningTimer) {
      setCurrentDuration(0);
      return;
    }

    // Calculate initial duration
    const elapsed = Math.floor((Date.now() - runningTimer.startTime) / 1000);
    setCurrentDuration(elapsed);

    // Update every second
    const interval = setInterval(() => {
      const newElapsed = Math.floor((Date.now() - runningTimer.startTime) / 1000);
      setCurrentDuration(newElapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [runningTimer]);

  const handleStop = async () => {
    if (!runningTimer) return;

    try {
      const result = await stopTimer({ entryId: runningTimer._id });
      const hours = formatHours(result.duration);
      showSuccess(`Timer stopped: ${hours}h logged`);
    } catch (error) {
      showError(error, "Failed to stop timer");
    }
  };

  if (runningTimer) {
    return (
      <Card recipe="timerStripActive" padding="sm">
        <Flex align="center" gap="sm">
          <Flex align="center" gap="sm">
            {/* Pulsing dot - using output for semantics, spans for phrasing content */}
            <output className="relative block" aria-label="Timer is running">
              <Dot />
              <Dot className="absolute inset-0 animate-ping" />
            </output>

            {/* Timer display */}
            <Flex align="center" role="timer" aria-live="off">
              <Typography variant="label" className="text-brand-indigo-text">
                {formatDuration(currentDuration)}
              </Typography>
            </Flex>

            {/* Description or Issue */}
            {(runningTimer.description || runningTimer.issue) && (
              <Tooltip
                content={runningTimer.issue ? runningTimer.issue.key : runningTimer.description}
              >
                <Button
                  variant="unstyled"
                  size="content"
                  className="max-w-timer-description truncate text-brand-indigo-text cursor-help"
                >
                  {runningTimer.issue ? runningTimer.issue.key : runningTimer.description}
                </Button>
              </Tooltip>
            )}
          </Flex>

          {/* Stop button */}
          <Button
            onClick={handleStop}
            variant="unstyled"
            size="content"
            aria-label="Stop timer"
            className={getStopTimerButtonClassName()}
          >
            Stop
          </Button>
        </Flex>
      </Card>
    );
  }

  return (
    <>
      <Button
        onClick={() => setShowTimeEntryModal(true)}
        variant="unstyled"
        size="content"
        leftIcon={<Icon icon={Play} size="sm" fill="currentColor" />}
        aria-label="Start timer"
        className={getStartTimerButtonClassName()}
      >
        <Inline className="hidden sm:inline">Start Timer</Inline>
      </Button>

      <TimeEntryModal
        open={showTimeEntryModal}
        onOpenChange={setShowTimeEntryModal}
        defaultMode="timer"
        billingEnabled={billingEnabled}
      />
    </>
  );
}
