import type { Id } from "@convex/_generated/dataModel";
import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  Check,
  ClipboardList,
  FileText,
  Hash,
  LinkIcon,
  ListChecks,
  Type,
  User,
} from "@/lib/icons";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Flex, FlexItem } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import { Metadata, MetadataItem } from "../ui/Metadata";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

type FieldType =
  | "text"
  | "number"
  | "select"
  | "multiselect"
  | "date"
  | "checkbox"
  | "url"
  | "user";

interface CustomFieldCardProps {
  field: {
    _id: Id<"customFields">;
    name: string;
    fieldKey: string;
    fieldType: string;
    options?: string[];
    isRequired: boolean;
    description?: string;
  };
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Displays a single custom field with its configuration
 * Extracted from CustomFieldsManager for better reusability
 */
export function CustomFieldCard({ field, onEdit, onDelete }: CustomFieldCardProps) {
  const getFieldTypeIcon = (type: string): LucideIcon => {
    switch (type as FieldType) {
      case "text":
        return Type;
      case "number":
        return Hash;
      case "select":
        return ClipboardList;
      case "multiselect":
        return ListChecks;
      case "date":
        return Calendar;
      case "checkbox":
        return Check;
      case "url":
        return LinkIcon;
      case "user":
        return User;
      default:
        return FileText;
    }
  };

  return (
    <Card padding="md">
      <Flex justify="between" align="start">
        <Flex gap="md" align="start" className="flex-1">
          <Icon icon={getFieldTypeIcon(field.fieldType)} size="lg" />
          <FlexItem flex="1">
            <Stack gap="sm">
              <Flex gap="sm" align="center">
                <Typography variant="label">{field.name}</Typography>
                {field.isRequired && <Badge variant="error">Required</Badge>}
              </Flex>
              <Metadata size="sm">
                <MetadataItem>
                  <code className="px-2 py-0.5 bg-ui-bg-secondary rounded font-mono text-xs">
                    {field.fieldKey}
                  </code>
                </MetadataItem>
                <MetadataItem className="capitalize">{field.fieldType}</MetadataItem>
              </Metadata>
              {field.description && (
                <Typography variant="small" color="secondary">
                  {field.description}
                </Typography>
              )}
              {field.options && field.options.length > 0 && (
                <Flex wrap gap="xs">
                  {field.options.map((option) => (
                    <Badge key={option} variant="secondary" size="md">
                      {option}
                    </Badge>
                  ))}
                </Flex>
              )}
            </Stack>
          </FlexItem>
        </Flex>
        <Flex gap="sm">
          <Button onClick={onEdit} variant="secondary" size="sm">
            Edit
          </Button>
          <Button onClick={onDelete} variant="secondary" size="sm" className="text-status-error">
            Delete
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}
