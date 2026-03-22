/**
 * Lead Onboarding
 *
 * Multi-step onboarding wizard for new organization leads.
 * Guides through workspace creation, team setup, and first project.
 * Shows feature highlights and quick-start actions.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { ArrowLeft, Building2, FolderPlus, Sparkles, UserPlus } from "lucide-react";
import { useState } from "react";
import { Card, getCardRecipeClassName } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Icon } from "@/components/ui/Icon";
import { Stack } from "@/components/ui/Stack";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Typography } from "../ui/Typography";
import { FeatureHighlights } from "./FeatureHighlights";

interface LeadOnboardingProps {
  onComplete: () => void;
  onCreateProject: (projectId: Id<"projects">) => void | Promise<void>;
  onBack: () => void;
  onWorkspaceCreated?: (slug: string) => void;
}

type LeadStep = "features" | "project" | "project-choice" | "creating";

function getLeadStepBackConfig(
  step: Exclude<LeadStep, "creating">,
  onBack: () => void,
  onStepChange: (step: LeadStep) => void,
) {
  switch (step) {
    case "features":
      return { label: "Back", onClick: onBack };
    case "project":
      return { label: "Back", onClick: () => onStepChange("features") };
    case "project-choice":
      return { label: "Back", onClick: () => onStepChange("project") };
  }
}

/** Multi-step onboarding wizard for team leads creating their first workspace. */
export function LeadOnboarding({
  onComplete,
  onCreateProject,
  onBack,
  onWorkspaceCreated,
}: LeadOnboardingProps) {
  const [step, setStep] = useState<LeadStep>("features");
  const [isCreating, setIsCreating] = useState(false);
  const [projectName, setWorkspaceName] = useState("");
  const [projectError, setWorkspaceError] = useState<string | null>(null);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);

  const { mutate: createSampleProject } = useAuthenticatedMutation(
    api.onboarding.createSampleProject,
  );
  const { mutate: createOrganization } = useAuthenticatedMutation(
    api.organizations.createOrganization,
  );
  const { mutate: completeOnboarding } = useAuthenticatedMutation(
    api.onboarding.completeOnboardingFlow,
  );

  const handleCreateOrganization = async () => {
    if (!projectName.trim()) {
      setWorkspaceError("Please enter a project name");
      return;
    }

    setIsCreating(true);
    setWorkspaceError(null);

    try {
      const result = await createOrganization({
        name: projectName.trim(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      setCreatedSlug(result.slug);
      showSuccess("Project created!");
      setStep("project-choice");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create project";
      setWorkspaceError(message);
      showError(error, "Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateSample = async () => {
    setIsCreating(true);
    try {
      const { projectId } = await createSampleProject({});
      await completeOnboarding();
      showSuccess("Sample project created! Explore and customize it.");

      // Navigate to the new project
      if (createdSlug && onWorkspaceCreated) {
        onWorkspaceCreated(createdSlug);
      } else {
        await onCreateProject(projectId);
      }
    } catch (error) {
      showError(error, "Failed to create sample project");
      setIsCreating(false);
    }
  };

  const handleFinishWithoutProject = async () => {
    await completeOnboarding();
    if (createdSlug && onWorkspaceCreated) {
      onWorkspaceCreated(createdSlug);
    } else {
      onComplete();
    }
  };

  if (step === "creating") {
    return null;
  }

  const backAction = getLeadStepBackConfig(step, onBack, setStep);

  return (
    <Stack gap="xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={backAction.onClick}
        className="self-start"
        leftIcon={<ArrowLeft className="size-4" />}
      >
        {backAction.label}
      </Button>

      <LeadStepContent
        step={step}
        projectName={projectName}
        projectError={projectError}
        isCreating={isCreating}
        onProjectNameChange={(value) => {
          setWorkspaceName(value);
          setWorkspaceError(null);
        }}
        onCreateOrganization={handleCreateOrganization}
        onContinueToProject={() => setStep("project")}
        onCreateSample={handleCreateSample}
        onFinishWithoutProject={handleFinishWithoutProject}
      />
    </Stack>
  );
}

function LeadStepContent({
  step,
  projectName,
  projectError,
  isCreating,
  onProjectNameChange,
  onCreateOrganization,
  onContinueToProject,
  onCreateSample,
  onFinishWithoutProject,
}: {
  step: Exclude<LeadStep, "creating">;
  projectName: string;
  projectError: string | null;
  isCreating: boolean;
  onProjectNameChange: (value: string) => void;
  onCreateOrganization: () => void;
  onContinueToProject: () => void;
  onCreateSample: () => void;
  onFinishWithoutProject: () => void;
}) {
  switch (step) {
    case "features":
      return <LeadFeaturesStep onContinue={onContinueToProject} />;
    case "project":
      return (
        <LeadProjectSetupStep
          projectName={projectName}
          projectError={projectError}
          isCreating={isCreating}
          onProjectNameChange={onProjectNameChange}
          onCreateOrganization={onCreateOrganization}
        />
      );
    case "project-choice":
      return (
        <LeadProjectChoiceStep
          isCreating={isCreating}
          onCreateSample={onCreateSample}
          onFinishWithoutProject={onFinishWithoutProject}
        />
      );
  }
}

function LeadFeaturesStep({ onContinue }: { onContinue: () => void }) {
  return (
    <>
      <Stack gap="sm" className="text-center">
        <Typography variant="h1" data-testid={TEST_IDS.ONBOARDING.TEAM_LEAD_HEADING}>
          Perfect for Team Leads
        </Typography>
        <Typography variant="lead">Here's what you can do with Nixelo</Typography>
      </Stack>

      <FeatureHighlights />

      <Card padding="lg" radius="full">
        <Stack gap="md">
          <Typography variant="h3">As a team lead, you can also:</Typography>
          <Stack gap="sm">
            <LeadFeatureRow icon={UserPlus} text="Invite team members and manage roles" />
            <LeadFeatureRow icon={FolderPlus} text="Create and customize project workflows" />
            <LeadFeatureRow
              icon={Sparkles}
              text="Use AI to generate issue suggestions and summaries"
            />
          </Stack>
        </Stack>
      </Card>

      <Flex justify="center">
        <Button
          variant="primary"
          size="lg"
          onClick={onContinue}
          data-testid={TEST_IDS.ONBOARDING.SETUP_WORKSPACE_BUTTON}
        >
          Let's set up your project
        </Button>
      </Flex>
    </>
  );
}

function LeadFeatureRow({ icon, text }: { icon: typeof UserPlus; text: string }) {
  return (
    <Flex align="start" gap="sm">
      <Icon icon={icon} size="md" tone="brand" className="mt-0.5 shrink-0" />
      <Typography color="secondary">{text}</Typography>
    </Flex>
  );
}

function LeadProjectSetupStep({
  projectName,
  projectError,
  isCreating,
  onProjectNameChange,
  onCreateOrganization,
}: {
  projectName: string;
  projectError: string | null;
  isCreating: boolean;
  onProjectNameChange: (value: string) => void;
  onCreateOrganization: () => void;
}) {
  return (
    <>
      <Stack gap="md" className="text-center">
        <Card recipe="onboardingHeroCircle" className="mx-auto size-16">
          <Flex align="center" justify="center" className="h-full w-full">
            <Icon icon={Building2} size="xl" tone="brand" />
          </Flex>
        </Card>
        <Stack gap="sm">
          <Typography variant="h1">Name Your Project</Typography>
          <Typography variant="lead">This is where your team will collaborate</Typography>
        </Stack>
      </Stack>

      <Stack gap="md" className="mx-auto max-w-md">
        <Stack gap="xs">
          <Input
            type="text"
            placeholder="e.g., Acme Corp, My Startup, Design Team"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isCreating) {
                onCreateOrganization();
              }
            }}
            className="text-center"
            autoFocus
          />
          {projectError ? (
            <Typography variant="small" color="error" className="text-center">
              {projectError}
            </Typography>
          ) : null}
        </Stack>

        <Button
          variant="primary"
          size="lg"
          onClick={onCreateOrganization}
          disabled={isCreating || !projectName.trim()}
          className="w-full"
          data-testid={TEST_IDS.ONBOARDING.CREATE_PROJECT_BUTTON}
        >
          {isCreating ? "Creating..." : "Create Project"}
        </Button>
      </Stack>
    </>
  );
}

function LeadProjectChoiceStep({
  isCreating,
  onCreateSample,
  onFinishWithoutProject,
}: {
  isCreating: boolean;
  onCreateSample: () => void;
  onFinishWithoutProject: () => void;
}) {
  return (
    <>
      <Stack gap="sm" className="text-center">
        <Typography variant="h1">Start Your First Project</Typography>
        <Typography variant="lead">How would you like to get started?</Typography>
      </Stack>

      <Grid cols={1} colsSm={2} gap="lg">
        <Card
          recipe="onboardingActionTileRecommended"
          padding="lg"
          onClick={isCreating ? undefined : onCreateSample}
          className={isCreating ? "opacity-50" : undefined}
          aria-disabled={isCreating}
        >
          <Stack gap="lg">
            <Flex align="center" justify="between">
              <div className={cn(getCardRecipeClassName("onboardingActionIconBrand"), "p-4")}>
                <Flex align="center" justify="center">
                  <Icon icon={Sparkles} size="lg" tone="brand" />
                </Flex>
              </div>
              <Badge variant="brand" shape="pill" size="md">
                Recommended
              </Badge>
            </Flex>
            <Stack gap="xs">
              <Typography variant="h3">
                {isCreating ? "Creating..." : "Start with a Sample"}
              </Typography>
              <Typography variant="small" color="secondary">
                Explore Nixelo with pre-filled demo issues and sprints
              </Typography>
            </Stack>
          </Stack>
        </Card>

        <Card
          recipe="onboardingActionTile"
          padding="lg"
          onClick={isCreating ? undefined : onFinishWithoutProject}
          className={isCreating ? "opacity-50" : undefined}
          aria-disabled={isCreating}
        >
          <Stack gap="lg">
            <div className={cn(getCardRecipeClassName("onboardingActionIconNeutral"), "p-4 w-fit")}>
              <Flex align="center" justify="center">
                <Icon icon={FolderPlus} size="lg" tone="secondary" />
              </Flex>
            </div>
            <Stack gap="xs">
              <Typography variant="h3">Start from Scratch</Typography>
              <Typography variant="small" color="secondary">
                Create your own project with a blank canvas
              </Typography>
            </Stack>
            <Typography variant="caption">For experienced users</Typography>
          </Stack>
        </Card>
      </Grid>

      <Flex justify="center">
        <Button variant="ghost" size="sm" onClick={onFinishWithoutProject} disabled={isCreating}>
          I'll explore on my own
        </Button>
      </Flex>
    </>
  );
}
