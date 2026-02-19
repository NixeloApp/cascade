import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Play } from "lucide-react";
import { useEffect, useState } from "react";
import { useOrganization } from "@/hooks/useOrgContext";
import { formatDuration, formatHours } from "@/lib/formatting";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Typography } from "../ui/Typography";
import { TimeEntryModal } from "./TimeEntryModal";

export function TimerWidget() {
  const runningTimer = useQuery(api.timeTracking.getRunningTimer);
  const stopTimer = useMutation(api.timeTracking.stopTimer);

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
      <Card padding="sm" className="bg-brand-indigo-track border-brand-indigo-border">
        <Flex align="center" gap="sm">
          <Flex align="center" gap="sm">
            {/* Pulsing dot */}
            <div className="relative">
              <div className="w-2 h-2 bg-brand rounded-full" />
              <div className="absolute inset-0 w-2 h-2 bg-brand rounded-full animate-ping" />
            </div>

            {/* Timer display */}
            <Typography variant="mono" className="font-semibold text-brand-indigo-text">
              {formatDuration(currentDuration)}
            </Typography>

            {/* Description or Issue */}
            {(runningTimer.description || runningTimer.issue) && (
              <Typography
                variant="caption"
                className="text-brand-indigo-text max-w-(--max-width-timer-description) truncate"
              >
                {runningTimer.issue ? runningTimer.issue.key : runningTimer.description}
              </Typography>
            )}
          </Flex>

          {/* Stop button */}
          <Button
            onClick={handleStop}
            variant="ghost"
            size="sm"
            className="text-xs text-brand-indigo-text hover:bg-brand-indigo-bg/10"
            aria-label="Stop timer"
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
        variant="secondary"
        size="sm"
        leftIcon={<Play className="w-4 h-4" fill="currentColor" />}
        aria-label="Start timer"
      >
        <span className="hidden sm:inline">Start Timer</span>
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
