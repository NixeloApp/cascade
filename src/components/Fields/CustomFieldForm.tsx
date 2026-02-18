import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { FormDialog } from "../ui/FormDialog";
import { Checkbox } from "../ui/form/Checkbox";
import { Input } from "../ui/form/Input";
import { Select } from "../ui/form/Select";
import { Textarea } from "../ui/form/Textarea";
import { Stack } from "../ui/Stack";

type FieldType = "text" | "number" | "select" | "multiselect" | "date" | "checkbox" | "url";

/**
 * Parse options string for select/multiselect fields
 */
function parseFieldOptions(fieldType: FieldType, options: string): string[] | undefined {
  if (fieldType !== "select" && fieldType !== "multiselect") {
    return undefined;
  }
  return options
    .split(",")
    .map((o) => o.trim())
    .filter((o) => o);
}

interface CustomFieldFormProps {
  projectId: Id<"projects">;
  field?: {
    _id: Id<"customFields">;
    name: string;
    fieldKey: string;
    fieldType: string;
    options?: string[];
    isRequired: boolean;
    description?: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Extracted form component for creating/editing custom fields
 * Separated from CustomFieldsManager for better reusability
 */
export function CustomFieldForm({ projectId, field, open, onOpenChange }: CustomFieldFormProps) {
  const [name, setName] = useState("");
  const [fieldKey, setFieldKey] = useState("");
  const [fieldType, setFieldType] = useState<FieldType>("text");
  const [options, setOptions] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createField = useMutation(api.customFields.create);
  const updateField = useMutation(api.customFields.update);

  // Reset form when field changes or dialog opens
  useEffect(() => {
    if (field) {
      setName(field.name);
      setFieldKey(field.fieldKey);
      setFieldType(field.fieldType as FieldType);
      setOptions(field.options?.join(", ") || "");
      setIsRequired(field.isRequired);
      setDescription(field.description || "");
    } else {
      setName("");
      setFieldKey("");
      setFieldType("text");
      setOptions("");
      setIsRequired(false);
      setDescription("");
    }
  }, [field]);

  const handleSave = async () => {
    if (!(name.trim() && (field || fieldKey.trim()))) {
      showError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const optionsArray = parseFieldOptions(fieldType, options);
      const descriptionValue = description || undefined;

      if (field) {
        await updateField({
          id: field._id,
          name,
          options: optionsArray,
          isRequired,
          description: descriptionValue,
        });
        showSuccess("Field updated");
      } else {
        await createField({
          projectId,
          name,
          fieldKey: fieldKey.toLowerCase().replace(/\s+/g, "_"),
          fieldType,
          options: optionsArray,
          isRequired,
          description: descriptionValue,
        });
        showSuccess("Field created");
      }

      onOpenChange(false);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to save field");
    } finally {
      setIsLoading(false);
    }
  };

  const requiresOptions = fieldType === "select" || fieldType === "multiselect";

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      onSave={handleSave}
      title={field ? "Edit Custom Field" : "Create Custom Field"}
      isLoading={isLoading}
    >
      <Stack gap="md">
        {/* Name */}
        <Input
          label="Field Name *"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Sprint Points"
        />

        {/* Field Key (only for create) */}
        {!field && (
          <Input
            label="Field Key *"
            type="text"
            value={fieldKey}
            onChange={(e) => setFieldKey(e.target.value)}
            className="font-mono"
            placeholder="e.g., sprint_points"
            helperText="Unique identifier (lowercase, underscores only)"
          />
        )}

        {/* Field Type */}
        <Select
          label="Field Type *"
          value={fieldType}
          onChange={(e) => setFieldType(e.target.value as FieldType)}
          disabled={!!field}
          helperText={field ? "Field type cannot be changed after creation" : undefined}
        >
          <option value="text">Text</option>
          <option value="number">Number</option>
          <option value="select">Select (Dropdown)</option>
          <option value="multiselect">Multi-Select</option>
          <option value="date">Date</option>
          <option value="checkbox">Checkbox</option>
          <option value="url">URL</option>
        </Select>

        {/* Options (for select types) */}
        {requiresOptions && (
          <Input
            label="Options *"
            type="text"
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            placeholder="Option 1, Option 2, Option 3"
            helperText="Separate options with commas"
          />
        )}

        {/* Description */}
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Optional description"
        />

        {/* Required Checkbox */}
        <Checkbox
          label="Required field"
          checked={isRequired}
          onChange={(e) => setIsRequired(e.target.checked)}
        />
      </Stack>
    </FormDialog>
  );
}
