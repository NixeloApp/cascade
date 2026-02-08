import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { ReactNode } from "react";
import { useState } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { CheckCircle, Clock, FileText, Mic, MicOff, Play, XCircle } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Collapsible, CollapsibleContent, CollapsibleHeader } from "./ui/Collapsible";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Flex } from "./ui/Flex";
import { Metadata, MetadataItem } from "./ui/Metadata";
import { Typography } from "./ui/Typography";

// Status badge configuration - extracted to reduce component complexity
interface StatusBadgeConfig {
  icon: ReactNode;
  label: string;
  className: string;
}

const STATUS_BADGE_CONFIG: Record<string, StatusBadgeConfig> = {
  scheduled: {
    icon: <Clock className="w-3 h-3 mr-1" />,
    label: "Scheduled",
    className: "bg-brand-subtle text-brand-active",
  },
  joining: {
    icon: <Play className="w-3 h-3 mr-1 animate-pulse" />,
    label: "Joining...",
    className: "bg-status-warning-bg text-status-warning",
  },
  recording: {
    icon: <Mic className="w-3 h-3 mr-1 animate-pulse" />,
    label: "Recording",
    className: "bg-status-error-bg text-status-error",
  },
  processing: {
    icon: <LoadingSpinner size="xs" className="mr-1" />,
    label: "Processing...",
    className: "bg-accent-subtle text-accent-active",
  },
  transcribing: {
    icon: <LoadingSpinner size="xs" className="mr-1" />,
    label: "Processing...",
    className: "bg-accent-subtle text-accent-active",
  },
  summarizing: {
    icon: <LoadingSpinner size="xs" className="mr-1" />,
    label: "Processing...",
    className: "bg-accent-subtle text-accent-active",
  },
  completed: {
    icon: <CheckCircle className="w-3 h-3 mr-1" />,
    label: "Completed",
    className: "bg-status-success-bg text-status-success",
  },
  failed: {
    icon: <XCircle className="w-3 h-3 mr-1" />,
    label: "Failed",
    className: "bg-status-error-bg text-status-error",
  },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_BADGE_CONFIG[status];
  if (!config) return null;

  return (
    <Badge size="sm" className={config.className}>
      {config.icon}
      {config.label}
    </Badge>
  );
}

// Platform detection helper
function detectPlatform(url: string): "google_meet" | "zoom" | "teams" | "other" {
  if (url.includes("meet.google.com")) return "google_meet";
  if (url.includes("zoom.us")) return "zoom";
  if (url.includes("teams.microsoft.com")) return "teams";
  return "other";
}

// Status message configuration for in-progress states
const IN_PROGRESS_MESSAGES: Record<string, string> = {
  recording: "Recording in progress...",
  transcribing: "Transcribing audio...",
  summarizing: "Generating summary...",
};

// Sub-components for each recording status
function NoRecordingState({
  onSchedule,
  isScheduling,
}: {
  onSchedule: () => void;
  isScheduling: boolean;
}) {
  return (
    <div className="bg-ui-bg-secondary rounded-lg p-4">
      <Typography variant="muted" className="mb-3">
        Schedule a bot to join this meeting and automatically generate transcripts and summaries.
      </Typography>
      <Button
        onClick={onSchedule}
        isLoading={isScheduling}
        leftIcon={<Mic className="w-4 h-4" />}
        size="sm"
      >
        {isScheduling ? "Scheduling..." : "Enable AI Notes"}
      </Button>
    </div>
  );
}

function ScheduledState({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="bg-brand-subtle rounded-lg p-4">
      <Flex justify="between" align="center">
        <div>
          <Typography variant="label">Bot scheduled to join</Typography>
          <Typography variant="meta">
            "Nixelo Notetaker" will join when the meeting starts
          </Typography>
        </div>
        <Button onClick={onCancel} variant="ghost" size="sm">
          <MicOff className="w-4 h-4 mr-1" />
          Cancel
        </Button>
      </Flex>
    </div>
  );
}

function FailedState({ errorMessage, onRetry }: { errorMessage?: string; onRetry: () => void }) {
  return (
    <div className="bg-status-error-bg rounded-lg p-4">
      <Typography variant="label" color="error">
        Recording failed
      </Typography>
      <Typography variant="meta" className="mt-1">
        {errorMessage || "An error occurred during recording"}
      </Typography>
      <Button onClick={onRetry} variant="secondary" size="sm" className="mt-3">
        Try Again
      </Button>
    </div>
  );
}

function InProgressState({ status }: { status: string }) {
  const message = IN_PROGRESS_MESSAGES[status] || "Processing...";
  return (
    <div className="bg-ui-bg-secondary rounded-lg p-4">
      <Flex gap="md" align="center">
        <LoadingSpinner size="sm" />
        <div>
          <Typography variant="label">{message}</Typography>
          <Typography variant="meta">This may take a few minutes</Typography>
        </div>
      </Flex>
    </div>
  );
}

// Recording status type from query
interface Recording {
  _id: Id<"meetingRecordings">;
  status: string;
  errorMessage?: string;
}

// Component to render the appropriate status content
function RecordingStatusContent({
  recording,
  isScheduling,
  onSchedule,
  onCancel,
}: {
  recording: Recording | null | undefined;
  isScheduling: boolean;
  onSchedule: () => void;
  onCancel: () => void;
}) {
  if (!recording) {
    return <NoRecordingState onSchedule={onSchedule} isScheduling={isScheduling} />;
  }

  switch (recording.status) {
    case "scheduled":
      return <ScheduledState onCancel={onCancel} />;
    case "completed":
      return <RecordingResults recordingId={recording._id} />;
    case "failed":
      return <FailedState errorMessage={recording.errorMessage} onRetry={onSchedule} />;
    default:
      return <InProgressState status={recording.status} />;
  }
}

interface MeetingRecordingSectionProps {
  calendarEventId: Id<"calendarEvents">;
  meetingUrl: string;
  meetingTitle: string;
  scheduledStartTime: number;
}

export function MeetingRecordingSection({
  calendarEventId,
  meetingUrl,
  meetingTitle,
  scheduledStartTime,
}: MeetingRecordingSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const { dialogState, isConfirming, openConfirm, closeConfirm, handleConfirm } =
    useConfirmDialog();

  // Check if there's already a recording for this event (optimized query)
  const recording = useQuery(api.meetingBot.getRecordingByCalendarEvent, { calendarEventId });
  const scheduleRecording = useMutation(api.meetingBot.scheduleRecording);
  const cancelRecording = useMutation(api.meetingBot.cancelRecording);

  const handleScheduleRecording = async () => {
    setIsScheduling(true);
    try {
      await scheduleRecording({
        calendarEventId,
        meetingUrl,
        title: meetingTitle,
        meetingPlatform: detectPlatform(meetingUrl),
        scheduledStartTime,
        isPublic: true,
      });
      showSuccess("Recording scheduled! Bot will join at meeting time.");
    } catch (error) {
      showError(error, "Failed to schedule recording");
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCancelRecording = () => {
    if (!recording) return;
    openConfirm({
      title: "Cancel Recording",
      message: "Cancel the scheduled recording?",
      confirmLabel: "Cancel Recording",
      variant: "warning",
    });
  };

  const executeCancelRecording = async () => {
    if (!recording) return;
    try {
      await cancelRecording({ recordingId: recording._id });
      showSuccess("Recording cancelled");
    } catch (error) {
      showError(error, "Failed to cancel recording");
    }
  };

  return (
    <div className="border-t border-ui-border pt-4">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleHeader
          icon={<Mic className="w-5 h-5" />}
          badge={recording && <StatusBadge status={recording.status} />}
        >
          AI Meeting Notes
        </CollapsibleHeader>

        <CollapsibleContent className="space-y-4">
          <RecordingStatusContent
            recording={recording}
            isScheduling={isScheduling}
            onSchedule={handleScheduleRecording}
            onCancel={handleCancelRecording}
          />
        </CollapsibleContent>
      </Collapsible>

      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={closeConfirm}
        onConfirm={() => handleConfirm(executeCancelRecording)}
        title={dialogState.title}
        message={dialogState.message}
        confirmLabel={dialogState.confirmLabel}
        variant={dialogState.variant}
        isLoading={isConfirming}
      />
    </div>
  );
}

// Separate component for showing recording results
function RecordingResults({ recordingId }: { recordingId: Id<"meetingRecordings"> }) {
  const [showTranscript, setShowTranscript] = useState(false);
  const recording = useQuery(api.meetingBot.getRecording, { recordingId });

  if (!recording) {
    return <LoadingSpinner size="sm" />;
  }

  const { summary, transcript } = recording;

  return (
    <div className="space-y-4">
      {/* Executive Summary */}
      {summary && (
        <div className="bg-ui-bg-secondary rounded-lg p-4">
          <Typography variant="label" className="mb-2">
            Summary
          </Typography>
          <Typography variant="muted">{summary.executiveSummary}</Typography>
        </div>
      )}

      {/* Key Points */}
      {summary && summary.keyPoints.length > 0 && (
        <div>
          <Typography variant="label" className="mb-2">
            Key Points
          </Typography>
          <ul className="list-disc list-inside space-y-1 text-xs text-ui-text-secondary marker:text-brand">
            {summary.keyPoints.map((point: string) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Items */}
      {summary && summary.actionItems.length > 0 && (
        <div>
          <Typography variant="label" className="mb-2">
            Action Items
          </Typography>
          <ul className="space-y-2">
            {summary.actionItems.map(
              (
                item: { description: string; assignee?: string; dueDate?: string },
                index: number,
              ) => (
                <li
                  key={`action-${index}-${item.description.slice(0, 20)}`}
                  className="bg-status-warning-bg rounded p-2"
                >
                  <Flex justify="between" align="start">
                    <Typography variant="small">{item.description}</Typography>
                    {item.assignee && (
                      <Badge size="sm" className="ml-2 shrink-0">
                        {item.assignee}
                      </Badge>
                    )}
                  </Flex>
                  {item.dueDate && (
                    <Typography variant="meta" className="mt-1 block">
                      Due: {item.dueDate}
                    </Typography>
                  )}
                </li>
              ),
            )}
          </ul>
        </div>
      )}

      {/* Decisions */}
      {summary && summary.decisions.length > 0 && (
        <div>
          <Typography variant="label" className="mb-2">
            Decisions Made
          </Typography>
          <ul className="space-y-1">
            {summary.decisions.map((decision: string) => (
              <Flex as="li" key={decision} align="start" gap="sm">
                <CheckCircle className="w-4 h-4 text-status-success shrink-0 mt-0.5" />
                <Typography variant="caption" color="secondary">
                  {decision}
                </Typography>
              </Flex>
            ))}
          </ul>
        </div>
      )}

      {/* Transcript Toggle */}
      {transcript && (
        <Collapsible open={showTranscript} onOpenChange={setShowTranscript}>
          <CollapsibleHeader icon={<FileText className="w-4 h-4" />}>
            {showTranscript ? "Hide Transcript" : "Show Full Transcript"}
          </CollapsibleHeader>
          <CollapsibleContent>
            <div className="bg-ui-bg-secondary rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-xs text-ui-text-secondary whitespace-pre-wrap font-sans">
                {transcript.fullText}
              </pre>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Stats */}
      {transcript && (
        <Metadata>
          <MetadataItem>{transcript.wordCount.toLocaleString()} words</MetadataItem>
          <MetadataItem>
            {recording.duration ? Math.round(recording.duration / 60) : "?"} min
          </MetadataItem>
          {transcript.speakerCount && (
            <MetadataItem>{transcript.speakerCount} speakers</MetadataItem>
          )}
        </Metadata>
      )}
    </div>
  );
}
