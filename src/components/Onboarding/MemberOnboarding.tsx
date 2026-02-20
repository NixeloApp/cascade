import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { ArrowLeft, Bell, Building2, Clock, FileText, Kanban } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { KeyboardShortcut } from "@/components/ui/KeyboardShortcut";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";

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
            <Typography variant="h1" data-testid={TEST_IDS.ONBOARDING.NAME_PROJECT_HEADING}>
              Name Your Project
            </Typography>
            <Typography variant="lead">Create a project for your team to collaborate</Typography>
          </Stack>
        </Stack>

        {/* Project Name Input */}
        <Stack gap="md" className="max-w-md mx-auto">
          <Stack gap="xs">
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

  return (
    <Stack gap="xl">
      {/* Back button - Mintlify-inspired */}
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
        <Typography variant="h2" data-testid={TEST_IDS.ONBOARDING.ALL_SET_HEADING}>
          You're ready
        </Typography>
        <Typography variant="lead">Here's what you can do in Nixelo</Typography>
      </Stack>

      {/* What you can do */}
      <Grid cols={1} colsSm={2} gap="md">
        <Card variant="soft" padding="md" hoverable>
          <Flex align="start" gap="md">
            <Flex
              align="center"
              justify="center"
              className="w-9 h-9 rounded-lg bg-palette-blue-bg shrink-0"
            >
              <Icon icon={Kanban} size="md" className="text-palette-blue" />
            </Flex>
            <Stack gap="none">
              <Typography variant="label">Work on Issues</Typography>
              <Typography variant="meta">Drag issues across the board as you progress</Typography>
            </Stack>
          </Flex>
        </Card>

        <Card variant="soft" padding="md" hoverable>
          <Flex align="start" gap="md">
            <Flex
              align="center"
              justify="center"
              className="w-9 h-9 rounded-lg bg-status-success-bg shrink-0"
            >
              <Icon icon={FileText} size="md" className="text-status-success" />
            </Flex>
            <Stack gap="none">
              <Typography variant="label">Collaborate on Docs</Typography>
              <Typography variant="meta">Edit documents together in real-time</Typography>
            </Stack>
          </Flex>
        </Card>

        <Card variant="soft" padding="md" hoverable>
          <Flex align="start" gap="md">
            <Flex
              align="center"
              justify="center"
              className="w-9 h-9 rounded-lg bg-status-warning-bg shrink-0"
            >
              <Icon icon={Clock} size="md" className="text-status-warning" />
            </Flex>
            <Stack gap="none">
              <Typography variant="label">Track Time</Typography>
              <Typography variant="meta">Log time spent on tasks</Typography>
            </Stack>
          </Flex>
        </Card>

        <Card variant="soft" padding="md" hoverable>
          <Flex align="start" gap="md">
            <Flex
              align="center"
              justify="center"
              className="w-9 h-9 rounded-lg bg-palette-purple-bg shrink-0"
            >
              <Icon icon={Bell} size="md" className="text-palette-purple" />
            </Flex>
            <Stack gap="none">
              <Typography variant="label">Stay Updated</Typography>
              <Typography variant="meta">Get notified when mentioned or assigned</Typography>
            </Stack>
          </Flex>
        </Card>
      </Grid>

      {/* Keyboard shortcuts tip */}
      <Card padding="md" radius="full" className="text-center">
        <Typography variant="small" color="secondary">
          <strong>Pro tip:</strong> Press <KeyboardShortcut shortcut="Ctrl+K" variant="subtle" /> or{" "}
          <KeyboardShortcut shortcut="Cmd+K" variant="subtle" /> to open the command palette
        </Typography>
      </Card>

      {/* Continue */}
      <Flex justify="center">
        <Button
          variant="primary"
          size="lg"
          onClick={handleFinish}
          className="min-w-48"
          data-testid={TEST_IDS.ONBOARDING.GO_TO_DASHBOARD_BUTTON}
        >
          Go to Dashboard
        </Button>
      </Flex>
    </Stack>
  );
}
