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
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { CardSection } from "./ui/CardSection";
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

const PROJECT_TEMPLATE_DIALOG_COPY = {
  configure: {
    description:
      "Confirm the workspace, project key, and starter structure before creating the new project hub.",
    title: "Configure Project",
  },
  select: {
    description:
      "Choose a starting template first. You can rename it, change the key, and pick the workspace next.",
    title: "Choose a Template",
  },
} as const;

function getCategoryColor(category: string): string {
  switch (category) {
    case "software":
      return "brand";
    case "marketing":
    case "design":
      return "accent";
    default:
      return "neutral";
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
    <Flex direction="column" directionSm="row" justifySm="between" gap="sm" className="w-full">
      <Button
        onClick={onBack}
        variant="secondary"
        className="w-full sm:w-auto"
        disabled={isSubmitting}
        leftIcon={<Icon icon={ArrowLeft} size="sm" />}
      >
        Back to Templates
      </Button>
      <Flex direction="column" directionSm="row" gap="md" className="w-full sm:w-auto">
        <FlexItem flex="1" flexSm="none">
          <Button onClick={onCancel} variant="secondary" className="w-full" disabled={isSubmitting}>
            Cancel
          </Button>
        </FlexItem>
        <FlexItem flex="1" flexSm="none">
          <Button onClick={onCreate} disabled={!canCreate || isSubmitting} className="w-full">
            {isSubmitting ? (
              <Flex align="center" gap="sm">
                <LoadingSpinner size="sm" />
                <span>Creating...</span>
              </Flex>
            ) : (
              "Create Project"
            )}
          </Button>
        </FlexItem>
      </Flex>
    </Flex>
  );
}

function TemplateSelection({ templates, onSelectTemplate }: TemplateSelectionProps) {
  return (
    <Stack gap="lg">
      {!templates ? (
        <Card recipe="overlayInset" variant="section" padding="xl">
          <Flex align="center" justify="center">
            <LoadingSpinner />
          </Flex>
        </Card>
      ) : (
        <Grid as="ul" cols={1} colsMd={2} gap="lg">
          {templates.map((template) => (
            <li key={template._id} className="list-none">
              <Card
                recipe="optionTile"
                padding="lg"
                onClick={() => onSelectTemplate(template._id)}
                className="h-full text-left"
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
                        <Badge
                          size="sm"
                          variant={
                            getCategoryColor(template.category) as "brand" | "accent" | "neutral"
                          }
                        >
                          {template.category}
                        </Badge>
                        <Badge size="sm" variant="neutral" className="capitalize">
                          {template.boardType}
                        </Badge>
                      </Flex>
                    </Stack>
                  </FlexItem>
                </Flex>
              </Card>
            </li>
          ))}
        </Grid>
      )}
    </Stack>
  );
}

function TemplateSummary({
  selectedTemplate,
}: {
  selectedTemplate: NonNullable<FunctionReturnType<typeof api.projectTemplates.get>>;
}) {
  return (
    <Card recipe="overlayInset" variant="section" padding="md">
      <Stack gap="md">
        <Flex align="start" gap="md">
          <Typography variant="h3" as="span">
            {selectedTemplate.icon}
          </Typography>
          <Stack gap="xs">
            <Flex align="center" gap="sm" wrap>
              <Typography variant="h3">{selectedTemplate.name}</Typography>
              <Badge
                size="sm"
                variant={
                  getCategoryColor(selectedTemplate.category) as "brand" | "accent" | "neutral"
                }
              >
                {selectedTemplate.category}
              </Badge>
              <Badge size="sm" variant="neutral" className="capitalize">
                {selectedTemplate.boardType}
              </Badge>
            </Flex>
            <Typography variant="small" color="secondary">
              {selectedTemplate.description}
            </Typography>
          </Stack>
        </Flex>

        <Grid cols={1} colsSm={3} gap="md">
          <CardSection>
            <Stack gap="xs">
              <Typography variant="eyebrowWide">Workflow</Typography>
              <Typography variant="h4">{selectedTemplate.workflowStates.length}</Typography>
              <Typography variant="small" color="secondary">
                Starter states ready for the project board.
              </Typography>
            </Stack>
          </CardSection>
          <CardSection>
            <Stack gap="xs">
              <Typography variant="eyebrowWide">Labels</Typography>
              <Typography variant="h4">{selectedTemplate.defaultLabels.length}</Typography>
              <Typography variant="small" color="secondary">
                Pre-configured tags included from day one.
              </Typography>
            </Stack>
          </CardSection>
          <CardSection>
            <Stack gap="xs">
              <Typography variant="eyebrowWide">Board</Typography>
              <Typography variant="h4" className="capitalize">
                {selectedTemplate.boardType}
              </Typography>
              <Typography variant="small" color="secondary">
                Delivery mode applied across the new project.
              </Typography>
            </Stack>
          </CardSection>
        </Grid>

        <Stack gap="sm">
          <Typography variant="label">Included in the template</Typography>
          <Stack gap="sm">
            <Flex align="center" gap="sm">
              <Icon icon={CheckCircle} tone="success" />
              <Typography variant="small">
                {selectedTemplate.workflowStates.length} workflow states
              </Typography>
            </Flex>
            <Flex align="center" gap="sm">
              <Icon icon={CheckCircle} tone="success" />
              <Typography variant="small">
                {selectedTemplate.defaultLabels.length} pre-configured labels
              </Typography>
            </Flex>
            <Flex align="center" gap="sm">
              <Icon icon={CheckCircle} tone="success" />
              <Typography variant="small" className="capitalize">
                {selectedTemplate.boardType} board type
              </Typography>
            </Flex>
          </Stack>
        </Stack>
      </Stack>
    </Card>
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
      {selectedTemplate ? <TemplateSummary selectedTemplate={selectedTemplate} /> : null}

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
  const dialogCopy =
    step === "select"
      ? PROJECT_TEMPLATE_DIALOG_COPY.select
      : PROJECT_TEMPLATE_DIALOG_COPY.configure;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={dialogCopy.title}
      description={dialogCopy.description}
      size="lg"
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
