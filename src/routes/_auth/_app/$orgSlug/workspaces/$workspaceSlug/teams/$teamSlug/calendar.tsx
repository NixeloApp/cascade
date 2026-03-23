import { createFileRoute } from "@tanstack/react-router";
import { CalendarView } from "@/components/Calendar/CalendarView";
import { useTeamLayout } from "./route";

export const Route = createFileRoute(
  "/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/calendar",
)({
  component: TeamCalendarPage,
});

function TeamCalendarPage() {
  const { teamId } = useTeamLayout();
  return <CalendarView teamId={teamId} />;
}
