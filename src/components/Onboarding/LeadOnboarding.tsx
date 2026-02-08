import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { ArrowLeft, Building2, FolderPlus, Sparkles, UserPlus } from "lucide-react";
import { useState } from "react";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { showError, showSuccess } from "@/lib/toast";
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
      <div className="space-y-8">
        {/* Back button - Mintlify-inspired */}
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-ui-text-secondary hover:text-ui-text transition-colors duration-fast group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <Typography variant="caption" className="font-medium">
            Back
          </Typography>
        </button>

        {/* Header */}
        <div className="text-center">
          <Typography variant="h1" className="text-3xl font-bold text-ui-text mb-3">
            Perfect for Team Leads
          </Typography>
          <Typography className="text-ui-text-secondary text-lg">
            Here's what you can do with Nixelo
          </Typography>
        </div>

        {/* Feature Highlights */}
        <FeatureHighlights />

        {/* Additional lead features */}
        <div className="bg-ui-bg rounded-xl p-6">
          <Typography variant="h3" className="font-medium text-ui-text mb-4">
            As a team lead, you can also:
          </Typography>
          <ul className="space-y-3 text-ui-text-secondary">
            <li className="flex items-start gap-3">
              <UserPlus className="w-5 h-5 text-brand-ring mt-0.5 shrink-0" />
              <span>Invite team members and manage roles</span>
            </li>
            <li className="flex items-start gap-3">
              <FolderPlus className="w-5 h-5 text-brand-ring mt-0.5 shrink-0" />
              <span>Create and customize project workflows</span>
            </li>
            <li className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-brand-ring mt-0.5 shrink-0" />
              <span>Use AI to generate issue suggestions and summaries</span>
            </li>
          </ul>
        </div>

        {/* Continue */}
        <Flex justify="center">
          <Button variant="primary" size="lg" onClick={() => setStep("project")}>
            Let's set up your project
          </Button>
        </Flex>
      </div>
    );
  }

  if (step === "project") {
    return (
      <div className="space-y-8">
        {/* Back button - Mintlify-inspired */}
        <button
          type="button"
          onClick={() => setStep("features")}
          className="flex items-center gap-2 text-ui-text-secondary hover:text-ui-text transition-colors duration-fast group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <Typography variant="caption" className="font-medium">
            Back
          </Typography>
        </button>

        {/* Header */}
        <div className="text-center">
          <Flex
            inline
            align="center"
            justify="center"
            className="w-16 h-16 rounded-full bg-brand-indigo-track mb-4"
          >
            <Building2 className="w-8 h-8 text-brand" />
          </Flex>
          <Typography variant="h1" className="text-3xl font-bold mb-3">
            Name Your Project
          </Typography>
          <Typography variant="p" color="secondary" className="text-lg">
            This is where your team will collaborate
          </Typography>
        </div>

        {/* Project Name Input */}
        <div className="max-w-md mx-auto space-y-4">
          <div>
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
              <Typography variant="p" className="text-status-error text-sm mt-2 text-center">
                {projectError}
              </Typography>
            )}
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleCreateOrganization}
            disabled={isCreating || !projectName.trim()}
            className="w-full h-12 text-lg font-semibold transition-all duration-300 hover:shadow-xl active:scale-95"
          >
            {isCreating ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </div>
    );
  }

  if (step === "project-choice") {
    return (
      <div className="space-y-8">
        {/* Back button - Mintlify-inspired subtle styling */}
        <button
          type="button"
          onClick={() => setStep("project")}
          className="flex items-center gap-2 text-ui-text-secondary hover:text-ui-text transition-colors duration-fast group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <Typography variant="caption" className="font-medium">
            Back
          </Typography>
        </button>

        {/* Header */}
        <div className="text-center">
          <Typography variant="h1" className="text-3xl font-bold mb-3 tracking-tight">
            Start Your First Project
          </Typography>
          <Typography variant="p" color="secondary" className="text-lg">
            How would you like to get started?
          </Typography>
        </div>

        {/* Options - Mintlify-inspired card styling */}
        <Grid cols={1} colsSm={2} gap="lg">
          {/* Sample Project - Highlighted as recommended */}
          <button
            type="button"
            onClick={handleCreateSample}
            disabled={isCreating}
            className="group p-6 rounded-container border-2 border-brand/30 bg-brand-subtle/30 text-left transition-all duration-default hover:border-brand hover:shadow-card-hover hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <Flex direction="column" gap="lg">
              <Flex align="center" justify="between">
                <div className="p-3 rounded-lg bg-brand-subtle group-hover:bg-brand/10 transition-colors">
                  <Sparkles className="w-6 h-6 text-brand" />
                </div>
                <Badge variant="brand" shape="pill" size="md">
                  Recommended
                </Badge>
              </Flex>
              <div>
                <Typography variant="h3" className="font-semibold mb-1 text-ui-text">
                  {isCreating ? "Creating..." : "Start with a Sample"}
                </Typography>
                <Typography variant="p" color="secondary" className="text-sm">
                  Explore Nixelo with pre-filled demo issues and sprints
                </Typography>
              </div>
            </Flex>
          </button>

          {/* Start Fresh */}
          <button
            type="button"
            onClick={handleFinishWithoutProject}
            disabled={isCreating}
            className="group p-6 rounded-container border-2 border-ui-border bg-ui-bg text-left transition-all duration-default hover:border-ui-border-secondary hover:shadow-card-hover hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <Flex direction="column" gap="lg">
              <div className="p-3 rounded-lg bg-ui-bg-tertiary group-hover:bg-ui-bg-hover transition-colors w-fit">
                <FolderPlus className="w-6 h-6 text-ui-text-secondary" />
              </div>
              <div>
                <Typography variant="h3" className="font-semibold mb-1 text-ui-text">
                  Start from Scratch
                </Typography>
                <Typography variant="p" color="secondary" className="text-sm">
                  Create your own project with a blank canvas
                </Typography>
              </div>
              <Typography variant="caption">For experienced users</Typography>
            </Flex>
          </button>
        </Grid>

        {/* Skip option */}
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFinishWithoutProject}
            disabled={isCreating}
            className="text-ui-text-tertiary hover:text-ui-text"
          >
            I'll explore on my own
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
