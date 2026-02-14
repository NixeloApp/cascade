import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { FormInput, FormSelect, FormTextarea } from "@/lib/form";
import { FileText } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Dialog } from "./ui/Dialog";
import { EmptyState } from "./ui/EmptyState";
import { Typography } from "./ui/Typography";

// =============================================================================
// Schema
// =============================================================================

const categories = ["meeting", "planning", "engineering", "design", "other"] as const;

const templateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  category: z.enum(categories),
  icon: z.string().min(1, "Icon is required").max(2),
  isPublic: z.boolean(),
});

interface DocumentTemplatesManagerProps {
  projectId?: Id<"projects">;
  onSelectTemplate?: (templateId: Id<"documentTemplates">) => void;
  /** Increment to trigger opening the create modal from outside */
  createRequested?: number;
}

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

  const templates = useQuery(api.documentTemplates.list, {
    category: selectedCategory === "all" ? undefined : selectedCategory,
    projectId,
  });
  const createTemplate = useMutation(api.documentTemplates.create);
  const updateTemplate = useMutation(api.documentTemplates.update);
  const deleteTemplate = useMutation(api.documentTemplates.remove);

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      category: "planning" as (typeof categories)[number],
      icon: "📄",
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
        const templateData = {
          name: value.name.trim(),
          description: value.description?.trim() || undefined,
          category: value.category,
          icon: value.icon,
          content: [
            {
              type: "heading",
              props: { level: 1 },
              content: [{ type: "text", text: value.name }],
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
    icon: string;
    isPublic: boolean;
  }) => {
    setEditingId(template._id);
    form.setFieldValue("name", template.name);
    form.setFieldValue("description", template.description || "");
    form.setFieldValue("category", template.category as (typeof categories)[number]);
    form.setFieldValue("icon", template.icon);
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
        <div className="mb-6">
          <Flex gap="sm" className="overflow-x-auto pb-2">
            {categoryFilters.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setSelectedCategory(cat.value)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                  selectedCategory === cat.value
                    ? "bg-brand text-brand-foreground"
                    : "bg-ui-bg-tertiary text-ui-text hover:bg-ui-bg-secondary",
                )}
              >
                {cat.label}
              </button>
            ))}
          </Flex>
        </div>

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
          <div className="space-y-6">
            {/* Built-in Templates */}
            {builtInTemplates.length > 0 && (
              <div>
                <Typography variant="h3" className="text-sm font-semibold text-ui-text mb-3">
                  Built-in Templates
                </Typography>
                <Grid cols={1} colsMd={2} colsLg={3} gap="lg">
                  {builtInTemplates.map((template: Doc<"documentTemplates">) => (
                    <button
                      key={template._id}
                      type="button"
                      onClick={() => onSelectTemplate?.(template._id)}
                      className="p-4 bg-linear-to-br from-brand-subtle to-brand-subtle rounded-lg hover:shadow-card-hover transition-all text-left border-2 border-transparent hover:border-brand-muted"
                    >
                      <Flex align="start" gap="md">
                        <Typography variant="label" className="text-3xl">
                          {template.icon}
                        </Typography>
                        <FlexItem flex="1">
                          <Typography variant="h4" className="font-semibold text-ui-text mb-1">
                            {template.name}
                          </Typography>
                          {template.description && (
                            <Typography variant="muted" className="line-clamp-2">
                              {template.description}
                            </Typography>
                          )}
                          <Badge
                            variant="primary"
                            size="md"
                            className="inline-block mt-2 capitalize"
                          >
                            {template.category}
                          </Badge>
                        </FlexItem>
                      </Flex>
                    </button>
                  ))}
                </Grid>
              </div>
            )}

            {/* Custom Templates */}
            {customTemplates.length > 0 && (
              <div>
                <Typography variant="h3" className="text-sm font-semibold text-ui-text mb-3">
                  Custom Templates
                </Typography>
                <Grid cols={1} colsMd={2} colsLg={3} gap="lg">
                  {customTemplates.map((template: Doc<"documentTemplates">) => (
                    <div
                      key={template._id}
                      className="p-4 bg-ui-bg-secondary rounded-lg hover:bg-ui-bg-tertiary transition-colors border border-ui-border"
                    >
                      <Flex align="start" gap="md">
                        <button
                          type="button"
                          onClick={() => onSelectTemplate?.(template._id)}
                          className="flex items-start gap-3 flex-1 text-left"
                        >
                          <Typography variant="label" className="text-2xl">
                            {template.icon}
                          </Typography>
                          <FlexItem flex="1">
                            <Typography variant="h4" className="font-medium text-ui-text mb-1">
                              {template.name}
                            </Typography>
                            {template.description && (
                              <Typography variant="muted" className="line-clamp-2 mb-2">
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
                          </FlexItem>
                        </button>

                        <Flex gap="xs">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(template)}
                            leftIcon={
                              <svg
                                aria-hidden="true"
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            }
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirm(template._id)}
                            leftIcon={
                              <svg
                                aria-hidden="true"
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            }
                          />
                        </Flex>
                      </Flex>
                    </div>
                  ))}
                </Grid>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog
        open={showModal}
        onOpenChange={(open) => !open && resetForm()}
        title={editingId ? "Edit Template" : "Create Template"}
        className="sm:max-w-2xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
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
                <FormInput
                  field={field}
                  label="Icon (Emoji)"
                  placeholder="📄"
                  maxLength={2}
                  required
                />
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
                <Flex align="center" gap="sm" className="pt-7">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={field.state.value as boolean}
                    onChange={(e) => field.handleChange(e.target.checked)}
                    onBlur={field.handleBlur}
                    className="w-4 h-4 text-brand bg-ui-bg border-ui-border rounded focus:ring-brand-ring:ring-brand focus:ring-2"
                  />
                  <label htmlFor="isPublic" className="text-sm font-medium text-ui-text">
                    Make public (visible to all users)
                  </label>
                </Flex>
              )}
            </form.Field>
          </Grid>

          <Flex justify="end" gap="sm" className="pt-4">
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
