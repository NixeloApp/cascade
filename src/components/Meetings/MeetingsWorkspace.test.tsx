import type { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { DAY } from "@convex/lib/timeUtils";
import userEvent from "@testing-library/user-event";
import type { FunctionReturnType } from "convex/server";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { OrgContext, type OrgContextType } from "@/hooks/useOrgContext";
import { useSeededDocumentCreation } from "@/hooks/useSeededDocumentCreation";
import { TEST_IDS } from "@/lib/test-ids";
import { showSuccess } from "@/lib/toast";
import { fireEvent, render, screen, waitFor, within } from "@/test/custom-render";
import {
  filterMeetingMemory,
  filterMeetingRecordings,
  getMeetingMemoryProjectLenses,
  MeetingsWorkspace,
} from "./MeetingsWorkspace";

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    Link: (props: { children: ReactNode; to?: string; title?: string }) => (
      <a href={props.to ?? "#"} title={props.title}>
        {props.children}
      </a>
    ),
  };
});

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
  useAuthenticatedMutation: vi.fn(),
}));

vi.mock("@/hooks/useSeededDocumentCreation", () => ({
  useSeededDocumentCreation: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

type MeetingListItem = FunctionReturnType<typeof api.meetingBot.listRecordings>[number];
type MeetingMemory = FunctionReturnType<typeof api.meetingBot.listMemoryItems>;
type MeetingSearchItem = FunctionReturnType<typeof api.meetingBot.searchRecordings>[number];
type MeetingDetail = NonNullable<FunctionReturnType<typeof api.meetingBot.getRecording>>;
type ProjectItem = FunctionReturnType<typeof api.dashboard.getMyProjects>[number];

const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockUseSeededDocumentCreation = vi.mocked(useSeededDocumentCreation);
const mockShowSuccess = vi.mocked(showSuccess);
const mockScrollIntoView = vi.fn();

const recordingId = "recording_1" as Id<"meetingRecordings">;
const summaryId = "summary_1" as Id<"meetingSummaries">;
const projectId = "project_1" as Id<"projects">;
const organizationId = "organization_1" as Id<"organizations">;
const alexUserId = "user_alex" as Id<"users">;
const priyaUserId = "user_priya" as Id<"users">;
const createIssueFromActionItem = vi.fn();
const scheduleRecording = vi.fn();
const createSeededDocumentAndOpen = vi.fn();
const organizationContext: OrgContextType = {
  organizationId,
  orgSlug: "acme",
  organizationName: "Acme",
  userRole: "owner",
  billingEnabled: true,
};

function renderMeetingsWorkspace() {
  return render(
    <OrgContext.Provider value={organizationContext}>
      <MeetingsWorkspace />
    </OrgContext.Provider>,
  );
}

function mockMeetingViewport(isWide: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: isWide,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function buildProjectItem(overrides: Partial<ProjectItem> = {}): ProjectItem {
  return {
    _id: projectId,
    name: "Core Platform",
    key: "CORE",
    description: "Main product work",
    role: "admin",
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
        userId: alexUserId,
        joinedAt: undefined,
        leftAt: undefined,
        speakingTime: undefined,
        speakingPercentage: undefined,
        isHost: true,
        isExternal: false,
      },
      {
        _id: "participant_2" as Id<"meetingParticipants">,
        _creationTime: 1_710_000_000_000,
        recordingId,
        displayName: "Priya",
        email: "priya@example.com",
        userId: priyaUserId,
        joinedAt: undefined,
        leftAt: undefined,
        speakingTime: undefined,
        speakingPercentage: undefined,
        isHost: false,
        isExternal: true,
      },
    ],
    transcript: {
      _id: "transcript_1" as Id<"meetingTranscripts">,
      _creationTime: 1_710_000_000_000,
      recordingId,
      fullText: "Full transcript text",
      segments: [
        {
          startTime: 0,
          endTime: 12,
          speaker: "Alex",
          speakerUserId: alexUserId,
          text: "Thanks everyone for joining the weekly product review.",
          confidence: 0.96,
        },
        {
          startTime: 12,
          endTime: 25,
          speaker: "Priya",
          speakerUserId: priyaUserId,
          text: "We aligned on the narrower launch scope and next implementation steps.",
          confidence: 0.93,
        },
      ],
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
          assigneeUserId: alexUserId,
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

function buildMemory(overrides: Partial<MeetingMemory> = {}): MeetingMemory {
  return {
    recentDecisions: [
      {
        recordingId,
        projectId,
        recordingTitle: "Weekly Product Review",
        meetingPlatform: "google_meet",
        createdAt: 1_710_000_000_000,
        decision: "Ship the narrower first iteration",
      },
    ],
    openQuestions: [
      {
        recordingId,
        projectId,
        recordingTitle: "Weekly Product Review",
        meetingPlatform: "google_meet",
        createdAt: 1_710_000_000_000,
        question: "Do we need Zoom support in v1?",
      },
    ],
    unresolvedActionItems: [
      {
        recordingId,
        projectId,
        recordingTitle: "Weekly Product Review",
        meetingPlatform: "google_meet",
        createdAt: 1_710_000_000_000,
        description: "Update the spec",
        assignee: "Alex",
        dueDate: "2026-03-20",
        priority: "high",
      },
    ],
    ...overrides,
  };
}

function isObjectArg(args: unknown): args is Record<string, unknown> {
  return typeof args === "object" && args !== null;
}

function matchesMemoryArgs(args: Record<string, unknown>) {
  return "sectionLimit" in args;
}

function matchesSearchArgs(args: Record<string, unknown>) {
  return "query" in args;
}

function matchesListArgs(args: Record<string, unknown>) {
  return "limit" in args;
}

function matchesIssueArgs(args: Record<string, unknown>) {
  return "id" in args;
}

function matchesRecordingArgs(args: Record<string, unknown>) {
  return "recordingId" in args && args.recordingId === recordingId;
}

function matchesProjectArgs(args: Record<string, unknown>) {
  return Object.keys(args).length === 0;
}

function resolveMeetingQueryResult(
  args: unknown,
  config: {
    listRecordings: MeetingListItem[];
    detail: MeetingDetail | undefined;
    projects: ProjectItem[];
    memory: MeetingMemory;
    searchQuery?: string;
    searchResults: MeetingSearchItem[];
    linkedIssue?: {
      _id: Id<"issues">;
      key: string;
      title: string;
      status: string;
    } | null;
  },
) {
  if (!isObjectArg(args)) return undefined;
  if (matchesMemoryArgs(args)) return config.memory;
  if (matchesSearchArgs(args)) return args.query === config.searchQuery ? config.searchResults : [];
  if (matchesListArgs(args)) return config.listRecordings;
  if (matchesProjectArgs(args)) return config.projects;
  if (matchesIssueArgs(args)) return config.linkedIssue ?? null;
  if (matchesRecordingArgs(args)) return config.detail;
  return undefined;
}

function installMeetingQueryMock({
  listRecordings = [buildListItem()],
  detail = buildDetail(),
  projects = [buildProjectItem()],
  memory = buildMemory(),
  searchQuery,
  searchResults = [],
  linkedIssue = null,
}: {
  listRecordings?: MeetingListItem[];
  detail?: MeetingDetail | undefined;
  projects?: ProjectItem[];
  memory?: MeetingMemory;
  searchQuery?: string;
  searchResults?: MeetingSearchItem[];
  linkedIssue?: {
    _id: Id<"issues">;
    key: string;
    title: string;
    status: string;
  } | null;
}) {
  mockUseAuthenticatedQuery.mockImplementation((_query, args) =>
    resolveMeetingQueryResult(args, {
      listRecordings,
      detail,
      projects,
      memory,
      searchQuery,
      searchResults,
      linkedIssue,
    }),
  );
}

describe("MeetingsWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMeetingViewport(true);
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      value: mockScrollIntoView,
      configurable: true,
      writable: true,
    });

    let mutationHookCallCount = 0;
    mockUseAuthenticatedMutation.mockImplementation(() => {
      mutationHookCallCount += 1;

      const mutate =
        mutationHookCallCount % 2 === 1 ? scheduleRecording : createIssueFromActionItem;
      return {
        mutate: Object.assign(mutate, { withOptimisticUpdate: vi.fn().mockReturnThis() }),
        canAct: true,
        isAuthLoading: false,
      };
    });
    mockUseSeededDocumentCreation.mockReturnValue({
      createSeededDocumentAndOpen,
      createTemplateDocumentAndOpen: vi.fn(),
      error: null,
      isCreatingDocument: false,
      isLoading: false,
    });
  });

  it("renders an empty state when there are no recordings", () => {
    installMeetingQueryMock({ listRecordings: [] });

    renderMeetingsWorkspace();

    expect(screen.getByText("No meeting recordings yet")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Schedule from calendar or add a direct meeting URL to start capturing transcripts, summaries, and follow-up work.",
      ),
    ).toBeInTheDocument();
  });

  it("renders recording details for the selected meeting", () => {
    installMeetingQueryMock({});

    renderMeetingsWorkspace();

    expect(screen.getByText("Meeting Memory")).toBeInTheDocument();
    expect(screen.getByText("Recent Decisions")).toBeInTheDocument();
    expect(screen.getAllByText("Open Questions")).toHaveLength(2);
    expect(screen.getByText("Unresolved Action Items")).toBeInTheDocument();
    expect(screen.getByText("Project Context")).toBeInTheDocument();
    expect(screen.getAllByText("CORE - Core Platform").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("0 linked issues")).toBeInTheDocument();
    expect(screen.getByText("1 pending follow-ups")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Project Board" })).toBeInTheDocument();
    expect(screen.getAllByText("Ship the narrower first iteration").length).toBeGreaterThanOrEqual(
      2,
    );
    expect(screen.getAllByText("Weekly Product Review").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("The team aligned on delivery scope.")).toBeInTheDocument();
    expect(screen.getAllByText("Update the spec").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Do we need Zoom support in v1?").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Alex").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Speaker-attributed transcript with timestamps.")).toBeInTheDocument();
    expect(screen.getByText("Speakers in this meeting")).toBeInTheDocument();
    expect(screen.getAllByText("alex@example.com").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("0:00 - 0:12")).toBeInTheDocument();
    expect(screen.getByText("0:12 - 0:25")).toBeInTheDocument();
    expect(
      screen.getByText("Thanks everyone for joining the weekly product review."),
    ).toBeInTheDocument();
    expect(screen.getByText("Raw Transcript")).toBeInTheDocument();
    expect(screen.getByText("Full transcript text")).toBeInTheDocument();
    const completedBadges = screen.getAllByText("Completed");
    expect(completedBadges.length).toBeGreaterThan(0);
    for (const badge of completedBadges) {
      expect(badge).toHaveClass("bg-status-success-bg");
    }
  });

  it("creates an issue from an action item", async () => {
    createIssueFromActionItem.mockResolvedValue({ issueId: "issue_1" });
    installMeetingQueryMock({});

    renderMeetingsWorkspace();

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
          _id: summaryId,
          _creationTime: 1_710_000_000_000,
          recordingId,
          transcriptId: "transcript_1" as Id<"meetingTranscripts">,
          modelUsed: "test-model",
          executiveSummary: "",
          keyPoints: [],
          actionItems: [],
          decisions: [],
          openQuestions: [],
          topics: [],
        },
        participants: [],
      }),
    });

    renderMeetingsWorkspace();

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

  it("filters transcript segments within the selected meeting", async () => {
    installMeetingQueryMock({});

    renderMeetingsWorkspace();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search transcript" }), {
      target: { value: "narrower" },
    });

    expect(
      screen.queryByText("Thanks everyone for joining the weekly product review."),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("We aligned on the narrower launch scope and next implementation steps."),
    ).toBeInTheDocument();
    expect(screen.getByText("1 matches")).toBeInTheDocument();
  });

  it("focuses one detail pane at a time on narrow widths", async () => {
    const user = userEvent.setup();
    mockMeetingViewport(false);
    installMeetingQueryMock({});

    renderMeetingsWorkspace();
    const meetingDetailSection = screen.getByTestId(TEST_IDS.MEETINGS.DETAIL_SECTION);
    const getActiveDetailPanel = () => within(meetingDetailSection).getByRole("tabpanel");

    expect(screen.getByRole("tab", { name: "Actions" })).toHaveAttribute("data-state", "active");
    expect(within(getActiveDetailPanel()).getByText("Update the spec")).toBeVisible();

    await user.click(screen.getByRole("tab", { name: "People" }));

    await waitFor(() => {
      expect(within(getActiveDetailPanel()).getByText("Host")).toBeVisible();
    });

    expect(within(getActiveDetailPanel()).getByText("Host")).toBeVisible();
    expect(within(getActiveDetailPanel()).queryByText("Update the spec")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Transcript" }));
    fireEvent.change(screen.getByRole("searchbox", { name: "Search transcript" }), {
      target: { value: "narrower" },
    });

    expect(
      within(getActiveDetailPanel()).getByText(
        "We aligned on the narrower launch scope and next implementation steps.",
      ),
    ).toBeVisible();
    expect(within(getActiveDetailPanel()).queryByText("Update the spec")).not.toBeInTheDocument();
  });

  it("matches transcript speakers and assignees against participant metadata", () => {
    installMeetingQueryMock({});

    renderMeetingsWorkspace();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search transcript" }), {
      target: { value: "priya@example.com" },
    });

    expect(
      screen.getByText("We aligned on the narrower launch scope and next implementation steps."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Thanks everyone for joining the weekly product review."),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("External").length).toBeGreaterThanOrEqual(1);

    const actionItemsSection = screen.getByTestId(TEST_IDS.MEETINGS.ACTION_ITEMS_SECTION);
    expect(within(actionItemsSection).getByText("alex@example.com")).toBeInTheDocument();
    expect(within(actionItemsSection).getByText("Internal")).toBeInTheDocument();
  });

  it("jumps to transcript segments from the transcript navigation strip", () => {
    installMeetingQueryMock({});

    renderMeetingsWorkspace();

    fireEvent.click(screen.getByRole("button", { name: "Jump to 0:12 Priya" }));

    expect(mockScrollIntoView).toHaveBeenCalled();
  });

  it("shows linked issue details for action items with created issues", async () => {
    installMeetingQueryMock({
      linkedIssue: {
        _id: "issue_1" as Id<"issues">,
        key: "CORE-42",
        title: "Update onboarding copy",
        status: "todo",
      },
      detail: buildDetail({
        summary: {
          _id: summaryId,
          _creationTime: 1_710_000_000_000,
          recordingId,
          transcriptId: "transcript_1" as Id<"meetingTranscripts">,
          modelUsed: "test-model",
          executiveSummary: "The team aligned on delivery scope.",
          keyPoints: ["Finalize scope", "Start implementation"],
          decisions: [],
          openQuestions: [],
          topics: [],
          actionItems: [
            {
              description: "Update the spec",
              assignee: "Alex",
              assigneeUserId: undefined,
              dueDate: "2026-03-20",
              priority: "high",
              issueCreated: "issue_1" as Id<"issues">,
            },
          ],
        },
      }),
    });

    renderMeetingsWorkspace();

    expect(screen.getByText("CORE-42")).toBeInTheDocument();
    expect(screen.getByText("Update onboarding copy")).toBeInTheDocument();
    expect(screen.getByText("todo")).toBeInTheDocument();
  });

  it("creates a seeded meeting document from the selected recording", async () => {
    createSeededDocumentAndOpen.mockResolvedValue({ documentId: "doc_1" as Id<"documents"> });
    installMeetingQueryMock({});

    renderMeetingsWorkspace();

    fireEvent.click(screen.getByRole("button", { name: "Create doc" }));

    await waitFor(() => {
      expect(createSeededDocumentAndOpen).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Meeting Notes: Weekly Product Review",
          projectId,
          isPublic: true,
        }),
      );
      expect(mockShowSuccess).toHaveBeenCalledWith("Meeting document created");
    });

    const createArgs = createSeededDocumentAndOpen.mock.calls[0]?.[0];
    expect(createArgs?.value).toEqual(
      expect.arrayContaining([
        { type: "h1", children: [{ text: "Meeting Notes: Weekly Product Review" }] },
        { type: "h2", children: [{ text: "Action Items" }] },
        {
          type: "todo_li",
          checked: false,
          children: [{ text: "Update the spec — Owner: Alex — Due: 2026-03-20 — Priority: high" }],
        },
      ]),
    );
  });

  it("filters recordings by status, project, and date window", () => {
    const recentFailedRecording = buildListItem({
      _id: "recording_2" as Id<"meetingRecordings">,
      title: "Customer Follow-up",
      status: "failed",
      projectId: "project_2" as Id<"projects">,
      createdAt: Date.now() - 2 * DAY,
      scheduledStartTime: Date.now() - 2 * DAY,
    });
    const oldFailedRecording = buildListItem({
      _id: "recording_3" as Id<"meetingRecordings">,
      title: "Quarterly Review",
      status: "failed",
      projectId: "project_2" as Id<"projects">,
      createdAt: Date.now() - 120 * DAY,
      scheduledStartTime: Date.now() - 120 * DAY,
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

  it("scopes meeting memory by project lens", () => {
    const secondProjectId = "project_2" as Id<"projects">;
    const secondRecordingId = "recording_2" as Id<"meetingRecordings">;
    const projects = [
      buildProjectItem(),
      buildProjectItem({
        _id: secondProjectId,
        key: "OPS",
        name: "Ops Rollout",
      }),
    ];
    const memory = buildMemory({
      recentDecisions: [
        ...buildMemory().recentDecisions,
        {
          recordingId: secondRecordingId,
          projectId: secondProjectId,
          recordingTitle: "Rollout Sync",
          meetingPlatform: "google_meet",
          createdAt: 1_710_000_500_000,
          decision: "Start the phased rollout on Monday",
        },
      ],
      openQuestions: [
        ...buildMemory().openQuestions,
        {
          recordingId: secondRecordingId,
          projectId: secondProjectId,
          recordingTitle: "Rollout Sync",
          meetingPlatform: "google_meet",
          createdAt: 1_710_000_500_000,
          question: "Which customers need white-glove onboarding?",
        },
      ],
    });

    const filteredMemory = filterMeetingMemory(memory, secondProjectId);
    const projectLenses = getMeetingMemoryProjectLenses(memory, projects);

    expect(filteredMemory).toEqual({
      recentDecisions: [
        expect.objectContaining({ decision: "Start the phased rollout on Monday" }),
      ],
      openQuestions: [
        expect.objectContaining({ question: "Which customers need white-glove onboarding?" }),
      ],
      unresolvedActionItems: [],
    });
    expect(projectLenses).toEqual([
      expect.objectContaining({ projectId, projectKey: "CORE", totalItems: 3 }),
      expect.objectContaining({ projectId: secondProjectId, projectKey: "OPS", totalItems: 2 }),
    ]);
  });

  it("updates the meeting memory rail when a project lens is selected", () => {
    const secondProjectId = "project_2" as Id<"projects">;
    const secondRecordingId = "recording_2" as Id<"meetingRecordings">;

    installMeetingQueryMock({
      projects: [
        buildProjectItem(),
        buildProjectItem({
          _id: secondProjectId,
          key: "OPS",
          name: "Ops Rollout",
        }),
      ],
      listRecordings: [
        buildListItem(),
        buildListItem({
          _id: secondRecordingId,
          title: "Rollout Sync",
          projectId: secondProjectId,
        }),
      ],
      memory: buildMemory({
        recentDecisions: [
          ...buildMemory().recentDecisions,
          {
            recordingId: secondRecordingId,
            projectId: secondProjectId,
            recordingTitle: "Rollout Sync",
            meetingPlatform: "google_meet",
            createdAt: 1_710_000_500_000,
            decision: "Start the phased rollout on Monday",
          },
        ],
      }),
    });

    renderMeetingsWorkspace();

    expect(screen.getByRole("button", { name: /OPS/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /OPS/i }));

    expect(
      screen.getByText(
        "Cross-meeting decisions, open questions, and follow-ups for OPS - Ops Rollout.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Start the phased rollout on Monday")).toBeInTheDocument();
    expect(screen.queryByText("Ship the narrower first iteration")).not.toBeInTheDocument();
  });

  it("schedules a recording from the meetings page", async () => {
    scheduleRecording.mockResolvedValue({ recordingId });
    installMeetingQueryMock({});

    renderMeetingsWorkspace();

    fireEvent.click(screen.getByRole("button", { name: "Schedule Recording" }));
    fireEvent.change(screen.getByLabelText("Meeting Title"), {
      target: { value: "Customer rollout review" },
    });
    fireEvent.change(screen.getByLabelText("Meeting URL"), {
      target: { value: "https://meet.google.com/abc-defg-hij" },
    });
    fireEvent.change(screen.getByLabelText("Scheduled Time"), {
      target: { value: "2026-03-19T18:30" },
    });

    fireEvent.submit(document.getElementById("schedule-recording-form") as HTMLFormElement);

    await waitFor(() => {
      expect(scheduleRecording).toHaveBeenCalledWith({
        title: "Customer rollout review",
        meetingUrl: "https://meet.google.com/abc-defg-hij",
        meetingPlatform: "google_meet",
        scheduledStartTime: new Date("2026-03-19T18:30").getTime(),
        projectId: undefined,
        isPublic: false,
      });
    });
  });

  it("renders stable screenshot hooks for schedule, filtered-empty, and detail placeholder states", async () => {
    installMeetingQueryMock({
      searchQuery: "zzzz-no-results",
      searchResults: [],
    });

    renderMeetingsWorkspace();

    expect(screen.getByTestId(TEST_IDS.MEETINGS.SCHEDULE_BUTTON)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId(TEST_IDS.MEETINGS.SCHEDULE_BUTTON));
    expect(screen.getByTestId(TEST_IDS.MEETINGS.SCHEDULE_DIALOG)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    fireEvent.change(screen.getByRole("searchbox", { name: "Search meetings" }), {
      target: { value: "zzzz-no-results" },
    });

    await waitFor(() => {
      expect(screen.getByTestId(TEST_IDS.MEETINGS.FILTER_EMPTY_STATE)).toBeInTheDocument();
      expect(screen.getByTestId(TEST_IDS.MEETINGS.DETAIL_EMPTY_STATE)).toBeInTheDocument();
    });
  });

  it("shows the transcript-first processing state when a summary is not ready yet", () => {
    mockMeetingViewport(false);
    installMeetingQueryMock({
      listRecordings: [buildListItem({ status: "processing", title: "Go-live Support Runbook" })],
      detail: buildDetail({
        status: "processing",
        title: "Go-live Support Runbook",
        summary: null,
      }),
    });

    renderMeetingsWorkspace();

    expect(screen.getByTestId(TEST_IDS.MEETINGS.SUMMARY_PROCESSING_STATE)).toBeInTheDocument();
    expect(screen.getByText("Summary is still being generated")).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Transcript" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Participants" })).toBeInTheDocument();
    expect(screen.getAllByText("Alex").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Priya").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Thanks everyone for joining the weekly product review."),
    ).toBeInTheDocument();
  });
});
