import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { MAX_PAGE_SIZE } from "./queryLimits";

/**
 * Convex currently types multikey index equality too narrowly for array-backed keys.
 * Keep that library-boundary cast isolated here instead of leaking it into product queries.
 */
export async function queryCalendarEventsByAttendeeInRange(
  ctx: QueryCtx,
  attendeeId: Id<"users">,
  startDate: number,
  endDate: number,
) {
  return await ctx.db
    .query("calendarEvents")
    .withIndex("by_attendee_start", (q) =>
      q.eq("attendeeIds", [attendeeId]).gte("startTime", startDate).lte("startTime", endDate),
    )
    .take(MAX_PAGE_SIZE);
}
