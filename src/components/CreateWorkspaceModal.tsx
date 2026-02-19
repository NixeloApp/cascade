import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Stack } from "@/components/ui/Stack";
import { Textarea } from "@/components/ui/Textarea";
import { useOrganization } from "@/hooks/useOrgContext";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (workspaceId: string, slug: string) => void;
}

export function CreateWorkspaceModal({ isOpen, onClose, onCreated }: CreateWorkspaceModalProps) {
  const { organizationId } = useOrganization();
  const createWorkspace = useMutation(api.workspaces.create);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      // Generate slug from name
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const workspaceId = await createWorkspace({
        name,
        slug,
        description: description.trim() || undefined,
        organizationId: organizationId as Id<"organizations">,
      });

      toast.success("Workspace created successfully");
      onCreated?.(workspaceId, slug);
      onClose();
      setName("");
      setDescription("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create workspace");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title="Create Workspace"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
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
