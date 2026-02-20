import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { ArrowLeft, Building2, FolderPlus, Sparkles, UserPlus } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Icon } from "@/components/ui/Icon";
import { Stack } from "@/components/ui/Stack";
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
  onCreateProject: (projectId: Id<"projects">) => void;
  onBack: () => void;
  onWorkspaceCreated?: (slug: string) => void;
}

type LeadStep = "features" | "project" | "project-choice" | "creating";

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

  const createSampleProject = useMutation(api.onboarding.createSampleProject);
  const createOrganization = useMutation(api.organizations.createOrganization);
  const completeOnboarding = useMutation(api.onboarding.completeOnboardingFlow);

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
      const projectId = await createSampleProject({});
      await completeOnboarding();
      showSuccess("Sample project created! Explore and customize it.");

      // Navigate to the new project
      if (createdSlug && onWorkspaceCreated) {
        onWorkspaceCreated(createdSlug);
      } else {
        onCreateProject(projectId as Id<"projects">);
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

  if (step === "features") {
    return (
      <Stack gap="xl">
        {/* Back button - Mintlify-inspired */}
        <Button variant="ghost" size="sm" onClick={onBack} className="self-start group">
          <Flex align="center" gap="xs">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <Typography variant="caption" className="font-medium">
              Back
            </Typography>
          </Flex>
        </Button>

        {/* Header */}
        <Stack gap="sm" className="text-center">
          <Typography variant="h1" data-testid={TEST_IDS.ONBOARDING.TEAM_LEAD_HEADING}>
            Perfect for Team Leads
          </Typography>
          <Typography variant="lead">Here's what you can do with Nixelo</Typography>
        </Stack>

        {/* Feature Highlights */}
        <FeatureHighlights />

        {/* Additional lead features */}
        <Card padding="lg" radius="full">
          <Stack gap="md">
            <Typography variant="h3">As a team lead, you can also:</Typography>
            <Stack gap="sm">
              <Flex align="start" gap="sm">
                <Icon icon={UserPlus} size="md" className="text-brand-ring mt-0.5 shrink-0" />
                <Typography color="secondary">Invite team members and manage roles</Typography>
              </Flex>
              <Flex align="start" gap="sm">
                <Icon icon={FolderPlus} size="md" className="text-brand-ring mt-0.5 shrink-0" />
                <Typography color="secondary">Create and customize project workflows</Typography>
              </Flex>
              <Flex align="start" gap="sm">
                <Icon icon={Sparkles} size="md" className="text-brand-ring mt-0.5 shrink-0" />
                <Typography color="secondary">
                  Use AI to generate issue suggestions and summaries
                </Typography>
              </Flex>
            </Stack>
          </Stack>
        </Card>

        {/* Continue */}
        <Flex justify="center">
          <Button
            variant="primary"
            size="lg"
            onClick={() => setStep("project")}
            data-testid={TEST_IDS.ONBOARDING.SETUP_WORKSPACE_BUTTON}
          >
            Let's set up your project
          </Button>
        </Flex>
      </Stack>
    );
  }

  if (step === "project") {
    return (
      <Stack gap="xl">
        {/* Back button - Mintlify-inspired */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setStep("features")}
          className="self-start group"
        >
          <Flex align="center" gap="xs">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <Typography variant="caption" className="font-medium">
              Back
            </Typography>
          </Flex>
        </Button>

        {/* Header */}
        <Stack gap="md" className="text-center">
          <Flex
            inline
            align="center"
            justify="center"
            className="w-16 h-16 rounded-full bg-brand-indigo-track mx-auto"
          >
            <Icon icon={Building2} size="xl" className="text-brand" />
          </Flex>
          <Stack gap="sm">
            <Typography variant="h1">Name Your Project</Typography>
            <Typography variant="lead">This is where your team will collaborate</Typography>
          </Stack>
        </Stack>

        {/* Project Name Input */}
        <Stack gap="md" className="max-w-md mx-auto">
          <Stack gap="xs">
            <Input
              type="text"
              placeholder="e.g., Acme Corp, My Startup, Design Team"
              value={projectName}
              onChange={(e) => {
                setWorkspaceName(e.target.value);
                setWorkspaceError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isCreating) {
                  handleCreateOrganization();
                }
              }}
              className="text-center text-lg"
              autoFocus
            />
            {projectError && (
              <Typography variant="small" color="error" className="text-center">
                {projectError}
              </Typography>
            )}
          </Stack>

          <Button
            variant="primary"
            size="lg"
            onClick={handleCreateOrganization}
            disabled={isCreating || !projectName.trim()}
            className="w-full"
          >
            {isCreating ? "Creating..." : "Create Project"}
          </Button>
        </Stack>
      </Stack>
    );
  }

  if (step === "project-choice") {
    return (
      <Stack gap="xl">
        {/* Back button - Mintlify-inspired subtle styling */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setStep("project")}
          className="self-start group"
        >
          <Flex align="center" gap="xs">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <Typography variant="caption" className="font-medium">
              Back
            </Typography>
          </Flex>
        </Button>

        {/* Header */}
        <Stack gap="sm" className="text-center">
          <Typography variant="h1">Start Your First Project</Typography>
          <Typography variant="lead">How would you like to get started?</Typography>
        </Stack>

        {/* Options - Mintlify-inspired card styling */}
        <Grid cols={1} colsSm={2} gap="lg">
          {/* Sample Project - Highlighted as recommended */}
          <Card
            hoverable
            padding="lg"
            onClick={handleCreateSample}
            className={cn(
              "group border-2 border-brand/30 bg-brand-subtle/30 text-left",
              isCreating && "opacity-50 pointer-events-none",
            )}
            aria-disabled={isCreating}
          >
            <Stack gap="lg">
              <Flex align="center" justify="between">
                <Flex
                  align="center"
                  justify="center"
                  className="p-3 rounded-lg bg-brand-subtle group-hover:bg-brand/10 transition-colors"
                >
                  <Icon icon={Sparkles} size="lg" className="text-brand" />
                </Flex>
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

          {/* Start Fresh */}
          <Card
            hoverable
            padding="lg"
            onClick={handleFinishWithoutProject}
            className={cn(
              "group border-2 text-left",
              isCreating && "opacity-50 pointer-events-none",
            )}
            aria-disabled={isCreating}
          >
            <Stack gap="lg">
              <Flex
                align="center"
                justify="center"
                className="p-3 rounded-lg bg-ui-bg-tertiary group-hover:bg-ui-bg-hover transition-colors w-fit"
              >
                <Icon icon={FolderPlus} size="lg" className="text-ui-text-secondary" />
              </Flex>
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

        {/* Skip option */}
        <Flex justify="center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFinishWithoutProject}
            disabled={isCreating}
          >
            I'll explore on my own
          </Button>
        </Flex>
      </Stack>
    );
  }

  return null;
}
