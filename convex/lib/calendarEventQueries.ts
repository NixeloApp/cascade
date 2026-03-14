import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { MAX_PAGE_SIZE } from "./queryLimits";

/**
 * Query calendar events where user is an attendee within a time range.
 *
 * Uses multikey index on attendeeIds - Convex creates an index entry per array element,
 * so we query with the scalar attendeeId. The cast is required because Convex types
 * expect array type but runtime correctly matches scalar against indexed elements.
 */
export async function queryCalendarEventsByAttendeeInRange(
  ctx: QueryCtx,
  attendeeId: Id<"users">,
  startDate: number,
  endDate: number,
) {
  // Convex multikey index: query scalar value against array field
  // Type system expects array but runtime matches individual elements
  const attendeeIdForIndex = attendeeId as unknown as Id<"users">[];

  return await ctx.db
    .query("calendarEvents")
    .withIndex("by_attendee_start", (q) =>
      q.eq("attendeeIds", attendeeIdForIndex).gte("startTime", startDate).lte("startTime", endDate),
    )
    .take(MAX_PAGE_SIZE);
}
