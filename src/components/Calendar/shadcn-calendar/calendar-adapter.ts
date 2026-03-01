import type { Doc, Id } from "@convex/_generated/dataModel";
import { EVENT_TYPE_DEFAULT_COLOR } from "../calendar-colors";
import type { NixeloCalendarEvent } from "./calendar-types";

/**
 * Converts a Convex calendar event document to the internal calendar format.
 */
export function toCalendarEvent(doc: Doc<"calendarEvents">): NixeloCalendarEvent {
  return {
    id: doc._id,
    convexId: doc._id,
    title: doc.title,
    start: new Date(doc.startTime),
    end: new Date(doc.endTime),
    color: doc.color ?? EVENT_TYPE_DEFAULT_COLOR[doc.eventType] ?? "blue",
    eventType: doc.eventType,
  };
}

/**
 * Extracts the Convex document ID from a calendar event.
 */
export function extractConvexId(event: NixeloCalendarEvent): Id<"calendarEvents"> {
  return event.convexId as Id<"calendarEvents">;
}
