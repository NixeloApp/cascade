import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { PageContent, PageError } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Stack } from "@/components/ui/Stack";
import { Switch } from "@/components/ui/Switch";
import { Textarea } from "@/components/ui/Textarea";
import { Typography } from "@/components/ui/Typography";
import { useOrganization } from "@/hooks/useOrgContext";
import { showError, showSuccess } from "@/lib/toast";

export const Route = createFileRoute("/_auth/_app/$orgSlug/workspaces/$workspaceSlug/settings")({
  component: WorkspaceSettings,
});

// Common emoji icons for workspaces
const WORKSPACE_ICONS = ["🏢", "🏗️", "💼", "🎯", "🚀", "💡", "🔧", "📊", "🎨", "📱", "🌐", "⚡"];

function WorkspaceSettings() {
  const { organizationId } = useOrganization();
  const { workspaceSlug } = Route.useParams();
  const workspace = useQuery(api.workspaces.getBySlug, { organizationId, slug: workspaceSlug });
  const updateWorkspace = useMutation(api.workspaces.updateWorkspace);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [defaultProjectVisibility, setDefaultProjectVisibility] = useState(true);
  const [allowExternalSharing, setAllowExternalSharing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize form state when workspace data loads
  if (workspace && !initialized) {
    setName(workspace.name);
    setDescription(workspace.description ?? "");
    setIcon(workspace.icon ?? "🏢");
    setDefaultProjectVisibility(workspace.settings?.defaultProjectVisibility ?? true);
    setAllowExternalSharing(workspace.settings?.allowExternalSharing ?? false);
    setInitialized(true);
  }

  if (workspace === undefined) {
    return <PageContent isLoading>{null}</PageContent>;
  }

  if (!workspace) {
    return (
      <PageError
        title="Workspace Not Found"
        message={`The workspace "${workspaceSlug}" doesn't exist or you don't have access to it.`}
      />
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateWorkspace({
        workspaceId: workspace._id,
        name: name.trim() || workspace.name,
        description: description.trim() || undefined,
        icon: icon || undefined,
        settings: {
          defaultProjectVisibility,
          allowExternalSharing,
        },
      });
      showSuccess("Workspace settings saved");
    } catch (error) {
      showError(error, "Failed to update workspace settings");
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    name !== workspace.name ||
    description !== (workspace.description ?? "") ||
    icon !== (workspace.icon ?? "🏢") ||
    defaultProjectVisibility !== (workspace.settings?.defaultProjectVisibility ?? true) ||
    allowExternalSharing !== (workspace.settings?.allowExternalSharing ?? false);

  return (
    <div className="max-w-3xl mx-auto py-6">
      <Stack gap="xl">
        {/* Page header */}
        <div className="pb-2 border-b border-ui-border">
          <Typography variant="h2" className="text-2xl font-semibold tracking-tight">
            Workspace Settings
          </Typography>
          <Typography variant="p" color="secondary" className="mt-1.5">
            Configure workspace settings and preferences
          </Typography>
        </div>

        {/* General Settings */}
        <Card variant="elevated" padding="lg">
          <Stack gap="lg">
            <Typography variant="h3" className="font-semibold">
              General
            </Typography>

            {/* Workspace Icon */}
            <div>
              <Label htmlFor="workspace-icon">Icon</Label>
              <Flex gap="sm" wrap className="mt-2">
                {WORKSPACE_ICONS.map((emoji) => (
                  <Button
                    key={emoji}
                    variant={icon === emoji ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setIcon(emoji)}
                    className="w-10 h-10 text-lg"
                    aria-label={`Select ${emoji} icon`}
                  >
                    {emoji}
                  </Button>
                ))}
              </Flex>
            </div>

            {/* Name */}
            <div>
              <Label htmlFor="workspace-name">Name</Label>
              <Input
                id="workspace-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Workspace name"
                className="mt-2"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="workspace-description">Description</Label>
              <Textarea
                id="workspace-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this workspace"
                className="mt-2"
                rows={3}
              />
            </div>
          </Stack>
        </Card>

        {/* Visibility & Sharing Settings */}
        <Card variant="elevated" padding="lg">
          <Stack gap="lg">
            <Typography variant="h3" className="font-semibold">
              Visibility & Sharing
            </Typography>

            {/* Default Project Visibility */}
            <Flex align="center" justify="between">
              <div>
                <Typography variant="label">Default Project Visibility</Typography>
                <Typography variant="small" color="secondary">
                  New projects in this workspace are visible to all workspace members by default
                </Typography>
              </div>
              <Switch
                checked={defaultProjectVisibility}
                onCheckedChange={setDefaultProjectVisibility}
                aria-label="Toggle default project visibility"
              />
            </Flex>

            {/* External Sharing */}
            <Flex align="center" justify="between">
              <div>
                <Typography variant="label">Allow External Sharing</Typography>
                <Typography variant="small" color="secondary">
                  Members can share documents and issues with people outside the workspace
                </Typography>
              </div>
              <Switch
                checked={allowExternalSharing}
                onCheckedChange={setAllowExternalSharing}
                aria-label="Toggle external sharing"
              />
            </Flex>
          </Stack>
        </Card>

        {/* Save Button */}
        <Flex justify="end">
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </Flex>
      </Stack>
    </div>
  );
}
