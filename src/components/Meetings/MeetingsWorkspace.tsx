import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { DAY, MINUTE } from "@convex/lib/timeUtils";
import { Link } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";
import {
  type FormEvent,
  type ReactNode,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from "react";
import { PageContent } from "@/components/layout";
import { Avatar, type AvatarProps } from "@/components/ui/Avatar";
import { Badge, type BadgeProps } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CardSection } from "@/components/ui/CardSection";
import { Checkbox } from "@/components/ui/Checkbox";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { List } from "@/components/ui/List";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Metadata, MetadataItem } from "@/components/ui/Metadata";
import { ScrollArea } from "@/components/ui/ScrollArea";
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
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useOrganizationOptional } from "@/hooks/useOrgContext";
import { useSeededDocumentCreation } from "@/hooks/useSeededDocumentCreation";
import { BREAKPOINTS } from "@/lib/constants";
import {
  formatDateTime,
  formatDurationHuman,
  formatNumber,
  formatRelativeTime,
} from "@/lib/formatting";
import { Calendar, CheckCircle, ChevronRight, FileText, Mic, XCircle } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import {
  buildTranscriptTurns,
  listTranscriptSpeakers,
  type ResolvedMeetingPerson,
  resolveActionItemAssignee,
} from "./meetingAttribution";
import { buildMeetingDocumentTitle, createMeetingDocumentValue } from "./meetingDocument";

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
type MemoryProjectLens = {
  projectId: Id<"projects">;
  projectKey: string;
  projectName: string;
  totalItems: number;
  recentDecisions: number;
  openQuestions: number;
  unresolvedActionItems: number;
};

type MeetingDetailTab = "actions" | "notes" | "transcript" | "people";
type MeetingDetailTabConfig = {
  value: MeetingDetailTab;
  label: string;
  content: ReactNode;
};

const WIDE_MEETING_DETAIL_MEDIA_QUERY = `(min-width: ${BREAKPOINTS.lg})`;

function hasMeetingNotes(summary: MeetingSummary) {
  return (
    summary.keyPoints.length > 0 ||
    summary.decisions.length > 0 ||
    summary.openQuestions.length > 0 ||
    summary.topics.length > 0
  );
}

function getDefaultMeetingDetailTab(tabs: MeetingDetailTab[]) {
  return tabs[0] ?? null;
}

function useMeetingDetailTabState(tabs: MeetingDetailTab[]) {
  const [activeTab, setActiveTab] = useState<MeetingDetailTab | null>(() =>
    getDefaultMeetingDetailTab(tabs),
  );

  useEffect(() => {
    setActiveTab((currentTab) => {
      if (currentTab && tabs.includes(currentTab)) {
        return currentTab;
      }

      return getDefaultMeetingDetailTab(tabs);
    });
  }, [tabs]);

  return { activeTab, setActiveTab };
}

function getMeetingsPageEmptyState({
  recordings,
  projectFilter,
  statusFilter,
  platformFilter,
  timeWindowFilter,
  deferredSearchQuery,
  onScheduleRecording,
}: {
  recordings: MeetingOverview[] | undefined;
  projectFilter: ProjectFilter;
  statusFilter: StatusFilter;
  platformFilter: PlatformFilter;
  timeWindowFilter: TimeWindowFilter;
  deferredSearchQuery: string;
  onScheduleRecording: () => void;
}) {
  if (
    recordings === undefined ||
    recordings.length > 0 ||
    projectFilter !== "all" ||
    statusFilter !== "all" ||
    platformFilter !== "all" ||
    timeWindowFilter !== "all" ||
    deferredSearchQuery.length >= 2
  ) {
    return null;
  }

  return {
    icon: Mic,
    title: "No meeting recordings yet",
    description:
      "Schedule from calendar or add a direct meeting URL to start capturing transcripts, summaries, and follow-up work.",
    actions: <Button onClick={() => onScheduleRecording()}>Schedule Recording</Button>,
  };
}

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

const STATUS_BADGE_VARIANTS: Record<string, BadgeProps["variant"]> = {
  scheduled: "brand",
  joining: "warning",
  recording: "error",
  processing: "accent",
  transcribing: "accent",
  summarizing: "accent",
  completed: "success",
  cancelled: "secondary",
  failed: "error",
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
  return ageMs >= 0 && ageMs <= dayCount * DAY;
}

/**
 * Filters meeting recordings using the active status, platform, project, and date filters.
 */
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
  const fiveMinutesFromNow = Date.now() + 5 * MINUTE;
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

function getMeetingPersonAvatarVariant(person: ResolvedMeetingPerson): AvatarProps["variant"] {
  if (person.isHost) return "brand";
  if (person.isExternal) return "accent";
  if (person.source === "unknown") return "neutral";
  return "soft";
}

function MeetingPersonBadges({
  person,
  includeInternal = false,
}: {
  person: ResolvedMeetingPerson;
  includeInternal?: boolean;
}) {
  const showInternal = includeInternal && person.source === "participant" && !person.isExternal;

  if (!(person.isHost || person.isExternal || showInternal || person.source === "label")) {
    return null;
  }

  return (
    <Flex gap="xs" wrap>
      {person.isHost && (
        <Badge size="sm" variant="brand">
          Host
        </Badge>
      )}
      {person.isExternal && (
        <Badge size="sm" variant="accent">
          External
        </Badge>
      )}
      {showInternal && (
        <Badge size="sm" variant="secondary">
          Internal
        </Badge>
      )}
      {person.source === "label" && (
        <Badge size="sm" variant="neutral">
          Speaker label
        </Badge>
      )}
    </Flex>
  );
}

function MeetingPersonSummary({
  person,
  caption,
  includeInternal = false,
}: {
  person: ResolvedMeetingPerson;
  caption?: string;
  includeInternal?: boolean;
}) {
  return (
    <Flex align="center" gap="sm" wrap>
      <Avatar
        name={person.displayName}
        email={person.email}
        size="sm"
        variant={getMeetingPersonAvatarVariant(person)}
      />
      <Stack gap="xs">
        <Flex align="center" gap="xs" wrap>
          <Typography variant="small">{person.displayName}</Typography>
          <MeetingPersonBadges person={person} includeInternal={includeInternal} />
        </Flex>
        {(person.email || caption) && (
          <Typography variant="caption" color="secondary">
            {person.email ?? caption}
          </Typography>
        )}
      </Stack>
    </Flex>
  );
}

function filterMemoryItemsByProject<T extends { projectId?: Id<"projects"> }>(
  items: T[],
  projectId: ProjectFilter,
) {
  if (projectId === "all") {
    return items;
  }

  return items.filter((item) => item.projectId === projectId);
}

/**
 * Restricts the meeting memory sections to the selected project lens.
 */
export function filterMeetingMemory(memory: MeetingMemory | undefined, projectId: ProjectFilter) {
  if (!memory) {
    return memory;
  }

  return {
    recentDecisions: filterMemoryItemsByProject(memory.recentDecisions, projectId),
    openQuestions: filterMemoryItemsByProject(memory.openQuestions, projectId),
    unresolvedActionItems: filterMemoryItemsByProject(memory.unresolvedActionItems, projectId),
  };
}

/**
 * Aggregates memory items into project-level rollups for the lens buttons.
 */
export function getMeetingMemoryProjectLenses(
  memory: MeetingMemory | undefined,
  projects: ProjectOption[] | undefined,
) {
  if (!memory || !projects) {
    return [] as MemoryProjectLens[];
  }

  const lensMap = new Map<Id<"projects">, MemoryProjectLens>();

  const upsertLens = (
    projectId: Id<"projects">,
    section: keyof Omit<
      MemoryProjectLens,
      "projectId" | "projectKey" | "projectName" | "totalItems"
    >,
  ) => {
    const project = projects.find((candidate) => candidate._id === projectId);
    if (!project) {
      return;
    }

    const existingLens = lensMap.get(projectId);
    if (existingLens) {
      existingLens[section] += 1;
      existingLens.totalItems += 1;
      return;
    }

    lensMap.set(projectId, {
      projectId,
      projectKey: project.key,
      projectName: project.name,
      totalItems: 1,
      recentDecisions: section === "recentDecisions" ? 1 : 0,
      openQuestions: section === "openQuestions" ? 1 : 0,
      unresolvedActionItems: section === "unresolvedActionItems" ? 1 : 0,
    });
  };

  for (const item of memory.recentDecisions) {
    if (item.projectId) {
      upsertLens(item.projectId, "recentDecisions");
    }
  }

  for (const item of memory.openQuestions) {
    if (item.projectId) {
      upsertLens(item.projectId, "openQuestions");
    }
  }

  for (const item of memory.unresolvedActionItems) {
    if (item.projectId) {
      upsertLens(item.projectId, "unresolvedActionItems");
    }
  }

  return [...lensMap.values()].sort((left, right) => right.totalItems - left.totalItems);
}

function hasTranscriptSegments(
  segments: MeetingTranscript["segments"],
): segments is [MeetingTranscriptSegment, ...MeetingTranscriptSegment[]] {
  return segments.some((segment) => segment.text.trim().length > 0);
}

function getTranscriptSegmentKey(segment: MeetingTranscriptSegment, index: number) {
  return `${segment.startTime}-${segment.endTime}-${segment.speaker ?? "speaker"}-${index}`;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge size="sm" variant={STATUS_BADGE_VARIANTS[status] ?? "accent"}>
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
    <Card
      variant={isSelected ? "outline" : "soft"}
      padding="md"
      hoverable
      onClick={onSelect}
      data-testid={TEST_IDS.MEETINGS.RECORDING_CARD}
    >
      <Stack gap="sm">
        <Flex justify="between" align="start" gap="sm" wrap>
          <FlexItem flex="1">
            <Stack gap="xs">
              <Typography variant="label">{recording.title}</Typography>
              <Typography variant="caption" color="secondary">
                {formatMeetingPlatform(recording.meetingPlatform)} <span aria-hidden="true">•</span>{" "}
                {formatRelativeTime(recording.createdAt)}
              </Typography>
              {"matchExcerpt" in recording && recording.matchExcerpt && (
                <Typography variant="caption" color="secondary">
                  {recording.matchExcerpt}
                </Typography>
              )}
            </Stack>
          </FlexItem>
          <StatusBadge status={recording.status} />
        </Flex>

        <Metadata>
          {recording.scheduledStartTime && (
            <MetadataItem icon={<Calendar size={16} />}>
              {formatDateTime(recording.scheduledStartTime)}
            </MetadataItem>
          )}
          <MetadataItem>{recording.isPublic ? "Shared in project" : "Private"}</MetadataItem>
        </Metadata>

        <Flex gap="xs" wrap>
          {recording.hasSummary && <Badge size="sm">Summary</Badge>}
          {recording.hasTranscript && <Badge size="sm">Transcript</Badge>}
          {recording.calendarEventId && <Badge size="sm">Calendar-linked</Badge>}
        </Flex>
      </Stack>
    </Card>
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

function MeetingMemorySection({
  memory,
  projectFilter,
  projects,
  onProjectSelect,
}: {
  memory: MeetingMemory | undefined;
  projectFilter: ProjectFilter;
  projects: ProjectOption[] | undefined;
  onProjectSelect: (projectId: ProjectFilter) => void;
}) {
  const filteredMemory = filterMeetingMemory(memory, projectFilter) ?? {
    recentDecisions: [],
    openQuestions: [],
    unresolvedActionItems: [],
  };
  const projectLenses = getMeetingMemoryProjectLenses(memory, projects);
  const selectedProject =
    projectFilter === "all"
      ? undefined
      : projects?.find((project) => project._id === projectFilter);
  const description = selectedProject
    ? `Cross-meeting decisions, open questions, and follow-ups for ${selectedProject.key} - ${selectedProject.name}.`
    : "Recent decisions, open questions, and follow-ups across completed meetings.";

  if (memory === undefined) {
    return (
      <Section
        title="Meeting Memory"
        description={description}
        gap="sm"
        data-testid={TEST_IDS.MEETINGS.MEMORY_SECTION}
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
      description={description}
      gap="sm"
      data-testid={TEST_IDS.MEETINGS.MEMORY_SECTION}
    >
      <span className="sr-only" data-testid={TEST_IDS.MEETINGS.MEMORY_DESCRIPTION}>
        {description}
      </span>
      {projectLenses.length > 0 && (
        <Flex gap="xs" wrap>
          <Button
            variant={projectFilter === "all" ? "secondary" : "outline"}
            size="sm"
            onClick={() => onProjectSelect("all")}
            data-testid={TEST_IDS.MEETINGS.MEMORY_FILTER_BUTTON("all")}
          >
            All meetings
          </Button>
          {projectLenses.map((lens) => (
            <Button
              key={lens.projectId}
              variant={projectFilter === lens.projectId ? "secondary" : "outline"}
              size="sm"
              onClick={() => onProjectSelect(lens.projectId)}
              data-testid={TEST_IDS.MEETINGS.MEMORY_FILTER_BUTTON(lens.projectKey)}
            >
              <Flex gap="xs" align="center">
                <Typography as="span" variant="strong">
                  {lens.projectKey}
                </Typography>
                <Badge size="sm">{lens.totalItems}</Badge>
              </Flex>
            </Button>
          ))}
        </Flex>
      )}

      <Grid cols={1} colsXl={3} gap="lg">
        <MemoryCard
          title="Recent Decisions"
          description="Latest calls and commitments from completed meetings."
          itemCount={filteredMemory.recentDecisions.length}
        >
          {filteredMemory.recentDecisions.length === 0 ? (
            <Typography variant="caption" color="secondary">
              Completed meetings will surface key decisions here.
            </Typography>
          ) : (
            <List gap="sm">
              {filteredMemory.recentDecisions.map((item) => (
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
            </List>
          )}
        </MemoryCard>

        <MemoryCard
          title="Open Questions"
          description="Unresolved questions still worth tracking after the meeting ends."
          itemCount={filteredMemory.openQuestions.length}
        >
          {filteredMemory.openQuestions.length === 0 ? (
            <Typography variant="caption" color="secondary">
              Outstanding questions from summaries will appear here.
            </Typography>
          ) : (
            <List gap="sm">
              {filteredMemory.openQuestions.map((item) => (
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
            </List>
          )}
        </MemoryCard>

        <MemoryCard
          title="Unresolved Action Items"
          description="Follow-ups that have not been converted into linked issues yet."
          itemCount={filteredMemory.unresolvedActionItems.length}
        >
          {filteredMemory.unresolvedActionItems.length === 0 ? (
            <Typography variant="caption" color="secondary">
              Pending follow-ups will appear here until they are linked into project work.
            </Typography>
          ) : (
            <List gap="sm">
              {filteredMemory.unresolvedActionItems.map((item) => (
                <li key={`${item.recordingId}-${item.description}`}>
                  <Card variant="soft" padding="sm">
                    <Stack gap="xs">
                      <Typography variant="small">{item.description}</Typography>
                      <Flex gap="xs" wrap>
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
            </List>
          )}
        </MemoryCard>
      </Grid>
    </Section>
  );
}

function MeetingProjectContext({
  recording,
  projects,
}: {
  recording: NonNullable<MeetingDetail>;
  projects: ProjectOption[] | undefined;
}) {
  const organization = useOrganizationOptional();
  const project = recording.projectId
    ? projects?.find((candidate) => candidate._id === recording.projectId)
    : undefined;
  const linkedIssueCount = recording.summary
    ? recording.summary.actionItems.filter((item) => item.issueCreated).length
    : 0;
  const pendingFollowUpCount = recording.summary
    ? recording.summary.actionItems.filter((item) => !item.issueCreated).length
    : 0;

  if (!recording.projectId) return null;

  return (
    <Section
      title="Project Context"
      description="Keep meeting output attached to the project where the work is actually happening."
      gap="sm"
    >
      <Card padding="md">
        <Stack gap="sm">
          {project ? (
            <>
              <Flex justify="between" align="start" gap="sm" wrap>
                <Stack gap="xs">
                  <Typography variant="label">
                    {project.key} - {project.name}
                  </Typography>
                  {project.description && (
                    <Typography variant="caption" color="secondary">
                      {project.description}
                    </Typography>
                  )}
                </Stack>
                <Badge size="sm">{project.role}</Badge>
              </Flex>

              <Flex gap="xs" wrap>
                <Badge size="sm">{linkedIssueCount} linked issues</Badge>
                <Badge size="sm">{pendingFollowUpCount} pending follow-ups</Badge>
                <Badge size="sm">
                  {recording.isPublic ? "Shared in project" : "Private to you"}
                </Badge>
              </Flex>

              <Typography variant="caption" color="secondary">
                Issues created from this meeting stay connected to {project.name}, and follow-up
                work can continue from the project board or calendar.
              </Typography>

              {organization && (
                <Flex gap="xs" wrap>
                  <Button asChild variant="outline" size="sm">
                    <Link
                      to={ROUTES.projects.board.path}
                      params={{ orgSlug: organization.orgSlug, key: project.key }}
                    >
                      Open Project Board
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link
                      to={ROUTES.projects.calendar.path}
                      params={{ orgSlug: organization.orgSlug, key: project.key }}
                    >
                      Project Calendar
                    </Link>
                  </Button>
                </Flex>
              )}
            </>
          ) : (
            <Typography variant="caption" color="secondary">
              This meeting is linked to a project, but project navigation is not available in the
              current workspace context.
            </Typography>
          )}
        </Stack>
      </Card>
    </Section>
  );
}

function TranscriptSegmentList({
  transcript,
  participants,
}: {
  transcript: MeetingTranscript;
  participants: MeetingParticipants;
}) {
  const [query, setQuery] = useState("");
  const segmentRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const normalizedQuery = query.trim();
  const transcriptTurns = buildTranscriptTurns(transcript.segments, participants, normalizedQuery);
  const filteredSegments = transcriptTurns.flatMap((turn) => turn.segments);
  const transcriptSpeakers = listTranscriptSpeakers(transcript.segments, participants);
  const segmentKeyBySegment = new Map(
    filteredSegments.map((segment, index) => [segment, getTranscriptSegmentKey(segment, index)]),
  );
  const speakerBySegment = new Map(
    transcriptTurns.flatMap((turn) => turn.segments.map((segment) => [segment, turn.speaker])),
  );

  if (!hasTranscriptSegments(transcript.segments)) {
    return (
      <Card variant="soft" padding="md">
        <Typography as="pre" variant="monoBlock">
          {transcript.fullText}
        </Typography>
      </Card>
    );
  }

  return (
    <Stack gap="sm">
      <Card padding="sm">
        <Stack gap="sm">
          <Flex justify="between" align="center" gap="sm" wrap>
            <Typography variant="caption" color="secondary">
              Speaker-attributed transcript with timestamps.
            </Typography>
            <Flex gap="xs" wrap>
              <Badge size="sm">{transcript.segments.length} segments</Badge>
              {transcript.speakerCount && (
                <Badge size="sm">{transcript.speakerCount} speakers</Badge>
              )}
              {normalizedQuery && <Badge size="sm">{filteredSegments.length} matches</Badge>}
            </Flex>
          </Flex>

          {transcriptSpeakers.length > 0 && (
            <Stack gap="xs">
              <Typography variant="caption" color="secondary">
                Speakers in this meeting
              </Typography>
              <Flex gap="xs" wrap>
                {transcriptSpeakers.map((speaker) => (
                  <CardSection key={speaker.key} size="compact">
                    <Flex align="center" gap="sm" wrap>
                      <Avatar
                        name={speaker.displayName}
                        email={speaker.email}
                        size="xs"
                        variant={getMeetingPersonAvatarVariant(speaker)}
                      />
                      <Stack gap="xs">
                        <Typography variant="caption">{speaker.displayName}</Typography>
                        <Typography variant="caption" color="secondary">
                          {speaker.segmentCount} segment{speaker.segmentCount === 1 ? "" : "s"}
                        </Typography>
                      </Stack>
                      <MeetingPersonBadges person={speaker} />
                    </Flex>
                  </CardSection>
                ))}
              </Flex>
            </Stack>
          )}

          <Input
            variant="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter transcript by phrase, speaker, or email"
            aria-label="Search transcript"
            data-testid={TEST_IDS.MEETINGS.TRANSCRIPT_SEARCH}
          />

          <Stack gap="xs">
            <Typography variant="caption" color="secondary">
              Jump to segment
            </Typography>
            <Flex gap="xs" wrap>
              {filteredSegments.map((segment, index) => {
                const segmentKey =
                  segmentKeyBySegment.get(segment) ?? getTranscriptSegmentKey(segment, index);
                const resolvedSpeaker = speakerBySegment.get(segment);
                const segmentLabel = `${formatTranscriptTimestamp(segment.startTime)}${
                  resolvedSpeaker ? ` ${resolvedSpeaker.displayName}` : ""
                }`;

                return (
                  <Button
                    key={segmentKey}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      segmentRefs.current[segmentKey]?.scrollIntoView({
                        block: "center",
                        behavior: "smooth",
                      })
                    }
                    aria-label={`Jump to ${segmentLabel}`}
                  >
                    {segmentLabel}
                  </Button>
                );
              })}
            </Flex>
          </Stack>
        </Stack>
      </Card>

      <Card variant="soft" padding="md">
        <ScrollArea size="contentLg">
          {filteredSegments.length === 0 ? (
            <EmptyState
              icon={FileText}
              size="compact"
              title="No transcript matches"
              description="Try a different phrase, speaker name, or attendee email."
            />
          ) : (
            <List as="ol" gap="sm">
              {transcriptTurns.map((turn) => (
                <li key={turn.key}>
                  <CardSection size="compact">
                    <Stack gap="sm">
                      <Flex justify="between" align="start" gap="sm" wrap>
                        <MeetingPersonSummary person={turn.speaker} />
                        <Flex gap="xs" wrap>
                          <Badge size="sm">
                            {formatTranscriptTimestamp(turn.startTime)} -{" "}
                            {formatTranscriptTimestamp(turn.endTime)}
                          </Badge>
                          {turn.segments.length > 1 && (
                            <Badge size="sm">{turn.segments.length} segments</Badge>
                          )}
                        </Flex>
                      </Flex>

                      <List gap="xs">
                        {turn.segments.map((segment, index) => {
                          const segmentKey =
                            segmentKeyBySegment.get(segment) ??
                            getTranscriptSegmentKey(segment, index);

                          return (
                            <li
                              key={segmentKey}
                              ref={(element) => {
                                segmentRefs.current[segmentKey] = element;
                              }}
                            >
                              <Stack gap="xs">
                                <Typography variant="caption" color="secondary">
                                  {formatTranscriptTimestamp(segment.startTime)}
                                </Typography>
                                <Typography variant="caption" color="secondary">
                                  {segment.text}
                                </Typography>
                              </Stack>
                            </li>
                          );
                        })}
                      </List>
                    </Stack>
                  </CardSection>
                </li>
              ))}
            </List>
          )}
        </ScrollArea>
      </Card>

      <Card padding="sm">
        <Stack gap="xs">
          <Typography variant="caption" color="secondary">
            Raw Transcript
          </Typography>
          <ScrollArea size="contentSm">
            <Typography as="pre" variant="monoBlock">
              {transcript.fullText}
            </Typography>
          </ScrollArea>
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
    <Card variant="section" padding="sm">
      <Stack gap="xs">
        <Flex justify="between" align="start" gap="sm" wrap>
          <Badge size="sm">Issue linked</Badge>
          <Badge size="sm">{issue.status}</Badge>
        </Flex>
        <Typography variant="caption" color="secondary">
          <Typography as="span" variant="strong">
            {issue.key}
          </Typography>{" "}
          {issue.title}
        </Typography>
        {organization && (
          <Button asChild variant="link" size="none">
            <Link
              to={ROUTES.issues.detail.path}
              params={{ orgSlug: organization.orgSlug, key: issue.key }}
            >
              Open issue
            </Link>
          </Button>
        )}
      </Stack>
    </Card>
  );
}

function ActionItemCard({
  actionItem,
  index,
  summaryId,
  participants,
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
  participants: MeetingParticipants;
  availableProjects: ProjectOption[] | undefined;
  selectedProjectId: Id<"projects"> | null | undefined;
  canCreateIssue: boolean;
  isCreating: boolean;
  onProjectChange: (projectId: Id<"projects">) => void;
  onCreateIssue: (actionItemIndex: number) => void;
}) {
  const resolvedAssignee = resolveActionItemAssignee(actionItem, participants);

  return (
    <Card variant="soft" padding="sm">
      <Stack gap="xs">
        <Flex justify="between" align="start" gap="sm">
          <Typography variant="small">{actionItem.description}</Typography>
        </Flex>
        {resolvedAssignee && (
          <MeetingPersonSummary
            person={resolvedAssignee}
            includeInternal
            caption="Assigned follow-up owner"
          />
        )}
        <Flex gap="xs" wrap>
          {actionItem.dueDate && <Badge size="sm">Due: {actionItem.dueDate}</Badge>}
          {actionItem.priority && <Badge size="sm">Priority: {actionItem.priority}</Badge>}
        </Flex>

        {actionItem.issueCreated ? (
          <LinkedIssueDetails issueId={actionItem.issueCreated} />
        ) : (
          <CardSection size="compact">
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
                <Flex direction="column" directionSm="row" gap="sm" alignSm="center">
                  <FlexItem flex="1">
                    <Select
                      key={`${summaryId}-${index}-${selectedProjectId ?? "none"}`}
                      defaultValue={selectedProjectId ?? undefined}
                      onValueChange={(value) => onProjectChange(value as Id<"projects">)}
                    >
                      <SelectTrigger aria-label={`Project for action item ${index + 1}`}>
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
                  </FlexItem>
                  <Button
                    variant="secondary"
                    size="sm"
                    isLoading={isCreating}
                    disabled={!canCreateIssue || !selectedProjectId}
                    onClick={() => onCreateIssue(index)}
                  >
                    Create issue
                  </Button>
                </Flex>
              )}
            </Stack>
          </CardSection>
        )}
      </Stack>
    </Card>
  );
}

function ActionItemsSection({
  summary,
  defaultProjectId,
  projects,
  participants,
}: {
  summary: MeetingSummary;
  defaultProjectId: Id<"projects"> | undefined;
  projects: ProjectOption[] | undefined;
  participants: MeetingParticipants;
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
    <Section title="Action Items" gap="sm" data-testid={TEST_IDS.MEETINGS.ACTION_ITEMS_SECTION}>
      <List gap="sm">
        {summary.actionItems.map((item, index) => (
          <li key={`${item.description}-${item.assignee ?? ""}-${item.dueDate ?? ""}`}>
            <ActionItemCard
              actionItem={item}
              index={index}
              summaryId={summary._id}
              participants={participants}
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
      </List>
    </Section>
  );
}

function ParticipantsSection({ participants }: { participants: MeetingParticipants }) {
  if (!(participants && participants.length > 0)) return null;

  return (
    <Section title="Participants" gap="sm">
      <List gap="sm">
        {participants.map((participant) => (
          <li key={participant._id}>
            <Card variant="soft" padding="sm">
              <Flex justify="between" align="center" gap="sm">
                <FlexItem flex="1">
                  <Stack gap="xs">
                    <Typography variant="label">{participant.displayName}</Typography>
                    {participant.email && (
                      <Typography variant="caption" color="secondary">
                        {participant.email}
                      </Typography>
                    )}
                  </Stack>
                </FlexItem>
                <Flex gap="xs" wrap justify="end">
                  {participant.isHost && <Badge size="sm">Host</Badge>}
                  {participant.isExternal && <Badge size="sm">External</Badge>}
                </Flex>
              </Flex>
            </Card>
          </li>
        ))}
      </List>
    </Section>
  );
}

/** Collapsible section using native details/summary for meeting detail density. */
function CollapsibleDetail({
  title,
  defaultOpen = false,
  count,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  count?: number;
  children: ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group">
      <Flex
        as="summary"
        align="center"
        gap="sm"
        className="cursor-pointer list-none [&::-webkit-details-marker]:hidden"
      >
        <ChevronRight className="size-4 text-ui-text-tertiary transition-transform group-open:rotate-90" />
        <Typography variant="h5">{title}</Typography>
        {count !== undefined && count > 0 && (
          <Badge size="sm" variant="neutral">
            {count}
          </Badge>
        )}
      </Flex>
      <Stack gap="sm">{children}</Stack>
    </details>
  );
}

function SummaryOverviewCard({ summary }: { summary: MeetingSummary }) {
  return (
    <Card variant="soft" padding="md">
      <Section title="Summary" gap="sm">
        <Typography variant="muted" data-testid={TEST_IDS.MEETINGS.DETAIL_SUMMARY}>
          {summary.executiveSummary}
        </Typography>
        <Flex gap="xs" wrap>
          {summary.overallSentiment && (
            <Badge size="sm">Sentiment: {summary.overallSentiment}</Badge>
          )}
          <Badge size="sm">Model: {summary.modelUsed}</Badge>
        </Flex>
      </Section>
    </Card>
  );
}

function MeetingNotesPanel({ summary }: { summary: MeetingSummary }) {
  return (
    <Section title="Meeting Notes" gap="md">
      {summary.keyPoints.length > 0 && (
        <Stack gap="xs">
          <Typography variant="h5">Key Points</Typography>
          <List gap="xs" variant="bulleted">
            {summary.keyPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </List>
        </Stack>
      )}

      {summary.decisions.length > 0 && (
        <Stack gap="xs">
          <Typography variant="h5">Decisions</Typography>
          <List gap="xs">
            {summary.decisions.map((decision) => (
              <Flex as="li" key={decision} align="start" gap="sm">
                <Icon icon={CheckCircle} size="sm" tone="success" />
                <Typography variant="caption" color="secondary">
                  {decision}
                </Typography>
              </Flex>
            ))}
          </List>
        </Stack>
      )}

      {summary.openQuestions.length > 0 && (
        <Stack gap="xs">
          <Typography variant="h5">Open Questions</Typography>
          <List gap="xs" variant="bulleted">
            {summary.openQuestions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </List>
        </Stack>
      )}

      {summary.topics.length > 0 && (
        <Stack gap="sm">
          <Typography variant="h5">Topics</Typography>
          <List gap="sm">
            {summary.topics.map((topic) => (
              <li key={`topic-${topic.title}-${topic.summary}`}>
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
          </List>
        </Stack>
      )}
    </Section>
  );
}

function FocusedMeetingDetailTab({
  value,
  label,
  isActive,
  onSelect,
}: {
  value: MeetingDetailTab;
  label: string;
  isActive: boolean;
  onSelect: (value: MeetingDetailTab) => void;
}) {
  return (
    <FlexItem flex="1">
      <Button
        type="button"
        variant={isActive ? "secondary" : "ghost"}
        size="touchWide"
        role="tab"
        id={`meeting-detail-tab-${value}`}
        aria-controls={`meeting-detail-panel-${value}`}
        aria-selected={isActive}
        data-state={isActive ? "active" : "inactive"}
        onClick={() => onSelect(value)}
      >
        {label}
      </Button>
    </FlexItem>
  );
}

function getFocusedMeetingDetailTabConfigs(
  recording: NonNullable<MeetingDetail>,
  projects: ProjectOption[] | undefined,
) {
  if (!recording.summary) {
    return [] as MeetingDetailTabConfig[];
  }

  const configs: MeetingDetailTabConfig[] = [];

  if (recording.summary.actionItems.length > 0) {
    configs.push({
      value: "actions",
      label: "Actions",
      content: (
        <ActionItemsSection
          summary={recording.summary}
          defaultProjectId={recording.projectId}
          projects={projects}
          participants={recording.participants}
        />
      ),
    });
  }

  if (hasMeetingNotes(recording.summary)) {
    configs.push({
      value: "notes",
      label: "Notes",
      content: <MeetingNotesPanel summary={recording.summary} />,
    });
  }

  if (recording.transcript) {
    configs.push({
      value: "transcript",
      label: "Transcript",
      content: (
        <TranscriptSegmentList
          transcript={recording.transcript}
          participants={recording.participants}
        />
      ),
    });
  }

  if (recording.participants.length > 0) {
    configs.push({
      value: "people",
      label: "People",
      content: <ParticipantsSection participants={recording.participants} />,
    });
  }

  return configs;
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
      <Stack gap="lg">
        <EmptyState
          icon={Mic}
          size="compact"
          title="Summary is still being generated"
          description="The transcript is available below while the summary is processing."
          data-testid={TEST_IDS.MEETINGS.SUMMARY_PROCESSING_STATE}
        />
        {transcript && (
          <CollapsibleDetail title="Transcript" defaultOpen>
            <TranscriptSegmentList transcript={transcript} participants={recording.participants} />
          </CollapsibleDetail>
        )}
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <SummaryOverviewCard summary={summary} />

      <CollapsibleDetail title="Action Items" defaultOpen count={summary.actionItems.length}>
        <ActionItemsSection
          summary={summary}
          defaultProjectId={recording.projectId}
          projects={projects}
          participants={recording.participants}
        />
      </CollapsibleDetail>

      {summary.keyPoints.length > 0 && (
        <CollapsibleDetail title="Key Points" count={summary.keyPoints.length}>
          <List gap="xs" variant="bulleted">
            {summary.keyPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </List>
        </CollapsibleDetail>
      )}

      {summary.decisions.length > 0 && (
        <CollapsibleDetail title="Decisions" count={summary.decisions.length}>
          <List gap="xs">
            {summary.decisions.map((decision) => (
              <Flex as="li" key={decision} align="start" gap="sm">
                <Icon icon={CheckCircle} size="sm" tone="success" />
                <Typography variant="caption" color="secondary">
                  {decision}
                </Typography>
              </Flex>
            ))}
          </List>
        </CollapsibleDetail>
      )}

      {summary.openQuestions.length > 0 && (
        <CollapsibleDetail title="Open Questions" count={summary.openQuestions.length}>
          <List gap="xs" variant="bulleted">
            {summary.openQuestions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </List>
        </CollapsibleDetail>
      )}

      {summary.topics.length > 0 && (
        <CollapsibleDetail title="Topics" count={summary.topics.length}>
          <List gap="sm">
            {summary.topics.map((topic) => (
              <li key={`topic-${topic.title}-${topic.summary}`}>
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
          </List>
        </CollapsibleDetail>
      )}

      {transcript && (
        <CollapsibleDetail title="Transcript" defaultOpen>
          <TranscriptSegmentList transcript={transcript} participants={recording.participants} />
        </CollapsibleDetail>
      )}
    </Stack>
  );
}

function FocusedMeetingDetailSections({
  recording,
  projects,
}: {
  recording: NonNullable<MeetingDetail>;
  projects: ProjectOption[] | undefined;
}) {
  const tabConfigs = getFocusedMeetingDetailTabConfigs(recording, projects);
  const tabs = tabConfigs.map((config) => config.value);
  const { activeTab, setActiveTab } = useMeetingDetailTabState(tabs);

  if (!recording.summary) {
    return <SummarySections recording={recording} projects={projects} />;
  }

  if (tabs.length === 0 || !activeTab) {
    return <SummaryOverviewCard summary={recording.summary} />;
  }

  return (
    <Stack gap="md">
      <SummaryOverviewCard summary={recording.summary} />

      <Card
        recipe="filterBar"
        variant="ghost"
        padding="xs"
        role="tablist"
        aria-label="Meeting detail sections"
      >
        <Flex gap="xs">
          {tabConfigs.map((tabConfig) => (
            <FocusedMeetingDetailTab
              key={tabConfig.value}
              value={tabConfig.value}
              label={tabConfig.label}
              isActive={activeTab === tabConfig.value}
              onSelect={setActiveTab}
            />
          ))}
        </Flex>
      </Card>

      {tabConfigs.map((tabConfig) => (
        <div
          key={tabConfig.value}
          role="tabpanel"
          id={`meeting-detail-panel-${tabConfig.value}`}
          aria-labelledby={`meeting-detail-tab-${tabConfig.value}`}
          hidden={activeTab !== tabConfig.value}
        >
          {tabConfig.content}
        </div>
      ))}
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
  const { createSeededDocumentAndOpen, isCreatingDocument } = useSeededDocumentCreation();
  const isWideDetailLayout = useMediaQuery(WIDE_MEETING_DETAIL_MEDIA_QUERY, true);

  const handleCreateMeetingDocument = async (meeting: NonNullable<MeetingDetail>) => {
    try {
      const created = await createSeededDocumentAndOpen({
        title: buildMeetingDocumentTitle(meeting),
        projectId: meeting.projectId,
        isPublic: meeting.projectId ? meeting.isPublic : false,
        value: createMeetingDocumentValue(meeting),
      });

      if (created) {
        showSuccess("Meeting document created");
      }
    } catch (error) {
      showError(error, "Failed to create meeting document");
    }
  };

  if (recording == null) {
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
          <Flex justify="between" align="start" gap="sm" wrap>
            <FlexItem flex="1">
              <Stack gap="xs">
                <Typography variant="h4" data-testid={TEST_IDS.MEETINGS.DETAIL_TITLE}>
                  {recording.title}
                </Typography>
                <Typography variant="caption" color="secondary">
                  {formatMeetingPlatform(recording.meetingPlatform)}
                </Typography>
              </Stack>
            </FlexItem>
            <Flex gap="sm" align="center" wrap>
              <Button
                variant="secondary"
                size="sm"
                isLoading={isCreatingDocument}
                onClick={() => void handleCreateMeetingDocument(recording)}
              >
                Create doc
              </Button>
              <StatusBadge status={recording.status} />
            </Flex>
          </Flex>

          <Metadata>
            <MetadataItem icon={<Calendar size={16} />}>
              {recording.scheduledStartTime
                ? formatDateTime(recording.scheduledStartTime)
                : formatDateTime(recording._creationTime)}
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
            <CardSection size="compact">
              <Flex gap="sm" align="start">
                <Icon icon={XCircle} size="sm" tone="error" />
                <Typography variant="caption" color="secondary">
                  {recording.errorMessage}
                </Typography>
              </Flex>
            </CardSection>
          )}
        </Stack>
      </Card>

      <MeetingProjectContext recording={recording} projects={projects} />
      {isWideDetailLayout || !recording.summary ? (
        <>
          <SummarySections recording={recording} projects={projects} />
          {recording.participants.length > 0 && (
            <ParticipantsSection participants={recording.participants} />
          )}
        </>
      ) : (
        <FocusedMeetingDetailSections recording={recording} projects={projects} />
      )}
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
      data-testid={TEST_IDS.MEETINGS.SCHEDULE_DIALOG}
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

/**
 * Meetings workspace with memory rail, recording filters, and recording detail panel.
 */
export function MeetingsWorkspace() {
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>("all");
  const recordingQueryArgs =
    projectFilter === "all"
      ? { limit: 50 }
      : { limit: 50, projectId: projectFilter as Id<"projects"> };
  const recordings = useAuthenticatedQuery(api.meetingBot.listRecordings, recordingQueryArgs);
  const memory = useAuthenticatedQuery(api.meetingBot.listMemoryItems, { sectionLimit: 5 });
  const projects = useAuthenticatedQuery(api.dashboard.getMyProjects, {});
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [timeWindowFilter, setTimeWindowFilter] = useState<TimeWindowFilter>("all");
  const deferredSearchQuery = useDeferredValue(searchQuery.trim());
  const searchQueryArgs =
    deferredSearchQuery.length >= 2
      ? {
          query: deferredSearchQuery,
          limit: 50,
          ...(projectFilter !== "all" ? { projectId: projectFilter as Id<"projects"> } : {}),
        }
      : "skip";
  const searchedRecordings = useAuthenticatedQuery(
    api.meetingBot.searchRecordings,
    searchQueryArgs,
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
  const pageEmptyState = getMeetingsPageEmptyState({
    recordings,
    projectFilter,
    statusFilter,
    platformFilter,
    timeWindowFilter,
    deferredSearchQuery,
    onScheduleRecording: () => setIsScheduleDialogOpen(true),
  });

  return (
    <>
      <PageContent
        isLoading={
          recordings === undefined ||
          (deferredSearchQuery.length >= 2 && searchedRecordings === undefined)
        }
        emptyState={pageEmptyState}
      >
        <Stack gap="lg">
          <MeetingMemorySection
            memory={memory}
            projectFilter={projectFilter}
            projects={projects}
            onProjectSelect={setProjectFilter}
          />

          <Grid cols={1} colsLg={2} gap="lg">
            <Section
              title="Recent Meetings"
              description="Recordings created from calendar-linked meetings and direct bot runs."
              gap="sm"
              data-testid={TEST_IDS.MEETINGS.RECENT_SECTION}
            >
              <Stack gap="sm">
                <Flex justify="between" align="center" gap="sm" wrap>
                  <Typography variant="caption" color="secondary">
                    Schedule from calendar or add an ad-hoc meeting URL here.
                  </Typography>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsScheduleDialogOpen(true)}
                    data-testid={TEST_IDS.MEETINGS.SCHEDULE_BUTTON}
                  >
                    Schedule Recording
                  </Button>
                </Flex>

                <Input
                  variant="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search transcript text"
                  aria-label="Search meetings"
                  data-testid={TEST_IDS.MEETINGS.SEARCH_INPUT}
                />

                <Grid cols={1} colsSm={2} colsXl={4} gap="sm">
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
                </Grid>

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
                    data-testid={TEST_IDS.MEETINGS.FILTER_EMPTY_STATE}
                  />
                ) : (
                  <List gap="sm">
                    {filteredRecordings?.map((recording) => (
                      <li key={recording._id}>
                        <RecordingListItem
                          recording={recording}
                          isSelected={selectedRecordingId === recording._id}
                          onSelect={() => setSelectedRecordingId(recording._id)}
                        />
                      </li>
                    ))}
                  </List>
                )}
              </Stack>
            </Section>

            <Section
              title="Meeting Detail"
              description="Review summaries, decisions, action items, transcript, and participants."
              gap="sm"
              data-testid={TEST_IDS.MEETINGS.DETAIL_SECTION}
            >
              {selectedRecordingId ? (
                <RecordingDetailPanel recording={selectedRecording} projects={projects} />
              ) : (
                <EmptyState
                  icon={FileText}
                  size="compact"
                  title="Select a meeting"
                  description="Choose a recording from the list to inspect its details."
                  data-testid={TEST_IDS.MEETINGS.DETAIL_EMPTY_STATE}
                />
              )}
            </Section>
          </Grid>
        </Stack>
      </PageContent>
      <ScheduleRecordingDialog
        open={isScheduleDialogOpen}
        onOpenChange={setIsScheduleDialogOpen}
        projects={projects}
      />
    </>
  );
}
