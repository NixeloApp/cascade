import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { ReactNode } from "react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, waitFor } from "@/test/custom-render";
import { MeetingRecordingSection } from "./MeetingRecordingSection";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("./ui/LoadingSpinner", () => ({
  LoadingSpinner: () => <div>loading-spinner</div>,
  InlineSpinner: () => <div>inline-spinner</div>,
}));

vi.mock("./ui/Badge", () => ({
  Badge: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("./ui/Button", () => ({
  Button: ({
    children,
    onClick,
    isLoading,
  }: {
    children: ReactNode;
    onClick?: () => void;
    isLoading?: boolean;
  }) => (
    <button type="button" onClick={onClick} disabled={isLoading}>
      {children}
    </button>
  ),
}));

vi.mock("./ui/Card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("./ui/Collapsible", () => ({
  Collapsible: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CollapsibleContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CollapsibleHeader: ({ children, badge }: { children: ReactNode; badge?: ReactNode }) => (
    <div>
      <div>{children}</div>
      {badge}
    </div>
  ),
}));

vi.mock("./ui/ConfirmDialog", () => ({
  ConfirmDialog: ({
    isOpen,
    title,
    message,
    confirmLabel,
    onConfirm,
  }: {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  }) =>
    isOpen ? (
      <div>
        <div>{title}</div>
        <div>{message}</div>
        <button type="button" onClick={onConfirm}>
          {confirmLabel ?? "Confirm"}
        </button>
      </div>
    ) : null,
}));

vi.mock("./ui/Flex", () => ({
  Flex: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  FlexItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("./ui/Icon", () => ({
  Icon: ({ children, className }: { children?: ReactNode; className?: string }) => (
    <span className={className}>{children ?? "icon"}</span>
  ),
}));

vi.mock("./ui/List", () => ({
  List: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("./ui/Metadata", () => ({
  Metadata: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  MetadataItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("./ui/ScrollArea", () => ({
  ScrollArea: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("./ui/Separator", () => ({
  Separator: () => <div />,
}));

vi.mock("./ui/Stack", () => ({
  Stack: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("./ui/Typography", () => ({
  Typography: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockShowSuccess = vi.mocked(showSuccess);
const mockShowError = vi.mocked(showError);

type MutationProcedure = (
  ...args: Parameters<ReturnType<typeof useAuthenticatedMutation>["mutate"]>
) => ReturnType<ReturnType<typeof useAuthenticatedMutation>["mutate"]>;

function createMutationMock(
  mockProcedure: Mock<MutationProcedure>,
): ReactMutation<FunctionReference<"mutation">> {
  const mutation = ((...args: Parameters<typeof mockProcedure>) =>
    mockProcedure(...args)) as ReactMutation<FunctionReference<"mutation">>;
  mutation.withOptimisticUpdate = () => mutation;
  return mutation;
}

const scheduleRecording = vi.fn<MutationProcedure>();
const cancelRecording = vi.fn<MutationProcedure>();

const calendarEventId = "calendar_1" as Id<"calendarEvents">;
const recordingId = "recording_1" as Id<"meetingRecordings">;

let currentRecording:
  | {
      _id: Id<"meetingRecordings">;
      status: string;
      errorMessage?: string;
    }
  | null
  | undefined;
let currentRecordingDetails:
  | {
      summary?: {
        executiveSummary: string;
        keyPoints: string[];
        actionItems: Array<{ description: string; assignee?: string; dueDate?: string }>;
        decisions: string[];
      };
      transcript?: {
        fullText: string;
        wordCount: number;
        speakerCount?: number;
      };
      duration?: number;
    }
  | null
  | undefined;

describe("MeetingRecordingSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentRecording = null;
    currentRecordingDetails = null;
    scheduleRecording.mockResolvedValue(undefined);
    cancelRecording.mockResolvedValue(undefined);

    mockUseAuthenticatedQuery.mockImplementation((_query, args) => {
      if (typeof args === "object" && args && "recordingId" in args) {
        return currentRecordingDetails;
      }
      if (typeof args === "object" && args && "calendarEventId" in args) {
        return currentRecording;
      }
      return undefined;
    });

    let mutationCallCount = 0;
    mockUseAuthenticatedMutation.mockImplementation(() => {
      mutationCallCount += 1;
      return mutationCallCount % 2 === 1
        ? {
            mutate: createMutationMock(scheduleRecording),
            canAct: true,
            isAuthLoading: false,
          }
        : {
            mutate: createMutationMock(cancelRecording),
            canAct: true,
            isAuthLoading: false,
          };
    });
  });

  it("renders the empty state and schedules a meeting recording", async () => {
    const user = userEvent.setup();

    render(
      <MeetingRecordingSection
        calendarEventId={calendarEventId}
        meetingUrl="https://meet.google.com/abc-defg-hij"
        meetingTitle="Product Sync"
        scheduledStartTime={1_700_000_000_000}
      />,
    );

    expect(screen.getByText("AI Meeting Notes")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Schedule a bot to join this meeting and automatically generate transcripts and summaries.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Enable AI Notes" }));

    await waitFor(() =>
      expect(scheduleRecording).toHaveBeenCalledWith({
        calendarEventId,
        meetingUrl: "https://meet.google.com/abc-defg-hij",
        title: "Product Sync",
        meetingPlatform: "google_meet",
        scheduledStartTime: 1_700_000_000_000,
        isPublic: true,
      }),
    );
    expect(mockShowSuccess).toHaveBeenCalledWith(
      "Recording scheduled! Bot will join at meeting time.",
    );
  });

  it("renders the scheduled state and confirms cancellation", async () => {
    const user = userEvent.setup();
    currentRecording = { _id: recordingId, status: "scheduled" };

    render(
      <MeetingRecordingSection
        calendarEventId={calendarEventId}
        meetingUrl="https://zoom.us/j/123"
        meetingTitle="Standup"
        scheduledStartTime={1_700_000_000_000}
      />,
    );

    expect(screen.getByText("Scheduled")).toBeInTheDocument();
    expect(screen.getByText("Bot scheduled to join")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getAllByText("Cancel Recording")).toHaveLength(2);
    expect(screen.getByText("Cancel the scheduled recording?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel Recording" }));

    await waitFor(() => expect(cancelRecording).toHaveBeenCalledWith({ recordingId }));
    expect(mockShowSuccess).toHaveBeenCalledWith("Recording cancelled");
  });

  it("renders the failed state and surfaces retry errors", async () => {
    const user = userEvent.setup();
    const error = new Error("retry failed");
    currentRecording = {
      _id: recordingId,
      status: "failed",
      errorMessage: "Bot could not join the meeting",
    };
    scheduleRecording.mockRejectedValueOnce(error);

    render(
      <MeetingRecordingSection
        calendarEventId={calendarEventId}
        meetingUrl="https://teams.microsoft.com/l/meetup-join/123"
        meetingTitle="Ops Review"
        scheduledStartTime={1_700_000_000_000}
      />,
    );

    expect(screen.getByText("Recording failed")).toBeInTheDocument();
    expect(screen.getByText("Bot could not join the meeting")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try Again" }));

    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith(error, "Failed to schedule recording"),
    );
  });

  it("renders completed recording results with summary, action items, decisions, and stats", () => {
    currentRecording = { _id: recordingId, status: "completed" };
    currentRecordingDetails = {
      summary: {
        executiveSummary: "The team aligned on scope and delivery timing.",
        keyPoints: ["Finalize the spec", "Share the rollout plan"],
        actionItems: [
          {
            description: "Update the implementation brief",
            assignee: "Alex",
            dueDate: "2026-03-20",
          },
        ],
        decisions: ["Launch to the beta cohort first"],
      },
      transcript: {
        fullText: "Full transcript text",
        wordCount: 1234,
        speakerCount: 3,
      },
      duration: 1800,
    };

    render(
      <MeetingRecordingSection
        calendarEventId={calendarEventId}
        meetingUrl="https://meet.google.com/abc-defg-hij"
        meetingTitle="Weekly Review"
        scheduledStartTime={1_700_000_000_000}
      />,
    );

    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Summary")).toBeInTheDocument();
    expect(screen.getByText("The team aligned on scope and delivery timing.")).toBeInTheDocument();
    expect(screen.getByText("Key Points")).toBeInTheDocument();
    expect(screen.getByText("Finalize the spec")).toBeInTheDocument();
    expect(screen.getByText("Action Items")).toBeInTheDocument();
    expect(screen.getByText("Update the implementation brief")).toBeInTheDocument();
    expect(screen.getByText("Alex")).toBeInTheDocument();
    expect(screen.getByText("Due: 2026-03-20")).toBeInTheDocument();
    expect(screen.getByText("Decisions Made")).toBeInTheDocument();
    expect(screen.getByText("Launch to the beta cohort first")).toBeInTheDocument();
    expect(screen.getByText("Show Full Transcript")).toBeInTheDocument();
    expect(screen.getByText("Full transcript text")).toBeInTheDocument();
    expect(screen.getByText("1,234 words")).toBeInTheDocument();
    expect(screen.getByText("30 min")).toBeInTheDocument();
    expect(screen.getByText("3 speakers")).toBeInTheDocument();
  });
});
