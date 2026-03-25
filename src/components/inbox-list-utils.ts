import { DAY, WEEK } from "@convex/lib/timeUtils";

export const THREE_DAYS = DAY * 3;

export const INBOX_SNOOZE_PRESETS = [
  { id: "tomorrow", label: "Tomorrow", durationMs: DAY },
  { id: "three-days", label: "3 days", durationMs: THREE_DAYS },
  { id: "one-week", label: "1 week", durationMs: WEEK },
] as const;

export interface InboxSourceMeta {
  createdByUser?: {
    name?: string;
  } | null;
  source: "api" | "email" | "form" | "in_app";
  sourceEmail?: string;
}

export type InboxEmptyStateActionKind = "clearSearch" | "switchToClosed" | "switchToOpen";

export interface InboxEmptyStateConfig {
  actionKind?: InboxEmptyStateActionKind;
  actionLabel?: string;
  description: string;
  title: string;
}

/** Return the default custom snooze date as a local `YYYY-MM-DD` string. */
export function getDefaultCustomSnoozeDateValue(now = Date.now()): string {
  const date = new Date(now);
  date.setDate(date.getDate() + 1);
  return formatLocalDateInputValue(date);
}

/** Convert a custom snooze date input into a future local-noon timestamp. */
export function buildCustomSnoozeTimestamp(dateValue: string, now = Date.now()): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return null;
  }

  if (dateValue < getDefaultCustomSnoozeDateValue(now)) {
    return null;
  }

  const [year, month, day] = dateValue.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  const localDate = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (
    Number.isNaN(localDate.getTime()) ||
    localDate.getFullYear() !== year ||
    localDate.getMonth() !== month - 1 ||
    localDate.getDate() !== day
  ) {
    return null;
  }

  const timestamp = localDate.getTime();
  return timestamp > now ? timestamp : null;
}

/** Format intake source metadata into a short user-facing provenance label. */
export function formatInboxSourceLabel({
  createdByUser,
  source,
  sourceEmail,
}: InboxSourceMeta): string {
  if (source === "email") {
    return sourceEmail ? `Received via email from ${sourceEmail}` : "Received via email";
  }

  if (source === "api") {
    return sourceEmail ? `Submitted via API by ${sourceEmail}` : "Submitted via API";
  }

  if (source === "form") {
    return sourceEmail ? `Submitted from form by ${sourceEmail}` : "Submitted from form";
  }

  if (createdByUser?.name) {
    return `Submitted by ${createdByUser.name}`;
  }

  return "Submitted in app";
}

/** Build the most helpful empty-state copy for the current inbox tab. */
export function getInboxEmptyStateConfig({
  counterpartCount,
  searchActive,
  tab,
}: {
  counterpartCount: number;
  searchActive: boolean;
  tab: "open" | "closed";
}): InboxEmptyStateConfig {
  if (searchActive) {
    return {
      actionKind: "clearSearch",
      actionLabel: "Clear search",
      description: "Try a different search term or clear the current query.",
      title: "No matching items",
    };
  }

  if (tab === "open") {
    if (counterpartCount > 0) {
      return {
        actionKind: "switchToClosed",
        actionLabel: "View closed items",
        description:
          "Everything in this inbox has already been triaged. Review prior decisions in the closed tab.",
        title: "No pending items",
      };
    }

    return {
      description: "All inbox issues have been triaged. New submissions will appear here.",
      title: "No pending items",
    };
  }

  if (counterpartCount > 0) {
    return {
      actionKind: "switchToOpen",
      actionLabel: "View open items",
      description:
        "This project still has items waiting for review. Accepted, declined, and duplicate issues will collect here after triage.",
      title: "No closed items",
    };
  }

  return {
    description: "Accepted, declined, and duplicate issues will appear here.",
    title: "No closed items",
  };
}

function formatLocalDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}
