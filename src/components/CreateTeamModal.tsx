import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Dialog } from "@/components/ui/Dialog";
import { Flex } from "@/components/ui/Flex";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrgContext";

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId?: Id<"workspaces">;
  workspaceSlug?: string;
}

export function CreateTeamModal({
  isOpen,
  onClose,
  workspaceId,
  workspaceSlug,
}: CreateTeamModalProps) {
  const { organizationId, orgSlug } = useOrganization();
  const navigate = useNavigate();
  const createTeam = useMutation(api.teams.createTeam);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(name.trim() && workspaceId && workspaceSlug)) return;

    setIsSubmitting(true);
    try {
      const { slug: teamSlug } = await createTeam({
        name,
        description: description.trim() || undefined,
        isPrivate,
        organizationId: organizationId as Id<"organizations">,
        workspaceId,
      });

      toast.success("Team created successfully");
      navigate({
        to: ROUTES.workspaces.teams.detail.path,
        params: { orgSlug, workspaceSlug, teamSlug },
      });
      onClose();

      // Reset form
      setName("");
      setDescription("");
      setIsPrivate(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create team");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title="Create Team"
      description="Create a new team to organize your projects and members."
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} form="create-team-form">
            Create Team
          </Button>
        </>
      }
    >
      <form id="create-team-form" onSubmit={handleSubmit}>
        <Flex direction="column" gap="md" className="py-2">
          <Flex direction="column" gap="xs" className="w-full items-center">
            <Label htmlFor="team-name">Team Name</Label>
            <Input
              id="team-name"
              placeholder="e.g. Frontend, Design..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </Flex>
          <Flex direction="column" gap="xs" className="w-full items-center">
            <Label htmlFor="team-description" className="text-ui-text-secondary">
              Description (Optional)
            </Label>
            <Textarea
              id="team-description"
              placeholder="What is this team for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Flex>
          <Flex align="center" className="space-x-2 pt-2">
            <Checkbox
              id="team-private"
              checked={isPrivate}
              onCheckedChange={(checked) => setIsPrivate(checked === true)}
              label="Make this team private"
              description="Only invited members can view this team"
            />
          </Flex>
        </Flex>
      </form>
    </Dialog>
  );
}
