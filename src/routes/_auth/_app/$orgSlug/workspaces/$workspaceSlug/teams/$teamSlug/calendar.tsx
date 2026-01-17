import { createFileRoute } from "@tanstack/react-router";
import { Typography } from "@/components/ui/Typography";

export const Route = createFileRoute(
  "/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/calendar",
)({
  component: TeamCalendar,
});

function TeamCalendar() {
  return (
    <div>
      <Typography variant="h2">Team Calendar</Typography>
      <Typography variant="p" color="secondary" className="mt-2">
        Coming soon: View all team events, meetings, and milestones
      </Typography>
    </div>
  );
}
