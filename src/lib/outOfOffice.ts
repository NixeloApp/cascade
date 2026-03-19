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

export function getOutOfOfficeReasonLabel(reason: OutOfOfficeReason): string {
  return OUT_OF_OFFICE_REASON_LABELS[reason];
}

export function formatOutOfOfficeDateRange(status: OutOfOfficeStatusSummary): string {
  const start = formatDate(status.startsAt);
  const end = formatDate(status.endsAt);

  return start === end ? start : `${start} - ${end}`;
}

export function formatOutOfOfficeUntil(status: OutOfOfficeStatusSummary): string {
  return `Until ${formatDate(status.endsAt)}`;
}
