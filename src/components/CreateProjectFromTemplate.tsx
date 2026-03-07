/**
 * Create Project From Template
 *
 * Template selection and project creation wizard.
 * Displays available templates with descriptions and previews.
 * Handles project key generation and initial configuration.
 */

import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import { useEffect, useState } from "react";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Stack } from "@/components/ui/Stack";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { ArrowLeft, CheckCircle } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Dialog } from "./ui/Dialog";
import { Input, Select, Textarea } from "./ui/form";
import { Icon } from "./ui/Icon";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { Typography } from "./ui/Typography";

interface CreateProjectFromTemplateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated?: (project: {
    projectId: Id<"projects">;
    projectKey: string;
  }) => void | Promise<void>;
}

interface CreateProjectFooterProps {
  isSubmitting: boolean;
  canCreate: boolean;
  onBack: () => void;
  onCancel: () => void;
  onCreate: () => void;
}

interface TemplateSelectionProps {
  templates: Doc<"projectTemplates">[] | undefined;
  onSelectTemplate: (templateId: Id<"projectTemplates">) => void;
}

interface ProjectConfigurationProps {
  selectedTemplate: FunctionReturnType<typeof api.projectTemplates.get> | undefined;
  workspaces: Doc<"workspaces">[] | undefined;
  selectedWorkspaceId: Id<"workspaces"> | null;
  onWorkspaceChange: (workspaceId: Id<"workspaces">) => void;
  projectName: string;
  onProjectNameChange: (projectName: string) => void;
  projectKey: string;
  onProjectKeyChange: (projectKey: string) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
}

function getCategoryColor(category: string): string {
  switch (category) {
    case "software":
      return "bg-brand-subtle text-brand-active";
    case "marketing":
    case "design":
      return "bg-accent-subtle text-accent-active";
    default:
      return "bg-ui-bg-tertiary text-ui-text-secondary";
  }
}

function CreateProjectFooter({
  isSubmitting,
  canCreate,
  onBack,
  onCancel,
  onCreate,
}: CreateProjectFooterProps) {
  return (
    <Flex direction="column" gap="sm" className="sm:flex-row sm:justify-between w-full">
      <Button
        onClick={onBack}
        variant="secondary"
        className="w-full sm:w-auto"
        disabled={isSubmitting}
        leftIcon={<Icon icon={ArrowLeft} size="sm" />}
      >
        Back to Templates
      </Button>
      <Flex gap="md" className="w-full sm:w-auto">
        <Button
          onClick={onCancel}
          variant="secondary"
          className="flex-1 sm:flex-none"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          onClick={onCreate}
          disabled={!canCreate || isSubmitting}
          className="flex-1 sm:flex-none"
        >
          {isSubmitting ? (
            <Flex align="center" gap="sm">
              <LoadingSpinner size="sm" />
              <span>Creating...</span>
            </Flex>
          ) : (
            "Create Project"
          )}
        </Button>
      </Flex>
    </Flex>
  );
}

function TemplateSelection({ templates, onSelectTemplate }: TemplateSelectionProps) {
  return (
    <Stack gap="lg">
      <Typography variant="p" color="secondary">
        Start with a pre-configured template to save time and follow best practices
      </Typography>

      {!templates ? (
        <Card padding="xl" variant="ghost">
          <Flex align="center" justify="center">
            <LoadingSpinner />
          </Flex>
        </Card>
      ) : (
        <Grid as="ul" cols={1} colsMd={2} gap="lg">
          {templates.map((template) => (
            <li key={template._id} className="list-none">
              <Button
                variant="unstyled"
                onClick={() => onSelectTemplate(template._id)}
                className="text-left border-2 border-ui-border rounded-lg hover:border-brand-ring hover:bg-ui-bg-secondary transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-ring h-auto w-full"
              >
                <Flex align="start" gap="lg">
                  <FlexItem shrink={false}>
                    <Typography variant="h2" as="span">
                      {template.icon}
                    </Typography>
                  </FlexItem>
                  <FlexItem flex="1" className="min-w-0">
                    <Stack gap="sm">
                      <Typography variant="h3" as="span">
                        {template.name}
                      </Typography>
                      <Typography variant="small" color="secondary" as="span">
                        {template.description}
                      </Typography>
                      <Flex align="center" gap="sm">
                        <Badge size="sm" className={cn(getCategoryColor(template.category))}>
                          {template.category}
                        </Badge>
                        <Badge size="sm" variant="neutral" className="capitalize">
                          {template.boardType}
                        </Badge>
                      </Flex>
                    </Stack>
                  </FlexItem>
                </Flex>
              </Button>
            </li>
          ))}
        </Grid>
      )}
    </Stack>
  );
}

function ProjectConfiguration({
  selectedTemplate,
  workspaces,
  selectedWorkspaceId,
  onWorkspaceChange,
  projectName,
  onProjectNameChange,
  projectKey,
  onProjectKeyChange,
  description,
  onDescriptionChange,
}: ProjectConfigurationProps) {
  return (
    <Stack gap="lg">
      {selectedTemplate && (
        <Card padding="md" className="bg-ui-bg-secondary">
          <Flex align="center" gap="md">
            <Typography variant="h3" as="span">
              {selectedTemplate.icon}
            </Typography>
            <Stack gap="none">
              <Typography variant="h3">{selectedTemplate.name}</Typography>
              <Typography variant="small" color="secondary">
                {selectedTemplate.workflowStates.length} workflow states,{" "}
                {selectedTemplate.defaultLabels.length} default labels
              </Typography>
            </Stack>
          </Flex>
        </Card>
      )}

      <Stack gap="md">
        {workspaces && workspaces.length > 1 && (
          <Select
            label="Workspace"
            value={selectedWorkspaceId || ""}
            onChange={(e) => onWorkspaceChange(e.target.value as Id<"workspaces">)}
            options={workspaces.map((workspace) => ({
              value: workspace._id,
              label: workspace.name,
            }))}
            required
          />
        )}

        <Input
          label="Project Name"
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          placeholder="My Awesome Project"
          required
          data-testid={TEST_IDS.PROJECT.NAME_INPUT}
        />

        <Input
          label="Project Key"
          value={projectKey}
          onChange={(e) => onProjectKeyChange(e.target.value.toUpperCase())}
          placeholder="MAP"
          required
          helperText="Short code for issue keys (e.g., MAP-123)"
          data-testid={TEST_IDS.PROJECT.KEY_INPUT}
        />

        <Textarea
          label="Description (Optional)"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={3}
          placeholder="Project description..."
        />
      </Stack>

      {selectedTemplate && (
        <Stack gap="sm">
          <Typography variant="label">What's Included:</Typography>
          <Stack gap="sm">
            <Flex align="center" gap="sm">
              <Icon icon={CheckCircle} className="text-status-success" />
              <Typography variant="small">
                {selectedTemplate.workflowStates.length} workflow states
              </Typography>
            </Flex>
            <Flex align="center" gap="sm">
              <Icon icon={CheckCircle} className="text-status-success" />
              <Typography variant="small">
                {selectedTemplate.defaultLabels.length} pre-configured labels
              </Typography>
            </Flex>
            <Flex align="center" gap="sm">
              <Icon icon={CheckCircle} className="text-status-success" />
              <Typography variant="small" className="capitalize">
                {selectedTemplate.boardType} board type
              </Typography>
            </Flex>
          </Stack>
        </Stack>
      )}
    </Stack>
  );
}

/** Modal wizard for creating projects from pre-configured templates. */
export function CreateProjectFromTemplate({
  open,
  onOpenChange,
  onProjectCreated,
}: CreateProjectFromTemplateProps) {
  const { organizationId } = useOrganization();
  const [step, setStep] = useState<"select" | "configure">("select");
  const [selectedTemplateId, setSelectedTemplateId] = useState<Id<"projectTemplates"> | null>(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<Id<"workspaces"> | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [description, setDescription] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only load data when modal is open (auth is handled by useAuthenticatedQuery)
  const shouldLoadModalData = open;
  const workspaces = useAuthenticatedQuery(
    api.workspaces.list,
    shouldLoadModalData ? { organizationId } : "skip",
  );

  const templates = useAuthenticatedQuery(
    api.projectTemplates.list,
    shouldLoadModalData ? {} : "skip",
  );
  const selectedTemplate = useAuthenticatedQuery(
    api.projectTemplates.get,
    shouldLoadModalData && selectedTemplateId ? { id: selectedTemplateId } : "skip",
  );

  // Auto-select first workspace if available
  useEffect(() => {
    if (workspaces && workspaces.length > 0 && !selectedWorkspaceId) {
      setSelectedWorkspaceId(workspaces[0]._id);
    }
  }, [workspaces, selectedWorkspaceId]);

  const { mutate: createProject } = useAuthenticatedMutation(
    api.projectTemplates.createFromTemplate,
  );

  const handleSelectTemplate = (templateId: Id<"projectTemplates">) => {
    setSelectedTemplateId(templateId);
    setStep("configure");
  };

  const handleBack = () => {
    setStep("select");
    setSelectedTemplateId(null);
  };

  const handleCreate = async () => {
    if (!(selectedTemplateId && selectedWorkspaceId && projectName.trim() && projectKey.trim())) {
      showError("validation", "Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    let projectId: Id<"projects">;
    try {
      const result = await createProject({
        templateId: selectedTemplateId,
        projectName: projectName.trim(),
        projectKey: projectKey.trim().toUpperCase(),
        description: description.trim() || undefined,
        organizationId,
        workspaceId: selectedWorkspaceId,
      });
      projectId = result.projectId;
    } catch (error) {
      showError(error, "Failed to create project");
      setIsSubmitting(false);
      return;
    }

    // Project created successfully - callback errors are separate
    showSuccess("Project created successfully");
    try {
      await onProjectCreated?.({
        projectId,
        projectKey: projectKey.trim().toUpperCase(),
      });
    } catch (error) {
      showError(error, "Project created but callback failed");
    }
    onOpenChange(false);
    resetForm();
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setStep("select");
    setSelectedTemplateId(null);
    setProjectName("");
    setProjectKey("");
    setDescription("");
    setIsSubmitting(false); // Reset submitting state too
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };
  const canCreate = Boolean(projectName.trim() && projectKey.trim() && selectedWorkspaceId);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={step === "select" ? "Choose a Template" : "Configure Project"}
      size="xl"
      footer={
        step === "configure" ? (
          <CreateProjectFooter
            isSubmitting={isSubmitting}
            canCreate={canCreate}
            onBack={handleBack}
            onCancel={handleClose}
            onCreate={handleCreate}
          />
        ) : undefined
      }
    >
      <div data-testid={TEST_IDS.PROJECT.CREATE_MODAL}>
        {step === "select" ? (
          <TemplateSelection templates={templates} onSelectTemplate={handleSelectTemplate} />
        ) : (
          <ProjectConfiguration
            selectedTemplate={selectedTemplate}
            workspaces={workspaces}
            selectedWorkspaceId={selectedWorkspaceId}
            onWorkspaceChange={setSelectedWorkspaceId}
            projectName={projectName}
            onProjectNameChange={setProjectName}
            projectKey={projectKey}
            onProjectKeyChange={setProjectKey}
            description={description}
            onDescriptionChange={setDescription}
          />
        )}
      </div>
    </Dialog>
  );
}
