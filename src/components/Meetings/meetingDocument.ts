import type { Value } from "platejs";
import { formatDateTime, formatDurationHuman } from "@/lib/formatting";
import {
  buildTranscriptTurns,
  type MeetingActionItemLike,
  type MeetingParticipantLike,
  type MeetingTranscriptSegmentLike,
  resolveActionItemAssignee,
} from "./meetingAttribution";

type MeetingPlatform = "google_meet" | "zoom" | "teams" | "other";

type MeetingTopicLike = {
  summary: string;
  title: string;
};

type MeetingSummaryLike = {
  actionItems: Array<
    MeetingActionItemLike & {
      description: string;
      dueDate?: string;
      issueCreated?: string;
      priority?: string;
    }
  >;
  decisions: string[];
  executiveSummary: string;
  keyPoints: string[];
  openQuestions: string[];
  topics: MeetingTopicLike[];
};

type MeetingTranscriptLike = {
  fullText: string;
  segments: MeetingTranscriptSegmentLike[];
};

export type MeetingDocumentInput = {
  _creationTime: number;
  duration?: number;
  isPublic: boolean;
  meetingPlatform: MeetingPlatform;
  meetingUrl?: string;
  participants: MeetingParticipantLike[];
  scheduledStartTime?: number;
  summary?: MeetingSummaryLike | null;
  title: string;
  transcript?: MeetingTranscriptLike | null;
};

type PlateTextLeaf = {
  bold?: boolean;
  text: string;
};

type PlateChild = PlateTextLeaf | PlateElement;

type PlateElement = {
  checked?: boolean;
  children: PlateChild[];
  type: string;
};

function text(value: string, options?: { bold?: boolean }): PlateTextLeaf {
  return {
    text: value,
    bold: options?.bold === true ? true : undefined,
  };
}

function paragraph(children: PlateChild[]): PlateElement {
  return {
    type: "p",
    children: children.length > 0 ? children : [{ text: "" }],
  };
}

function heading(level: 1 | 2 | 3, value: string): PlateElement {
  return {
    type: `h${level}`,
    children: [text(value)],
  };
}

function bulletList(items: string[]): PlateElement {
  return {
    type: "ul",
    children: items.map((item) => ({
      type: "li",
      children: [text(item)],
    })),
  };
}

function todoItem(value: string): PlateElement {
  return {
    type: "todo_li",
    checked: false,
    children: [text(value)],
  };
}

function formatMeetingPlatform(platform: MeetingPlatform) {
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

function buildActionItemLine(
  actionItem: MeetingSummaryLike["actionItems"][number],
  participants: MeetingParticipantLike[],
) {
  const parts = [actionItem.description.trim()];
  const resolvedAssignee = resolveActionItemAssignee(actionItem, participants);
  const assigneeLabel = resolvedAssignee?.displayName ?? actionItem.assignee?.trim();

  if (assigneeLabel) {
    parts.push(`Owner: ${assigneeLabel}`);
  }

  if (actionItem.dueDate?.trim()) {
    parts.push(`Due: ${actionItem.dueDate.trim()}`);
  }

  if (actionItem.priority?.trim()) {
    parts.push(`Priority: ${actionItem.priority.trim()}`);
  }

  if (actionItem.issueCreated) {
    parts.push("Linked to issue");
  }

  return parts.join(" — ");
}

function buildParticipantLine(participant: MeetingParticipantLike) {
  const identity =
    participant.email?.trim() && participant.email.trim() !== participant.displayName.trim()
      ? `${participant.displayName} (${participant.email.trim()})`
      : participant.displayName;
  const badges = [
    participant.isHost ? "Host" : null,
    participant.isExternal ? "External" : null,
  ].filter((badge): badge is string => badge !== null);

  return badges.length > 0 ? `${identity} — ${badges.join(", ")}` : identity;
}

/** Builds the default title used when exporting a meeting into the documents workspace. */
export function buildMeetingDocumentTitle(recording: Pick<MeetingDocumentInput, "title">) {
  const title = recording.title.trim();
  return title.length > 0 ? `Meeting Notes: ${title}` : "Meeting Notes";
}

function createMeetingDetailBlocks(recording: MeetingDocumentInput): PlateElement[] {
  const occurredAt = recording.scheduledStartTime ?? recording._creationTime;
  const blocks: PlateElement[] = [
    heading(1, buildMeetingDocumentTitle(recording)),
    heading(2, "Meeting Details"),
    paragraph([text("Date: ", { bold: true }), text(formatDateTime(occurredAt))]),
    paragraph([
      text("Platform: ", { bold: true }),
      text(formatMeetingPlatform(recording.meetingPlatform)),
    ]),
    paragraph([
      text("Visibility: ", { bold: true }),
      text(recording.isPublic ? "Shared in project" : "Private"),
    ]),
  ];

  if (recording.meetingUrl?.trim()) {
    blocks.push(paragraph([text("Meeting URL: ", { bold: true }), text(recording.meetingUrl)]));
  }

  if (recording.duration) {
    blocks.push(
      paragraph([
        text("Duration: ", { bold: true }),
        text(formatDurationHuman(recording.duration)),
      ]),
    );
  }

  return blocks;
}

function createParticipantsBlocks(participants: MeetingParticipantLike[]): PlateElement[] {
  if (participants.length === 0) {
    return [];
  }

  return [heading(2, "Participants"), bulletList(participants.map(buildParticipantLine))];
}

function createSummaryListBlocks(title: string, items: string[]): PlateElement[] {
  if (items.length === 0) {
    return [];
  }

  return [heading(2, title), bulletList(items)];
}

function createActionItemBlocks(
  summary: MeetingSummaryLike | null | undefined,
  participants: MeetingParticipantLike[],
): PlateElement[] {
  if (!summary) {
    return [
      heading(2, "Action Items"),
      paragraph([text("Action items will appear once the summary is available.")]),
    ];
  }

  if (summary.actionItems.length === 0) {
    return [
      heading(2, "Action Items"),
      paragraph([text("No action items were captured for this meeting.")]),
    ];
  }

  return [
    heading(2, "Action Items"),
    ...summary.actionItems.map((actionItem) =>
      todoItem(buildActionItemLine(actionItem, participants)),
    ),
  ];
}

function createTopicBlocks(topics: MeetingTopicLike[]): PlateElement[] {
  if (topics.length === 0) {
    return [];
  }

  return [
    heading(2, "Topics"),
    ...topics.flatMap((topic) => [heading(3, topic.title), paragraph([text(topic.summary)])]),
  ];
}

function createSummaryBlocks(recording: MeetingDocumentInput): PlateElement[] {
  const summaryBlocks: PlateElement[] = [heading(2, "Executive Summary")];

  if (recording.summary?.executiveSummary.trim()) {
    summaryBlocks.push(paragraph([text(recording.summary.executiveSummary.trim())]));
  } else {
    summaryBlocks.push(paragraph([text("Summary is still processing for this meeting.")]));
  }

  summaryBlocks.push(...createSummaryListBlocks("Key Points", recording.summary?.keyPoints ?? []));
  summaryBlocks.push(...createSummaryListBlocks("Decisions", recording.summary?.decisions ?? []));
  summaryBlocks.push(
    ...createSummaryListBlocks("Open Questions", recording.summary?.openQuestions ?? []),
  );
  summaryBlocks.push(...createActionItemBlocks(recording.summary, recording.participants));
  summaryBlocks.push(...createTopicBlocks(recording.summary?.topics ?? []));

  return summaryBlocks;
}

function createTranscriptBlocks(recording: MeetingDocumentInput): PlateElement[] {
  const transcriptBlocks: PlateElement[] = [heading(2, "Transcript")];

  if (recording.transcript?.segments.length) {
    const turns = buildTranscriptTurns(recording.transcript.segments, recording.participants);

    return [
      ...transcriptBlocks,
      ...turns.map((turn) =>
        paragraph([
          text(
            `${turn.speaker.displayName} (${formatTranscriptTimestamp(turn.startTime)} - ${formatTranscriptTimestamp(turn.endTime)}): `,
            { bold: true },
          ),
          text(
            turn.segments
              .map((segment) => segment.text.trim())
              .join(" ")
              .trim(),
          ),
        ]),
      ),
    ];
  }

  if (recording.transcript?.fullText.trim()) {
    transcriptBlocks.push(paragraph([text(recording.transcript.fullText.trim())]));
    return transcriptBlocks;
  }

  transcriptBlocks.push(paragraph([text("Transcript is still processing for this meeting.")]));
  return transcriptBlocks;
}

/**
 * Converts meeting detail data into a seeded Plate document so exported notes
 * open with summary, action items, participants, and transcript context intact.
 */
export function createMeetingDocumentValue(recording: MeetingDocumentInput): Value {
  const value: PlateElement[] = [
    ...createMeetingDetailBlocks(recording),
    ...createParticipantsBlocks(recording.participants),
    ...createSummaryBlocks(recording),
    ...createTranscriptBlocks(recording),
  ];

  return value as Value;
}
