import { createFileRoute } from "@tanstack/react-router";
import { ProjectCalendar } from "@/components/Calendar/ProjectCalendar";

export const Route = createFileRoute(
  "/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/projects/$key/calendar",
)({
  component: CalendarPage,
});

function CalendarPage() {
  const { key } = Route.useParams();

  return <ProjectCalendar projectKey={key} />;
}
