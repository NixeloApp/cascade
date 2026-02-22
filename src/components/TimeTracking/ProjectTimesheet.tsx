import type { Id } from "@convex/_generated/dataModel";
import { TimeTrackingPage } from "./TimeTrackingPage";

interface ProjectTimesheetProps {
  projectId: Id<"projects">;
  userRole: "admin" | "editor" | "viewer" | null;
}

/**
 * Wrapper for TimeTrackingPage scoped to a single project
 */
export function ProjectTimesheet({ projectId, userRole }: ProjectTimesheetProps) {
  return <TimeTrackingPage projectId={projectId} userRole={userRole} />;
}
