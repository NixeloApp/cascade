import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import type { IssuePriority, IssueTypeWithSubtask } from "@convex/validators";
import { ISSUE_PRIORITIES, ISSUE_TYPES_WITH_SUBTASK } from "@convex/validators";
import { useForm } from "@tanstack/react-form";
import { useAction, useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useOrganization } from "@/hooks/useOrgContext";
import { toggleInArray } from "@/lib/array-utils";
import { FormInput, FormSelect, FormTextarea } from "@/lib/form";
import { Check, Sparkles } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";
import { Dialog } from "./ui/Dialog";
import { Flex } from "./ui/Flex";
import { Select } from "./ui/form";
import { Grid } from "./ui/Grid";
import { Icon } from "./ui/Icon";
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
  const createIssue = useMutation(api.issues.create);
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
          assigneeId: (value.assigneeId || undefined) as Id<"users"> | undefined,
          sprintId,
          labels: selectedLabels.length > 0 ? selectedLabels : undefined,
          storyPoints: value.storyPoints ? Number.parseFloat(value.storyPoints) : undefined,
        });

        showSuccess("Issue created successfully");
        onOpenChange(false);
      } catch (error) {
        showError(error, "Failed to create issue");
      }
    },
  });

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
      className="sm:max-w-2xl"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-4"
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
            <Flex
              align="center"
              gap="xs"
              className="text-sm text-status-success"
              aria-live="polite"
            >
              <Icon icon={Check} size="sm" />
              <span>AI suggestions applied</span>
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
              <FormSelect field={field} label="Type">
                <option value="task">Task</option>
                <option value="bug">Bug</option>
                <option value="story">Story</option>
                <option value="epic">Epic</option>
                <option value="subtask">Sub-task</option>
              </FormSelect>
            )}
          </form.Field>

          <form.Field name="priority">
            {(field) => (
              <FormSelect field={field} label="Priority">
                <option value="lowest">Lowest</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="highest">Highest</option>
              </FormSelect>
            )}
          </form.Field>
        </Grid>

        {/* Assignee */}
        <form.Field name="assigneeId">
          {(field) => (
            <FormSelect field={field} label="Assignee">
              <option value="">Unassigned</option>
              {project?.members.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name}
                </option>
              ))}
            </FormSelect>
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
          <div>
            <Typography variant="label" className="block text-ui-text mb-2">
              Labels
            </Typography>
            <Flex wrap gap="sm">
              {labels.map((label: Doc<"labels">) => (
                <button
                  key={label._id}
                  type="button"
                  onClick={() => toggleLabel(label._id)}
                  aria-pressed={selectedLabels.includes(label._id)}
                  className={cn(
                    "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-brand-foreground transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-ring",
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
                </button>
              ))}
            </Flex>
          </div>
        )}

        {/* Footer - form.Subscribe needs to stay inside the form */}
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Flex gap="sm" justify="end" className="pt-4">
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
          )}
        </form.Subscribe>
      </form>
    </Dialog>
  );
}
