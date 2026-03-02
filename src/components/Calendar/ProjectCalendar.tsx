import type { Id } from "@convex/_generated/dataModel";
import { CalendarView } from "./CalendarView";

interface ProjectCalendarProps {
  projectId: Id<"projects">;
}

/**
 * Project-specific calendar view
 * Wraps the unified CalendarView with project scoping.
 */
export function ProjectCalendar({ projectId }: ProjectCalendarProps) {
  return <CalendarView projectId={projectId} />;
}
