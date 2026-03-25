import { describe, expect, it } from "vitest";
import type { MeetingDocumentInput } from "./meetingDocument";
import { buildMeetingDocumentTitle, createMeetingDocumentValue } from "./meetingDocument";

function buildMeetingInput(overrides: Partial<MeetingDocumentInput> = {}): MeetingDocumentInput {
  return {
    _creationTime: 1_710_000_000_000,
    scheduledStartTime: 1_710_000_000_000,
    duration: 1800,
    isPublic: true,
    meetingPlatform: "google_meet",
    meetingUrl: "https://meet.google.com/abc-defg-hij",
    title: "Weekly Product Review",
    participants: [
      {
        displayName: "Alex",
        email: "alex@example.com",
        userId: "user_alex",
        isHost: true,
        isExternal: false,
      },
      {
        displayName: "Priya",
        email: "priya@example.com",
        userId: "user_priya",
        isHost: false,
        isExternal: true,
      },
    ],
    summary: {
      executiveSummary: "The team aligned on the narrower launch scope.",
      keyPoints: ["Finalize scope", "Start implementation"],
      decisions: ["Ship the narrower first iteration"],
      openQuestions: ["Do we need Zoom support in v1?"],
      actionItems: [
        {
          description: "Update the spec",
          assignee: "Alex",
          assigneeUserId: "user_alex",
          dueDate: "2026-03-20",
          priority: "high",
        },
      ],
      topics: [{ title: "Scope", summary: "Team agreed to launch the smaller slice first." }],
    },
    transcript: {
      fullText: "Alex reviewed scope. Priya confirmed rollout next steps.",
      segments: [
        {
          startTime: 0,
          endTime: 12,
          speaker: "Alex",
          speakerUserId: "user_alex",
          text: "Thanks everyone for joining the weekly product review.",
        },
        {
          startTime: 12,
          endTime: 25,
          speaker: "Priya",
          speakerUserId: "user_priya",
          text: "We aligned on the narrower launch scope and next implementation steps.",
        },
      ],
    },
    ...overrides,
  };
}

describe("buildMeetingDocumentTitle", () => {
  it("prefixes the meeting title for seeded documents", () => {
    expect(buildMeetingDocumentTitle({ title: "Weekly Product Review" })).toBe(
      "Meeting Notes: Weekly Product Review",
    );
    expect(buildMeetingDocumentTitle({ title: "   " })).toBe("Meeting Notes");
  });
});

describe("createMeetingDocumentValue", () => {
  it("builds a structured meeting document with summary, action items, and transcript turns", () => {
    const value = createMeetingDocumentValue(buildMeetingInput());

    expect(value).toEqual(
      expect.arrayContaining([
        { type: "h1", children: [{ text: "Meeting Notes: Weekly Product Review" }] },
        { type: "h2", children: [{ text: "Participants" }] },
        {
          type: "ul",
          children: expect.arrayContaining([
            { type: "li", children: [{ text: "Alex (alex@example.com) — Host" }] },
          ]),
        },
        { type: "h2", children: [{ text: "Action Items" }] },
        {
          type: "todo_li",
          checked: false,
          children: [{ text: "Update the spec — Owner: Alex — Due: 2026-03-20 — Priority: high" }],
        },
      ]),
    );

    expect(value).toEqual(
      expect.arrayContaining([
        {
          type: "p",
          children: [
            { text: "Alex (0:00 - 0:12): ", bold: true },
            { text: "Thanks everyone for joining the weekly product review." },
          ],
        },
      ]),
    );
  });

  it("falls back gracefully when summary and transcript are still processing", () => {
    const value = createMeetingDocumentValue(
      buildMeetingInput({
        summary: null,
        transcript: null,
      }),
    );

    expect(value).toEqual(
      expect.arrayContaining([
        { type: "h2", children: [{ text: "Executive Summary" }] },
        {
          type: "p",
          children: [{ text: "Summary is still processing for this meeting." }],
        },
        { type: "h2", children: [{ text: "Action Items" }] },
        {
          type: "p",
          children: [{ text: "Action items will appear once the summary is available." }],
        },
        { type: "h2", children: [{ text: "Transcript" }] },
        {
          type: "p",
          children: [{ text: "Transcript is still processing for this meeting." }],
        },
      ]),
    );
  });
});
