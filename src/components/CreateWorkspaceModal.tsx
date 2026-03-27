/**
 * Create Workspace Modal
 *
 * Dialog for creating new workspaces within an organization.
 * Workspaces group related teams and projects together.
 * Requires name and optional description for workspace setup.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Stack } from "@/components/ui/Stack";
import { Textarea } from "@/components/ui/Textarea";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { buildWorkspaceSlug } from "@/lib/workspaces";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (slug: string) => void;
}

/** Modal form for creating a new workspace in an organization. */
export function CreateWorkspaceModal({ isOpen, onClose, onCreated }: CreateWorkspaceModalProps) {
  const { organizationId } = useOrganization();
  const { mutate: createWorkspace } = useAuthenticatedMutation(api.workspaces.create);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName("");
    setDescription("");
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setIsSubmitting(true);
    try {
      const slug = buildWorkspaceSlug(trimmedName);

      await createWorkspace({
        name: trimmedName,
        slug,
        description: description.trim() || undefined,
        organizationId: organizationId as Id<"organizations">,
      });

      showSuccess("Workspace created successfully");
      onCreated?.(slug);
      resetForm();
      onClose();
    } catch (error) {
      showError(error, "Failed to create workspace");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
      title="Create Workspace"
      data-testid={TEST_IDS.WORKSPACE.CREATE_MODAL}
      footer={
        <>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            form="create-workspace-form"
          >
            Create Workspace
          </Button>
        </>
      }
    >
      <form id="create-workspace-form" onSubmit={handleSubmit}>
        <Stack gap="md">
          <Stack gap="xs">
            <Label htmlFor="workspace-name">Workspace Name</Label>
            <Input
              id="workspace-name"
              data-testid={TEST_IDS.WORKSPACE.CREATE_NAME_INPUT}
              placeholder="e.g. Engineering, Marketing..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </Stack>
          <Stack gap="xs">
            <Label htmlFor="workspace-description" color="secondary">
              Description (Optional)
            </Label>
            <Textarea
              id="workspace-description"
              placeholder="What is this workspace for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Stack>
        </Stack>
      </form>
    </Dialog>
  );
}
