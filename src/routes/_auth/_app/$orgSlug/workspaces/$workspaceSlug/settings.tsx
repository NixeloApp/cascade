import { createFileRoute } from "@tanstack/react-router";
import { Typography } from "@/components/ui/Typography";

export const Route = createFileRoute("/_auth/_app/$orgSlug/workspaces/$workspaceSlug/settings")({
  component: WorkspaceSettings,
});

function WorkspaceSettings() {
  return (
    <div>
      <Typography variant="h2">Workspace Settings</Typography>
      <Typography variant="p" color="secondary" className="mt-2">
        Coming soon: Configure workspace settings, permissions, and preferences
      </Typography>
    </div>
  );
}
