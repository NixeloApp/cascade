/**
 * General Settings
 *
 * Project name and description editor component.
 * Includes edit/view modes with save/cancel controls.
 * Shows read-only project key display.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { type ReactNode, useState } from "react";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { SettingsSection, SettingsSectionInset } from "../Settings/SettingsSection";
import { Button } from "../ui/Button";
import { Flex } from "../ui/Flex";
import { Input, Textarea } from "../ui/form";
import { Label } from "../ui/Label";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

interface GeneralSettingsProps {
  projectId: Id<"projects">;
  name: string;
  projectKey: string;
  description: string | undefined;
}

interface ReadonlyFieldProps {
  label: string;
  children: ReactNode;
}

function ReadonlyField({ label, children }: ReadonlyFieldProps) {
  return (
    <SettingsSectionInset title={label}>
      <Stack gap="xs">{children}</Stack>
    </SettingsSectionInset>
  );
}

function ReadonlyValue({ children }: { children: ReactNode }) {
  return <SettingsSectionInset padding="sm">{children}</SettingsSectionInset>;
}

/** Project name and description editor with save/cancel controls. */
export function GeneralSettings({
  projectId,
  name,
  projectKey,
  description,
}: GeneralSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editDescription, setEditDescription] = useState(description || "");
  const [isSaving, setIsSaving] = useState(false);

  const { mutate: updateProject } = useAuthenticatedMutation(api.projects.updateProject);

  const handleEdit = () => {
    setEditName(name);
    setEditDescription(description || "");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      showError(new Error("Project name is required"), "Validation error");
      return;
    }

    setIsSaving(true);
    try {
      await updateProject({
        projectId,
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      showSuccess("Project settings updated");
      setIsEditing(false);
    } catch (error) {
      showError(error, "Failed to update project");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsSection
      title="General"
      description="Basic project information"
      action={
        !isEditing ? (
          <Button variant="secondary" size="sm" onClick={handleEdit}>
            Edit
          </Button>
        ) : null
      }
      variant="outline"
      padding="lg"
    >
      {isEditing ? (
        <Stack gap="lg">
          <Input
            label="Project Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Enter project name"
          />
          <Stack gap="xs">
            <Label>Project Key</Label>
            <ReadonlyValue>
              <Typography variant="mono">{projectKey}</Typography>
            </ReadonlyValue>
            <Typography variant="caption" color="tertiary">
              Project key cannot be changed after creation
            </Typography>
          </Stack>
          <Textarea
            label="Description"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Enter project description"
            rows={3}
          />
          <Flex gap="sm" pt="sm">
            <Button onClick={handleSave} disabled={isSaving} isLoading={isSaving}>
              Save Changes
            </Button>
            <Button variant="secondary" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
          </Flex>
        </Stack>
      ) : (
        <Stack gap="sm">
          <ReadonlyField label="Project Name">
            <Typography variant="label">{name}</Typography>
          </ReadonlyField>
          <ReadonlyField label="Project Key">
            <Typography variant="mono" color="secondary">
              {projectKey}
            </Typography>
          </ReadonlyField>
          <ReadonlyField label="Description">
            <Typography variant="p" color="secondary">
              {description || "No description"}
            </Typography>
          </ReadonlyField>
        </Stack>
      )}
    </SettingsSection>
  );
}
