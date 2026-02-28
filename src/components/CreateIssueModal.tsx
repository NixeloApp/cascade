import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import type { IssuePriority, IssueTypeWithSubtask } from "@convex/validators";
import { useForm } from "@tanstack/react-form";
import { useAction, useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useOrganization } from "@/hooks/useOrgContext";
import { toggleInArray } from "@/lib/array-utils";
import { FormInput, FormSelectRadix, FormTextarea } from "@/lib/form";
import { Check, Sparkles, User } from "@/lib/icons";
import {
  getPriorityColor,
  getTypeLabel,
  ISSUE_PRIORITIES,
  ISSUE_TYPE_ICONS,
  ISSUE_TYPES_WITH_SUBTASK,
  PRIORITY_ICONS,
} from "@/lib/issue-utils";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { DuplicateDetection } from "./DuplicateDetection";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { Dialog } from "./ui/Dialog";
import { Flex } from "./ui/Flex";
import { Select } from "./ui/form";
import { Grid } from "./ui/Grid";
import { Icon } from "./ui/Icon";
import { SelectItem } from "./ui/Select";
import { Stack } from "./ui/Stack";
import { Switch } from "./ui/Switch";
import { Typography } from "./ui/Typography";

// =============================================================================
// Schema
// =============================================================================

const createIssueSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  type: z.enum(ISSUE_TYPES_WITH_SUBTASK),
  priority: z.enum(ISSUE_PRIORITIES),
  assigneeId: z.string(),
  storyPoints: z.string(),
});

// =============================================================================
// Component
// =============================================================================

interface CreateIssueModalProps {
  projectId?: Id<"projects">;
  sprintId?: Id<"sprints">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Render a modal dialog that lets users create a new issue for a project.
 *
 * The modal provides optional template selection, title/description inputs, type/priority selectors,
 * assignee and story point fields, label selection, and an AI-powered suggestions action. It handles
 * applying templates, toggling label selection, generating and applying AI suggestions, and creating
 * the issue via the provided project and sprint context.
 *
 * @param projectId - The id of the project the new issue will belong to.
 * @param sprintId - Optional id of the sprint to associate the new issue with.
 * @param open - Whether the modal is open.
 * @param onOpenChange - Callback invoked when the modal open state changes; receives the new open state.
 * @returns The modal's JSX element, or `null` when required project data is not yet available.
 */
export function CreateIssueModal({
  projectId,
  sprintId,
  open,
  onOpenChange,
}: CreateIssueModalProps) {
  const { organizationId } = useOrganization();

  // Project selection for global use
  const [internalSelectedProjectId, setInternalSelectedProjectId] = useState<Id<"projects"> | null>(
    projectId || null,
  );
  // Template selection (outside form - controls form reset)
  const [selectedTemplate, setSelectedTemplate] = useState<Id<"issueTemplates"> | "">("");
  // Labels (array state, not simple string)
  const [selectedLabels, setSelectedLabels] = useState<Id<"labels">[]>([]);
  // AI state
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  // Create another toggle
  const [createAnother, setCreateAnother] = useState(false);

  // Queries
  const orgProjects = useQuery(
    api.projects.getCurrentUserProjects,
    projectId ? "skip" : { organizationId },
  );

  const effectiveProjectId = projectId || internalSelectedProjectId;

  const project = useQuery(
    api.projects.getProject,
    effectiveProjectId ? { id: effectiveProjectId } : "skip",
  );
  const templates = useQuery(
    api.templates.listByProject,
    effectiveProjectId ? { projectId: effectiveProjectId } : "skip",
  );
  const labels = useQuery(
    api.labels.list,
    effectiveProjectId ? { projectId: effectiveProjectId } : "skip",
  );

  // Mutations
  const createIssue = useMutation(api.issues.createIssue);
  const generateSuggestions = useAction(api.ai.actions.generateIssueSuggestions);

  type CreateIssueForm = z.infer<typeof createIssueSchema>;

  // Form
  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      type: "task" satisfies IssueTypeWithSubtask,
      priority: "medium" satisfies IssuePriority,
      assigneeId: "",
      storyPoints: "",
    },
    validators: { onChange: createIssueSchema },
    onSubmit: async ({ value }: { value: CreateIssueForm }) => {
      if (!effectiveProjectId) {
        showError(new Error("Project is required"), "Validation error");
        return;
      }
      try {
        await createIssue({
          projectId: effectiveProjectId,
          title: value.title.trim(),
          description: value.description?.trim() || undefined,
          type: value.type,
          priority: value.priority,
          assigneeId:
            value.assigneeId && value.assigneeId !== "unassigned"
              ? (value.assigneeId as Id<"users">)
              : undefined,
          sprintId,
          labels: selectedLabels.length > 0 ? selectedLabels : undefined,
          storyPoints: value.storyPoints ? Number.parseFloat(value.storyPoints) : undefined,
        });

        showSuccess("Issue created successfully");

        if (createAnother) {
          // Reset form for another issue
          form.reset();
          setSelectedLabels([]);
          setSelectedTemplate("");
          setShowAISuggestions(false);
        } else {
          onOpenChange(false);
        }
      } catch (error) {
        showError(error, "Failed to create issue");
      }
    },
  });

  // Auto-select default template when modal opens
  useEffect(() => {
    if (!templates || selectedTemplate) return;
    const defaultTemplate = templates.find((t: Doc<"issueTemplates">) => t.isDefault);
    if (defaultTemplate) {
      setSelectedTemplate(defaultTemplate._id);
    }
  }, [templates, selectedTemplate]);

  // Apply template when selected
  useEffect(() => {
    if (!(selectedTemplate && templates)) return;

    const template = templates.find((t: Doc<"issueTemplates">) => t._id === selectedTemplate);
    if (!template) return;

    form.setFieldValue("type", template.type);
    form.setFieldValue("priority", template.defaultPriority);
    form.setFieldValue("title", template.titleTemplate);
    form.setFieldValue("description", template.descriptionTemplate || "");

    // Apply default labels if they exist
    if (template.defaultLabels && template.defaultLabels.length > 0 && labels) {
      const labelIds = labels
        .filter((label: Doc<"labels">) => template.defaultLabels?.includes(label.name))
        .map((label: Doc<"labels">) => label._id);
      setSelectedLabels(labelIds);
    }

    // Apply new Plane-parity fields
    if (template.defaultAssigneeId) {
      form.setFieldValue("assigneeId", template.defaultAssigneeId);
    }
    if (template.defaultStoryPoints !== undefined) {
      form.setFieldValue("storyPoints", template.defaultStoryPoints.toString());
    }
  }, [selectedTemplate, templates, labels, form]);

  const toggleLabel = (labelId: Id<"labels">) => {
    setSelectedLabels((prev) => toggleInArray(prev, labelId));
  };

  interface AISuggestions {
    description?: string;
    priority?: IssuePriority;
    labels?: string[];
  }

  const applyAISuggestions = (suggestions: AISuggestions, description: string | undefined) => {
    if (suggestions.description && !(description as string)?.trim()) {
      form.setFieldValue("description", suggestions.description as string);
    }
    if (suggestions.priority) {
      form.setFieldValue("priority", suggestions.priority);
    }
    if (suggestions.labels && (suggestions.labels as string[]).length > 0 && labels) {
      const suggestedLabelIds = labels
        .filter((label: Doc<"labels">) => (suggestions.labels as string[]).includes(label.name))
        .map((label: Doc<"labels">) => label._id);
      setSelectedLabels((prev) => [...new Set([...prev, ...suggestedLabelIds])]);
    }
  };

  const handleGenerateAISuggestions = async () => {
    const title = form.getFieldValue("title") as string;
    const description = form.getFieldValue("description");

    if (!(effectiveProjectId && title?.trim())) {
      showError(
        new Error(effectiveProjectId ? "Please enter a title" : "Please select a project"),
        "Requirement missing",
      );
      return;
    }

    setIsGeneratingAI(true);
    try {
      const suggestions = await generateSuggestions({
        projectId: effectiveProjectId,
        issueTitle: title,
        issueDescription: description || undefined,
        suggestionTypes: ["description", "priority", "labels"],
      });

      applyAISuggestions(suggestions, description);
      setShowAISuggestions(true);
      showSuccess("AI suggestions applied!");
    } catch (error) {
      showError(error, "Failed to generate AI suggestions");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Only show loading if we don't have a projectId but are fetching projects
  if (!(projectId || orgProjects)) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create Issue"
      description="Form to create a new issue"
      size="lg"
    >
      <Stack
        as="form"
        onSubmit={(e: React.FormEvent) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        gap="md"
      >
        {/* Project Selector (if no projectId passed) */}
        {!projectId && orgProjects && (
          <Select
            label="Project"
            value={internalSelectedProjectId || ""}
            onChange={(e) => setInternalSelectedProjectId(e.target.value as Id<"projects">)}
            required
          >
            <option value="" disabled>
              Select a project...
            </option>
            {orgProjects?.page.map((p: Doc<"projects">) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.key})
              </option>
            ))}
          </Select>
        )}

        {/* Template Selector (outside form state) */}
        {templates && templates.length > 0 && (
          <Select
            label="Use Template (Optional)"
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value as Id<"issueTemplates"> | "")}
          >
            <option value="">Start from scratch</option>
            {templates.map((template: Doc<"issueTemplates">) => (
              <option key={template._id} value={template._id}>
                {template.name} ({template.type})
              </option>
            ))}
          </Select>
        )}

        {/* Title */}
        <form.Field name="title">
          {(field) => (
            <FormInput field={field} label="Title" placeholder="Enter issue title..." required />
          )}
        </form.Field>

        {/* Duplicate Detection */}
        <form.Subscribe selector={(state) => state.values.title}>
          {(title) =>
            effectiveProjectId && title ? (
              <DuplicateDetection
                title={title}
                projectId={effectiveProjectId}
                onIssueClick={(issueId) => {
                  // Close modal and let user view the existing issue
                  // The user can navigate to the issue from the main UI
                  onOpenChange(false);
                  showSuccess(`Opening ${issueId.slice(0, 8)}... You can find it in the board.`);
                }}
              />
            ) : null
          }
        </form.Subscribe>

        {/* AI Suggestions Button */}
        <Flex align="center" gap="sm" className="pb-2">
          <Button
            type="button"
            onClick={handleGenerateAISuggestions}
            isLoading={isGeneratingAI}
            className="bg-linear-to-r from-brand to-accent hover:from-brand-hover hover:to-accent-hover text-brand-foreground border-0"
            leftIcon={<Icon icon={Sparkles} size="sm" />}
          >
            Get AI Suggestions
          </Button>
          {showAISuggestions && (
            <Flex align="center" gap="xs" className="text-status-success" aria-live="polite">
              <Icon icon={Check} size="sm" />
              <Typography variant="small">AI suggestions applied</Typography>
            </Flex>
          )}
        </Flex>

        {/* Description */}
        <form.Field name="description">
          {(field) => (
            <FormTextarea
              field={field}
              label="Description"
              placeholder="Enter issue description..."
              rows={6}
            />
          )}
        </form.Field>

        {/* Type & Priority */}
        <Grid cols={1} colsSm={2} gap="lg">
          <form.Field name="type">
            {(field) => (
              <FormSelectRadix field={field} label="Type" placeholder="Select type">
                {ISSUE_TYPES_WITH_SUBTASK.map((type) => (
                  <SelectItem key={type} value={type}>
                    <Flex align="center" gap="sm">
                      <Icon icon={ISSUE_TYPE_ICONS[type]} size="sm" />
                      {getTypeLabel(type)}
                    </Flex>
                  </SelectItem>
                ))}
              </FormSelectRadix>
            )}
          </form.Field>

          <form.Field name="priority">
            {(field) => (
              <FormSelectRadix field={field} label="Priority" placeholder="Select priority">
                {ISSUE_PRIORITIES.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    <Flex align="center" gap="sm">
                      <Icon
                        icon={PRIORITY_ICONS[priority]}
                        size="sm"
                        className={getPriorityColor(priority)}
                      />
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Flex>
                  </SelectItem>
                ))}
              </FormSelectRadix>
            )}
          </form.Field>
        </Grid>

        {/* Assignee */}
        <form.Field name="assigneeId">
          {(field) => (
            <FormSelectRadix field={field} label="Assignee" placeholder="Select assignee">
              <SelectItem value="unassigned">
                <Flex align="center" gap="sm">
                  <Flex
                    align="center"
                    justify="center"
                    className="h-5 w-5 rounded-full bg-ui-bg-tertiary"
                  >
                    <User className="h-3 w-3 text-ui-text-secondary" />
                  </Flex>
                  Unassigned
                </Flex>
              </SelectItem>
              {project?.members.map((member) => (
                <SelectItem key={member._id} value={member._id}>
                  <Flex align="center" gap="sm">
                    <Avatar name={member.name} src={member.image} size="xs" className="h-5 w-5" />
                    {member.name}
                  </Flex>
                </SelectItem>
              ))}
            </FormSelectRadix>
          )}
        </form.Field>

        {/* Story Points */}
        <form.Field name="storyPoints">
          {(field) => (
            <FormInput
              field={field}
              label="Story Points"
              type="number"
              placeholder="Enter story points (optional)"
              min="0"
              step="0.5"
            />
          )}
        </form.Field>

        {/* Labels (outside form - array state) */}
        {labels && labels.length > 0 && (
          <Stack as="fieldset" gap="xs">
            <Typography as="legend" variant="label" className="block text-ui-text">
              Labels
            </Typography>
            <Flex wrap gap="sm">
              {labels.map((label: Doc<"labels">) => (
                <Button
                  key={label._id}
                  variant="unstyled"
                  onClick={() => toggleLabel(label._id)}
                  aria-pressed={selectedLabels.includes(label._id)}
                  className={cn(
                    "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-brand-foreground transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-ring h-auto",
                    selectedLabels.includes(label._id)
                      ? "opacity-100 ring-2 ring-offset-2 ring-brand"
                      : "opacity-60 hover:opacity-80",
                  )}
                  style={{ backgroundColor: label.color }}
                >
                  {selectedLabels.includes(label._id) && (
                    <Icon icon={Check} size="sm" className="mr-1" />
                  )}
                  {label.name}
                </Button>
              ))}
            </Flex>
          </Stack>
        )}

        {/* Footer - form.Subscribe needs to stay inside the form */}
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Flex align="center" justify="between" className="pt-4">
              <Switch
                id="create-another"
                checked={createAnother}
                onCheckedChange={setCreateAnother}
                label="Create another"
              />
              <Flex gap="sm">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  Create Issue
                </Button>
              </Flex>
            </Flex>
          )}
        </form.Subscribe>
      </Stack>
    </Dialog>
  );
}
