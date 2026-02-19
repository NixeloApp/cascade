import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Stack } from "@/components/ui/Stack";
import { useOrganization } from "@/hooks/useOrgContext";
import { ArrowLeft, CheckCircle } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
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
  onProjectCreated?: (projectId: Id<"projects">, projectKey: string) => void;
}

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

  const workspaces = useQuery(api.workspaces.list, { organizationId });

  const templates = useQuery(api.projectTemplates.list);
  const selectedTemplate = useQuery(
    api.projectTemplates.get,
    selectedTemplateId ? { id: selectedTemplateId } : "skip",
  );

  // Auto-select first workspace if available
  useEffect(() => {
    if (workspaces && workspaces.length > 0 && !selectedWorkspaceId) {
      setSelectedWorkspaceId(workspaces[0]._id);
    }
  }, [workspaces, selectedWorkspaceId]);

  const createProject = useMutation(api.projectTemplates.createFromTemplate);

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
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const projectId = await createProject({
        templateId: selectedTemplateId,
        projectName: projectName.trim(),
        projectKey: projectKey.trim().toUpperCase(),
        description: description.trim() || undefined,
        organizationId,
        workspaceId: selectedWorkspaceId,
      });

      toast.success("Project created successfully");
      onProjectCreated?.(projectId, projectKey.trim().toUpperCase());
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "software":
        return "bg-brand-subtle text-brand-active";
      case "marketing":
        return "bg-accent-subtle text-accent-active";
      case "design":
        return "bg-accent-subtle text-accent-active";
      default:
        return "bg-ui-bg-tertiary text-ui-text-secondary";
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={step === "select" ? "Choose a Template" : "Configure Project"}
      className="sm:max-w-4xl"
      footer={
        step === "configure" ? (
          <Flex direction="column" gap="sm" className="sm:flex-row sm:justify-between w-full">
            <Button
              onClick={handleBack}
              variant="secondary"
              className="w-full sm:w-auto"
              disabled={isSubmitting}
              leftIcon={<Icon icon={ArrowLeft} size="sm" />}
            >
              Back to Templates
            </Button>
            <Flex gap="md" className="w-full sm:w-auto">
              <Button
                onClick={handleClose}
                variant="secondary"
                className="flex-1 sm:flex-none"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={
                  !(projectName.trim() && projectKey.trim() && selectedWorkspaceId) || isSubmitting
                }
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
        ) : undefined
      }
    >
      <div data-testid={TEST_IDS.PROJECT.CREATE_MODAL}>
        {step === "select" ? (
          // Template Selection
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
              <Grid cols={1} colsMd={2} gap="lg">
                {templates.map((template: Doc<"projectTemplates">) => (
                  <button
                    type="button"
                    key={template._id}
                    onClick={() => handleSelectTemplate(template._id)}
                    className="text-left border-2 border-ui-border rounded-lg hover:border-brand-ring hover:bg-ui-bg-secondary transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-ring"
                  >
                    <Flex align="start" gap="lg">
                      <FlexItem shrink={false}>
                        <Typography variant="h2">{template.icon}</Typography>
                      </FlexItem>
                      <FlexItem flex="1" className="min-w-0">
                        <Stack gap="sm">
                          <Typography variant="h3">{template.name}</Typography>
                          <Typography variant="small" color="secondary">
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
                  </button>
                ))}
              </Grid>
            )}
          </Stack>
        ) : (
          // Project Configuration
          <Stack gap="lg">
            {/* Template Info */}
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

            {/* Form */}
            <Stack gap="md">
              {workspaces && workspaces.length > 1 && (
                <Select
                  label="Workspace"
                  value={selectedWorkspaceId || ""}
                  onChange={(e) => setSelectedWorkspaceId(e.target.value as Id<"workspaces">)}
                  options={workspaces.map((ws: Doc<"workspaces">) => ({
                    value: ws._id,
                    label: ws.name,
                  }))}
                  required
                />
              )}

              <Input
                label="Project Name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My Awesome Project"
                required
                data-testid={TEST_IDS.PROJECT.NAME_INPUT}
              />

              <Input
                label="Project Key"
                value={projectKey}
                onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                placeholder="MAP"
                required
                helperText="Short code for issue keys (e.g., MAP-123)"
                data-testid={TEST_IDS.PROJECT.KEY_INPUT}
              />

              <Textarea
                label="Description (Optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Project description..."
              />
            </Stack>

            {/* Preview */}
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
        )}
      </div>
    </Dialog>
  );
}
