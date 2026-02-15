import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";
import { ClipboardList } from "@/lib/icons";
import type { IssuePriority, IssueType } from "@/lib/issue-utils";
import { TemplateCard } from "./Templates/TemplateCard";
import { TemplateForm } from "./Templates/TemplateForm";
import { Button } from "./ui/Button";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { EmptyState } from "./ui/EmptyState";

interface TemplatesManagerProps {
  projectId: Id<"projects">;
}

type IssueTemplate = {
  _id: Id<"issueTemplates">;
  name: string;
  type: Exclude<IssueType, "subtask">;
  titleTemplate: string;
  descriptionTemplate: string;
  defaultPriority: IssuePriority;
  defaultLabels?: string[];
};

/**
 * Render and manage issue templates for a specific project, including creation, editing, and deletion flows.
 *
 * @param projectId - The project identifier used to scope fetched templates and associated mutations
 */
export function TemplatesManager({ projectId }: TemplatesManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<IssueTemplate | null>(null);

  const templates = useQuery(api.templates.listByProject, { projectId });
  const deleteTemplateMutation = useMutation(api.templates.remove);

  // Delete confirmation
  const deleteConfirm = useDeleteConfirmation<"issueTemplates">({
    successMessage: "Template deleted",
    errorMessage: "Failed to delete template",
  });

  const handleCreate = () => {
    setEditingTemplate(null);
    setShowModal(true);
  };

  const handleEdit = (template: IssueTemplate) => {
    setEditingTemplate(template);
    setShowModal(true);
  };

  const handleCloseForm = () => {
    setShowModal(false);
    setEditingTemplate(null);
  };

  return (
    <>
      <Card>
        <CardHeader
          title="Issue Templates"
          description="Create reusable templates for common issue types"
          action={
            <Button
              onClick={handleCreate}
              leftIcon={
                <svg
                  aria-hidden="true"
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              }
            >
              New Template
            </Button>
          }
        />

        <CardBody>
          {!templates || templates.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No templates yet"
              description="Create templates to speed up issue creation"
            />
          ) : (
            <div className="space-y-3">
              {templates.map((template: IssueTemplate) => (
                <TemplateCard
                  key={template._id}
                  template={template}
                  onEdit={() => handleEdit(template)}
                  onDelete={() => deleteConfirm.confirmDelete(template._id)}
                />
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create/Edit Form */}
      <TemplateForm
        projectId={projectId}
        template={editingTemplate}
        open={showModal}
        onOpenChange={(open) => !open && handleCloseForm()}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm.deleteId}
        onClose={deleteConfirm.cancelDelete}
        onConfirm={() =>
          deleteConfirm.executeDelete((id) =>
            deleteTemplateMutation({ id }).then(() => {
              /* intentional */
            }),
          )
        }
        title="Delete Template"
        message="Are you sure you want to delete this template?"
        variant="danger"
        confirmLabel="Delete"
        isLoading={deleteConfirm.isDeleting}
      />
    </>
  );
}
