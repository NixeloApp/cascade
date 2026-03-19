import { formatDate } from "./formatting";

export const OUT_OF_OFFICE_REASON_LABELS = {
  vacation: "Vacation",
  travel: "Travel",
  sick_leave: "Sick leave",
  public_holiday: "Public holiday",
} as const;

export type OutOfOfficeReason = keyof typeof OUT_OF_OFFICE_REASON_LABELS;

export interface OutOfOfficeStatusSummary {
  startsAt: number;
  endsAt: number;
  reason: OutOfOfficeReason;
  note?: string;
  updatedAt: number;
  isActive?: boolean;
}

/**
 * Map an out-of-office reason enum to the user-facing label.
 */
export function getOutOfOfficeReasonLabel(reason: OutOfOfficeReason): string {
  return OUT_OF_OFFICE_REASON_LABELS[reason];
}

/**
 * Format the full out-of-office date window for settings and detail views.
 */
export function formatOutOfOfficeDateRange(status: OutOfOfficeStatusSummary): string {
  const start = formatDate(status.startsAt);
  const end = formatDate(status.endsAt);

  return start === end ? start : `${start} - ${end}`;
}

/**
 * Format the return label shown in assignee surfaces while a user is away.
 */
export function formatOutOfOfficeUntil(status: OutOfOfficeStatusSummary): string {
  return `Until ${formatDate(status.endsAt)}`;
}
