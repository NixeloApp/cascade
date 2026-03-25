export type MeetingParticipantLike = {
  displayName: string;
  email?: string;
  userId?: string;
  isHost?: boolean;
  isExternal?: boolean;
};

export type MeetingTranscriptSegmentLike = {
  startTime: number;
  endTime: number;
  speaker?: string;
  speakerUserId?: string;
  text: string;
};

export type MeetingActionItemLike = {
  assignee?: string;
  assigneeUserId?: string;
};

export type ResolvedMeetingPerson = {
  key: string;
  displayName: string;
  email?: string;
  userId?: string;
  isHost: boolean;
  isExternal: boolean;
  source: "participant" | "label" | "unknown";
};

export type TranscriptSpeakerSummary = ResolvedMeetingPerson & {
  segmentCount: number;
  totalDurationSeconds: number;
};

export type TranscriptTurn<TSegment extends MeetingTranscriptSegmentLike> = {
  key: string;
  speaker: ResolvedMeetingPerson;
  startTime: number;
  endTime: number;
  segments: TSegment[];
};

type ParticipantDirectory<TParticipant extends MeetingParticipantLike> = {
  byUserId: Map<string, TParticipant>;
  uniqueByName: Map<string, TParticipant>;
};

function normalizeMeetingText(value?: string) {
  const normalized = value?.trim().toLowerCase().replace(/\s+/g, " ");
  return normalized && normalized.length > 0 ? normalized : undefined;
}

function createParticipantDirectory<TParticipant extends MeetingParticipantLike>(
  participants: readonly TParticipant[],
): ParticipantDirectory<TParticipant> {
  const byUserId = new Map<string, TParticipant>();
  const participantsByName = new Map<string, TParticipant[]>();

  for (const participant of participants) {
    if (participant.userId) {
      byUserId.set(participant.userId, participant);
    }

    const normalizedName = normalizeMeetingText(participant.displayName);
    if (!normalizedName) continue;

    const existing = participantsByName.get(normalizedName) ?? [];
    existing.push(participant);
    participantsByName.set(normalizedName, existing);
  }

  const uniqueByName = new Map<string, TParticipant>();
  for (const [normalizedName, matchingParticipants] of participantsByName) {
    if (matchingParticipants.length === 1) {
      uniqueByName.set(normalizedName, matchingParticipants[0]);
    }
  }

  return { byUserId, uniqueByName };
}

function toResolvedParticipant<TParticipant extends MeetingParticipantLike>(
  participant: TParticipant,
): ResolvedMeetingPerson {
  const normalizedName = normalizeMeetingText(participant.displayName) ?? "participant";

  return {
    key: participant.userId ? `user:${participant.userId}` : `participant:${normalizedName}`,
    displayName: participant.displayName,
    email: participant.email,
    userId: participant.userId,
    isHost: participant.isHost === true,
    isExternal: participant.isExternal === true,
    source: "participant",
  };
}

function resolveParticipantByName<TParticipant extends MeetingParticipantLike>(
  participantDirectory: ParticipantDirectory<TParticipant>,
  label?: string,
) {
  const normalizedLabel = normalizeMeetingText(label);
  if (!normalizedLabel) return undefined;
  return participantDirectory.uniqueByName.get(normalizedLabel);
}

function resolveTranscriptSpeakerWithDirectory<TParticipant extends MeetingParticipantLike>(
  segment: MeetingTranscriptSegmentLike,
  participantDirectory: ParticipantDirectory<TParticipant>,
): ResolvedMeetingPerson {
  if (segment.speakerUserId) {
    const matchedParticipant = participantDirectory.byUserId.get(segment.speakerUserId);
    if (matchedParticipant) {
      return toResolvedParticipant(matchedParticipant);
    }
  }

  const matchedParticipant = resolveParticipantByName(participantDirectory, segment.speaker);
  if (matchedParticipant) {
    return toResolvedParticipant(matchedParticipant);
  }

  const normalizedSpeaker = normalizeMeetingText(segment.speaker);
  if (normalizedSpeaker && segment.speaker) {
    return {
      key: `label:${normalizedSpeaker}`,
      displayName: segment.speaker,
      isHost: false,
      isExternal: false,
      source: "label",
    };
  }

  return {
    key: "unknown",
    displayName: "Unknown speaker",
    isHost: false,
    isExternal: false,
    source: "unknown",
  };
}

function resolveActionItemAssigneeWithDirectory<TParticipant extends MeetingParticipantLike>(
  actionItem: MeetingActionItemLike,
  participantDirectory: ParticipantDirectory<TParticipant>,
): ResolvedMeetingPerson | null {
  if (actionItem.assigneeUserId) {
    const matchedParticipant = participantDirectory.byUserId.get(actionItem.assigneeUserId);
    if (matchedParticipant) {
      return toResolvedParticipant(matchedParticipant);
    }
  }

  const matchedParticipant = resolveParticipantByName(participantDirectory, actionItem.assignee);
  if (matchedParticipant) {
    return toResolvedParticipant(matchedParticipant);
  }

  const normalizedAssignee = normalizeMeetingText(actionItem.assignee);
  if (normalizedAssignee && actionItem.assignee) {
    return {
      key: `assignee:${normalizedAssignee}`,
      displayName: actionItem.assignee,
      isHost: false,
      isExternal: false,
      source: "label",
    };
  }

  return null;
}

function matchesTranscriptQuery<TParticipant extends MeetingParticipantLike>(
  segment: MeetingTranscriptSegmentLike,
  resolvedSpeaker: ResolvedMeetingPerson,
  participantDirectory: ParticipantDirectory<TParticipant>,
  query: string,
) {
  const normalizedQuery = normalizeMeetingText(query);
  if (!normalizedQuery) return true;

  const matchedParticipant = resolveParticipantByName(participantDirectory, segment.speaker);
  const searchableValues = [
    segment.text,
    segment.speaker,
    resolvedSpeaker.displayName,
    resolvedSpeaker.email,
    matchedParticipant?.email,
  ];

  return searchableValues.some((value) => normalizeMeetingText(value)?.includes(normalizedQuery));
}

/**
 * Resolve the best available speaker identity for a transcript segment.
 * Prefers explicit user ids, then unique participant-name matches, then raw labels.
 */
export function resolveTranscriptSpeaker<TParticipant extends MeetingParticipantLike>(
  segment: MeetingTranscriptSegmentLike,
  participants: readonly TParticipant[],
): ResolvedMeetingPerson {
  const participantDirectory = createParticipantDirectory(participants);
  return resolveTranscriptSpeakerWithDirectory(segment, participantDirectory);
}

/**
 * Resolve the best available assignee identity for a summarized meeting action item.
 */
export function resolveActionItemAssignee<TParticipant extends MeetingParticipantLike>(
  actionItem: MeetingActionItemLike,
  participants: readonly TParticipant[],
): ResolvedMeetingPerson | null {
  const participantDirectory = createParticipantDirectory(participants);
  return resolveActionItemAssigneeWithDirectory(actionItem, participantDirectory);
}

/**
 * Build speaker summaries for a transcript in first-appearance order.
 */
export function listTranscriptSpeakers<
  TSegment extends MeetingTranscriptSegmentLike,
  TParticipant extends MeetingParticipantLike,
>(
  segments: readonly TSegment[],
  participants: readonly TParticipant[],
): TranscriptSpeakerSummary[] {
  const speakersByKey = new Map<string, TranscriptSpeakerSummary>();
  const participantDirectory = createParticipantDirectory(participants);

  for (const segment of segments) {
    if (segment.text.trim().length === 0) continue;

    const speaker = resolveTranscriptSpeakerWithDirectory(segment, participantDirectory);
    const existing = speakersByKey.get(speaker.key);
    const segmentDuration = Math.max(0, segment.endTime - segment.startTime);

    if (existing) {
      existing.segmentCount += 1;
      existing.totalDurationSeconds += segmentDuration;
      continue;
    }

    speakersByKey.set(speaker.key, {
      ...speaker,
      segmentCount: 1,
      totalDurationSeconds: segmentDuration,
    });
  }

  return [...speakersByKey.values()];
}

/**
 * Group filtered transcript segments into consecutive speaker turns for UI rendering.
 */
export function buildTranscriptTurns<
  TSegment extends MeetingTranscriptSegmentLike,
  TParticipant extends MeetingParticipantLike,
>(
  segments: readonly TSegment[],
  participants: readonly TParticipant[],
  query = "",
): TranscriptTurn<TSegment>[] {
  const participantDirectory = createParticipantDirectory(participants);
  const matchingSegments = segments.filter((segment) => {
    if (segment.text.trim().length === 0) return false;

    const resolvedSpeaker = resolveTranscriptSpeakerWithDirectory(segment, participantDirectory);
    return matchesTranscriptQuery(segment, resolvedSpeaker, participantDirectory, query);
  });

  const turns: TranscriptTurn<TSegment>[] = [];

  for (const segment of matchingSegments) {
    const speaker = resolveTranscriptSpeakerWithDirectory(segment, participantDirectory);
    const previousTurn = turns[turns.length - 1];

    if (previousTurn && previousTurn.speaker.key === speaker.key) {
      previousTurn.segments.push(segment);
      previousTurn.endTime = segment.endTime;
      continue;
    }

    turns.push({
      key: `${speaker.key}:${segment.startTime}:${segment.endTime}`,
      speaker,
      startTime: segment.startTime,
      endTime: segment.endTime,
      segments: [segment],
    });
  }

  return turns;
}
