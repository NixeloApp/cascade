import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import { Check, KanbanSquare, ListTodo } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Dialog, DialogContent, DialogFooter } from "../ui/Dialog";
import { Flex } from "../ui/Flex";
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

  const createWorkspace = useMutation(api.projects.createProject);
  const updateOnboarding = useMutation(api.onboarding.updateOnboardingStatus);

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
      const projectId = await createWorkspace({
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <div className="space-y-6">
          {/* Mintlify-inspired step indicator */}
          <div className="mb-8">
            <Flex gap="sm" className="mb-4">
              {[1, 2, 3, 4].map((stepNum) => (
                <Flex key={stepNum} align="center" gap="sm" className="flex-1">
                  <Flex
                    align="center"
                    justify="center"
                    className={cn(
                      "w-8 h-8 rounded-full text-sm font-medium transition-all duration-default shrink-0",
                      stepNum < step
                        ? "bg-status-success text-brand-foreground"
                        : stepNum === step
                          ? "bg-brand text-brand-foreground ring-4 ring-brand/20"
                          : "bg-ui-bg-tertiary text-ui-text-tertiary",
                    )}
                  >
                    {stepNum < step ? (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      stepNum
                    )}
                  </Flex>
                  {stepNum < 4 && (
                    <div
                      className={cn(
                        "flex-1 h-0.5 rounded-full transition-colors duration-default",
                        stepNum < step ? "bg-status-success" : "bg-ui-border",
                      )}
                    />
                  )}
                </Flex>
              ))}
            </Flex>
            <Flex justify="between" className="px-1">
              <Typography className="text-sm font-medium text-ui-text">Step {step} of 4</Typography>
              <Typography className="text-sm text-ui-text-tertiary">
                {Math.round((step / 4) * 100)}% complete
              </Typography>
            </Flex>
          </div>

          {/* Step 1: Project Name & Key */}
          {step === 1 && (
            <div className="space-y-4">
              <Typography variant="h2" className="text-2xl font-bold text-ui-text">
                Create Your First Project
              </Typography>
              <Typography className="text-ui-text-secondary">
                Let's start by giving your project a name and a unique key.
              </Typography>

              <div>
                <Label htmlFor="project-name" required className="block mb-1">
                  Project Name
                </Label>
                <input
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
                  className="w-full px-3 py-2 border border-ui-border rounded-md bg-ui-bg text-ui-text"
                />
              </div>

              <div>
                <Label htmlFor="project-key" required className="block mb-1">
                  Project Key
                </Label>
                <input
                  id="project-key"
                  type="text"
                  value={projectKey}
                  onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                  placeholder="e.g., WEB, MOBILE, Q1"
                  className="w-full px-3 py-2 border border-ui-border rounded-md bg-ui-bg text-ui-text font-mono"
                  maxLength={10}
                />
                <Typography className="text-xs text-ui-text-tertiary mt-1">
                  2-10 uppercase letters. This will prefix your issue keys (e.g.,{" "}
                  {projectKey || "KEY"}-123)
                </Typography>
              </div>

              <Textarea
                label="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this project about?"
                rows={3}
              />
            </div>
          )}

          {/* Step 2: Board Type */}
          {step === 2 && (
            <div className="space-y-4">
              <Typography variant="h2" className="text-2xl font-bold text-ui-text">
                Choose Your Board Type
              </Typography>
              <Typography className="text-ui-text-secondary">
                How do you want to organize your work? You can change this later.
              </Typography>

              <Grid cols={2} gap="lg">
                <button
                  type="button"
                  onClick={() => setBoardType("kanban")}
                  className={cn(
                    "p-6 border-2 rounded-lg text-left transition-all",
                    boardType === "kanban"
                      ? "border-brand bg-brand-indigo-track"
                      : "border-ui-border hover:border-brand-muted",
                  )}
                >
                  <Flex align="center" gap="sm" className="mb-2">
                    <Icon icon={KanbanSquare} size="md" />
                    <Typography variant="h3" className="font-bold text-lg text-ui-text">
                      Kanban
                    </Typography>
                  </Flex>
                  <Typography className="text-sm text-ui-text-secondary">
                    Continuous flow of work through columns. Great for ongoing projects and support
                    teams.
                  </Typography>
                  <ul className="mt-3 text-ui-text-tertiary space-y-1">
                    <Typography as="li" variant="caption">
                      <Icon icon={Check} size="xs" className="inline mr-1" /> No time constraints
                    </Typography>
                    <Typography as="li" variant="caption">
                      <Icon icon={Check} size="xs" className="inline mr-1" /> Visualize workflow
                    </Typography>
                    <Typography as="li" variant="caption">
                      <Icon icon={Check} size="xs" className="inline mr-1" /> Limit work in progress
                    </Typography>
                  </ul>
                </button>

                <button
                  type="button"
                  onClick={() => setBoardType("scrum")}
                  className={cn(
                    "p-6 border-2 rounded-lg text-left transition-all",
                    boardType === "scrum"
                      ? "border-brand bg-brand-indigo-track"
                      : "border-ui-border hover:border-brand-muted",
                  )}
                >
                  <Flex align="center" gap="sm" className="mb-2">
                    <Icon icon={ListTodo} size="md" />
                    <Typography variant="h3" className="font-bold text-lg text-ui-text">
                      Scrum
                    </Typography>
                  </Flex>
                  <Typography className="text-sm text-ui-text-secondary">
                    Work in sprints with defined goals. Great for product development and fixed
                    deadlines.
                  </Typography>
                  <ul className="mt-3 text-ui-text-tertiary space-y-1">
                    <Typography as="li" variant="caption">
                      <Icon icon={Check} size="xs" className="inline mr-1" /> Sprint planning
                    </Typography>
                    <Typography as="li" variant="caption">
                      <Icon icon={Check} size="xs" className="inline mr-1" /> Velocity tracking
                    </Typography>
                    <Typography as="li" variant="caption">
                      <Icon icon={Check} size="xs" className="inline mr-1" /> Burndown charts
                    </Typography>
                  </ul>
                </button>
              </Grid>
            </div>
          )}

          {/* Step 3: Workflow States */}
          {step === 3 && (
            <div className="space-y-4">
              <Typography variant="h2" className="text-2xl font-bold text-ui-text">
                Customize Your Workflow
              </Typography>
              <Typography className="text-ui-text-secondary">
                These are the stages your issues will move through. You can customize them now or
                use the defaults.
              </Typography>

              <Flex direction="column" gap="md">
                {workflowStates.map((state, index) => (
                  <Flex key={state.id} gap="md" align="center">
                    <Typography variant="caption" className="font-mono w-6">
                      {index + 1}.
                    </Typography>
                    <input
                      type="text"
                      value={state.name}
                      onChange={(e) => {
                        const newStates = [...workflowStates];
                        newStates[index].name = e.target.value;
                        setWorkflowStates(newStates);
                      }}
                      className="flex-1 px-3 py-2 border border-ui-border rounded-md bg-ui-bg text-ui-text"
                    />
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
              </Flex>

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
            </div>
          )}

          {/* Step 4: Summary & Create */}
          {step === 4 && (
            <div className="space-y-4">
              <Typography variant="h2" className="text-2xl font-bold text-ui-text">
                Ready to Create!
              </Typography>
              <Typography className="text-ui-text-secondary">
                Here's a summary of your new project:
              </Typography>

              <div className="bg-ui-bg-secondary rounded-lg p-4 space-y-3">
                <div>
                  <Typography variant="caption">Project Name:</Typography>
                  <Typography className="font-medium text-ui-text">{projectName}</Typography>
                </div>
                <div>
                  <Typography variant="caption">Project Key:</Typography>
                  <Typography className="font-mono font-medium text-ui-text">
                    {projectKey}
                  </Typography>
                </div>
                <div>
                  <Typography variant="caption">Board Type:</Typography>
                  <Typography className="font-medium text-ui-text capitalize">
                    {boardType}
                  </Typography>
                </div>
                <div>
                  <Typography variant="caption">Workflow States:</Typography>
                  <Flex wrap gap="sm" className="mt-1">
                    {workflowStates.map((state) => (
                      <Badge key={state.id} variant="secondary">
                        {state.name}
                      </Badge>
                    ))}
                  </Flex>
                </div>
              </div>

              <Typography className="text-sm text-ui-text-secondary">
                Click "Create Project" and we'll set everything up for you. You can start adding
                issues right away!
              </Typography>
            </div>
          )}

          {/* Navigation Buttons - Mintlify-inspired with proper spacing */}
          <DialogFooter className="flex justify-between sm:justify-between pt-6 border-t border-ui-border">
            <div>
              {step > 1 && (
                <Button
                  onClick={handlePrevious}
                  variant="ghost"
                  className="text-ui-text-secondary hover:text-ui-text"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </Button>
              )}
            </div>
            <Flex gap="md">
              <Button
                onClick={() => onOpenChange(false)}
                variant="ghost"
                className="text-ui-text-tertiary hover:text-ui-text"
              >
                Cancel
              </Button>
              {step < 4 ? (
                <Button onClick={handleNext} variant="primary" className="min-w-24">
                  Next
                  <svg
                    className="w-4 h-4 ml-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              ) : (
                <Button onClick={handleFinish} variant="primary" className="font-medium min-w-36">
                  Create Project
                </Button>
              )}
            </Flex>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
