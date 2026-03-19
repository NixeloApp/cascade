import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import { useEffect, useState } from "react";
import { PageContent } from "@/components/layout";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Metadata, MetadataItem } from "@/components/ui/Metadata";
import { Section } from "@/components/ui/Section";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { formatDateTime, formatDurationHuman, formatNumber, formatRelativeTime } from "@/lib/formatting";
import { Calendar, CheckCircle, FileText, Mic, XCircle } from "@/lib/icons";
import { cn } from "@/lib/utils";

type MeetingListItem = FunctionReturnType<typeof api.meetingBot.listRecordings>[number];
type MeetingDetail = FunctionReturnType<typeof api.meetingBot.getRecording>;

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Scheduled",
  joining: "Joining",
  recording: "Recording",
  processing: "Processing",
  transcribing: "Transcribing",
  summarizing: "Summarizing",
  completed: "Completed",
  cancelled: "Cancelled",
  failed: "Failed",
};

const STATUS_CLASSNAMES: Record<string, string> = {
  scheduled: "bg-brand-subtle text-brand-active",
  joining: "bg-status-warning-bg text-status-warning",
  recording: "bg-status-error-bg text-status-error",
  processing: "bg-accent-subtle text-accent-active",
  transcribing: "bg-accent-subtle text-accent-active",
  summarizing: "bg-accent-subtle text-accent-active",
  completed: "bg-status-success-bg text-status-success",
  cancelled: "bg-ui-bg-tertiary text-ui-text-secondary",
  failed: "bg-status-error-bg text-status-error",
};

function formatMeetingPlatform(platform: MeetingListItem["meetingPlatform"]): string {
  switch (platform) {
    case "google_meet":
      return "Google Meet";
    case "zoom":
      return "Zoom";
    case "teams":
      return "Microsoft Teams";
    default:
      return "Other";
  }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge size="sm" className={STATUS_CLASSNAMES[status] ?? STATUS_CLASSNAMES.processing}>
      {STATUS_LABELS[status] ?? "Unknown"}
    </Badge>
  );
}

function RecordingListItem({
  isSelected,
  onSelect,
  recording,
}: {
  isSelected: boolean;
  onSelect: () => void;
  recording: MeetingListItem;
}) {
  return (
    <button type="button" onClick={onSelect} className="w-full text-left">
      <Card
        variant={isSelected ? "outline" : "soft"}
        padding="md"
        className={cn(
          "transition-default",
          isSelected && "border-brand-ring bg-brand-subtle/40",
        )}
      >
        <Stack gap="sm">
          <Flex justify="between" align="start" gap="sm">
            <Stack gap="xs" className="min-w-0">
              <Typography variant="label" className="truncate">
                {recording.title}
              </Typography>
              <Typography variant="caption" color="secondary">
                {formatMeetingPlatform(recording.meetingPlatform)}{" "}
                <span aria-hidden="true">•</span> {formatRelativeTime(recording.createdAt)}
              </Typography>
            </Stack>
            <StatusBadge status={recording.status} />
          </Flex>

          <Metadata>
            {recording.scheduledStartTime && (
              <MetadataItem icon={<Calendar className="h-4 w-4" />}>
                {formatDateTime(recording.scheduledStartTime)}
              </MetadataItem>
            )}
            <MetadataItem>{recording.isPublic ? "Shared in project" : "Private"}</MetadataItem>
          </Metadata>

          <Flex gap="xs" className="flex-wrap">
            {recording.hasSummary && <Badge size="sm">Summary</Badge>}
            {recording.hasTranscript && <Badge size="sm">Transcript</Badge>}
            {recording.calendarEventId && <Badge size="sm">Calendar-linked</Badge>}
          </Flex>
        </Stack>
      </Card>
    </button>
  );
}

function ActionItemsSection({ summary }: { summary: NonNullable<MeetingDetail>["summary"] }) {
  if (!(summary && summary.actionItems.length > 0)) return null;

  return (
    <Section title="Action Items" gap="sm">
      <Stack as="ul" gap="sm" className="list-none">
        {summary.actionItems.map((item, index) => (
          <li key={`${item.description}-${item.assignee ?? ""}-${index}`}>
            <Card variant="soft" padding="sm">
              <Stack gap="xs">
                <Flex justify="between" align="start" gap="sm">
                  <Typography variant="small">{item.description}</Typography>
                  {item.assignee && (
                    <Badge size="sm" className="shrink-0">
                      {item.assignee}
                    </Badge>
                  )}
                </Flex>
                <Flex gap="xs" className="flex-wrap">
                  {item.dueDate && <Badge size="sm">Due: {item.dueDate}</Badge>}
                  {item.priority && <Badge size="sm">Priority: {item.priority}</Badge>}
                  {item.issueCreated && <Badge size="sm">Issue linked</Badge>}
                </Flex>
              </Stack>
            </Card>
          </li>
        ))}
      </Stack>
    </Section>
  );
}

function ParticipantsSection({ participants }: { participants: NonNullable<MeetingDetail>["participants"] }) {
  if (!(participants && participants.length > 0)) return null;

  return (
    <Section title="Participants" gap="sm">
      <Stack as="ul" gap="sm" className="list-none">
        {participants.map((participant) => (
          <li key={participant._id}>
            <Card variant="soft" padding="sm">
              <Flex justify="between" align="center" gap="sm">
                <Stack gap="xs" className="min-w-0">
                  <Typography variant="label" className="truncate">
                    {participant.displayName}
                  </Typography>
                  {participant.email && (
                    <Typography variant="caption" color="secondary" className="truncate">
                      {participant.email}
                    </Typography>
                  )}
                </Stack>
                <Flex gap="xs" className="shrink-0 flex-wrap justify-end">
                  {participant.isHost && <Badge size="sm">Host</Badge>}
                  {participant.isExternal && <Badge size="sm">External</Badge>}
                </Flex>
              </Flex>
            </Card>
          </li>
        ))}
      </Stack>
    </Section>
  );
}

function SummarySections({ recording }: { recording: NonNullable<MeetingDetail> }) {
  const { summary, transcript } = recording;

  if (!summary) {
    return (
      <EmptyState
        icon={Mic}
        size="compact"
        title="Meeting processing is still in progress"
        description="This recording exists, but the summary has not been generated yet."
      />
    );
  }

  return (
    <Stack gap="lg">
      <Card variant="soft" padding="md">
        <Section title="Summary" gap="sm">
          <Typography variant="muted">{summary.executiveSummary}</Typography>
          <Flex gap="xs" className="flex-wrap">
            {summary.overallSentiment && <Badge size="sm">Sentiment: {summary.overallSentiment}</Badge>}
            <Badge size="sm">Model: {summary.modelUsed}</Badge>
          </Flex>
        </Section>
      </Card>

      {summary.keyPoints.length > 0 && (
        <Section title="Key Points" gap="sm">
          <Stack as="ul" gap="xs" className="list-disc list-inside text-ui-text-secondary marker:text-brand">
            {summary.keyPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </Stack>
        </Section>
      )}

      <ActionItemsSection summary={summary} />

      {summary.decisions.length > 0 && (
        <Section title="Decisions" gap="sm">
          <Stack as="ul" gap="xs" className="list-none">
            {summary.decisions.map((decision) => (
              <Flex as="li" key={decision} align="start" gap="sm">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-status-success" />
                <Typography variant="caption" color="secondary">
                  {decision}
                </Typography>
              </Flex>
            ))}
          </Stack>
        </Section>
      )}

      {summary.openQuestions.length > 0 && (
        <Section title="Open Questions" gap="sm">
          <Stack as="ul" gap="xs" className="list-disc list-inside text-ui-text-secondary marker:text-brand">
            {summary.openQuestions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </Stack>
        </Section>
      )}

      {summary.topics.length > 0 && (
        <Section title="Topics" gap="sm">
          <Stack as="ul" gap="sm" className="list-none">
            {summary.topics.map((topic, index) => (
              <li key={`${topic.title}-${index}`}>
                <Card variant="soft" padding="sm">
                  <Stack gap="xs">
                    <Typography variant="label">{topic.title}</Typography>
                    <Typography variant="caption" color="secondary">
                      {topic.summary}
                    </Typography>
                  </Stack>
                </Card>
              </li>
            ))}
          </Stack>
        </Section>
      )}

      {transcript && (
        <Section title="Transcript" gap="sm">
          <Card variant="soft" padding="md" className="max-h-96 overflow-y-auto">
            <Typography as="pre" variant="mono" color="secondary" className="whitespace-pre-wrap">
              {transcript.fullText}
            </Typography>
          </Card>
        </Section>
      )}
    </Stack>
  );
}

function RecordingDetailPanel({
  recording,
}: {
  recording: MeetingDetail | undefined;
}) {
  if (recording === undefined) {
    return (
      <Card variant="soft" padding="xl">
        <Flex justify="center">
          <LoadingSpinner size="lg" />
        </Flex>
      </Card>
    );
  }

  return (
    <Stack gap="lg">
      <Card padding="md">
        <Stack gap="sm">
          <Flex justify="between" align="start" gap="sm">
            <Stack gap="xs" className="min-w-0">
              <Typography variant="h4">{recording.title}</Typography>
              <Typography variant="caption" color="secondary">
                {formatMeetingPlatform(recording.meetingPlatform)}
              </Typography>
            </Stack>
            <StatusBadge status={recording.status} />
          </Flex>

          <Metadata>
            <MetadataItem icon={<Calendar className="h-4 w-4" />}>
              {recording.scheduledStartTime
                ? formatDateTime(recording.scheduledStartTime)
                : formatDateTime(recording.createdAt)}
            </MetadataItem>
            <MetadataItem>{recording.isPublic ? "Shared in project" : "Private"}</MetadataItem>
            {recording.duration && (
              <MetadataItem>{formatDurationHuman(recording.duration)}</MetadataItem>
            )}
            {recording.transcript && (
              <MetadataItem>{formatNumber(recording.transcript.wordCount)} words</MetadataItem>
            )}
            {recording.transcript?.speakerCount && (
              <MetadataItem>{recording.transcript.speakerCount} speakers</MetadataItem>
            )}
          </Metadata>

          {recording.errorMessage && (
            <Card variant="soft" padding="sm" className="border-status-error/30 bg-status-error-bg">
              <Flex gap="sm" align="start">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-status-error" />
                <Typography variant="caption" color="secondary">
                  {recording.errorMessage}
                </Typography>
              </Flex>
            </Card>
          )}
        </Stack>
      </Card>

      <SummarySections recording={recording} />
      <ParticipantsSection participants={recording.participants} />
    </Stack>
  );
}

export function MeetingsWorkspace() {
  const recordings = useAuthenticatedQuery(api.meetingBot.listRecordings, { limit: 50 });
  const [selectedRecordingId, setSelectedRecordingId] = useState<Id<"meetingRecordings"> | null>(
    null,
  );

  useEffect(() => {
    if (!recordings) return;

    if (recordings.length === 0) {
      setSelectedRecordingId(null);
      return;
    }

    setSelectedRecordingId((current) => {
      if (current && recordings.some((recording) => recording._id === current)) {
        return current;
      }
      return recordings[0]._id;
    });
  }, [recordings]);

  const selectedRecording = useAuthenticatedQuery(
    api.meetingBot.getRecording,
    selectedRecordingId ? { recordingId: selectedRecordingId } : "skip",
  );

  return (
    <PageContent
      isLoading={recordings === undefined}
      isEmpty={recordings !== undefined && recordings.length === 0}
      emptyState={{
        icon: Mic,
        title: "No meeting recordings yet",
        description:
          "Schedule AI Meeting Notes from a calendar event to start capturing transcripts, summaries, and follow-up work.",
      }}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <Section
          title="Recent Meetings"
          description="Recordings created from calendar-linked meetings and direct bot runs."
          gap="sm"
        >
          <Stack as="ul" gap="sm" className="list-none">
            {recordings?.map((recording) => (
              <li key={recording._id}>
                <RecordingListItem
                  recording={recording}
                  isSelected={selectedRecordingId === recording._id}
                  onSelect={() => setSelectedRecordingId(recording._id)}
                />
              </li>
            ))}
          </Stack>
        </Section>

        <Section
          title="Meeting Detail"
          description="Review summaries, decisions, action items, transcript, and participants."
          gap="sm"
        >
          {selectedRecordingId ? (
            <RecordingDetailPanel recording={selectedRecording} />
          ) : (
            <EmptyState
              icon={FileText}
              size="compact"
              title="Select a meeting"
              description="Choose a recording from the list to inspect its details."
            />
          )}
        </Section>
      </div>
    </PageContent>
  );
}
