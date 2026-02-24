import type { Id } from "@convex/_generated/dataModel";
import { Star } from "lucide-react";
import { ISSUE_TYPE_ICONS, type IssuePriority, type IssueType } from "@/lib/issue-utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Flex, FlexItem } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import { Tooltip } from "../ui/Tooltip";
import { Typography } from "../ui/Typography";

interface TemplateCardProps {
  template: {
    _id: Id<"issueTemplates">;
    name: string;
    type: IssueType;
    titleTemplate: string;
    descriptionTemplate: string;
    defaultPriority: IssuePriority;
    defaultLabels?: string[];
    defaultStoryPoints?: number;
    isDefault?: boolean;
  };
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Displays a single issue template
 * Extracted from TemplatesManager for better reusability
 */
export function TemplateCard({ template, onEdit, onDelete }: TemplateCardProps) {
  return (
    <Card padding="md" hoverable className="bg-ui-bg-secondary">
      <Flex justify="between" align="start">
        <FlexItem flex="1">
          <Flex gap="sm" align="center" className="mb-2">
            <Icon icon={ISSUE_TYPE_ICONS[template.type]} size="md" />
            <Typography variant="h4">{template.name}</Typography>
            {template.isDefault && (
              <Tooltip content="Default template">
                <Badge variant="brand" size="sm">
                  <Flex align="center" gap="xs">
                    <Star className="w-3 h-3" />
                    Default
                  </Flex>
                </Badge>
              </Tooltip>
            )}
            <Badge variant="neutral" size="sm" className="capitalize">
              {template.type}
            </Badge>
            <Badge variant="brand" size="sm" className="capitalize">
              {template.defaultPriority}
            </Badge>
            {template.defaultStoryPoints !== undefined && (
              <Badge variant="outline" size="sm">
                {template.defaultStoryPoints} pts
              </Badge>
            )}
          </Flex>
          <Typography variant="small" color="secondary" className="mb-1">
            <Typography variant="label" as="span">
              Title:
            </Typography>{" "}
            {template.titleTemplate}
          </Typography>
          {template.descriptionTemplate && (
            <Typography variant="caption" color="tertiary" className="line-clamp-2">
              {template.descriptionTemplate}
            </Typography>
          )}
          {template.defaultLabels && template.defaultLabels.length > 0 && (
            <Flex gap="xs" className="mt-2">
              {template.defaultLabels.map((label) => (
                <Badge key={label} variant="outline" size="sm">
                  {label}
                </Badge>
              ))}
            </Flex>
          )}
        </FlexItem>

        <Flex gap="sm" className="ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            }
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            }
          >
            Delete
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}
