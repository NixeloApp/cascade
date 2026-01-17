import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { useOrganization } from "@/hooks/useOrgContext";
import { formatDuration, formatHours } from "@/lib/formatting";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Flex } from "../ui/Flex";
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
      <Flex
        align="center"
        gap="sm"
        className="px-3 py-2 bg-brand-indigo-track border border-brand-indigo-border rounded-lg"
      >
        <Flex align="center" gap="sm">
          {/* Pulsing dot */}
          <div className="relative">
            <div className="w-2 h-2 bg-brand-600 rounded-full" />
            <div className="absolute inset-0 w-2 h-2 bg-brand-600 rounded-full animate-ping" />
          </div>

          {/* Timer display */}
          <span className="text-sm font-mono font-semibold text-brand-indigo-text">
            {formatDuration(currentDuration)}
          </span>

          {/* Description or Issue */}
          {(runningTimer.description || runningTimer.issue) && (
            <span className="text-xs text-brand-indigo-text max-w-[150px] truncate">
              {runningTimer.issue ? runningTimer.issue.key : runningTimer.description}
            </span>
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
    );
  }

  return (
    <>
      <Button
        onClick={() => setShowTimeEntryModal(true)}
        variant="secondary"
        size="sm"
        leftIcon={
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
        }
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
