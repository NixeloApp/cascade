import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Flex } from "@/components/ui/Flex";
import { Select } from "@/components/ui/form/Select";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { FolderInput } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";

interface MoveDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: Id<"documents">;
  currentProjectId?: Id<"projects">;
  organizationId: Id<"organizations">;
}

export function MoveDocumentDialog({
  open,
  onOpenChange,
  documentId,
  currentProjectId,
  organizationId,
}: MoveDocumentDialogProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<Id<"projects"> | "">(
    currentProjectId || "",
  );
  const [isMoving, setIsMoving] = useState(false);

  const projects = useQuery(api.projects.getCurrentUserProjects, { organizationId });
  const moveToProject = useMutation(api.documents.moveToProject);

  const handleMove = async () => {
    setIsMoving(true);
    try {
      await moveToProject({
        id: documentId,
        projectId: selectedProjectId || undefined,
      });
      showSuccess(
        selectedProjectId ? "Document moved to project" : "Document removed from project",
      );
      onOpenChange(false);
    } catch (error) {
      showError(error, "Failed to move document");
    } finally {
      setIsMoving(false);
    }
  };

  const hasChanged = selectedProjectId !== (currentProjectId || "");

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Move Document"
      description="Move this document to a different project, or remove it from its current project."
      size="sm"
      footer={
        <Flex gap="sm">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => void handleMove()}
            disabled={!hasChanged}
            isLoading={isMoving}
          >
            <FolderInput className="h-4 w-4 mr-2" />
            Move
          </Button>
        </Flex>
      }
    >
      <Stack gap="md">
        <Select
          label="Target Project"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value as Id<"projects"> | "")}
        >
          <option value="">No project (organization level)</option>
          {projects?.page.map((project: Doc<"projects">) => (
            <option key={project._id} value={project._id}>
              {project.name} ({project.key})
            </option>
          ))}
        </Select>

        {currentProjectId && selectedProjectId === "" && (
          <Typography variant="small" color="secondary">
            The document will be moved to the organization level and won&apos;t be associated with
            any project.
          </Typography>
        )}
      </Stack>
    </Dialog>
  );
}
