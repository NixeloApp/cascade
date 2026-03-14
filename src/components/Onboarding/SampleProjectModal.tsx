import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";

import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Flex, FlexItem } from "../ui/Flex";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

interface SampleProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateSampleProject: (projectId: Id<"projects">) => void;
  onStartFromScratch: () => void;
}

/** Dialog offering choice between sample project or starting from scratch. */
export function SampleProjectModal({
  open,
  onOpenChange,
  onCreateSampleProject,
  onStartFromScratch,
}: SampleProjectModalProps) {
  const { mutate: createSampleProject } = useAuthenticatedMutation(
    api.onboarding.createSampleProject,
  );

  const handleCreateSample = async () => {
    try {
      const { projectId } = await createSampleProject({});
      showSuccess("Sample project created! Let's take a quick tour.");
      onCreateSampleProject(projectId);
    } catch (error) {
      showError(error, "Failed to create sample project");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Welcome to Nixelo!" size="sm">
      <Stack gap="lg">
        <Typography color="secondary">
          Would you like us to create a sample project with demo issues to help you explore Nixelo?
        </Typography>
        <Flex gap="md">
          <FlexItem flex="1">
            <Button onClick={handleCreateSample} variant="primary" className="w-full">
              Yes, show me around!
            </Button>
          </FlexItem>
          <FlexItem flex="1">
            <Button onClick={onStartFromScratch} variant="secondary" className="w-full">
              I'll start from scratch
            </Button>
          </FlexItem>
        </Flex>
      </Stack>
    </Dialog>
  );
}
