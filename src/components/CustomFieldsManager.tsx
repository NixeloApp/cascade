import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { ClipboardList } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { CustomFieldCard } from "./Fields/CustomFieldCard";
import { CustomFieldForm } from "./Fields/CustomFieldForm";
import { Button } from "./ui/Button";
import { Card, CardBody } from "./ui/Card";
import { Flex } from "./ui/Flex";
import { Icon } from "./ui/Icon";
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

  const customFields = useQuery(api.customFields.list, { projectId });
  const removeField = useMutation(api.customFields.remove);

  const handleCreate = () => {
    setEditingField(null);
    setShowFormDialog(true);
  };

  const handleEdit = (field: CustomField) => {
    setEditingField(field);
    setShowFormDialog(true);
  };

  const handleDelete = async (id: Id<"customFields">) => {
    if (!confirm("Are you sure? This will delete all values for this field.")) {
      return;
    }

    try {
      await removeField({ id });
      showSuccess("Field deleted");
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to delete field");
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
        <Flex align="center" justify="center" className="min-h-32">
          <LoadingSpinner />
        </Flex>
      ) : customFields.length === 0 ? (
        <Card>
          <CardBody>
            <Stack align="center" gap="md" className="min-h-32 justify-center">
              <Icon icon={ClipboardList} size="xl" className="text-ui-text-tertiary" />
              <Typography variant="small" color="secondary">
                No custom fields yet. Add your first field to get started.
              </Typography>
            </Stack>
          </CardBody>
        </Card>
      ) : (
        <Stack gap="md">
          {customFields.map((field: Doc<"customFields">) => (
            <CustomFieldCard
              key={field._id}
              field={field}
              onEdit={() => handleEdit(field)}
              onDelete={() => handleDelete(field._id)}
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
    </Stack>
  );
}
