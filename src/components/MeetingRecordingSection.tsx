/**
 * Meeting Recording Section
 *
 * UI for managing meeting recordings and transcriptions.
 * Displays recording status, playback controls, and transcript preview.
 * Supports downloading recordings and viewing AI-generated summaries.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { ReactNode } from "react";
import { useState } from "react";
import type { BadgeProps } from "@/components/ui/Badge";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { CheckCircle, Clock, FileText, Mic, MicOff, Play, XCircle } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Collapsible, CollapsibleContent, CollapsibleHeader } from "./ui/Collapsible";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Flex, FlexItem } from "./ui/Flex";
import { Icon } from "./ui/Icon";
import { List } from "./ui/List";
import { InlineSpinner, LoadingSpinner } from "./ui/LoadingSpinner";
import { Metadata, MetadataItem } from "./ui/Metadata";
import { ScrollArea } from "./ui/ScrollArea";
import { Separator } from "./ui/Separator";
import { Stack } from "./ui/Stack";
import { Typography } from "./ui/Typography";

// Status badge configuration - extracted to reduce component complexity
interface StatusBadgeConfig {
  icon: ReactNode;
  label: string;
  variant: BadgeProps["variant"];
}

const STATUS_BADGE_CONFIG: Record<string, StatusBadgeConfig> = {
  scheduled: {
    icon: <StatusBadgeIcon icon={Clock} />,
    label: "Scheduled",
    variant: "brand",
  },
  joining: {
    icon: <StatusBadgeIcon icon={Play} tone="warning" animation="pulse" />,
    label: "Joining...",
    variant: "warning",
  },
  recording: {
    icon: <StatusBadgeIcon icon={Mic} tone="error" animation="pulse" />,
    label: "Recording",
    variant: "error",
  },
  processing: {
    icon: <InlineSpinner size="xs" variant="inherit" />,
    label: "Processing...",
    variant: "accent",
  },
  transcribing: {
    icon: <InlineSpinner size="xs" variant="inherit" />,
    label: "Processing...",
    variant: "accent",
  },
  summarizing: {
    icon: <InlineSpinner size="xs" variant="inherit" />,
    label: "Processing...",
    variant: "accent",
  },
  completed: {
    icon: <StatusBadgeIcon icon={CheckCircle} tone="success" />,
    label: "Completed",
    variant: "success",
  },
  failed: {
    icon: <StatusBadgeIcon icon={XCircle} tone="error" />,
    label: "Failed",
    variant: "error",
  },
};

function StatusBadgeIcon({
  icon,
  tone,
  animation,
}: {
  icon: typeof Clock;
  tone?: "warning" | "error" | "success";
  animation?: "pulse";
}) {
  return <Icon icon={icon} size="xs" tone={tone} animation={animation} />;
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_BADGE_CONFIG[status];
  if (!config) return null;

  return (
    <Badge size="sm" variant={config.variant}>
      <Flex as="span" align="center" gap="xs">
        {config.icon}
        {config.label}
      </Flex>
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
    <Card variant="soft" padding="md">
      <Stack gap="sm" align="start">
        <Typography variant="muted">
          Schedule a bot to join this meeting and automatically generate transcripts and summaries.
        </Typography>
        <Button
          onClick={onSchedule}
          isLoading={isScheduling}
          leftIcon={<Icon icon={Mic} size="sm" />}
          size="sm"
        >
          {isScheduling ? "Scheduling..." : "Enable AI Notes"}
        </Button>
      </Stack>
    </Card>
  );
}

function ScheduledState({ onCancel }: { onCancel: () => void }) {
  return (
    <Card recipe="statusBrand" padding="md">
      <Flex justify="between" align="center">
        <Stack gap="xs">
          <Typography variant="label">Bot scheduled to join</Typography>
          <Typography variant="meta">
            "Nixelo Notetaker" will join when the meeting starts
          </Typography>
        </Stack>
        <Button
          onClick={onCancel}
          variant="ghost"
          size="sm"
          leftIcon={<Icon icon={MicOff} size="sm" />}
        >
          Cancel
        </Button>
      </Flex>
    </Card>
  );
}

function FailedState({ errorMessage, onRetry }: { errorMessage?: string; onRetry: () => void }) {
  return (
    <Card recipe="statusError" padding="md">
      <Stack gap="sm">
        <Typography variant="label" color="error">
          Recording failed
        </Typography>
        <Typography variant="meta">
          {errorMessage || "An error occurred during recording"}
        </Typography>
        <Button onClick={onRetry} variant="secondary" size="sm">
          Try Again
        </Button>
      </Stack>
    </Card>
  );
}

function InProgressState({ status }: { status: string }) {
  const message = IN_PROGRESS_MESSAGES[status] || "Processing...";
  return (
    <Card variant="soft" padding="md">
      <Flex gap="md" align="center">
        <LoadingSpinner size="sm" />
        <Stack gap="xs">
          <Typography variant="label">{message}</Typography>
          <Typography variant="meta">This may take a few minutes</Typography>
        </Stack>
      </Flex>
    </Card>
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

/** Section for scheduling and managing meeting bot recordings. */
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
  const recording = useAuthenticatedQuery(api.meetingBot.getRecordingByCalendarEvent, {
    calendarEventId,
  });
  const { mutate: scheduleRecording } = useAuthenticatedMutation(api.meetingBot.scheduleRecording);
  const { mutate: cancelRecording } = useAuthenticatedMutation(api.meetingBot.cancelRecording);

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
    <Stack gap="lg">
      <Separator />
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleHeader
          icon={<Icon icon={Mic} size="md" />}
          badge={recording && <StatusBadge status={recording.status} />}
        >
          AI Meeting Notes
        </CollapsibleHeader>

        <CollapsibleContent>
          <Stack gap="md">
            <RecordingStatusContent
              recording={recording}
              isScheduling={isScheduling}
              onSchedule={handleScheduleRecording}
              onCancel={handleCancelRecording}
            />
          </Stack>
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
    </Stack>
  );
}

// Separate component for showing recording results
function RecordingResults({ recordingId }: { recordingId: Id<"meetingRecordings"> }) {
  const [showTranscript, setShowTranscript] = useState(false);
  const recording = useAuthenticatedQuery(api.meetingBot.getRecording, { recordingId });

  if (!recording) {
    return <LoadingSpinner size="sm" />;
  }

  const { summary, transcript } = recording;

  return (
    <Stack gap="md">
      {/* Executive Summary */}
      {summary && (
        <Card variant="soft" padding="md">
          <Stack gap="sm">
            <Typography variant="label">Summary</Typography>
            <Typography variant="muted">{summary.executiveSummary}</Typography>
          </Stack>
        </Card>
      )}

      {/* Key Points */}
      {summary && summary.keyPoints.length > 0 && (
        <Stack gap="sm">
          <Typography variant="label">Key Points</Typography>
          <List gap="xs" variant="bulleted">
            {summary.keyPoints.map((point: string) => (
              <li key={point}>{point}</li>
            ))}
          </List>
        </Stack>
      )}

      {/* Action Items */}
      {summary && summary.actionItems.length > 0 && (
        <Stack gap="sm">
          <Typography variant="label">Action Items</Typography>
          <Stack as="ul" gap="sm">
            {summary.actionItems.map(
              (item: { description: string; assignee?: string; dueDate?: string }) => (
                <li key={`${item.description}-${item.assignee ?? ""}-${item.dueDate ?? ""}`}>
                  <Card recipe="statusWarning" padding="sm">
                    <Stack gap="xs">
                      <Flex justify="between" align="start" gap="sm">
                        <FlexItem flex="1">
                          <Typography variant="small">{item.description}</Typography>
                        </FlexItem>
                        {item.assignee && <Badge size="sm">{item.assignee}</Badge>}
                      </Flex>
                      {item.dueDate && <Typography variant="meta">Due: {item.dueDate}</Typography>}
                    </Stack>
                  </Card>
                </li>
              ),
            )}
          </Stack>
        </Stack>
      )}

      {/* Decisions */}
      {summary && summary.decisions.length > 0 && (
        <Stack gap="sm">
          <Typography variant="label">Decisions Made</Typography>
          <List gap="xs">
            {summary.decisions.map((decision: string) => (
              <Flex as="li" key={decision} align="start" gap="sm">
                <Icon icon={CheckCircle} size="xs" tone="success" />
                <Typography variant="caption" color="secondary">
                  {decision}
                </Typography>
              </Flex>
            ))}
          </List>
        </Stack>
      )}

      {/* Transcript Toggle */}
      {transcript && (
        <Collapsible open={showTranscript} onOpenChange={setShowTranscript}>
          <CollapsibleHeader icon={<Icon icon={FileText} size="sm" />}>
            {showTranscript ? "Hide Transcript" : "Show Full Transcript"}
          </CollapsibleHeader>
          <CollapsibleContent>
            <Card variant="soft" padding="md">
              <ScrollArea size="contentLg">
                <Typography as="pre" variant="mono" className="whitespace-pre-wrap">
                  {transcript.fullText}
                </Typography>
              </ScrollArea>
            </Card>
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
    </Stack>
  );
}
