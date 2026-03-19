/**
 * InlinePropertyEdit - Click-to-edit components for issue properties
 *
 * Provides inline editing for:
 * - Priority (dropdown)
 * - Type (dropdown)
 * - Assignee (user dropdown)
 * - Story Points (number input)
 */

import type { Id } from "@convex/_generated/dataModel";
import type { IssuePriority, IssueTypeWithSubtask } from "@convex/validators";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { IconCircle } from "@/components/ui/IconCircle";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Typography } from "@/components/ui/Typography";
import { User } from "@/lib/icons";
import {
  getPriorityColor,
  getTypeLabel,
  ISSUE_PRIORITIES,
  ISSUE_TYPE_ICONS,
  ISSUE_TYPES_WITH_SUBTASK,
  PRIORITY_ICONS,
} from "@/lib/issue-utils";
import { formatOutOfOfficeUntil, type OutOfOfficeStatusSummary } from "@/lib/outOfOffice";

interface InlineSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
}

/**
 * Generic inline select wrapper with consistent styling
 */
function InlineSelect({ label, value, onChange, children, disabled }: InlineSelectProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger variant="inlineEdit" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}

// =============================================================================
// Priority Select
// =============================================================================

interface PrioritySelectProps {
  value: IssuePriority;
  onChange: (value: IssuePriority) => void;
  disabled?: boolean;
}

export function InlinePrioritySelect({ value, onChange, disabled }: PrioritySelectProps) {
  return (
    <InlineSelect
      label="Change priority"
      value={value}
      onChange={(v) => onChange(v as IssuePriority)}
      disabled={disabled}
    >
      {ISSUE_PRIORITIES.map((priority) => (
        <SelectItem key={priority} value={priority}>
          <Flex align="center" gap="sm">
            <Icon
              icon={PRIORITY_ICONS[priority]}
              size="sm"
              className={getPriorityColor(priority)}
            />
            <span className="capitalize">{priority}</span>
          </Flex>
        </SelectItem>
      ))}
    </InlineSelect>
  );
}

// =============================================================================
// Type Select
// =============================================================================

interface TypeSelectProps {
  value: IssueTypeWithSubtask;
  onChange: (value: IssueTypeWithSubtask) => void;
  disabled?: boolean;
}

export function InlineTypeSelect({ value, onChange, disabled }: TypeSelectProps) {
  return (
    <InlineSelect
      label="Change type"
      value={value}
      onChange={(v) => onChange(v as IssueTypeWithSubtask)}
      disabled={disabled}
    >
      {ISSUE_TYPES_WITH_SUBTASK.map((type) => (
        <SelectItem key={type} value={type}>
          <Flex align="center" gap="sm">
            <Icon icon={ISSUE_TYPE_ICONS[type]} size="sm" />
            {getTypeLabel(type)}
          </Flex>
        </SelectItem>
      ))}
    </InlineSelect>
  );
}

// =============================================================================
// Assignee Select
// =============================================================================

interface AssigneeSelectProps {
  value: string | null | undefined;
  members: Array<{
    _id: Id<"users">;
    name: string;
    image?: string;
    outOfOffice?: OutOfOfficeStatusSummary;
  }>;
  onChange: (value: Id<"users"> | null) => void;
  disabled?: boolean;
}

function AssigneeOption({
  image,
  name,
  outOfOffice,
}: {
  image?: string;
  name: string;
  outOfOffice?: OutOfOfficeStatusSummary;
}) {
  return (
    <Flex align="center" gap="sm">
      <Avatar name={name} src={image} size="xs" />
      <div className="min-w-0">
        <Flex align="center" gap="xs">
          <span>{name}</span>
          {outOfOffice ? <Badge variant="warning">OOO</Badge> : null}
        </Flex>
        {outOfOffice ? (
          <span className="text-xs text-ui-text-tertiary">
            {formatOutOfOfficeUntil(outOfOffice)}
          </span>
        ) : null}
      </div>
    </Flex>
  );
}

export function InlineAssigneeSelect({ value, members, onChange, disabled }: AssigneeSelectProps) {
  const selectedMember = members.find((m) => m._id === value);

  return (
    <Select
      value={value || "unassigned"}
      onValueChange={(v) => onChange(v === "unassigned" ? null : (v as Id<"users">))}
      disabled={disabled}
    >
      <SelectTrigger variant="inlineEdit" aria-label="Change assignee">
        <SelectValue>
          {selectedMember ? (
            <AssigneeOption
              name={selectedMember.name}
              image={selectedMember.image}
              outOfOffice={selectedMember.outOfOffice}
            />
          ) : (
            <Flex align="center" gap="sm">
              <IconCircle variant="muted" className="size-5">
                <User className="size-3 text-ui-text-secondary" />
              </IconCircle>
              <span>Unassigned</span>
            </Flex>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">
          <Flex align="center" gap="sm">
            <IconCircle variant="muted" className="size-5">
              <User className="size-3 text-ui-text-secondary" />
            </IconCircle>
            Unassigned
          </Flex>
        </SelectItem>
        {members.map((member) => (
          <SelectItem key={member._id} value={member._id}>
            <AssigneeOption
              name={member.name}
              image={member.image}
              outOfOffice={member.outOfOffice}
            />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// =============================================================================
// Status Select
// =============================================================================

interface StatusSelectProps {
  value: string;
  workflowStates: Array<{ id: string; name: string; category: string }>;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function InlineStatusSelect({
  value,
  workflowStates,
  onChange,
  disabled,
}: StatusSelectProps) {
  const currentState = workflowStates.find((s) => s.id === value);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger variant="inlineEdit" aria-label="Change status">
        <SelectValue>{currentState?.name || value}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {workflowStates.map((state) => (
          <SelectItem key={state.id} value={state.id}>
            {state.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// =============================================================================
// Story Points Input
// =============================================================================

interface StoryPointsInputProps {
  value: number | undefined | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
}

export function InlineStoryPointsInput({ value, onChange, disabled }: StoryPointsInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue === "") {
      onChange(null);
    } else {
      const parsed = Number.parseFloat(newValue);
      if (!Number.isNaN(parsed) && parsed >= 0) {
        onChange(parsed);
      }
    }
  };

  return (
    <Input
      type="number"
      min="0"
      step="0.5"
      value={value ?? ""}
      onChange={handleChange}
      placeholder="Not set"
      disabled={disabled}
      variant="inlineEdit"
      inputSize="sm"
      className="w-24"
      aria-label="Story points"
    />
  );
}

// =============================================================================
// Property Row Component
// =============================================================================

interface PropertyRowProps {
  label: string;
  children: ReactNode;
}

export function PropertyRow({ label, children }: PropertyRowProps) {
  return (
    <Card recipe="issueMetadataRow">
      <Flex align="center" justify="between">
        <Typography variant="meta" color="secondary" className="min-w-24">
          {label}
        </Typography>
        <FlexItem flex="1">{children}</FlexItem>
      </Flex>
    </Card>
  );
}
