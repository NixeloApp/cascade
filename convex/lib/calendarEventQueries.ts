import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { MAX_PAGE_SIZE } from "./queryLimits";

/**
 * Query calendar events where user is an attendee within a time range.
 * Uses time-based index + in-memory filter for reliable array membership check.
 */
export async function queryCalendarEventsByAttendeeInRange(
  ctx: QueryCtx,
  attendeeId: Id<"users">,
  startDate: number,
  endDate: number,
) {
  const candidates = await ctx.db
    .query("calendarEvents")
    .withIndex("by_start_time", (q) => q.gte("startTime", startDate).lte("startTime", endDate))
    .take(MAX_PAGE_SIZE);

  return candidates.filter((event) => event.attendeeIds.includes(attendeeId));
}
