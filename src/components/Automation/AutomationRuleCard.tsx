import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type {
  AutomationActionType,
  AutomationActionValue,
  AutomationTrigger,
} from "@convex/validators";
import { useMutation } from "convex/react";
import { ArrowRight, Pause, Pencil, Play, Trash2 } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Flex, FlexItem } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

interface AutomationRuleCardProps {
  rule: {
    _id: Id<"automationRules">;
    name: string;
    description?: string;
    trigger: AutomationTrigger;
    triggerValue?: string;
    actionType: AutomationActionType;
    actionValue: AutomationActionValue;
    isActive: boolean;
    executionCount: number;
  };
  onEdit: () => void;
  onDelete: () => void;
}

const getTriggerLabel = (trigger: string) => {
  const labels: Record<string, string> = {
    status_changed: "Status Changed",
    assignee_changed: "Assignee Changed",
    priority_changed: "Priority Changed",
    issue_created: "Issue Created",
    label_added: "Label Added",
  };
  return labels[trigger] || trigger;
};

const getActionLabel = (actionType: string) => {
  const labels: Record<string, string> = {
    set_assignee: "Set Assignee",
    set_priority: "Set Priority",
    add_label: "Add Label",
    add_comment: "Add Comment",
    send_notification: "Send Notification",
  };
  return labels[actionType] || actionType;
};

/**
 * Card component for displaying an individual automation rule
 * Extracted from AutomationRulesManager for better reusability
 */
export function AutomationRuleCard({ rule, onEdit, onDelete }: AutomationRuleCardProps) {
  const updateRule = useMutation(api.automationRules.update);

  const handleToggle = async () => {
    try {
      await updateRule({
        id: rule._id,
        isActive: !rule.isActive,
      });
      showSuccess(rule.isActive ? "Rule disabled" : "Rule enabled");
    } catch (error) {
      showError(error, "Failed to toggle rule");
    }
  };

  return (
    <Card padding="md">
      <Flex justify="between" align="start" gap="lg">
        <FlexItem flex="1" className="min-w-0">
          <Stack gap="sm">
            <Flex gap="md" align="center">
              <Typography variant="label">{rule.name}</Typography>
              <Badge variant={rule.isActive ? "success" : "neutral"} size="md">
                {rule.isActive ? "Active" : "Inactive"}
              </Badge>
            </Flex>

            {rule.description && (
              <Typography variant="small" color="secondary">
                {rule.description}
              </Typography>
            )}

            <Flex gap="lg" align="center">
              <Flex gap="sm" align="center">
                <Typography variant="muted">When:</Typography>
                <Badge variant="brand" size="md">
                  {getTriggerLabel(rule.trigger)}
                  {rule.triggerValue && (
                    <>
                      <Icon icon={ArrowRight} size="xs" className="inline mx-1" />
                      {rule.triggerValue}
                    </>
                  )}
                </Badge>
              </Flex>

              <Flex gap="sm" align="center">
                <Typography variant="muted">Then:</Typography>
                <Badge variant="accent" size="md">
                  {getActionLabel(rule.actionType)}
                </Badge>
              </Flex>

              <Typography variant="small" color="secondary">
                Executed: {rule.executionCount} times
              </Typography>
            </Flex>
          </Stack>
        </FlexItem>

        <Flex gap="sm" align="center" className="shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            className="h-8 w-8"
            title={rule.isActive ? "Disable rule" : "Enable rule"}
            aria-label={
              rule.isActive ? `Disable rule: ${rule.name}` : `Enable rule: ${rule.name}`
            }
          >
            <Icon icon={rule.isActive ? Pause : Play} size="sm" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-8 w-8"
            title="Edit rule"
            aria-label={`Edit rule: ${rule.name}`}
          >
            <Icon icon={Pencil} size="sm" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8"
            title="Delete rule"
            aria-label={`Delete rule: ${rule.name}`}
          >
            <Icon icon={Trash2} size="sm" />
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}
