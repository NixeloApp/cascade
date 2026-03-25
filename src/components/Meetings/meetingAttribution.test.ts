import { describe, expect, it } from "vitest";
import {
  buildTranscriptTurns,
  listTranscriptSpeakers,
  resolveActionItemAssignee,
  resolveTranscriptSpeaker,
} from "./meetingAttribution";

const participants = [
  {
    displayName: "Alex Morgan",
    email: "alex@example.com",
    userId: "user_alex",
    isHost: true,
    isExternal: false,
  },
  {
    displayName: "Priya Shah",
    email: "priya@example.com",
    userId: "user_priya",
    isHost: false,
    isExternal: true,
  },
] as const;

describe("meetingAttribution", () => {
  it("resolves transcript speakers by user id before falling back to labels", () => {
    const speaker = resolveTranscriptSpeaker(
      {
        startTime: 0,
        endTime: 8,
        speaker: "Someone else",
        speakerUserId: "user_alex",
        text: "Welcome everyone.",
      },
      participants,
    );

    expect(speaker).toEqual(
      expect.objectContaining({
        displayName: "Alex Morgan",
        email: "alex@example.com",
        isHost: true,
        source: "participant",
      }),
    );
  });

  it("keeps ambiguous name-only matches as raw labels instead of guessing the participant", () => {
    const ambiguousParticipants = [
      {
        displayName: "Alex",
        email: "alex-1@example.com",
        userId: "user_alex_1",
      },
      {
        displayName: "Alex",
        email: "alex-2@example.com",
        userId: "user_alex_2",
      },
    ] as const;

    const speaker = resolveTranscriptSpeaker(
      {
        startTime: 0,
        endTime: 6,
        speaker: "Alex",
        text: "We should verify the rollout timing.",
      },
      ambiguousParticipants,
    );

    expect(speaker).toEqual(
      expect.objectContaining({
        displayName: "Alex",
        source: "label",
      }),
    );
    expect("email" in speaker).toBe(false);
    expect("userId" in speaker).toBe(false);
  });

  it("groups consecutive turns and supports email-based transcript filtering", () => {
    const turns = buildTranscriptTurns(
      [
        {
          startTime: 0,
          endTime: 8,
          speaker: "Alex Morgan",
          speakerUserId: "user_alex",
          text: "Thanks for joining.",
        },
        {
          startTime: 8,
          endTime: 14,
          speaker: "Alex Morgan",
          speakerUserId: "user_alex",
          text: "We can keep the launch focused.",
        },
        {
          startTime: 14,
          endTime: 22,
          speaker: "Priya Shah",
          speakerUserId: "user_priya",
          text: "I will coordinate the partner follow-up.",
        },
      ],
      participants,
      "priya@example.com",
    );

    expect(turns).toHaveLength(1);
    expect(turns[0]).toEqual(
      expect.objectContaining({
        speaker: expect.objectContaining({
          displayName: "Priya Shah",
          email: "priya@example.com",
        }),
        startTime: 14,
        endTime: 22,
      }),
    );
    expect(turns[0].segments).toHaveLength(1);
  });

  it("resolves action item assignees and speaker summaries from participant metadata", () => {
    const assignee = resolveActionItemAssignee(
      {
        assignee: "Alex Morgan",
      },
      participants,
    );
    const speakers = listTranscriptSpeakers(
      [
        {
          startTime: 0,
          endTime: 8,
          speaker: "Alex Morgan",
          speakerUserId: "user_alex",
          text: "Thanks for joining.",
        },
        {
          startTime: 8,
          endTime: 18,
          speaker: "Alex Morgan",
          speakerUserId: "user_alex",
          text: "We can keep the launch focused.",
        },
      ],
      participants,
    );

    expect(assignee).toEqual(
      expect.objectContaining({
        displayName: "Alex Morgan",
        email: "alex@example.com",
        source: "participant",
      }),
    );
    expect(speakers).toEqual([
      expect.objectContaining({
        displayName: "Alex Morgan",
        segmentCount: 2,
        totalDurationSeconds: 18,
      }),
    ]);
  });
});
