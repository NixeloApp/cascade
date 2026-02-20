import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { ISSUE_PRIORITIES, ISSUE_TYPES } from "@convex/validators";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "convex/react";
import { type FormEvent, useEffect } from "react";
import { z } from "zod";
import { FormCheckbox, FormInput, FormSelect, FormTextarea } from "@/lib/form";
import type { IssuePriority, IssueType } from "@/lib/issue-utils";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Stack } from "../ui/Stack";

// =============================================================================
// Schema
// =============================================================================

const templateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(ISSUE_TYPES),
  titleTemplate: z.string().min(1, "Title template is required"),
  descriptionTemplate: z.string(),
  defaultPriority: z.enum(ISSUE_PRIORITIES),
  defaultLabels: z.string(),
  // New fields for Plane parity
  defaultAssigneeId: z.string(),
  defaultStatus: z.string(),
  defaultStoryPoints: z.string(),
  isDefault: z.boolean(),
});

// =============================================================================
// Component
// =============================================================================

interface TemplateFormProps {
  projectId: Id<"projects">;
  template?: {
    _id: Id<"issueTemplates">;
    name: string;
    type: Exclude<IssueType, "subtask">;
    titleTemplate: string;
    descriptionTemplate: string;
    defaultPriority: IssuePriority;
    defaultLabels?: string[];
    defaultAssigneeId?: Id<"users">;
    defaultStatus?: string;
    defaultStoryPoints?: number;
    isDefault?: boolean;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateForm({ projectId, template, open, onOpenChange }: TemplateFormProps) {
  const createTemplate = useMutation(api.templates.create);
  const updateTemplate = useMutation(api.templates.update);

  // Fetch project data for members and workflow states
  const project = useQuery(api.projects.getProject, { id: projectId });

  const form = useForm({
    defaultValues: {
      name: "",
      type: "task" satisfies IssueType,
      titleTemplate: "",
      descriptionTemplate: "",
      defaultPriority: "medium" satisfies IssuePriority,
      defaultLabels: "",
      defaultAssigneeId: "",
      defaultStatus: "",
      defaultStoryPoints: "",
      isDefault: false,
    },
    validators: { onChange: templateSchema },
    onSubmit: async ({ value }: { value: z.infer<typeof templateSchema> }) => {
      try {
        const templateData = {
          name: value.name.trim(),
          type: value.type,
          titleTemplate: value.titleTemplate.trim(),
          descriptionTemplate: value.descriptionTemplate?.trim() || "",
          defaultPriority: value.defaultPriority,
          defaultLabels:
            value.defaultLabels
              ?.split(",")
              .map((l: string) => l.trim())
              .filter(Boolean) || [],
          defaultAssigneeId: value.defaultAssigneeId
            ? (value.defaultAssigneeId as Id<"users">)
            : undefined,
          defaultStatus: value.defaultStatus || undefined,
          defaultStoryPoints: value.defaultStoryPoints
            ? Number.parseFloat(value.defaultStoryPoints)
            : undefined,
          isDefault: value.isDefault,
        };

        if (template) {
          await updateTemplate({ id: template._id, ...templateData });
          showSuccess("Template updated");
        } else {
          await createTemplate({ projectId, ...templateData });
          showSuccess("Template created");
        }
        onOpenChange(false);
      } catch (error) {
        showError(error, "Failed to save template");
      }
    },
  });

  // Reset form when template changes
  useEffect(() => {
    if (template) {
      form.setFieldValue("name", template.name);
      form.setFieldValue("type", template.type);
      form.setFieldValue("titleTemplate", template.titleTemplate);
      form.setFieldValue("descriptionTemplate", template.descriptionTemplate);
      form.setFieldValue("defaultPriority", template.defaultPriority);
      form.setFieldValue("defaultLabels", template.defaultLabels?.join(", ") || "");
      form.setFieldValue("defaultAssigneeId", template.defaultAssigneeId || "");
      form.setFieldValue("defaultStatus", template.defaultStatus || "");
      form.setFieldValue("defaultStoryPoints", template.defaultStoryPoints?.toString() || "");
      form.setFieldValue("isDefault", template.isDefault || false);
    } else {
      form.reset();
    }
  }, [template, form]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={template ? "Edit Template" : "Create Template"}
      className="sm:max-w-2xl"
    >
      <Stack
        as="form"
        gap="md"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <Grid cols={1} colsSm={2} gap="lg">
          <form.Field name="name">
            {(field) => (
              <FormInput
                field={field}
                label="Template Name"
                placeholder="e.g., Bug Report, Feature Request"
                required
                autoFocus
              />
            )}
          </form.Field>

          <form.Field name="type">
            {(field) => (
              <FormSelect field={field} label="Issue Type" required>
                <option value="task">Task</option>
                <option value="bug">Bug</option>
                <option value="story">Story</option>
                <option value="epic">Epic</option>
              </FormSelect>
            )}
          </form.Field>
        </Grid>

        <form.Field name="titleTemplate">
          {(field) => (
            <FormInput
              field={field}
              label="Title Template"
              placeholder="e.g., [BUG] {description}"
              helperText="Use {placeholders} for dynamic content"
              required
            />
          )}
        </form.Field>

        <form.Field name="descriptionTemplate">
          {(field) => (
            <FormTextarea
              field={field}
              label="Description Template"
              placeholder="## Steps to Reproduce&#10;1. &#10;2. &#10;&#10;## Expected Result&#10;&#10;## Actual Result"
              rows={6}
              className="font-mono text-sm"
            />
          )}
        </form.Field>

        <Grid cols={1} colsSm={2} gap="lg">
          <form.Field name="defaultPriority">
            {(field) => (
              <FormSelect field={field} label="Default Priority">
                <option value="lowest">Lowest</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="highest">Highest</option>
              </FormSelect>
            )}
          </form.Field>

          <form.Field name="defaultLabels">
            {(field) => (
              <FormInput
                field={field}
                label="Default Labels (comma separated)"
                placeholder="bug, frontend, urgent"
              />
            )}
          </form.Field>
        </Grid>

        {/* Advanced defaults */}
        <Grid cols={1} colsSm={2} gap="lg">
          <form.Field name="defaultAssigneeId">
            {(field) => (
              <FormSelect field={field} label="Default Assignee">
                <option value="">Unassigned</option>
                {project?.members?.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                  </option>
                ))}
              </FormSelect>
            )}
          </form.Field>

          <form.Field name="defaultStatus">
            {(field) => (
              <FormSelect field={field} label="Default Status">
                <option value="">Use project default</option>
                {project?.workflowStates?.map((state: { id: string; name: string }) => (
                  <option key={state.id} value={state.id}>
                    {state.name}
                  </option>
                ))}
              </FormSelect>
            )}
          </form.Field>
        </Grid>

        <Grid cols={1} colsSm={2} gap="lg">
          <form.Field name="defaultStoryPoints">
            {(field) => (
              <FormInput
                field={field}
                label="Default Story Points"
                type="number"
                placeholder="e.g., 3"
                min="0"
                step="0.5"
              />
            )}
          </form.Field>

          <form.Field name="isDefault">
            {(field) => (
              <FormCheckbox
                field={field}
                label="Set as default template"
                helperText="Automatically selected when creating new issues"
              />
            )}
          </form.Field>
        </Grid>

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
                {template ? "Update" : "Create"} Template
              </Button>
            </Flex>
          )}
        </form.Subscribe>
      </Stack>
    </Dialog>
  );
}
