/**
 * Time Entry Form Hook
 *
 * Form state management for time entry creation and editing.
 * Supports timer, duration, and time range entry modes.
 * Handles project/issue selection and billable tracking.
 */

import type { Id } from "@convex/_generated/dataModel";
import { useEffect, useState } from "react";
import { formatDateForInput, formatDurationHuman, parseDuration } from "@/lib/formatting";

export type EntryMode = "timer" | "duration" | "timeRange";

export interface TimeEntryFormState {
  projectId: Id<"projects"> | undefined;
  issueId: Id<"issues"> | undefined;
  description: string;
  activity: string;
  billable: boolean;
  date: string;
  startTime: string;
  endTime: string;
  tags: string[];
  tagInput: string;
  entryMode: EntryMode;
  durationInput: string;
  durationSeconds: number;
  timeRangeDuration: number;
}

export interface TimeEntryFormActions {
  setProjectId: (id: Id<"projects"> | undefined) => void;
  setIssueId: (id: Id<"issues"> | undefined) => void;
  setDescription: (value: string) => void;
  setActivity: (value: string) => void;
  setBillable: (value: boolean) => void;
  setDate: (value: string) => void;
  setStartTime: (value: string) => void;
  setEndTime: (value: string) => void;
  setEntryMode: (mode: EntryMode) => void;
  setDurationInput: (value: string) => void;
  setTagInput: (value: string) => void;
  handleAddTag: () => void;
  handleRemoveTag: (tag: string) => void;
  handleQuickIncrement: (minutes: number) => void;
  clearDuration: () => void;
}

export interface TimeEntryFormProps {
  initialProjectId?: Id<"projects">;
  initialIssueId?: Id<"issues">;
  defaultMode?: "timer" | "log";
  open: boolean;
}

/**
 * Parse duration input and return seconds (0 if invalid)
 */
function parseDurationToSeconds(input: string): number {
  const parsed = parseDuration(input);
  return parsed ?? 0;
}

/**
 * Calculate duration in seconds from time range
 */
function calculateTimeRangeDuration(date: string, startTime: string, endTime: string): number {
  if (!(date && startTime && endTime)) return 0;
  try {
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    if (end <= start) return 0;
    return Math.floor((end.getTime() - start.getTime()) / 1000);
  } catch {
    return 0;
  }
}

/**
 * Custom hook for managing time entry form state
 * Extracts complex state management from TimeEntryModal to reduce cognitive complexity
 */
export function useTimeEntryForm({
  initialProjectId,
  initialIssueId,
  defaultMode = "log",
  open,
}: TimeEntryFormProps): {
  state: TimeEntryFormState;
  actions: TimeEntryFormActions;
  computed: {
    effectiveDuration: number;
    hasTaskContext: boolean;
    hasManualContext: boolean;
    hasValidContext: boolean;
    isDurationInputValid: boolean;
    isTimerMode: boolean;
  };
} {
  // Form state
  const [projectId, setProjectId] = useState<Id<"projects"> | undefined>(initialProjectId);
  const [issueId, setIssueId] = useState<Id<"issues"> | undefined>(initialIssueId);
  const [description, setDescription] = useState("");
  const [activity, setActivity] = useState("");
  const [billable, setBillable] = useState(false);

  // Log mode state
  const [date, setDate] = useState(() => formatDateForInput(Date.now()));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Entry mode: timer, duration, or timeRange
  const [entryMode, setEntryMode] = useState<EntryMode>(
    defaultMode === "timer" ? "timer" : "duration",
  );
  const [durationInput, setDurationInput] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [timeRangeDuration, setTimeRangeDuration] = useState(0);

  // Reset form when modal opens with new props
  useEffect(() => {
    if (open) {
      setProjectId(initialProjectId);
      setIssueId(initialIssueId);
      setEntryMode(defaultMode === "timer" ? "timer" : "duration");
      setDescription("");
      setActivity("");
      setBillable(false);
      setDate(formatDateForInput(Date.now()));
      setStartTime("09:00");
      setEndTime("17:00");
      setTags([]);
      setTagInput("");
      setDurationInput("");
      setDurationSeconds(0);
      setTimeRangeDuration(0);
    }
  }, [open, initialProjectId, initialIssueId, defaultMode]);

  // Parse duration input when it changes
  useEffect(() => {
    if (entryMode === "duration") {
      setDurationSeconds(parseDurationToSeconds(durationInput));
    }
  }, [durationInput, entryMode]);

  // Calculate duration from time range
  useEffect(() => {
    if (entryMode === "timeRange") {
      setTimeRangeDuration(calculateTimeRangeDuration(date, startTime, endTime));
    }
  }, [date, startTime, endTime, entryMode]);

  // Tag handlers
  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Duration handlers
  const handleQuickIncrement = (minutes: number) => {
    const newSeconds = durationSeconds + minutes * 60;
    setDurationSeconds(newSeconds);
    setDurationInput(formatDurationHuman(newSeconds));
  };

  const clearDuration = () => {
    setDurationSeconds(0);
    setDurationInput("");
  };

  // Computed values
  // Note: effectiveDuration is only used for "log time" modes (duration/timeRange).
  // In timer mode, duration is tracked by the timer component separately.
  const effectiveDuration = entryMode === "duration" ? durationSeconds : timeRangeDuration;
  const hasTaskContext = Boolean(projectId && issueId);
  const hasManualContext = Boolean(description.trim() && activity);
  const hasValidContext = hasTaskContext || hasManualContext;
  const isDurationInputValid = durationInput.trim() === "" || durationSeconds > 0;
  const isTimerMode = entryMode === "timer";

  return {
    state: {
      projectId,
      issueId,
      description,
      activity,
      billable,
      date,
      startTime,
      endTime,
      tags,
      tagInput,
      entryMode,
      durationInput,
      durationSeconds,
      timeRangeDuration,
    },
    actions: {
      setProjectId,
      setIssueId,
      setDescription,
      setActivity,
      setBillable,
      setDate,
      setStartTime,
      setEndTime,
      setEntryMode,
      setDurationInput,
      setTagInput,
      handleAddTag,
      handleRemoveTag,
      handleQuickIncrement,
      clearDuration,
    },
    computed: {
      effectiveDuration,
      hasTaskContext,
      hasManualContext,
      hasValidContext,
      isDurationInputValid,
      isTimerMode,
    },
  };
}
