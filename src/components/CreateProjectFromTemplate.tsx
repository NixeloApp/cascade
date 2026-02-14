import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { useOrganization } from "@/hooks/useOrgContext";
import { ArrowLeft } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
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
          <Flex className="flex-col sm:flex-row sm:justify-between gap-3 w-full">
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
          <div className="space-y-6">
            <Typography variant="p" color="secondary">
              Start with a pre-configured template to save time and follow best practices
            </Typography>

            {!templates ? (
              <Flex align="center" justify="center" className="py-8">
                <LoadingSpinner />
              </Flex>
            ) : (
              <Grid cols={1} colsMd={2} gap="lg">
                {templates.map((template: Doc<"projectTemplates">) => (
                  <button
                    type="button"
                    key={template._id}
                    onClick={() => handleSelectTemplate(template._id)}
                    className="text-left p-6 border-2 border-ui-border rounded-lg hover:border-brand-ring hover:bg-ui-bg-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-ring"
                  >
                    <Flex align="start" gap="lg">
                      <FlexItem shrink={false}>
                        <Typography variant="h2">{template.icon}</Typography>
                      </FlexItem>
                      <FlexItem flex="1" className="min-w-0">
                        <Typography
                          variant="h3"
                          className="text-lg font-semibold text-ui-text mb-1"
                        >
                          {template.name}
                        </Typography>
                        <Typography variant="p" color="secondary" className="text-sm mb-3">
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
                      </FlexItem>
                    </Flex>
                  </button>
                ))}
              </Grid>
            )}
          </div>
        ) : (
          // Project Configuration
          <div className="space-y-6">
            {/* Template Info */}
            {selectedTemplate && (
              <div className="p-4 bg-ui-bg-secondary rounded-lg">
                <Flex align="center" gap="md">
                  <Typography variant="h3" as="span">
                    {selectedTemplate.icon}
                  </Typography>
                  <div>
                    <Typography variant="h3" className="font-semibold text-ui-text">
                      {selectedTemplate.name}
                    </Typography>
                    <Typography variant="p" color="secondary" className="text-sm">
                      {selectedTemplate.workflowStates.length} workflow states,{" "}
                      {selectedTemplate.defaultLabels.length} default labels
                    </Typography>
                  </div>
                </Flex>
              </div>
            )}

            {/* Form */}
            <div className="space-y-4">
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
            </div>

            {/* Preview */}
            {selectedTemplate && (
              <div>
                <Typography variant="h4" className="text-sm font-medium text-ui-text mb-3">
                  What's Included:
                </Typography>
                <div className="space-y-2">
                  <Flex align="center" gap="sm">
                    <svg
                      aria-hidden="true"
                      className="w-5 h-5 text-status-success"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <Typography variant="p" className="text-ui-text">
                      {selectedTemplate.workflowStates.length} workflow states
                    </Typography>
                  </Flex>
                  <Flex align="center" gap="sm">
                    <svg
                      aria-hidden="true"
                      className="w-5 h-5 text-status-success"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <Typography variant="p" className="text-ui-text">
                      {selectedTemplate.defaultLabels.length} pre-configured labels
                    </Typography>
                  </Flex>
                  <Flex align="center" gap="sm">
                    <svg
                      aria-hidden="true"
                      className="w-5 h-5 text-status-success"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <Typography variant="p" className="text-ui-text capitalize">
                      {selectedTemplate.boardType} board type
                    </Typography>
                  </Flex>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}
