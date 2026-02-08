import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Flex } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { Check, X } from "@/lib/icons";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Checkbox } from "./ui/form/Checkbox";
import { Input } from "./ui/form/Input";
import { Select } from "./ui/form/Select";
import { Label } from "./ui/Label";
import { Typography } from "./ui/Typography";

interface CustomFieldValuesProps {
  issueId: Id<"issues">;
  projectId: Id<"projects">;
}

export function CustomFieldValues({ issueId, projectId }: CustomFieldValuesProps) {
  const [editingFieldId, setEditingFieldId] = useState<Id<"customFields"> | null>(null);
  const [editValue, setEditValue] = useState("");

  const customFields = useQuery(api.customFields.list, { projectId });
  const fieldValues = useQuery(api.customFields.getValuesForIssue, { issueId });
  const setValue = useMutation(api.customFields.setValue);
  const removeValue = useMutation(api.customFields.removeValue);

  if (!customFields || customFields.length === 0) {
    return null;
  }

  const getFieldValue = (fieldId: Id<"customFields">) => {
    return fieldValues?.find((v: Doc<"customFieldValues">) => v.fieldId === fieldId);
  };

  const handleEdit = (fieldId: Id<"customFields">, currentValue?: string) => {
    setEditingFieldId(fieldId);
    setEditValue(currentValue || "");
  };

  const handleSave = async (fieldId: Id<"customFields">) => {
    try {
      if (!editValue.trim()) {
        await removeValue({ issueId, fieldId });
      } else {
        await setValue({ issueId, fieldId, value: editValue.trim() });
      }
      setEditingFieldId(null);
      setEditValue("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update field");
    }
  };

  const handleCancel = () => {
    setEditingFieldId(null);
    setEditValue("");
  };

  type CustomField = {
    _id: Id<"customFields">;
    name: string;
    fieldKey: string;
    fieldType: string;
    options?: string[];
    isRequired: boolean;
    description?: string;
  };

  const renderFieldInput = (field: CustomField) => {
    switch (field.fieldType) {
      case "text":
      case "url":
        return (
          <Input
            type={field.fieldType === "url" ? "url" : "text"}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={field.description || `Enter ${field.name.toLowerCase()}...`}
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="Enter number..."
          />
        );

      case "date":
        return (
          <Input type="date" value={editValue} onChange={(e) => setEditValue(e.target.value)} />
        );

      case "checkbox":
        return (
          <Checkbox
            label={field.description || "Check to enable"}
            checked={editValue === "true"}
            onChange={(e) => setEditValue(e.target.checked ? "true" : "false")}
          />
        );

      case "select":
        return (
          <Select value={editValue} onChange={(e) => setEditValue(e.target.value)}>
            <option value="">Select an option...</option>
            {field.options?.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        );

      case "multiselect":
        return (
          <div className="space-y-2">
            {field.options?.map((option: string) => {
              const selectedOptions = editValue
                .split(",")
                .map((o) => o.trim())
                .filter((o) => o);
              const isSelected = selectedOptions.includes(option);

              return (
                <Checkbox
                  key={option}
                  label={option}
                  checked={isSelected}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setEditValue([...selectedOptions, option].join(", "));
                    } else {
                      setEditValue(selectedOptions.filter((o) => o !== option).join(", "));
                    }
                  }}
                />
              );
            })}
          </div>
        );

      default:
        return (
          <Input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} />
        );
    }
  };

  const renderFieldValue = (field: CustomField, value?: string) => {
    if (!value) {
      return (
        <Typography variant="muted" className="italic">
          Not set
        </Typography>
      );
    }

    switch (field.fieldType) {
      case "checkbox":
        return value === "true" ? (
          <Badge variant="success" size="sm">
            <Icon icon={Check} size="xs" className="inline mr-1" /> Yes
          </Badge>
        ) : (
          <Typography variant="muted">
            <Icon icon={X} size="xs" className="inline mr-1" /> No
          </Typography>
        );

      case "url":
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand hover:underline"
          >
            {value}
          </a>
        );

      case "date":
        return new Date(value).toLocaleDateString();

      case "multiselect":
        return (
          <Flex wrap gap="xs">
            {value.split(",").map((option) => (
              <Badge key={option.trim()} variant="brand" size="md">
                {option.trim()}
              </Badge>
            ))}
          </Flex>
        );

      default:
        return <Typography variant="small">{value}</Typography>;
    }
  };

  return (
    <div className="space-y-3">
      <Typography
        variant="h3"
        className="text-sm font-semibold text-ui-text uppercase tracking-wide"
      >
        Custom Fields
      </Typography>

      {customFields.map((field: Doc<"customFields">) => {
        const fieldValue = getFieldValue(field._id);
        const isEditing = editingFieldId === field._id;

        return (
          <div key={field._id} className="border-b border-ui-border-secondary pb-3">
            <Flex align="start" justify="between" className="mb-2">
              <div className="flex-1">
                <Flex align="center" gap="sm">
                  <Label required={field.isRequired}>{field.name}</Label>
                </Flex>
                {field.description && (
                  <Typography variant="muted" className="text-xs text-ui-text-tertiary mt-0.5">
                    {field.description}
                  </Typography>
                )}
              </div>
              {!isEditing && (
                <Button
                  onClick={() => handleEdit(field._id, fieldValue?.value)}
                  variant="secondary"
                  size="sm"
                >
                  {fieldValue ? "Edit" : "Set"}
                </Button>
              )}
            </Flex>

            {isEditing ? (
              <div className="space-y-2">
                {renderFieldInput(field)}
                <Flex gap="sm">
                  <Button onClick={() => handleSave(field._id)} size="sm">
                    Save
                  </Button>
                  <Button onClick={handleCancel} variant="secondary" size="sm">
                    Cancel
                  </Button>
                </Flex>
              </div>
            ) : (
              <div className="mt-1">{renderFieldValue(field, fieldValue?.value)}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
