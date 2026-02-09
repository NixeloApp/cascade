import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { ArrowLeft, Bell, Building2, Clock, FileText, Kanban } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Input } from "@/components/ui/Input";
import { KeyboardShortcut } from "@/components/ui/KeyboardShortcut";
import { showError, showSuccess } from "@/lib/toast";
import { Typography } from "../ui/Typography";

interface MemberOnboardingProps {
  onComplete: () => void;
  onBack: () => void;
  onWorkspaceCreated?: (slug: string) => void;
}

type MemberStep = "project" | "features";

export function MemberOnboarding({
  onComplete,
  onBack,
  onWorkspaceCreated,
}: MemberOnboardingProps) {
  const [step, setStep] = useState<MemberStep>("project");
  const [projectName, setWorkspaceName] = useState("");
  const [projectError, setWorkspaceError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);

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
      setStep("features");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create project";
      setWorkspaceError(message);
      showError(error, "Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  const handleFinish = async () => {
    await completeOnboarding();
    if (createdSlug && onWorkspaceCreated) {
      onWorkspaceCreated(createdSlug);
    } else {
      onComplete();
    }
  };

  if (step === "project") {
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
            Create a project for your team to collaborate
          </Typography>
        </div>

        {/* Project Name Input */}
        <div className="max-w-md mx-auto space-y-4">
          <div>
            <Input
              type="text"
              placeholder="e.g., Acme Corp, My Team, Design Studio"
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

  return (
    <div className="space-y-8">
      {/* Back button - Mintlify-inspired */}
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
        <Typography variant="h2" className="mb-3 text-3xl">
          You're All Set!
        </Typography>
        <Typography variant="lead">Here's what you can do in your project</Typography>
      </div>

      {/* What you can do */}
      <div className="space-y-4">
        <Typography variant="h3" className="font-medium text-ui-text">
          Here's what you can do in Nixelo:
        </Typography>

        <Grid cols={1} colsSm={2} gap="md">
          <Flex
            align="start"
            gap="md"
            className="p-4 rounded-container bg-ui-bg-soft border border-ui-border hover:border-ui-border-secondary transition-colors duration-fast"
          >
            <Flex
              align="center"
              justify="center"
              className="w-9 h-9 rounded-lg bg-palette-blue-bg shrink-0"
            >
              <Kanban className="w-5 h-5 text-palette-blue" />
            </Flex>
            <div>
              <Typography variant="h4" className="font-medium text-ui-text text-sm">
                Work on Issues
              </Typography>
              <Typography className="text-xs text-ui-text-secondary mt-0.5">
                Drag issues across the board as you progress
              </Typography>
            </div>
          </Flex>

          <Flex
            align="start"
            gap="md"
            className="p-4 rounded-container bg-ui-bg-soft border border-ui-border hover:border-ui-border-secondary transition-colors duration-fast"
          >
            <Flex
              align="center"
              justify="center"
              className="w-9 h-9 rounded-lg bg-status-success-bg shrink-0"
            >
              <FileText className="w-5 h-5 text-status-success" />
            </Flex>
            <div>
              <Typography variant="h4" className="font-medium text-ui-text text-sm">
                Collaborate on Docs
              </Typography>
              <Typography className="text-xs text-ui-text-secondary mt-0.5">
                Edit documents together in real-time
              </Typography>
            </div>
          </Flex>

          <Flex
            align="start"
            gap="md"
            className="p-4 rounded-container bg-ui-bg-soft border border-ui-border hover:border-ui-border-secondary transition-colors duration-fast"
          >
            <Flex
              align="center"
              justify="center"
              className="w-9 h-9 rounded-lg bg-status-warning-bg shrink-0"
            >
              <Clock className="w-5 h-5 text-status-warning" />
            </Flex>
            <div>
              <Typography variant="h4" className="font-medium text-ui-text text-sm">
                Track Time
              </Typography>
              <Typography className="text-xs text-ui-text-secondary mt-0.5">
                Log time spent on tasks
              </Typography>
            </div>
          </Flex>

          <Flex
            align="start"
            gap="md"
            className="p-4 rounded-container bg-ui-bg-soft border border-ui-border hover:border-ui-border-secondary transition-colors duration-fast"
          >
            <Flex
              align="center"
              justify="center"
              className="w-9 h-9 rounded-lg bg-palette-purple-bg shrink-0"
            >
              <Bell className="w-5 h-5 text-palette-purple" />
            </Flex>
            <div>
              <Typography variant="h4" className="font-medium text-ui-text text-sm">
                Stay Updated
              </Typography>
              <Typography className="text-xs text-ui-text-secondary mt-0.5">
                Get notified when mentioned or assigned
              </Typography>
            </div>
          </Flex>
        </Grid>
      </div>

      {/* Keyboard shortcuts tip */}
      <div className="bg-ui-bg rounded-xl p-4 text-center">
        <Typography className="text-sm text-ui-text-secondary">
          <strong>Pro tip:</strong> Press <KeyboardShortcut shortcut="Ctrl+K" variant="subtle" /> or{" "}
          <KeyboardShortcut shortcut="Cmd+K" variant="subtle" /> to open the command palette
        </Typography>
      </div>

      {/* Continue */}
      <Flex justify="center">
        <Button variant="primary" size="lg" onClick={handleFinish} className="min-w-48">
          Go to Dashboard
        </Button>
      </Flex>
    </div>
  );
}
