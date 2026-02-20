import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type {
  AutomationActionType,
  AutomationActionValue,
  AutomationTrigger,
} from "@convex/validators";
import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { FormDialog } from "../ui/FormDialog";
import { Input } from "../ui/form/Input";
import { Select } from "../ui/form/Select";
import { Textarea } from "../ui/form/Textarea";
import { Stack } from "../ui/Stack";

interface AutomationRuleFormProps {
  projectId: Id<"projects">;
  rule?: {
    _id: Id<"automationRules">;
    name: string;
    description?: string;
    trigger: AutomationTrigger;
    triggerValue?: string;
    actionType: AutomationActionType;
    actionValue: AutomationActionValue;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TRIGGERS: { value: AutomationTrigger; label: string }[] = [
  { value: "status_changed", label: "Status Changed" },
  { value: "assignee_changed", label: "Assignee Changed" },
  { value: "priority_changed", label: "Priority Changed" },
  { value: "issue_created", label: "Issue Created" },
  { value: "label_added", label: "Label Added" },
];

const ACTION_TYPES: { value: AutomationActionType; label: string }[] = [
  { value: "set_assignee", label: "Set Assignee" },
  { value: "set_priority", label: "Set Priority" },
  { value: "add_label", label: "Add Label" },
  { value: "add_comment", label: "Add Comment" },
  { value: "send_notification", label: "Send Notification" },
];

/** Get placeholder text for action value based on action type */
function getActionPlaceholder(actionType: AutomationActionType): string {
  switch (actionType) {
    case "set_assignee":
      return "Enter user ID (or leave empty to unassign)";
    case "set_priority":
      return "lowest, low, medium, high, or highest";
    case "add_label":
      return "Enter label name";
    case "add_comment":
      return "Enter comment text";
    case "send_notification":
      return "Enter notification message";
  }
}

/** Get label for action value input based on action type */
function getActionLabel(actionType: AutomationActionType): string {
  switch (actionType) {
    case "set_assignee":
      return "Assignee User ID";
    case "set_priority":
      return "Priority *";
    case "add_label":
      return "Label Name *";
    case "add_comment":
      return "Comment Text *";
    case "send_notification":
      return "Notification Message *";
  }
}

/** Build typed action value from form inputs */
function buildActionValue(
  actionType: AutomationActionType,
  value: string,
): AutomationActionValue | null {
  const trimmed = value.trim();

  switch (actionType) {
    case "set_assignee":
      return {
        type: "set_assignee",
        assigneeId: trimmed ? (trimmed as Id<"users">) : null,
      };
    case "set_priority": {
      const priorities = ["lowest", "low", "medium", "high", "highest"] as const;
      if (!priorities.includes(trimmed as (typeof priorities)[number])) {
        return null;
      }
      return {
        type: "set_priority",
        priority: trimmed as (typeof priorities)[number],
      };
    }
    case "add_label":
      if (!trimmed) return null;
      return { type: "add_label", label: trimmed };
    case "add_comment":
      if (!trimmed) return null;
      return { type: "add_comment", comment: trimmed };
    case "send_notification":
      if (!trimmed) return null;
      return { type: "send_notification", message: trimmed };
  }
}

/** Extract display value from typed action value */
function getActionDisplayValue(actionValue: AutomationActionValue): string {
  switch (actionValue.type) {
    case "set_assignee":
      return actionValue.assigneeId ?? "";
    case "set_priority":
      return actionValue.priority;
    case "add_label":
      return actionValue.label;
    case "add_comment":
      return actionValue.comment;
    case "send_notification":
      return actionValue.message;
  }
}

/**
 * Form component for creating/editing automation rules
 * Uses typed validators instead of raw JSON strings
 */
export function AutomationRuleForm({
  projectId,
  rule,
  open,
  onOpenChange,
}: AutomationRuleFormProps) {
  const [name, setName] = useState(rule?.name || "");
  const [description, setDescription] = useState(rule?.description || "");
  const [trigger, setTrigger] = useState<AutomationTrigger>(rule?.trigger || "status_changed");
  const [triggerValue, setTriggerValue] = useState(rule?.triggerValue || "");
  const [actionType, setActionType] = useState<AutomationActionType>(
    rule?.actionType || "add_label",
  );
  const [actionValueInput, setActionValueInput] = useState(
    rule?.actionValue ? getActionDisplayValue(rule.actionValue) : "",
  );
  const [isLoading, setIsLoading] = useState(false);

  const createRule = useMutation(api.automationRules.create);
  const updateRule = useMutation(api.automationRules.update);

  // Reset form when rule changes or dialog opens
  useEffect(() => {
    if (open) {
      if (rule) {
        setName(rule.name);
        setDescription(rule.description || "");
        setTrigger(rule.trigger);
        setTriggerValue(rule.triggerValue || "");
        setActionType(rule.actionType);
        setActionValueInput(getActionDisplayValue(rule.actionValue));
      } else {
        setName("");
        setDescription("");
        setTrigger("status_changed");
        setTriggerValue("");
        setActionType("add_label");
        setActionValueInput("");
      }
    }
  }, [rule, open]);

  const handleSave = async () => {
    if (!name.trim()) {
      showError(new Error("Please enter a rule name"), "Validation Error");
      return;
    }

    const actionValue = buildActionValue(actionType, actionValueInput);
    if (!actionValue) {
      showError(new Error("Please enter a valid action value"), "Validation Error");
      return;
    }

    try {
      setIsLoading(true);

      if (rule) {
        await updateRule({
          id: rule._id,
          name: name.trim(),
          description: description.trim() || undefined,
          trigger,
          triggerValue: triggerValue.trim() || undefined,
          actionType,
          actionValue,
        });
        showSuccess("Rule updated");
      } else {
        await createRule({
          projectId,
          name: name.trim(),
          description: description.trim() || undefined,
          trigger,
          triggerValue: triggerValue.trim() || undefined,
          actionType,
          actionValue,
        });
        showSuccess("Rule created");
      }

      onOpenChange(false);
    } catch (error) {
      showError(error, "Failed to save rule");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      onSave={handleSave}
      title={rule ? "Edit Automation Rule" : "Create Automation Rule"}
      saveLabel={rule ? "Update Rule" : "Create Rule"}
      isLoading={isLoading}
      size="lg"
    >
      <Stack gap="md">
        {/* Name */}
        <Input
          label="Rule Name *"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Auto-assign high priority issues"
        />

        {/* Description */}
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Optional description"
        />

        {/* Trigger */}
        <Select
          label="Trigger Event *"
          value={trigger}
          onChange={(e) => setTrigger(e.target.value as AutomationTrigger)}
        >
          {TRIGGERS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>

        {/* Trigger Value */}
        <Input
          label="Trigger Value"
          type="text"
          value={triggerValue}
          onChange={(e) => setTriggerValue(e.target.value)}
          placeholder="Optional trigger condition (e.g., specific status name)"
        />

        {/* Action Type */}
        <Select
          label="Action *"
          value={actionType}
          onChange={(e) => {
            setActionType(e.target.value as AutomationActionType);
            setActionValueInput(""); // Reset value when type changes
          }}
        >
          {ACTION_TYPES.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </Select>

        {/* Action Value - dynamic based on action type */}
        {actionType === "add_comment" ? (
          <Textarea
            label={getActionLabel(actionType)}
            value={actionValueInput}
            onChange={(e) => setActionValueInput(e.target.value)}
            rows={3}
            placeholder={getActionPlaceholder(actionType)}
          />
        ) : (
          <Input
            label={getActionLabel(actionType)}
            type="text"
            value={actionValueInput}
            onChange={(e) => setActionValueInput(e.target.value)}
            placeholder={getActionPlaceholder(actionType)}
          />
        )}
      </Stack>
    </FormDialog>
  );
}
