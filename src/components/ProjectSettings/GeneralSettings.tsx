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
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
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
    <Card variant="outline" padding="sm" className="bg-ui-bg">
      <Stack gap="xs">
        <Label>{label}</Label>
        {children}
      </Stack>
    </Card>
  );
}

function ReadonlyValue({ children }: { children: ReactNode }) {
  return (
    <Card variant="flat" padding="sm" radius="md">
      {children}
    </Card>
  );
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
    <Card variant="outline" padding="none" className="p-4 sm:p-6">
      <Flex justify="between" align="center" className="mb-4 sm:mb-6">
        <Stack gap="xs">
          <Typography variant="h4">General</Typography>
          <Typography variant="small" color="secondary">
            Basic project information
          </Typography>
        </Stack>
        {!isEditing && (
          <Button variant="secondary" size="sm" onClick={handleEdit}>
            Edit
          </Button>
        )}
      </Flex>

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
    </Card>
  );
}
