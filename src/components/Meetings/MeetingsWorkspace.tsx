import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";
import { type FormEvent, type ReactNode, useDeferredValue, useEffect, useState } from "react";
import { PageContent } from "@/components/layout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
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
import { ROUTES } from "@/config/routes";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganizationOptional } from "@/hooks/useOrgContext";
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
type MeetingMemory = FunctionReturnType<typeof api.meetingBot.listMemoryItems>;
type MeetingSummary = NonNullable<NonNullable<MeetingDetail>["summary"]>;
type MeetingParticipants = NonNullable<NonNullable<MeetingDetail>["participants"]>;
type MeetingTranscript = NonNullable<NonNullable<MeetingDetail>["transcript"]>;
type MeetingTranscriptSegment = MeetingTranscript["segments"][number];
type ProjectOption = FunctionReturnType<typeof api.dashboard.getMyProjects>[number];
type MeetingStatus = MeetingOverview["status"];
type MeetingPlatform = MeetingOverview["meetingPlatform"];
type StatusFilter = "all" | MeetingStatus;
type PlatformFilter = "all" | MeetingPlatform;
type ProjectFilter = "all" | Id<"projects">;
type TimeWindowFilter = "all" | "7d" | "30d" | "90d";

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

const STATUS_FILTER_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "scheduled", label: "Scheduled" },
  { value: "joining", label: "Joining" },
  { value: "recording", label: "Recording" },
  { value: "processing", label: "Processing" },
  { value: "transcribing", label: "Transcribing" },
  { value: "summarizing", label: "Summarizing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "failed", label: "Failed" },
];

const PLATFORM_FILTER_OPTIONS: Array<{ value: PlatformFilter; label: string }> = [
  { value: "all", label: "All platforms" },
  { value: "google_meet", label: "Google Meet" },
  { value: "zoom", label: "Zoom" },
  { value: "teams", label: "Microsoft Teams" },
  { value: "other", label: "Other" },
];

const TIME_WINDOW_OPTIONS: Array<{ value: TimeWindowFilter; label: string }> = [
  { value: "all", label: "All dates" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

function matchesTimeWindow(recording: MeetingOverview, timeWindow: TimeWindowFilter) {
  if (timeWindow === "all") return true;

  const now = Date.now();
  const ageMs = now - (recording.scheduledStartTime ?? recording.createdAt);
  const dayCount = timeWindow === "7d" ? 7 : timeWindow === "30d" ? 30 : 90;
  return ageMs <= dayCount * 24 * 60 * 60 * 1000;
}

export function filterMeetingRecordings(
  recordings: MeetingOverview[] | undefined,
  filters: {
    status: StatusFilter;
    platform: PlatformFilter;
    projectId: ProjectFilter;
    timeWindow: TimeWindowFilter;
  },
) {
  if (!recordings) return recordings;

  return recordings.filter((recording) => {
    if (filters.status !== "all" && recording.status !== filters.status) return false;
    if (filters.platform !== "all" && recording.meetingPlatform !== filters.platform) return false;
    if (filters.projectId !== "all" && recording.projectId !== filters.projectId) return false;
    if (!matchesTimeWindow(recording, filters.timeWindow)) return false;
    return true;
  });
}

function detectMeetingPlatform(url: string): MeetingPlatform {
  if (url.includes("meet.google.com")) return "google_meet";
  if (url.includes("zoom.us")) return "zoom";
  if (url.includes("teams.microsoft.com")) return "teams";
  return "other";
}

function formatDateTimeLocalValue(timestamp: number) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getDefaultScheduledTimeValue() {
  const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;
  return formatDateTimeLocalValue(fiveMinutesFromNow);
}

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

function formatTranscriptTimestamp(seconds: number) {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function hasTranscriptSegments(
  segments: MeetingTranscript["segments"],
): segments is [MeetingTranscriptSegment, ...MeetingTranscriptSegment[]] {
  return segments.some((segment) => segment.text.trim().length > 0);
}

function matchesTranscriptSegment(segment: MeetingTranscriptSegment, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  return (
    segment.text.toLowerCase().includes(normalizedQuery) ||
    segment.speaker?.toLowerCase().includes(normalizedQuery) === true
  );
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

function MemoryCard({
  title,
  description,
  itemCount,
  children,
}: {
  title: string;
  description: string;
  itemCount: number;
  children: ReactNode;
}) {
  return (
    <Card padding="md">
      <Stack gap="sm">
        <Flex justify="between" align="start" gap="sm">
          <Stack gap="xs">
            <Typography variant="label">{title}</Typography>
            <Typography variant="caption" color="secondary">
              {description}
            </Typography>
          </Stack>
          <Badge size="sm">{itemCount}</Badge>
        </Flex>
        {children}
      </Stack>
    </Card>
  );
}

function MemoryItemMeta({
  recordingTitle,
  meetingPlatform,
  createdAt,
}: {
  recordingTitle: string;
  meetingPlatform: MeetingPlatform;
  createdAt: number;
}) {
  return (
    <Typography variant="caption" color="secondary">
      {recordingTitle} <span aria-hidden="true">•</span> {formatMeetingPlatform(meetingPlatform)}{" "}
      <span aria-hidden="true">•</span> {formatRelativeTime(createdAt)}
    </Typography>
  );
}

function MeetingMemorySection({ memory }: { memory: MeetingMemory | undefined }) {
  if (memory === undefined) {
    return (
      <Section
        title="Meeting Memory"
        description="Recent decisions, open questions, and follow-ups across completed meetings."
        gap="sm"
      >
        <Card variant="soft" padding="lg">
          <Flex justify="center">
            <LoadingSpinner size="lg" />
          </Flex>
        </Card>
      </Section>
    );
  }

  return (
    <Section
      title="Meeting Memory"
      description="Recent decisions, open questions, and follow-ups across completed meetings."
      gap="sm"
    >
      <div className="grid gap-4 xl:grid-cols-3">
        <MemoryCard
          title="Recent Decisions"
          description="Latest calls and commitments from completed meetings."
          itemCount={memory.recentDecisions.length}
        >
          {memory.recentDecisions.length === 0 ? (
            <Typography variant="caption" color="secondary">
              Completed meetings will surface key decisions here.
            </Typography>
          ) : (
            <Stack as="ul" gap="sm" className="list-none">
              {memory.recentDecisions.map((item) => (
                <li key={`${item.recordingId}-${item.decision}`}>
                  <Card variant="soft" padding="sm">
                    <Stack gap="xs">
                      <Typography variant="small">{item.decision}</Typography>
                      <MemoryItemMeta
                        recordingTitle={item.recordingTitle}
                        meetingPlatform={item.meetingPlatform}
                        createdAt={item.createdAt}
                      />
                    </Stack>
                  </Card>
                </li>
              ))}
            </Stack>
          )}
        </MemoryCard>

        <MemoryCard
          title="Open Questions"
          description="Unresolved questions still worth tracking after the meeting ends."
          itemCount={memory.openQuestions.length}
        >
          {memory.openQuestions.length === 0 ? (
            <Typography variant="caption" color="secondary">
              Outstanding questions from summaries will appear here.
            </Typography>
          ) : (
            <Stack as="ul" gap="sm" className="list-none">
              {memory.openQuestions.map((item) => (
                <li key={`${item.recordingId}-${item.question}`}>
                  <Card variant="soft" padding="sm">
                    <Stack gap="xs">
                      <Typography variant="small">{item.question}</Typography>
                      <MemoryItemMeta
                        recordingTitle={item.recordingTitle}
                        meetingPlatform={item.meetingPlatform}
                        createdAt={item.createdAt}
                      />
                    </Stack>
                  </Card>
                </li>
              ))}
            </Stack>
          )}
        </MemoryCard>

        <MemoryCard
          title="Unresolved Action Items"
          description="Follow-ups that have not been converted into linked issues yet."
          itemCount={memory.unresolvedActionItems.length}
        >
          {memory.unresolvedActionItems.length === 0 ? (
            <Typography variant="caption" color="secondary">
              Pending follow-ups will appear here until they are linked into project work.
            </Typography>
          ) : (
            <Stack as="ul" gap="sm" className="list-none">
              {memory.unresolvedActionItems.map((item) => (
                <li key={`${item.recordingId}-${item.description}`}>
                  <Card variant="soft" padding="sm">
                    <Stack gap="xs">
                      <Typography variant="small">{item.description}</Typography>
                      <Flex gap="xs" className="flex-wrap">
                        {item.assignee && <Badge size="sm">{item.assignee}</Badge>}
                        {item.dueDate && <Badge size="sm">Due: {item.dueDate}</Badge>}
                        {item.priority && <Badge size="sm">Priority: {item.priority}</Badge>}
                      </Flex>
                      <MemoryItemMeta
                        recordingTitle={item.recordingTitle}
                        meetingPlatform={item.meetingPlatform}
                        createdAt={item.createdAt}
                      />
                    </Stack>
                  </Card>
                </li>
              ))}
            </Stack>
          )}
        </MemoryCard>
      </div>
    </Section>
  );
}

function TranscriptSegmentList({ transcript }: { transcript: MeetingTranscript }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim();
  const filteredSegments = transcript.segments.filter(
    (segment) =>
      segment.text.trim().length > 0 && matchesTranscriptSegment(segment, normalizedQuery),
  );

  if (!hasTranscriptSegments(transcript.segments)) {
    return (
      <Card variant="soft" padding="md">
        <Typography as="pre" variant="mono" color="secondary" className="whitespace-pre-wrap">
          {transcript.fullText}
        </Typography>
      </Card>
    );
  }

  return (
    <Stack gap="sm">
      <Card padding="sm">
        <Stack gap="sm">
          <Flex justify="between" align="center" gap="sm" className="flex-wrap">
            <Typography variant="caption" color="secondary">
              Segmented transcript with timestamps.
            </Typography>
            <Flex gap="xs" className="flex-wrap">
              <Badge size="sm">{transcript.segments.length} segments</Badge>
              {transcript.speakerCount && (
                <Badge size="sm">{transcript.speakerCount} speakers</Badge>
              )}
              {normalizedQuery && <Badge size="sm">{filteredSegments.length} matches</Badge>}
            </Flex>
          </Flex>

          <Input
            variant="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter transcript segments"
            aria-label="Search transcript"
          />
        </Stack>
      </Card>

      <Card variant="soft" padding="md" className="max-h-96 overflow-y-auto">
        {filteredSegments.length === 0 ? (
          <EmptyState
            icon={FileText}
            size="compact"
            title="No transcript matches"
            description="Try a different phrase or speaker name."
          />
        ) : (
          <Stack as="ol" gap="sm" className="list-none">
            {filteredSegments.map((segment, index) => (
              <li key={`${segment.startTime}-${segment.endTime}-${index}`}>
                <Card variant="soft" padding="sm" className="border border-ui-border">
                  <Stack gap="xs">
                    <Flex justify="between" align="start" gap="sm" className="flex-wrap">
                      <Flex gap="xs" className="flex-wrap">
                        <Badge size="sm">{formatTranscriptTimestamp(segment.startTime)}</Badge>
                        <Badge size="sm">
                          {formatTranscriptTimestamp(segment.startTime)} -{" "}
                          {formatTranscriptTimestamp(segment.endTime)}
                        </Badge>
                        {segment.speaker && <Badge size="sm">{segment.speaker}</Badge>}
                      </Flex>
                    </Flex>
                    <Typography variant="caption" color="secondary">
                      {segment.text}
                    </Typography>
                  </Stack>
                </Card>
              </li>
            ))}
          </Stack>
        )}
      </Card>

      <Card padding="sm">
        <Stack gap="xs">
          <Typography variant="caption" color="secondary">
            Raw Transcript
          </Typography>
          <Typography
            as="pre"
            variant="mono"
            color="secondary"
            className="max-h-40 overflow-y-auto whitespace-pre-wrap"
          >
            {transcript.fullText}
          </Typography>
        </Stack>
      </Card>
    </Stack>
  );
}

function LinkedIssueDetails({ issueId }: { issueId: Id<"issues"> }) {
  const issue = useAuthenticatedQuery(api.issues.getIssue, { id: issueId });
  const organization = useOrganizationOptional();

  if (issue === undefined) {
    return (
      <Typography variant="caption" color="secondary">
        Loading linked issue...
      </Typography>
    );
  }

  if (issue === null) {
    return (
      <Typography variant="caption" color="secondary">
        Linked issue is unavailable.
      </Typography>
    );
  }

  return (
    <div className="rounded-lg border border-brand-border bg-brand-subtle/60 p-3">
      <Stack gap="xs">
        <Flex justify="between" align="start" gap="sm" className="flex-wrap">
          <Badge size="sm">Issue linked</Badge>
          <Badge size="sm">{issue.status}</Badge>
        </Flex>
        <Typography variant="caption" color="secondary">
          <span className="font-medium text-ui-text">{issue.key}</span> {issue.title}
        </Typography>
        {organization && (
          <Button asChild variant="ghost" size="sm" className="w-fit px-0">
            <Link
              to={ROUTES.issues.detail.path}
              params={{ orgSlug: organization.orgSlug, key: issue.key }}
            >
              Open issue
            </Link>
          </Button>
        )}
      </Stack>
    </div>
  );
}

function ActionItemCard({
  actionItem,
  index,
  summaryId,
  availableProjects,
  selectedProjectId,
  canCreateIssue,
  isCreating,
  onProjectChange,
  onCreateIssue,
}: {
  actionItem: MeetingSummary["actionItems"][number];
  index: number;
  summaryId: Id<"meetingSummaries">;
  availableProjects: ProjectOption[] | undefined;
  selectedProjectId: Id<"projects"> | null | undefined;
  canCreateIssue: boolean;
  isCreating: boolean;
  onProjectChange: (projectId: Id<"projects">) => void;
  onCreateIssue: (actionItemIndex: number) => void;
}) {
  return (
    <Card variant="soft" padding="sm">
      <Stack gap="xs">
        <Flex justify="between" align="start" gap="sm">
          <Typography variant="small">{actionItem.description}</Typography>
          {actionItem.assignee && (
            <Badge size="sm" className="shrink-0">
              {actionItem.assignee}
            </Badge>
          )}
        </Flex>
        <Flex gap="xs" className="flex-wrap">
          {actionItem.dueDate && <Badge size="sm">Due: {actionItem.dueDate}</Badge>}
          {actionItem.priority && <Badge size="sm">Priority: {actionItem.priority}</Badge>}
        </Flex>

        {actionItem.issueCreated ? (
          <LinkedIssueDetails issueId={actionItem.issueCreated} />
        ) : (
          <div className="rounded-lg border border-ui-border bg-ui-bg-elevated p-3">
            <Stack gap="xs">
              <Typography variant="caption" color="secondary">
                Turn this follow-up into a tracked issue.
              </Typography>

              {availableProjects === undefined ? (
                <Typography variant="caption" color="secondary">
                  Loading available projects...
                </Typography>
              ) : availableProjects.length === 0 ? (
                <Typography variant="caption" color="secondary">
                  Join a project to create issues from meeting action items.
                </Typography>
              ) : (
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <Select
                    key={`${summaryId}-${index}-${selectedProjectId ?? "none"}`}
                    defaultValue={selectedProjectId ?? undefined}
                    onValueChange={(value) => onProjectChange(value as Id<"projects">)}
                  >
                    <SelectTrigger
                      aria-label={`Project for action item ${index + 1}`}
                      className="w-full"
                    >
                      <SelectValue placeholder="Choose project" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProjects.map((project) => (
                        <SelectItem key={project._id} value={project._id}>
                          {project.key} - {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="secondary"
                    size="sm"
                    isLoading={isCreating}
                    disabled={!canCreateIssue || !selectedProjectId}
                    onClick={() => onCreateIssue(index)}
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
            <ActionItemCard
              actionItem={item}
              index={index}
              summaryId={summary._id}
              availableProjects={projects}
              selectedProjectId={selectedProjectIds[index]}
              canCreateIssue={canAct}
              isCreating={creatingIndex === index}
              onProjectChange={(projectId) =>
                setSelectedProjectIds((current) => ({
                  ...current,
                  [index]: projectId,
                }))
              }
              onCreateIssue={(actionItemIndex) => void handleCreateIssue(actionItemIndex)}
            />
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

function SummarySections({
  recording,
  projects,
}: {
  recording: NonNullable<MeetingDetail>;
  projects: ProjectOption[] | undefined;
}) {
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
          <TranscriptSegmentList transcript={transcript} />
        </Section>
      )}
    </Stack>
  );
}

function RecordingDetailPanel({
  recording,
  projects,
}: {
  recording: MeetingDetail | undefined;
  projects: ProjectOption[] | undefined;
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

      <SummarySections recording={recording} projects={projects} />
      <ParticipantsSection participants={recording.participants} />
    </Stack>
  );
}

function ScheduleRecordingDialog({
  open,
  onOpenChange,
  projects,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: ProjectOption[] | undefined;
}) {
  const { mutate: scheduleRecording, canAct } = useAuthenticatedMutation(
    api.meetingBot.scheduleRecording,
  );
  const [title, setTitle] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [scheduledTimeValue, setScheduledTimeValue] = useState(getDefaultScheduledTimeValue());
  const [projectId, setProjectId] = useState<ProjectFilter>("all");
  const [shareInProject, setShareInProject] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle("");
    setMeetingUrl("");
    setScheduledTimeValue(getDefaultScheduledTimeValue());
    setProjectId("all");
    setShareInProject(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) resetForm();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      showError("Meeting title is required");
      return;
    }

    if (!meetingUrl.trim()) {
      showError("Meeting URL is required");
      return;
    }

    const scheduledStartTime = new Date(scheduledTimeValue).getTime();
    if (Number.isNaN(scheduledStartTime)) {
      showError("Choose a valid meeting time");
      return;
    }

    setIsSubmitting(true);
    try {
      await scheduleRecording({
        title: title.trim(),
        meetingUrl: meetingUrl.trim(),
        meetingPlatform: detectMeetingPlatform(meetingUrl.trim()),
        scheduledStartTime,
        projectId: projectId === "all" ? undefined : projectId,
        isPublic: projectId === "all" ? false : shareInProject,
      });
      showSuccess("Recording scheduled");
      handleOpenChange(false);
    } catch (error) {
      showError(error, "Failed to schedule recording");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Schedule Recording"
      description="Create an ad-hoc meeting recording from a direct meeting URL."
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="schedule-recording-form"
            isLoading={isSubmitting}
            disabled={!canAct}
          >
            Schedule Recording
          </Button>
        </>
      }
    >
      <form id="schedule-recording-form" onSubmit={handleSubmit}>
        <Stack gap="md">
          <Stack gap="xs">
            <Label htmlFor="meeting-recording-title">Meeting Title</Label>
            <Input
              id="meeting-recording-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Customer rollout review"
              autoFocus
              required
            />
          </Stack>

          <Stack gap="xs">
            <Label htmlFor="meeting-recording-url">Meeting URL</Label>
            <Input
              id="meeting-recording-url"
              value={meetingUrl}
              onChange={(event) => setMeetingUrl(event.target.value)}
              placeholder="https://meet.google.com/..."
              type="url"
              required
            />
          </Stack>

          <Stack gap="xs">
            <Label htmlFor="meeting-recording-time">Scheduled Time</Label>
            <Input
              id="meeting-recording-time"
              value={scheduledTimeValue}
              onChange={(event) => setScheduledTimeValue(event.target.value)}
              type="datetime-local"
              required
            />
          </Stack>

          <Stack gap="xs">
            <Label htmlFor="meeting-recording-project" color="secondary">
              Project (Optional)
            </Label>
            <Select
              value={projectId}
              onValueChange={(value) => setProjectId(value as ProjectFilter)}
            >
              <SelectTrigger id="meeting-recording-project" aria-label="Recording project">
                <SelectValue placeholder="No project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">No project</SelectItem>
                {projects?.map((project) => (
                  <SelectItem key={project._id} value={project._id}>
                    {project.key} - {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Stack>

          <Checkbox
            checked={projectId === "all" ? false : shareInProject}
            onCheckedChange={(checked) => setShareInProject(checked === true)}
            disabled={projectId === "all"}
            label="Share in selected project"
            description={
              projectId === "all"
                ? "Choose a project first to make the meeting visible to that project."
                : "Project members can review the transcript, summary, and follow-up items."
            }
          />
        </Stack>
      </form>
    </Dialog>
  );
}

export function MeetingsWorkspace() {
  const recordings = useAuthenticatedQuery(api.meetingBot.listRecordings, { limit: 50 });
  const memory = useAuthenticatedQuery(api.meetingBot.listMemoryItems, { sectionLimit: 5 });
  const projects = useAuthenticatedQuery(api.dashboard.getMyProjects, {});
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>("all");
  const [timeWindowFilter, setTimeWindowFilter] = useState<TimeWindowFilter>("all");
  const deferredSearchQuery = useDeferredValue(searchQuery.trim());
  const searchedRecordings = useAuthenticatedQuery(
    api.meetingBot.searchRecordings,
    deferredSearchQuery.length >= 2 ? { query: deferredSearchQuery, limit: 50 } : "skip",
  );
  const [selectedRecordingId, setSelectedRecordingId] = useState<Id<"meetingRecordings"> | null>(
    null,
  );
  const displayedRecordings = deferredSearchQuery.length >= 2 ? searchedRecordings : recordings;
  const filteredRecordings = filterMeetingRecordings(displayedRecordings, {
    status: statusFilter,
    platform: platformFilter,
    projectId: projectFilter,
    timeWindow: timeWindowFilter,
  });

  useEffect(() => {
    if (!filteredRecordings) return;

    if (filteredRecordings.length === 0) {
      setSelectedRecordingId(null);
      return;
    }

    setSelectedRecordingId((current) => {
      if (current && filteredRecordings.some((recording) => recording._id === current)) {
        return current;
      }
      return filteredRecordings[0]._id;
    });
  }, [filteredRecordings]);

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
          "Schedule from calendar or add a direct meeting URL to start capturing transcripts, summaries, and follow-up work.",
      }}
    >
      <Stack gap="lg">
        <MeetingMemorySection memory={memory} />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <Section
            title="Recent Meetings"
            description="Recordings created from calendar-linked meetings and direct bot runs."
            gap="sm"
          >
            <Stack gap="sm">
              <Flex justify="between" align="center" gap="sm" className="flex-wrap">
                <Typography variant="caption" color="secondary">
                  Schedule from calendar or add an ad-hoc meeting URL here.
                </Typography>
                <Button variant="secondary" size="sm" onClick={() => setIsScheduleDialogOpen(true)}>
                  Schedule Recording
                </Button>
              </Flex>

              <Input
                variant="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search transcript text"
                aria-label="Search meetings"
              />

              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as StatusFilter)}
                >
                  <SelectTrigger aria-label="Filter by status">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_FILTER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={platformFilter}
                  onValueChange={(value) => setPlatformFilter(value as PlatformFilter)}
                >
                  <SelectTrigger aria-label="Filter by platform">
                    <SelectValue placeholder="All platforms" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORM_FILTER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={projectFilter}
                  onValueChange={(value) => setProjectFilter(value as ProjectFilter)}
                >
                  <SelectTrigger aria-label="Filter by project">
                    <SelectValue placeholder="All projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All projects</SelectItem>
                    {projects?.map((project) => (
                      <SelectItem key={project._id} value={project._id}>
                        {project.key} - {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={timeWindowFilter}
                  onValueChange={(value) => setTimeWindowFilter(value as TimeWindowFilter)}
                >
                  <SelectTrigger aria-label="Filter by date">
                    <SelectValue placeholder="All dates" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_WINDOW_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filteredRecordings !== undefined && (
                <Typography variant="caption" color="secondary">
                  {filteredRecordings.length} meeting{filteredRecordings.length === 1 ? "" : "s"}{" "}
                  shown
                </Typography>
              )}

              {deferredSearchQuery.length >= 2 && (
                <Typography variant="caption" color="secondary">
                  Searching transcript content for "{deferredSearchQuery}".
                </Typography>
              )}

              {filteredRecordings !== undefined && filteredRecordings.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  size="compact"
                  title="No meetings match these filters"
                  description="Adjust the search or filters, or open calendar to schedule a new meeting recording."
                />
              ) : (
                <Stack as="ul" gap="sm" className="list-none">
                  {filteredRecordings?.map((recording) => (
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
              <RecordingDetailPanel recording={selectedRecording} projects={projects} />
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
      </Stack>

      <ScheduleRecordingDialog
        open={isScheduleDialogOpen}
        onOpenChange={setIsScheduleDialogOpen}
        projects={projects}
      />
    </PageContent>
  );
}
