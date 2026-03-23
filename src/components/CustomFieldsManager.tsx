/**
 * Custom Fields Manager
 *
 * Admin interface for defining project-specific custom fields.
 * Supports text, number, date, select, and multi-select field types.
 * Fields appear on issue forms and can be used for filtering/search.
 */

import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { ClipboardList } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { CustomFieldCard } from "./Fields/CustomFieldCard";
import { CustomFieldForm } from "./Fields/CustomFieldForm";
import { Button } from "./ui/Button";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Flex } from "./ui/Flex";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { Stack } from "./ui/Stack";
import { Typography } from "./ui/Typography";

interface CustomFieldsManagerProps {
  projectId: Id<"projects">;
}

type CustomField = {
  _id: Id<"customFields">;
  name: string;
  fieldKey: string;
  fieldType: string;
  options?: string[];
  isRequired: boolean;
  description?: string;
};

/**
 * Refactored CustomFieldsManager - Now focused on orchestration
 * Form and card logic extracted to separate components
 *
 * Benefits:
 * - Reduced from 329 lines to ~100 lines
 * - Form logic reusable in other contexts
 * - Card component testable in isolation
 * - Consistent with AutomationRulesManager pattern
 */
export function CustomFieldsManager({ projectId }: CustomFieldsManagerProps) {
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<Id<"customFields"> | null>(null);

  const customFields = useAuthenticatedQuery(api.customFields.list, { projectId });
  const { mutate: removeField } = useAuthenticatedMutation(api.customFields.remove);

  const handleCreate = () => {
    setEditingField(null);
    setShowFormDialog(true);
  };

  const handleEdit = (field: CustomField) => {
    setEditingField(field);
    setShowFormDialog(true);
  };

  const handleDeleteClick = (id: Id<"customFields">) => {
    setPendingDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDeleteId) return;
    try {
      await removeField({ id: pendingDeleteId });
      showSuccess("Field deleted");
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to delete field");
    } finally {
      setPendingDeleteId(null);
    }
  };

  return (
    <Stack gap="xl">
      {/* Header */}
      <Flex align="center" justify="between">
        <Stack gap="xs">
          <Typography variant="h2">Custom Fields</Typography>
          <Typography variant="small" color="secondary">
            Add custom metadata fields to your issues
          </Typography>
        </Stack>
        <Button onClick={handleCreate}>+ Add Field</Button>
      </Flex>

      {/* Fields List */}
      {!customFields ? (
        <Flex align="center" justify="center" className="min-h-content-block">
          <LoadingSpinner />
        </Flex>
      ) : customFields.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No custom fields yet"
          description="Add your first field to get started."
        />
      ) : (
        <Stack gap="md">
          {customFields.map((field: Doc<"customFields">) => (
            <CustomFieldCard
              key={field._id}
              field={field}
              onEdit={() => handleEdit(field)}
              onDelete={() => handleDeleteClick(field._id)}
            />
          ))}
        </Stack>
      )}

      {/* Form Dialog */}
      <CustomFieldForm
        projectId={projectId}
        field={editingField}
        open={showFormDialog}
        onOpenChange={(open) => {
          setShowFormDialog(open);
          if (!open) {
            setEditingField(null);
          }
        }}
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Custom Field"
        message="Are you sure? This will delete all values for this field."
        variant="danger"
        confirmLabel="Delete"
      />
    </Stack>
  );
}
