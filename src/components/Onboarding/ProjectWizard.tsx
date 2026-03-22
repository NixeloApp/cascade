/**
 * Project Wizard
 *
 * Multi-step wizard dialog for creating a new project.
 * Guides users through name, key, description, and workflow setup.
 * Supports template selection and initial team member assignment.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/Progress";
import { Stack } from "@/components/ui/Stack";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { Check, KanbanSquare, ListTodo } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Flex, FlexItem } from "../ui/Flex";
import { Textarea } from "../ui/form";
import { Grid } from "../ui/Grid";
import { Icon } from "../ui/Icon";
import { Label } from "../ui/Label";
import { Typography } from "../ui/Typography";

interface ProjectWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (projectId: string) => void;
  organizationId: Id<"organizations">;
  workspaceId: Id<"workspaces">;
}

/** Multi-step wizard dialog for creating a new project with name, key, and workflow. */
export function ProjectWizard({
  open,
  onOpenChange,
  onComplete,
  organizationId,
  workspaceId,
}: ProjectWizardProps) {
  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [description, setDescription] = useState("");
  const [boardType, setBoardType] = useState<"kanban" | "scrum">("kanban");
  const [workflowStates, setWorkflowStates] = useState([
    { id: "todo", name: "To Do", category: "todo" as const, order: 0 },
    { id: "inprogress", name: "In Progress", category: "inprogress" as const, order: 1 },
    { id: "done", name: "Done", category: "done" as const, order: 2 },
  ]);

  const { mutate: createWorkspace } = useAuthenticatedMutation(api.projects.createProject);
  const { mutate: updateOnboarding } = useAuthenticatedMutation(
    api.onboarding.updateOnboardingStatus,
  );

  const handleNext = () => {
    if (step === 1) {
      if (!projectName.trim()) {
        showError("Project name is required");
        return;
      }
      if (!projectKey.trim()) {
        showError("Project key is required");
        return;
      }
      if (projectKey.length < 2 || projectKey.length > 10) {
        showError("Project key must be 2-10 characters");
        return;
      }
      if (!/^[A-Z]+$/.test(projectKey)) {
        showError("Project key must be uppercase letters only");
        return;
      }
    }
    setStep(step + 1);
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const handleFinish = async () => {
    try {
      const { projectId } = await createWorkspace({
        name: projectName,
        key: projectKey,
        description: description || undefined,
        isPublic: false,
        boardType,
        workflowStates,
        organizationId,
        workspaceId,
      });

      // Update onboarding status
      await updateOnboarding({
        wizardCompleted: true,
        onboardingStep: 3,
      });

      // Confetti effect (optional - would need react-confetti package)
      showSuccess("Project created successfully!");

      onComplete(projectId);
    } catch (error) {
      showError(error, "Failed to create project");
    }
  };

  const generateKeyFromName = (name: string) => {
    const key = name
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 10);
    setProjectKey(key);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create New Project"
      description="Set up your project in a few easy steps"
      size="lg"
    >
      <Stack gap="lg">
        <Stack gap="sm">
          <Progress value={(step / 4) * 100} variant={step === 4 ? "success" : "default"} />
          <Flex justify="between" align="center">
            <Typography variant="small">Step {step} of 4</Typography>
            <Badge variant="secondary" shape="pill" size="sm">
              {Math.round((step / 4) * 100)}% complete
            </Badge>
          </Flex>
        </Stack>

        {/* Step 1: Project Name & Key */}
        {step === 1 && (
          <Stack gap="md">
            <Stack gap="xs">
              <Typography variant="h2">Create Your First Project</Typography>
              <Typography color="secondary">
                Let's start by giving your project a name and a unique key.
              </Typography>
            </Stack>

            <Stack gap="xs">
              <Label htmlFor="project-name" required>
                Project Name
              </Label>
              <Input
                id="project-name"
                type="text"
                value={projectName}
                onChange={(e) => {
                  setProjectName(e.target.value);
                  if (!projectKey) {
                    generateKeyFromName(e.target.value);
                  }
                }}
                placeholder="e.g., Website Redesign, Mobile App, Q1 Planning"
              />
            </Stack>

            <Stack gap="xs">
              <Label htmlFor="project-key" required>
                Project Key
              </Label>
              <Input
                id="project-key"
                type="text"
                value={projectKey}
                onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                placeholder="e.g., WEB, MOBILE, Q1"
                maxLength={10}
              />
              <Typography variant="meta">
                2-10 uppercase letters. This will prefix your issue keys (e.g.,{" "}
                {projectKey || "KEY"}-123)
              </Typography>
            </Stack>

            <Textarea
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              rows={3}
            />
          </Stack>
        )}

        {/* Step 2: Board Type */}
        {step === 2 && (
          <Stack gap="md">
            <Stack gap="xs">
              <Typography variant="h2">Choose Your Board Type</Typography>
              <Typography color="secondary">
                How do you want to organize your work? You can change this later.
              </Typography>
            </Stack>

            <Grid cols={2} gap="lg">
              <Card
                recipe={boardType === "kanban" ? "optionTileSelected" : "optionTile"}
                padding="lg"
                onClick={() => setBoardType("kanban")}
                className="text-left"
              >
                <Stack gap="sm">
                  <Flex align="center" gap="sm">
                    <Icon icon={KanbanSquare} size="md" />
                    <Typography variant="h3">Kanban</Typography>
                  </Flex>
                  <Typography variant="small" color="secondary">
                    Continuous flow of work through columns. Great for ongoing projects and support
                    teams.
                  </Typography>
                  <Stack gap="xs" className="mt-2">
                    <Typography as="span" variant="caption" color="tertiary">
                      <Icon icon={Check} size="xs" inline /> No time constraints
                    </Typography>
                    <Typography as="span" variant="caption" color="tertiary">
                      <Icon icon={Check} size="xs" inline /> Visualize workflow
                    </Typography>
                    <Typography as="span" variant="caption" color="tertiary">
                      <Icon icon={Check} size="xs" inline /> Limit work in progress
                    </Typography>
                  </Stack>
                </Stack>
              </Card>

              <Card
                recipe={boardType === "scrum" ? "optionTileSelected" : "optionTile"}
                padding="lg"
                onClick={() => setBoardType("scrum")}
                className="text-left"
              >
                <Stack gap="sm">
                  <Flex align="center" gap="sm">
                    <Icon icon={ListTodo} size="md" />
                    <Typography variant="h3">Scrum</Typography>
                  </Flex>
                  <Typography variant="small" color="secondary">
                    Work in sprints with defined goals. Great for product development and fixed
                    deadlines.
                  </Typography>
                  <Stack gap="xs" className="mt-2">
                    <Typography as="span" variant="caption" color="tertiary">
                      <Icon icon={Check} size="xs" inline /> Sprint planning
                    </Typography>
                    <Typography as="span" variant="caption" color="tertiary">
                      <Icon icon={Check} size="xs" inline /> Velocity tracking
                    </Typography>
                    <Typography as="span" variant="caption" color="tertiary">
                      <Icon icon={Check} size="xs" inline /> Burndown charts
                    </Typography>
                  </Stack>
                </Stack>
              </Card>
            </Grid>
          </Stack>
        )}

        {/* Step 3: Workflow States */}
        {step === 3 && (
          <Stack gap="md">
            <Stack gap="xs">
              <Typography variant="h2">Customize Your Workflow</Typography>
              <Typography color="secondary">
                These are the stages your issues will move through. You can customize them now or
                use the defaults.
              </Typography>
            </Stack>

            <Stack gap="md">
              {workflowStates.map((state, index) => (
                <Flex key={state.id} gap="md" align="center">
                  <Typography variant="mono" className="w-6">
                    {index + 1}.
                  </Typography>
                  <FlexItem flex="1">
                    <Input
                      type="text"
                      value={state.name}
                      onChange={(e) => {
                        const newStates = [...workflowStates];
                        newStates[index].name = e.target.value;
                        setWorkflowStates(newStates);
                      }}
                    />
                  </FlexItem>
                  <Badge
                    variant={
                      state.category === "todo"
                        ? "secondary"
                        : state.category === "inprogress"
                          ? "primary"
                          : "success"
                    }
                    shape="pill"
                    size="md"
                  >
                    {state.category === "todo"
                      ? "To Do"
                      : state.category === "inprogress"
                        ? "In Progress"
                        : "Done"}
                  </Badge>
                </Flex>
              ))}
            </Stack>

            <Button
              onClick={() => {
                const newId = `custom-${workflowStates.length}`;
                setWorkflowStates([
                  ...workflowStates,
                  {
                    id: newId,
                    name: "New Status",
                    category: "inprogress",
                    order: workflowStates.length,
                  },
                ]);
              }}
              variant="ghost"
              size="sm"
              className="text-brand-indigo-text"
            >
              + Add another status
            </Button>
          </Stack>
        )}

        {/* Step 4: Summary & Create */}
        {step === 4 && (
          <Stack gap="md">
            <Stack gap="xs">
              <Typography variant="h2">Ready to Create!</Typography>
              <Typography color="secondary">Here's a summary of your new project:</Typography>
            </Stack>

            <Card variant="soft" padding="md">
              <Stack gap="sm">
                <Stack gap="none">
                  <Typography variant="caption">Project Name:</Typography>
                  <Typography variant="label">{projectName}</Typography>
                </Stack>
                <Stack gap="none">
                  <Typography variant="caption">Project Key:</Typography>
                  <Typography variant="mono">{projectKey}</Typography>
                </Stack>
                <Stack gap="none">
                  <Typography variant="caption">Board Type:</Typography>
                  <Typography variant="label" className="capitalize">
                    {boardType}
                  </Typography>
                </Stack>
                <Stack gap="xs">
                  <Typography variant="caption">Workflow States:</Typography>
                  <Flex wrap gap="sm">
                    {workflowStates.map((state) => (
                      <Badge key={state.id} variant="secondary">
                        {state.name}
                      </Badge>
                    ))}
                  </Flex>
                </Stack>
              </Stack>
            </Card>

            <Typography variant="small" color="secondary">
              Click "Create Project" and we'll set everything up for you. You can start adding
              issues right away!
            </Typography>
          </Stack>
        )}

        <Card recipe="onboardingWizardFooter" padding="lg">
          <Flex justify="between" align="center">
            {step > 1 && (
              <Button
                onClick={handlePrevious}
                variant="ghost"
                leftIcon={
                  <svg
                    className="size-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                }
              >
                Previous
              </Button>
            )}
            <Flex gap="md">
              <Button onClick={() => onOpenChange(false)} variant="ghost">
                Cancel
              </Button>
              {step < 4 ? (
                <Button
                  onClick={handleNext}
                  variant="primary"
                  rightIcon={
                    <svg
                      className="size-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  }
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleFinish}
                  variant="primary"
                  data-testid={TEST_IDS.ONBOARDING.CREATE_PROJECT_BUTTON}
                >
                  Create Project
                </Button>
              )}
            </Flex>
          </Flex>
        </Card>
      </Stack>
    </Dialog>
  );
}
