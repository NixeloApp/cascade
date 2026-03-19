import type { Doc } from "../_generated/dataModel";

export type StoredOutOfOfficeStatus = NonNullable<Doc<"users">["outOfOffice"]>;

export function isOutOfOfficeActive(
  status: StoredOutOfOfficeStatus | undefined,
  now = Date.now(),
): boolean {
  if (!status) {
    return false;
  }

  return status.startsAt <= now && status.endsAt >= now;
}

export function getActiveOutOfOfficeStatus(
  user: Doc<"users"> | null | undefined,
  now = Date.now(),
): StoredOutOfOfficeStatus | undefined {
  const status = user?.outOfOffice;
  if (!status) {
    return undefined;
  }

  return isOutOfOfficeActive(status, now) ? status : undefined;
}
