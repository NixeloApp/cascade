/**
 * Document Templates Manager
 *
 * UI for managing reusable document templates within a project.
 * Supports creating, editing, and deleting templates with preview.
 * Templates can be used to quickly create new documents with preset content.
 */

import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useForm } from "@tanstack/react-form";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { IconPicker, TemplateIcon, toTemplateIconString } from "@/components/ui/IconPicker";
import { Label } from "@/components/ui/Label";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/SegmentedControl";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { FormInput, FormSelect, FormTextarea } from "@/lib/form";
import { FileText, Pencil, Trash2 } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";

// =============================================================================
// Schema
// =============================================================================

const categories = ["meeting", "planning", "engineering", "design", "other"] as const;

const templateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  category: z.enum(categories),
  icon: z.string().min(1, "Icon is required"),
  isPublic: z.boolean(),
});

interface DocumentTemplatesManagerProps {
  projectId?: Id<"projects">;
  onSelectTemplate?: (templateId: Id<"documentTemplates">) => void;
  /** Increment to trigger opening the create modal from outside */
  createRequested?: number;
}

/** Manages document templates with create, edit, and delete functionality. */
export function DocumentTemplatesManager({
  projectId,
  onSelectTemplate,
  createRequested,
}: DocumentTemplatesManagerProps) {
  // UI State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<Id<"documentTemplates"> | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Id<"documentTemplates"> | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const templates = useAuthenticatedQuery(api.documentTemplates.list, {
    category: selectedCategory === "all" ? undefined : selectedCategory,
    projectId,
  });
  const { mutate: createTemplate } = useAuthenticatedMutation(api.documentTemplates.create);
  const { mutate: updateTemplate } = useAuthenticatedMutation(api.documentTemplates.update);
  const { mutate: deleteTemplate } = useAuthenticatedMutation(api.documentTemplates.remove);

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      category: "planning" as (typeof categories)[number],
      icon: "lucide:FileText",
      isPublic: false,
    },
    validators: { onChange: templateSchema },
    onSubmit: async ({
      value,
    }: {
      value: {
        name: string;
        description?: string;
        category: string;
        icon: string;
        isPublic: boolean;
        [key: string]: unknown;
      };
    }) => {
      try {
        const trimmedName = value.name.trim();
        const trimmedDescription = value.description?.trim() || undefined;
        const templateData = {
          name: trimmedName,
          description: trimmedDescription,
          category: value.category,
          icon: value.icon,
          content: [
            {
              type: "heading",
              props: { level: 1 },
              content: [{ type: "text", text: trimmedName }],
            },
            { type: "paragraph", content: [] },
          ],
          isPublic: value.isPublic,
          projectId,
        };

        if (editingId) {
          await updateTemplate({
            id: editingId,
            name: templateData.name,
            description: templateData.description,
            category: templateData.category,
            icon: templateData.icon,
            isPublic: templateData.isPublic,
          });
          showSuccess("Template updated");
        } else {
          await createTemplate(templateData);
          showSuccess("Template created");
        }
        resetForm();
      } catch (error) {
        showError(error, "Failed to save template");
      }
    },
  });

  const resetForm = () => {
    form.reset();
    setEditingId(null);
    setShowModal(false);
  };

  const startEdit = (template: {
    _id: Id<"documentTemplates">;
    name: string;
    description?: string;
    category: string;
    icon:
      | string
      | {
          type: "lucide";
          name: string;
        }
      | {
          type: "emoji";
          value: string;
        };
    isPublic: boolean;
  }) => {
    setEditingId(template._id);
    form.setFieldValue("name", template.name);
    form.setFieldValue("description", template.description || "");
    form.setFieldValue("category", template.category as (typeof categories)[number]);
    form.setFieldValue("icon", toTemplateIconString(template.icon));
    form.setFieldValue("isPublic", template.isPublic);
    setShowModal(true);
  };

  // Open create modal when requested from parent
  useEffect(() => {
    if (createRequested && createRequested > 0) {
      setShowModal(true);
    }
  }, [createRequested]);

  // Reset form when modal closes
  useEffect(() => {
    if (!showModal) {
      form.reset();
      setEditingId(null);
    }
  }, [showModal, form]);

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    try {
      await deleteTemplate({ id: deleteConfirm });
      showSuccess("Template deleted");
    } catch (error) {
      showError(error, "Failed to delete template");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const categoryFilters = [
    { value: "all", label: "All Templates" },
    { value: "meeting", label: "Meetings" },
    { value: "planning", label: "Planning" },
    { value: "engineering", label: "Engineering" },
    { value: "design", label: "Design" },
    { value: "other", label: "Other" },
  ];

  // Group templates by built-in vs custom
  const builtInTemplates = templates?.filter((t: Doc<"documentTemplates">) => t.isBuiltIn) || [];
  const customTemplates = templates?.filter((t: Doc<"documentTemplates">) => !t.isBuiltIn) || [];

  return (
    <>
      <div>
        {/* Category Filter */}
        <Card variant="ghost" className="mb-6">
          <SegmentedControl
            value={selectedCategory}
            onValueChange={(value: string) => {
              if (value) setSelectedCategory(value);
            }}
            wrap
            className="w-full"
          >
            {categoryFilters.map((cat) => (
              <SegmentedControlItem key={cat.value} value={cat.value} className="whitespace-nowrap">
                {cat.label}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        </Card>

        {!templates || templates.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No templates yet"
            description="Create templates to speed up document creation"
            action={{
              label: "Create Your First Template",
              onClick: () => setShowModal(true),
            }}
          />
        ) : (
          <Stack gap="lg">
            {/* Built-in Templates */}
            {builtInTemplates.length > 0 && (
              <Stack gap="sm">
                <Typography variant="label">Built-in Templates</Typography>
                <Grid cols={1} colsMd={2} colsLg={3} gap="lg">
                  {builtInTemplates.map((template: Doc<"documentTemplates">) => (
                    <Card
                      key={template._id}
                      recipe="templateBuiltInTile"
                      padding="md"
                      onClick={() => onSelectTemplate?.(template._id)}
                    >
                      <Flex align="start" gap="md">
                        <TemplateIcon value={template.icon} className="size-7" />
                        <FlexItem flex="1">
                          <Stack gap="xs">
                            <Typography variant="label">{template.name}</Typography>
                            {template.description && (
                              <Typography
                                variant="small"
                                color="secondary"
                                className="line-clamp-2"
                              >
                                {template.description}
                              </Typography>
                            )}
                            <Badge variant="primary" size="md" className="inline-block capitalize">
                              {template.category}
                            </Badge>
                          </Stack>
                        </FlexItem>
                      </Flex>
                    </Card>
                  ))}
                </Grid>
              </Stack>
            )}

            {/* Custom Templates */}
            {customTemplates.length > 0 && (
              <Stack gap="sm">
                <Typography variant="label">Custom Templates</Typography>
                <Grid cols={1} colsMd={2} colsLg={3} gap="lg">
                  {customTemplates.map((template: Doc<"documentTemplates">) => (
                    <Card key={template._id} recipe="templateCustomTile" padding="md">
                      <Flex align="start" gap="md">
                        <FlexItem flex="1">
                          <Button
                            variant="unstyled"
                            size="contentStart"
                            onClick={() => onSelectTemplate?.(template._id)}
                          >
                            <Flex align="start" gap="md">
                              <TemplateIcon value={template.icon} className="size-6" />
                              <FlexItem flex="1">
                                <Stack gap="xs">
                                  <Typography variant="label">{template.name}</Typography>
                                  {template.description && (
                                    <Typography
                                      variant="small"
                                      color="secondary"
                                      className="line-clamp-2"
                                    >
                                      {template.description}
                                    </Typography>
                                  )}
                                  <Flex gap="sm">
                                    <Badge variant="neutral" size="md" className="capitalize">
                                      {template.category}
                                    </Badge>
                                    {template.isPublic && (
                                      <Badge variant="success" size="md">
                                        Public
                                      </Badge>
                                    )}
                                  </Flex>
                                </Stack>
                              </FlexItem>
                            </Flex>
                          </Button>
                        </FlexItem>
                        <Flex gap="xs">
                          <IconButton
                            variant="subtle"
                            size="sm"
                            onClick={() => startEdit(template)}
                            aria-label={`Edit template ${template.name}`}
                          >
                            <Icon icon={Pencil} size="xs" aria-hidden="true" />
                          </IconButton>
                          <IconButton
                            variant="danger"
                            size="sm"
                            onClick={() => setDeleteConfirm(template._id)}
                            aria-label={`Delete template ${template.name}`}
                          >
                            <Icon icon={Trash2} size="xs" aria-hidden="true" />
                          </IconButton>
                        </Flex>
                      </Flex>
                    </Card>
                  ))}
                </Grid>
              </Stack>
            )}
          </Stack>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog
        open={showModal}
        onOpenChange={(open) => !open && resetForm()}
        title={editingId ? "Edit Template" : "Create Template"}
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <Stack gap="md">
            <Grid cols={1} colsSm={2} gap="lg">
              <form.Field name="name">
                {(field) => (
                  <FormInput
                    field={field}
                    label="Template Name"
                    placeholder="e.g., Weekly Sprint Review"
                    required
                    autoFocus
                  />
                )}
              </form.Field>

              <form.Field name="icon">
                {(field) => (
                  <Stack gap="sm">
                    <Label htmlFor="template-icon-picker">Icon</Label>
                    <div id="template-icon-picker">
                      <IconPicker
                        value={(field.state.value as string) || "lucide:FileText"}
                        onChange={(nextValue) => field.handleChange(nextValue)}
                      />
                    </div>
                    {field.state.meta.errors.length > 0 && (
                      <Typography variant="small" color="error">
                        {field.state.meta.errors[0]?.message}
                      </Typography>
                    )}
                  </Stack>
                )}
              </form.Field>
            </Grid>

            <form.Field name="description">
              {(field) => (
                <FormTextarea
                  field={field}
                  label="Description"
                  placeholder="Brief description of what this template is for..."
                  rows={3}
                />
              )}
            </form.Field>

            <Grid cols={1} colsSm={2} gap="lg">
              <form.Field name="category">
                {(field) => (
                  <FormSelect field={field} label="Category" required>
                    <option value="meeting">Meeting</option>
                    <option value="planning">Planning</option>
                    <option value="engineering">Engineering</option>
                    <option value="design">Design</option>
                    <option value="other">Other</option>
                  </FormSelect>
                )}
              </form.Field>

              <form.Field name="isPublic">
                {(field) => (
                  <Card variant="ghost" className="pt-7">
                    <Checkbox
                      id="isPublic"
                      checked={field.state.value as boolean}
                      onCheckedChange={(checked) => field.handleChange(checked === true)}
                      onBlur={field.handleBlur}
                      label="Make public (visible to all users)"
                    />
                  </Card>
                )}
              </form.Field>
            </Grid>

            <Card variant="ghost" className="pt-4">
              <Flex justify="end" gap="sm">
                <form.Subscribe selector={(state) => state.isSubmitting}>
                  {(isSubmitting) => (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={resetForm}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" isLoading={isSubmitting}>
                        {editingId ? "Update" : "Create"} Template
                      </Button>
                    </>
                  )}
                </form.Subscribe>
              </Flex>
            </Card>
          </Stack>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Template"
        message="Are you sure you want to delete this template? This action cannot be undone."
        variant="danger"
        confirmLabel="Delete"
      />
    </>
  );
}
