import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Flex } from "../ui/Flex";
import { Typography } from "../ui/Typography";

interface SampleProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateSampleProject: (projectId: Id<"projects">) => void;
  onStartFromScratch: () => void;
}

export function SampleProjectModal({
  open,
  onOpenChange,
  onCreateSampleProject,
  onStartFromScratch,
}: SampleProjectModalProps) {
  const createSampleProject = useMutation(api.onboarding.createSampleProject);

  const handleCreateSample = async () => {
    try {
      const projectId = await createSampleProject({});
      showSuccess("Sample project created! Let's take a quick tour.");
      onCreateSampleProject(projectId as Id<"projects">);
    } catch (error) {
      showError(error, "Failed to create sample project");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Welcome to Nixelo!" size="sm">
      <div className="space-y-4">
        <Typography className="text-ui-text-secondary leading-relaxed">
          Would you like us to create a sample project with demo issues to help you explore Nixelo?
        </Typography>
        <Flex gap="md" className="pt-2">
          <Button onClick={handleCreateSample} variant="primary" className="flex-1">
            Yes, show me around!
          </Button>
          <Button onClick={onStartFromScratch} variant="secondary" className="flex-1">
            I'll start from scratch
          </Button>
        </Flex>
      </div>
    </Dialog>
  );
}
