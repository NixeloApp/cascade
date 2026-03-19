import type { Id } from "@convex/_generated/dataModel";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { render, screen } from "@/test/custom-render";
import { MeetingsWorkspace } from "./MeetingsWorkspace";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
}));

const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);

const recordingId = "recording_1" as Id<"meetingRecordings">;

describe("MeetingsWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders an empty state when there are no recordings", () => {
    mockUseAuthenticatedQuery.mockImplementation((_query, args) => {
      if (typeof args === "object" && args && "limit" in args) {
        return [];
      }
      return undefined;
    });

    render(<MeetingsWorkspace />);

    expect(screen.getByText("No meeting recordings yet")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Schedule AI Meeting Notes from a calendar event to start capturing transcripts, summaries, and follow-up work.",
      ),
    ).toBeInTheDocument();
  });

  it("renders recording details for the selected meeting", () => {
    mockUseAuthenticatedQuery.mockImplementation((_query, args) => {
      if (typeof args === "object" && args && "limit" in args) {
        return [
          {
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
            createdBy: "user_1",
            projectId: undefined,
            isPublic: true,
            createdAt: 1_710_000_000_000,
            updatedAt: 1_710_000_100_000,
            calendarEvent: null,
            hasTranscript: true,
            hasSummary: true,
          },
        ];
      }

      if (typeof args === "object" && args && "recordingId" in args && args.recordingId === recordingId) {
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
          createdBy: "user_1",
          projectId: undefined,
          isPublic: true,
          updatedAt: 1_710_000_100_000,
          createdAt: 1_710_000_000_000,
          calendarEvent: null,
          participants: [
            {
              _id: "participant_1",
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
            _id: "transcript_1",
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
            _id: "summary_1",
            _creationTime: 1_710_000_000_000,
            recordingId,
            transcriptId: "transcript_1",
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
        };
      }

      return undefined;
    });

    render(<MeetingsWorkspace />);

    expect(screen.getAllByText("Weekly Product Review")).toHaveLength(2);
    expect(screen.getByText("The team aligned on delivery scope.")).toBeInTheDocument();
    expect(screen.getByText("Update the spec")).toBeInTheDocument();
    expect(screen.getByText("Do we need Zoom support in v1?")).toBeInTheDocument();
    expect(screen.getAllByText("Alex")).toHaveLength(2);
    expect(screen.getByText("Full transcript text")).toBeInTheDocument();
  });
});
