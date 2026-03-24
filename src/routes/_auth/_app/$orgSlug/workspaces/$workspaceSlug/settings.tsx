/**
 * Workspace Settings Page
 *
 * Settings form for editing workspace name, description, and icon.
 * Allows archiving and updating workspace configuration.
 * Restricted to workspace admins and editors.
 */

import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageContent } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Stack } from "@/components/ui/Stack";
import { Switch } from "@/components/ui/Switch";
import { Textarea } from "@/components/ui/Textarea";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { useWorkspaceLayout } from "./route";
export const Route = createFileRoute("/_auth/_app/$orgSlug/workspaces/$workspaceSlug/settings")({
  component: WorkspaceSettings,
});

// Common emoji icons for workspaces
const WORKSPACE_ICONS = ["🏢", "🏗️", "💼", "🎯", "🚀", "💡", "🔧", "📊", "🎨", "📱", "🌐", "⚡"];

function WorkspaceSettings() {
  const { workspaceId } = useWorkspaceLayout();
  const workspace = useAuthenticatedQuery(api.workspaces.getWorkspace, { id: workspaceId });

  if (workspace === undefined) {
    return <PageContent isLoading>{null}</PageContent>;
  }

  if (!workspace) {
    return <PageContent isLoading>{null}</PageContent>;
  }

  // Key on workspace _id so React remounts the form when workspace changes,
  // resetting all useState to initialValues without setState-during-render hacks.
  return <WorkspaceSettingsForm key={workspace._id} workspace={workspace} />;
}

interface WorkspaceSettingsFormProps {
  workspace: NonNullable<
    ReturnType<typeof useAuthenticatedQuery<typeof api.workspaces.getWorkspace>>
  >;
}

function WorkspaceSettingsForm({ workspace }: WorkspaceSettingsFormProps) {
  const { mutate: updateWorkspace } = useAuthenticatedMutation(api.workspaces.updateWorkspace);

  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description ?? "");
  const [icon, setIcon] = useState(workspace.icon ?? "🏢");
  const [defaultProjectVisibility, setDefaultProjectVisibility] = useState(
    workspace.settings?.defaultProjectVisibility ?? true,
  );
  const [allowExternalSharing, setAllowExternalSharing] = useState(
    workspace.settings?.allowExternalSharing ?? false,
  );
  const [isSaving, setIsSaving] = useState(false);

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
    <div className="max-w-prose">
      <Stack gap="xl">
        <Typography variant="h2">Workspace Settings</Typography>

        {/* General Settings */}
        <Card variant="elevated" padding="lg">
          <Stack gap="lg">
            <Typography variant="h3">General</Typography>

            {/* Workspace Icon */}
            <Stack gap="sm">
              <Label htmlFor="workspace-icon">Icon</Label>
              <Flex gap="sm" wrap>
                {WORKSPACE_ICONS.map((emoji) => (
                  <Button
                    key={emoji}
                    variant={icon === emoji ? "primary" : "outline"}
                    size="workspaceIcon"
                    onClick={() => setIcon(emoji)}
                    aria-label={`Select ${emoji} icon`}
                  >
                    {emoji}
                  </Button>
                ))}
              </Flex>
            </Stack>

            {/* Name */}
            <Stack gap="sm">
              <Label htmlFor="workspace-name">Name</Label>
              <Input
                id="workspace-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Workspace name"
              />
            </Stack>

            {/* Description */}
            <Stack gap="sm">
              <Label htmlFor="workspace-description">Description</Label>
              <Textarea
                id="workspace-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this workspace"
                rows={3}
              />
            </Stack>
          </Stack>
        </Card>

        {/* Visibility & Sharing Settings */}
        <Card variant="elevated" padding="lg">
          <Stack gap="lg">
            <Typography variant="h3">Visibility & Sharing</Typography>

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
