import type { Id } from "@convex/_generated/dataModel";
import { describe, expect, it } from "vitest";
import { getOptimisticUnreadCount } from "./notifications";

const UNREAD_COUNT = 3;
const NOTIFICATION_ID_ONE = "notif-1" as Id<"notifications">;
const NOTIFICATION_ID_TWO = "notif-2" as Id<"notifications">;
const NOTIFICATION_ID_THREE = "notif-3" as Id<"notifications">;
const ARCHIVED_NOTIFICATION_ID = "archived-1" as Id<"notifications">;

describe("getOptimisticUnreadCount", () => {
  it("subtracts only queued reads that belong to the unread inbox set", () => {
    expect(
      getOptimisticUnreadCount({
        unreadCount: UNREAD_COUNT,
        unreadNotificationIds: [NOTIFICATION_ID_ONE, NOTIFICATION_ID_TWO, NOTIFICATION_ID_THREE],
        queuedReadIds: new Set([NOTIFICATION_ID_ONE, ARCHIVED_NOTIFICATION_ID]),
      }),
    ).toBe(2);
  });

  it("returns the server count when unread ids are unavailable", () => {
    expect(
      getOptimisticUnreadCount({
        unreadCount: UNREAD_COUNT,
        unreadNotificationIds: undefined,
        queuedReadIds: new Set([NOTIFICATION_ID_ONE]),
      }),
    ).toBe(UNREAD_COUNT);
  });

  it("preserves nullish counts", () => {
    expect(
      getOptimisticUnreadCount({
        unreadCount: undefined,
        unreadNotificationIds: [NOTIFICATION_ID_ONE],
        queuedReadIds: new Set([NOTIFICATION_ID_ONE]),
      }),
    ).toBeUndefined();
  });
});
