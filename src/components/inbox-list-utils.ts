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

function formatLocalDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}
