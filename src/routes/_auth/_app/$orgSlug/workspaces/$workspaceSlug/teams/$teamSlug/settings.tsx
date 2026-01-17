import { createFileRoute } from "@tanstack/react-router";
import { Typography } from "@/components/ui/Typography";

export const Route = createFileRoute(
  "/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/settings",
)({
  component: TeamSettings,
});

function TeamSettings() {
  return (
    <div>
      <Typography variant="h2">Team Settings</Typography>
      <Typography variant="p" color="secondary" className="mt-2">
        Coming soon: Manage team members, permissions, and preferences
      </Typography>
    </div>
  );
}
