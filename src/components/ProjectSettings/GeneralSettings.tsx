import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
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

  const updateProject = useMutation(api.projects.updateProject);

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
    <Card variant="soft" padding="lg">
      <Flex justify="between" align="center" className="mb-6">
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
            <Typography
              variant="mono"
              className="bg-ui-bg-tertiary px-3 py-2.5 rounded-md block border border-ui-border"
            >
              {projectKey}
            </Typography>
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
          <Flex gap="sm" className="pt-2">
            <Button onClick={handleSave} disabled={isSaving} isLoading={isSaving}>
              Save Changes
            </Button>
            <Button variant="secondary" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
          </Flex>
        </Stack>
      ) : (
        <Stack gap="lg">
          <Card variant="soft" padding="md" className="bg-ui-bg-tertiary">
            <Label className="mb-1">Project Name</Label>
            <Typography variant="label">{name}</Typography>
          </Card>
          <Card variant="soft" padding="md" className="bg-ui-bg-tertiary">
            <Label className="mb-1">Project Key</Label>
            <Typography variant="mono" color="secondary">
              {projectKey}
            </Typography>
          </Card>
          <Card variant="soft" padding="md" className="bg-ui-bg-tertiary">
            <Label className="mb-1">Description</Label>
            <Typography color="secondary">{description || "No description"}</Typography>
          </Card>
        </Stack>
      )}
    </Card>
  );
}
