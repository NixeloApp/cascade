import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import { useDeferredValue, useEffect, useState } from "react";
import { PageContent } from "@/components/layout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { Input } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Metadata, MetadataItem } from "@/components/ui/Metadata";
import { Section } from "@/components/ui/Section";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import {
  formatDateTime,
  formatDurationHuman,
  formatNumber,
  formatRelativeTime,
} from "@/lib/formatting";
import { Calendar, CheckCircle, FileText, Mic, XCircle } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

type MeetingListItem = FunctionReturnType<typeof api.meetingBot.listRecordings>[number];
type MeetingSearchItem = FunctionReturnType<typeof api.meetingBot.searchRecordings>[number];
type MeetingOverview = MeetingListItem | MeetingSearchItem;
type MeetingDetail = FunctionReturnType<typeof api.meetingBot.getRecording>;
type MeetingSummary = NonNullable<NonNullable<MeetingDetail>["summary"]>;
type MeetingParticipants = NonNullable<NonNullable<MeetingDetail>["participants"]>;
type ProjectOption = FunctionReturnType<typeof api.dashboard.getMyProjects>[number];

function getSelectedActionItemProjects(
  summary: MeetingSummary,
  projects: ProjectOption[] | undefined,
  defaultProjectId: Id<"projects"> | undefined,
  currentSelections: Record<number, Id<"projects"> | null>,
) {
  const availableProjectIds = new Set((projects ?? []).map((project) => project._id));
  const nextSelections: Record<number, Id<"projects"> | null> = {};

  for (const [index, item] of summary.actionItems.entries()) {
    if (item.issueCreated) {
      nextSelections[index] = null;
      continue;
    }

    const existingProjectId = currentSelections[index];
    if (existingProjectId && availableProjectIds.has(existingProjectId)) {
      nextSelections[index] = existingProjectId;
      continue;
    }

    nextSelections[index] =
      defaultProjectId && availableProjectIds.has(defaultProjectId) ? defaultProjectId : null;
  }

  return nextSelections;
}

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
  recording: MeetingOverview;
}) {
  return (
    <button type="button" onClick={onSelect} className="w-full text-left">
      <Card
        variant={isSelected ? "outline" : "soft"}
        padding="md"
        className={cn("transition-default", isSelected && "border-brand-ring bg-brand-subtle/40")}
      >
        <Stack gap="sm">
          <Flex justify="between" align="start" gap="sm">
            <Stack gap="xs" className="min-w-0">
              <Typography variant="label" className="truncate">
                {recording.title}
              </Typography>
              <Typography variant="caption" color="secondary">
                {formatMeetingPlatform(recording.meetingPlatform)} <span aria-hidden="true">•</span>{" "}
                {formatRelativeTime(recording.createdAt)}
              </Typography>
              {"matchExcerpt" in recording && recording.matchExcerpt && (
                <Typography variant="caption" color="secondary" className="line-clamp-2">
                  {recording.matchExcerpt}
                </Typography>
              )}
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

function ActionItemsSection({
  summary,
  defaultProjectId,
  projects,
}: {
  summary: MeetingSummary;
  defaultProjectId: Id<"projects"> | undefined;
  projects: ProjectOption[] | undefined;
}) {
  const { mutate: createIssueFromActionItem, canAct } = useAuthenticatedMutation(
    api.meetingBot.createIssueFromActionItem,
  );
  const [selectedProjectIds, setSelectedProjectIds] = useState<
    Record<number, Id<"projects"> | null>
  >({});
  const [creatingIndex, setCreatingIndex] = useState<number | null>(null);

  useEffect(() => {
    setSelectedProjectIds((current) =>
      getSelectedActionItemProjects(summary, projects, defaultProjectId, current),
    );
  }, [defaultProjectId, projects, summary]);

  const handleCreateIssue = async (actionItemIndex: number) => {
    const projectId = selectedProjectIds[actionItemIndex];
    if (!projectId) {
      showError("Select a project before creating an issue");
      return;
    }

    setCreatingIndex(actionItemIndex);
    try {
      await createIssueFromActionItem({
        summaryId: summary._id,
        actionItemIndex,
        projectId,
      });
      showSuccess("Issue created from action item");
    } catch (error) {
      showError(error, "Failed to create issue from action item");
    } finally {
      setCreatingIndex(null);
    }
  };

  if (summary.actionItems.length === 0) return null;

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

                {!item.issueCreated && (
                  <div className="rounded-lg border border-ui-border bg-ui-bg-elevated p-3">
                    <Stack gap="xs">
                      <Typography variant="caption" color="secondary">
                        Turn this follow-up into a tracked issue.
                      </Typography>

                      {projects === undefined ? (
                        <Typography variant="caption" color="secondary">
                          Loading available projects...
                        </Typography>
                      ) : projects.length === 0 ? (
                        <Typography variant="caption" color="secondary">
                          Join a project to create issues from meeting action items.
                        </Typography>
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                          <Select
                            key={`${summary._id}-${index}-${selectedProjectIds[index] ?? "none"}`}
                            defaultValue={selectedProjectIds[index] ?? undefined}
                            onValueChange={(value) =>
                              setSelectedProjectIds((current) => ({
                                ...current,
                                [index]: value as Id<"projects">,
                              }))
                            }
                          >
                            <SelectTrigger
                              aria-label={`Project for action item ${index + 1}`}
                              className="w-full"
                            >
                              <SelectValue placeholder="Choose project" />
                            </SelectTrigger>
                            <SelectContent>
                              {projects.map((project) => (
                                <SelectItem key={project._id} value={project._id}>
                                  {project.key} - {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Button
                            variant="secondary"
                            size="sm"
                            isLoading={creatingIndex === index}
                            disabled={!canAct || !selectedProjectIds[index]}
                            onClick={() => void handleCreateIssue(index)}
                          >
                            Create issue
                          </Button>
                        </div>
                      )}
                    </Stack>
                  </div>
                )}
              </Stack>
            </Card>
          </li>
        ))}
      </Stack>
    </Section>
  );
}

function ParticipantsSection({ participants }: { participants: MeetingParticipants }) {
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
  const projects = useAuthenticatedQuery(api.dashboard.getMyProjects, {});

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
            {summary.overallSentiment && (
              <Badge size="sm">Sentiment: {summary.overallSentiment}</Badge>
            )}
            <Badge size="sm">Model: {summary.modelUsed}</Badge>
          </Flex>
        </Section>
      </Card>

      {summary.keyPoints.length > 0 && (
        <Section title="Key Points" gap="sm">
          <Stack
            as="ul"
            gap="xs"
            className="list-disc list-inside text-ui-text-secondary marker:text-brand"
          >
            {summary.keyPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </Stack>
        </Section>
      )}

      <ActionItemsSection
        summary={summary}
        defaultProjectId={recording.projectId}
        projects={projects}
      />

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
          <Stack
            as="ul"
            gap="xs"
            className="list-disc list-inside text-ui-text-secondary marker:text-brand"
          >
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

function RecordingDetailPanel({ recording }: { recording: MeetingDetail | undefined }) {
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
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery.trim());
  const searchedRecordings = useAuthenticatedQuery(
    api.meetingBot.searchRecordings,
    deferredSearchQuery.length >= 2 ? { query: deferredSearchQuery, limit: 50 } : "skip",
  );
  const [selectedRecordingId, setSelectedRecordingId] = useState<Id<"meetingRecordings"> | null>(
    null,
  );
  const displayedRecordings = deferredSearchQuery.length >= 2 ? searchedRecordings : recordings;

  useEffect(() => {
    if (!displayedRecordings) return;

    if (displayedRecordings.length === 0) {
      setSelectedRecordingId(null);
      return;
    }

    setSelectedRecordingId((current) => {
      if (current && displayedRecordings.some((recording) => recording._id === current)) {
        return current;
      }
      return displayedRecordings[0]._id;
    });
  }, [displayedRecordings]);

  const selectedRecording = useAuthenticatedQuery(
    api.meetingBot.getRecording,
    selectedRecordingId ? { recordingId: selectedRecordingId } : "skip",
  );

  return (
    <PageContent
      isLoading={
        recordings === undefined ||
        (deferredSearchQuery.length >= 2 && searchedRecordings === undefined)
      }
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
          <Stack gap="sm">
            <Input
              variant="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search transcript text"
              aria-label="Search meetings"
            />

            {deferredSearchQuery.length >= 2 && (
              <Typography variant="caption" color="secondary">
                Searching transcript content for "{deferredSearchQuery}".
              </Typography>
            )}

            {displayedRecordings !== undefined && displayedRecordings.length === 0 ? (
              <EmptyState
                icon={FileText}
                size="compact"
                title="No meetings match this search"
                description="Try a different keyword or open a recent meeting from the full list."
              />
            ) : (
              <Stack as="ul" gap="sm" className="list-none">
                {displayedRecordings?.map((recording) => (
                  <li key={recording._id}>
                    <RecordingListItem
                      recording={recording}
                      isSelected={selectedRecordingId === recording._id}
                      onSelect={() => setSelectedRecordingId(recording._id)}
                    />
                  </li>
                ))}
              </Stack>
            )}
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
