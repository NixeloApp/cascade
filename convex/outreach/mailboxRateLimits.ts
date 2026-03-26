import type { Doc } from "../_generated/dataModel";
import { MINUTE } from "../lib/timeUtils";

export const DEFAULT_MAILBOX_DAILY_SEND_LIMIT = 50;
export const DEFAULT_MAILBOX_MINUTE_SEND_LIMIT = 15;
export const MAILBOX_SEND_WINDOW_MS = MINUTE;

type MailboxRateLimitFields = Pick<
  Doc<"outreachMailboxes">,
  | "dailySendLimit"
  | "todaySendCount"
  | "todayResetAt"
  | "minuteSendLimit"
  | "minuteSendCount"
  | "minuteWindowStartedAt"
>;

function getUtcDateKey(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

/** Read the effective daily and minute mailbox counters for a mailbox. */
export function getMailboxRateLimitSnapshot(
  mailbox: MailboxRateLimitFields,
  now: number = Date.now(),
) {
  const dailyWindowCurrent = getUtcDateKey(now) === getUtcDateKey(mailbox.todayResetAt);
  const minuteWindowCurrent = now - mailbox.minuteWindowStartedAt < MAILBOX_SEND_WINDOW_MS;

  const todaySendCount = dailyWindowCurrent ? mailbox.todaySendCount : 0;
  const minuteSendCount = minuteWindowCurrent ? mailbox.minuteSendCount : 0;
  const minuteWindowStartedAt = minuteWindowCurrent ? mailbox.minuteWindowStartedAt : now;

  return {
    todaySendCount,
    todayResetAt: dailyWindowCurrent ? mailbox.todayResetAt : now,
    minuteSendCount,
    minuteWindowStartedAt,
    minuteSendLimit: mailbox.minuteSendLimit,
  };
}

/** Create the persisted mailbox counters for newly connected mailboxes. */
export function buildMailboxRateLimitDefaults(now: number = Date.now()) {
  return {
    dailySendLimit: DEFAULT_MAILBOX_DAILY_SEND_LIMIT,
    todaySendCount: 0,
    todayResetAt: now,
    minuteSendLimit: DEFAULT_MAILBOX_MINUTE_SEND_LIMIT,
    minuteSendCount: 0,
    minuteWindowStartedAt: now,
  };
}

/** Reserve one minute-window send slot before the outbound request starts. */
export function buildMailboxSendReservationPatch(
  mailbox: MailboxRateLimitFields,
  now: number = Date.now(),
) {
  const rateLimits = getMailboxRateLimitSnapshot(mailbox, now);

  return {
    todaySendCount: rateLimits.todaySendCount,
    todayResetAt: rateLimits.todayResetAt,
    minuteSendCount: rateLimits.minuteSendCount + 1,
    minuteWindowStartedAt: rateLimits.minuteWindowStartedAt,
  };
}

/** Advance post-send mailbox counters without double-counting the reserved minute slot. */
export function buildMailboxSuccessfulSendPatch(
  mailbox: MailboxRateLimitFields,
  now: number = Date.now(),
) {
  const rateLimits = getMailboxRateLimitSnapshot(mailbox, now);

  return {
    todaySendCount: rateLimits.todaySendCount + 1,
    todayResetAt: rateLimits.todayResetAt,
    minuteSendCount: rateLimits.minuteSendCount,
    minuteWindowStartedAt: rateLimits.minuteWindowStartedAt,
  };
}
