import type { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { showSuccess } from "@/lib/toast";
import { fireEvent, render, screen, waitFor } from "@/test/custom-render";
import { filterMeetingRecordings, MeetingsWorkspace } from "./MeetingsWorkspace";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
  useAuthenticatedMutation: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

type MeetingListItem = FunctionReturnType<typeof api.meetingBot.listRecordings>[number];
type MeetingSearchItem = FunctionReturnType<typeof api.meetingBot.searchRecordings>[number];
type MeetingDetail = NonNullable<FunctionReturnType<typeof api.meetingBot.getRecording>>;
type ProjectItem = FunctionReturnType<typeof api.dashboard.getMyProjects>[number];

const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockShowSuccess = vi.mocked(showSuccess);

const recordingId = "recording_1" as Id<"meetingRecordings">;
const summaryId = "summary_1" as Id<"meetingSummaries">;
const projectId = "project_1" as Id<"projects">;
const createIssueFromActionItem = vi.fn();

function buildProjectItem(overrides: Partial<ProjectItem> = {}): ProjectItem {
  return {
    _id: projectId,
    name: "Core Platform",
    key: "CORE",
    description: "Main product work",
    role: "lead",
    totalIssues: 12,
    myIssues: 4,
    ...overrides,
  };
}

function buildListItem(overrides: Partial<MeetingListItem> = {}): MeetingListItem {
  return {
    _id: recordingId,
    _creationTime: 1_710_000_000_000,
    calendarEventId: undefined,
    meetingUrl: "https://meet.google.com/abc-defg-hij",
    meetingPlatform: "google_meet",
    title: "Weekly Product Review",
    recordingFileId: undefined,
    recordingUrl: undefined,
    duration: 1800,
    fileSize: undefined,
    status: "completed",
    errorMessage: undefined,
    scheduledStartTime: 1_710_000_000_000,
    actualStartTime: undefined,
    actualEndTime: undefined,
    botJoinedAt: undefined,
    botLeftAt: undefined,
    botName: "Nixelo Notetaker",
    createdBy: "user_1" as Id<"users">,
    projectId,
    isPublic: true,
    createdAt: 1_710_000_000_000,
    updatedAt: 1_710_000_100_000,
    calendarEvent: null,
    hasTranscript: true,
    hasSummary: true,
    ...overrides,
  };
}

function buildDetail(overrides: Partial<MeetingDetail> = {}): MeetingDetail {
  return {
    ...buildListItem(),
    participants: [
      {
        _id: "participant_1" as Id<"meetingParticipants">,
        _creationTime: 1_710_000_000_000,
        recordingId,
        displayName: "Alex",
        email: "alex@example.com",
        userId: undefined,
        joinedAt: undefined,
        leftAt: undefined,
        speakingTime: undefined,
        speakingPercentage: undefined,
        isHost: true,
        isExternal: false,
      },
    ],
    transcript: {
      _id: "transcript_1" as Id<"meetingTranscripts">,
      _creationTime: 1_710_000_000_000,
      recordingId,
      fullText: "Full transcript text",
      segments: [],
      language: "en",
      modelUsed: "test-model",
      processingTime: 1000,
      wordCount: 1234,
      speakerCount: 3,
    },
    summary: {
      _id: summaryId,
      _creationTime: 1_710_000_000_000,
      recordingId,
      transcriptId: "transcript_1" as Id<"meetingTranscripts">,
      executiveSummary: "The team aligned on delivery scope.",
      keyPoints: ["Finalize scope", "Start implementation"],
      actionItems: [
        {
          description: "Update the spec",
          assignee: "Alex",
          assigneeUserId: undefined,
          dueDate: "2026-03-20",
          priority: "high",
          issueCreated: undefined,
        },
      ],
      decisions: ["Ship the narrower first iteration"],
      openQuestions: ["Do we need Zoom support in v1?"],
      topics: [{ title: "Scope", summary: "Team agreed to launch the smaller slice first." }],
      overallSentiment: "positive",
      modelUsed: "claude-opus-4-5",
      promptTokens: 100,
      completionTokens: 200,
      processingTime: 500,
      regeneratedAt: undefined,
    },
    job: null,
    ...overrides,
  };
}

function installMeetingQueryMock({
  listRecordings = [buildListItem()],
  detail = buildDetail(),
  projects = [buildProjectItem()],
  searchQuery,
  searchResults = [],
}: {
  listRecordings?: MeetingListItem[];
  detail?: MeetingDetail | undefined;
  projects?: ProjectItem[];
  searchQuery?: string;
  searchResults?: MeetingSearchItem[];
}) {
  mockUseAuthenticatedQuery.mockImplementation((_query, args) => {
    if (typeof args !== "object" || !args) return undefined;
    if ("query" in args) return args.query === searchQuery ? searchResults : [];
    if ("limit" in args) return listRecordings;
    if (Object.keys(args).length === 0) return projects;
    if ("recordingId" in args && args.recordingId === recordingId) return detail;
    return undefined;
  });
}

describe("MeetingsWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthenticatedMutation.mockReturnValue({
      mutate: createIssueFromActionItem,
      canAct: true,
      isAuthLoading: false,
    });
  });

  it("renders an empty state when there are no recordings", () => {
    installMeetingQueryMock({ listRecordings: [] });

    render(<MeetingsWorkspace />);

    expect(screen.getByText("No meeting recordings yet")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Schedule AI Meeting Notes from a calendar event to start capturing transcripts, summaries, and follow-up work.",
      ),
    ).toBeInTheDocument();
  });

  it("renders recording details for the selected meeting", () => {
    installMeetingQueryMock({});

    render(<MeetingsWorkspace />);

    expect(screen.getAllByText("Weekly Product Review")).toHaveLength(2);
    expect(screen.getByText("The team aligned on delivery scope.")).toBeInTheDocument();
    expect(screen.getByText("Update the spec")).toBeInTheDocument();
    expect(screen.getByText("Do we need Zoom support in v1?")).toBeInTheDocument();
    expect(screen.getAllByText("Alex")).toHaveLength(2);
    expect(screen.getByText("Full transcript text")).toBeInTheDocument();
  });

  it("creates an issue from an action item", async () => {
    createIssueFromActionItem.mockResolvedValue({ issueId: "issue_1" });
    installMeetingQueryMock({});

    render(<MeetingsWorkspace />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Create issue" })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Create issue" }));

    await waitFor(() => {
      expect(createIssueFromActionItem).toHaveBeenCalledWith({
        summaryId,
        actionItemIndex: 0,
        projectId,
      });
    });

    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith("Issue created from action item");
    });
  });

  it("shows transcript search results with match excerpts", async () => {
    installMeetingQueryMock({
      searchQuery: "scope",
      searchResults: [
        {
          ...buildListItem(),
          matchExcerpt: "Matched discussion about scope and rollout timing.",
        },
      ],
      detail: buildDetail({
        transcript: {
          _id: "transcript_1" as Id<"meetingTranscripts">,
          _creationTime: 1_710_000_000_000,
          recordingId,
          fullText: "Full transcript text about scope.",
          segments: [],
          language: "en",
          modelUsed: "test-model",
          processingTime: 1000,
          wordCount: 1234,
          speakerCount: 3,
        },
        summary: {
          ...buildDetail().summary,
          keyPoints: [],
          actionItems: [],
          decisions: [],
          openQuestions: [],
          topics: [],
        },
        participants: [],
      }),
    });

    render(<MeetingsWorkspace />);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search meetings" }), {
      target: { value: "scope" },
    });

    await waitFor(() => {
      expect(screen.getByText('Searching transcript content for "scope".')).toBeInTheDocument();
    });

    expect(
      screen.getByText("Matched discussion about scope and rollout timing."),
    ).toBeInTheDocument();
  });

  it("filters recordings by status, project, and date window", () => {
    const recentFailedRecording = buildListItem({
      _id: "recording_2" as Id<"meetingRecordings">,
      title: "Customer Follow-up",
      status: "failed",
      projectId: "project_2" as Id<"projects">,
      createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      scheduledStartTime: Date.now() - 2 * 24 * 60 * 60 * 1000,
    });
    const oldFailedRecording = buildListItem({
      _id: "recording_3" as Id<"meetingRecordings">,
      title: "Quarterly Review",
      status: "failed",
      projectId: "project_2" as Id<"projects">,
      createdAt: Date.now() - 120 * 24 * 60 * 60 * 1000,
      scheduledStartTime: Date.now() - 120 * 24 * 60 * 60 * 1000,
    });

    const filteredRecordings = filterMeetingRecordings(
      [buildListItem(), recentFailedRecording, oldFailedRecording],
      {
        status: "failed",
        platform: "all",
        projectId: "project_2" as Id<"projects">,
        timeWindow: "30d",
      },
    );

    expect(filteredRecordings).toEqual([recentFailedRecording]);
  });
});
