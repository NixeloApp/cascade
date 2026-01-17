import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { ArrowLeft, Bell, Building2, Clock, FileText, Kanban } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Flex } from "@/components/ui/Flex";
import { Input } from "@/components/ui/Input";
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
        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-ui-text-secondary hover:text-ui-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Header */}
        <div className="text-center">
          <Flex
            inline
            align="center"
            justify="center"
            className="w-16 h-16 rounded-full bg-brand-indigo-track mb-4"
          >
            <Building2 className="w-8 h-8 text-primary-600" />
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
              <Typography variant="p" className="text-red-500 text-sm mt-2 text-center">
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
      {/* Back button */}
      <button
        type="button"
        onClick={() => setStep("project")}
        className="flex items-center gap-2 text-ui-text-secondary hover:text-ui-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
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
        <Typography variant="h3" className="font-medium text-ui-text-primary">
          Here's what you can do in Nixelo:
        </Typography>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Flex align="start" gap="md" className="p-4 rounded-lg bg-ui-bg-primary">
            <Kanban className="w-5 h-5 text-priority-low mt-0.5 shrink-0" />
            <div>
              <Typography variant="h4" className="font-medium text-ui-text-primary text-sm">
                Work on Issues
              </Typography>
              <Typography className="text-xs text-ui-text-secondary">
                Drag issues across the board as you progress
              </Typography>
            </div>
          </Flex>

          <Flex align="start" gap="md" className="p-4 rounded-lg bg-ui-bg-primary">
            <FileText className="w-5 h-5 text-status-success mt-0.5 shrink-0" />
            <div>
              <Typography variant="h4" className="font-medium text-ui-text-primary text-sm">
                Collaborate on Docs
              </Typography>
              <Typography className="text-xs text-ui-text-secondary">
                Edit documents together in real-time
              </Typography>
            </div>
          </Flex>

          <Flex align="start" gap="md" className="p-4 rounded-lg bg-ui-bg-primary">
            <Clock className="w-5 h-5 text-status-warning mt-0.5 shrink-0" />
            <div>
              <Typography variant="h4" className="font-medium text-ui-text-primary text-sm">
                Track Time
              </Typography>
              <Typography className="text-xs text-ui-text-secondary">
                Log time spent on tasks
              </Typography>
            </div>
          </Flex>

          <Flex align="start" gap="md" className="p-4 rounded-lg bg-ui-bg-primary">
            <Bell className="w-5 h-5 text-issue-type-story mt-0.5 shrink-0" />
            <div>
              <Typography variant="h4" className="font-medium text-ui-text-primary text-sm">
                Stay Updated
              </Typography>
              <Typography className="text-xs text-ui-text-secondary">
                Get notified when mentioned or assigned
              </Typography>
            </div>
          </Flex>
        </div>
      </div>

      {/* Keyboard shortcuts tip */}
      <div className="bg-ui-bg-primary rounded-xl p-4 text-center">
        <Typography className="text-sm text-ui-text-secondary">
          <span className="font-medium">Pro tip:</span> Press{" "}
          <kbd className="px-2 py-0.5 rounded bg-ui-bg-tertiary text-xs font-mono">Ctrl+K</kbd> or{" "}
          <kbd className="px-2 py-0.5 rounded bg-ui-bg-tertiary text-xs font-mono">Cmd+K</kbd> to
          open the command palette
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
