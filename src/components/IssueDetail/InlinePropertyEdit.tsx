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
import type { ChangeEvent, ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { IconCircle } from "@/components/ui/IconCircle";
import { Inline } from "@/components/ui/Inline";
import { Input } from "@/components/ui/Input";
import { Select, type SelectOption } from "@/components/ui/Select";
import { Typography } from "@/components/ui/Typography";
import type { UserSummaryWithOutOfOffice } from "@/lib/entitySummaries";
import { User } from "@/lib/icons";
import {
  getPriorityColor,
  getTypeLabel,
  ISSUE_PRIORITIES,
  ISSUE_TYPE_ICONS,
  ISSUE_TYPES_WITH_SUBTASK,
  PRIORITY_ICONS,
} from "@/lib/issue-utils";
import { formatOutOfOfficeUntil } from "@/lib/outOfOffice";

interface InlineSelectProps<TValue extends string, TOption extends SelectOption<TValue>> {
  label: string;
  value: TValue;
  onChange: (value: TValue) => void;
  options: TOption[];
  disabled?: boolean;
  renderOption?: (option: TOption) => ReactNode;
  renderValue?: (option: TOption) => ReactNode;
}

/**
 * Generic inline select wrapper with consistent styling
 */
function InlineSelect<TValue extends string, TOption extends SelectOption<TValue>>({
  label,
  value,
  onChange,
  options,
  disabled,
  renderOption,
  renderValue,
}: InlineSelectProps<TValue, TOption>) {
  return (
    <Select
      ariaLabel={label}
      disabled={disabled}
      onChange={onChange}
      options={options}
      renderOption={renderOption}
      renderValue={renderValue}
      value={value}
      variant="inlineEdit"
    />
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
  const options = ISSUE_PRIORITIES.map((priority) => ({
    icon: PRIORITY_ICONS[priority],
    label: priority,
    toneClassName: getPriorityColor(priority),
    value: priority,
  }));

  return (
    <InlineSelect
      label="Change priority"
      onChange={onChange}
      options={options}
      renderOption={(option) => (
        <Flex align="center" gap="sm">
          <Icon icon={option.icon} size="sm" className={option.toneClassName} />
          <Inline className="capitalize">{option.label}</Inline>
        </Flex>
      )}
      disabled={disabled}
      value={value}
    />
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
  const options = ISSUE_TYPES_WITH_SUBTASK.map((type) => ({
    icon: ISSUE_TYPE_ICONS[type],
    label: getTypeLabel(type),
    value: type,
  }));

  return (
    <InlineSelect
      label="Change type"
      onChange={onChange}
      options={options}
      renderOption={(option) => (
        <Flex align="center" gap="sm">
          <Icon icon={option.icon} size="sm" />
          {option.label}
        </Flex>
      )}
      disabled={disabled}
      value={value}
    />
  );
}

// =============================================================================
// Assignee Select
// =============================================================================

interface AssigneeSelectProps {
  value: string | null | undefined;
  members: UserSummaryWithOutOfOffice[];
  onChange: (value: Id<"users"> | null) => void;
  disabled?: boolean;
}

function AssigneeOption({
  image,
  name,
  outOfOffice,
}: Pick<UserSummaryWithOutOfOffice, "image" | "name" | "outOfOffice">) {
  return (
    <Flex align="center" gap="sm">
      <Avatar name={name} src={image} size="xs" />
      <FlexItem flex="1">
        <Flex align="center" gap="xs">
          <Typography variant="small">{name}</Typography>
          {outOfOffice ? <Badge variant="warning">OOO</Badge> : null}
        </Flex>
        {outOfOffice ? (
          <Typography variant="caption" color="secondary">
            {formatOutOfOfficeUntil(outOfOffice)}
          </Typography>
        ) : null}
      </FlexItem>
    </Flex>
  );
}

export function InlineAssigneeSelect({ value, members, onChange, disabled }: AssigneeSelectProps) {
  const options = [
    {
      image: undefined,
      label: "Unassigned",
      name: "Unassigned",
      outOfOffice: undefined,
      value: "unassigned",
    },
    ...members.map((member) => ({
      image: member.image,
      label: member.name,
      name: member.name,
      outOfOffice: member.outOfOffice,
      value: member._id,
    })),
  ];

  return (
    <Select
      ariaLabel="Change assignee"
      disabled={disabled}
      onChange={(nextValue) =>
        onChange(nextValue === "unassigned" ? null : (nextValue as Id<"users">))
      }
      options={options}
      renderOption={(option) =>
        option.value === "unassigned" ? (
          <Flex align="center" gap="sm">
            <IconCircle variant="muted" className="size-5">
              <User className="size-3 text-ui-text-secondary" />
            </IconCircle>
            Unassigned
          </Flex>
        ) : (
          <AssigneeOption
            image={option.image}
            name={option.name}
            outOfOffice={option.outOfOffice}
          />
        )
      }
      renderValue={(option) =>
        option.value === "unassigned" ? (
          <Flex align="center" gap="sm">
            <IconCircle variant="muted" className="size-5">
              <User className="size-3 text-ui-text-secondary" />
            </IconCircle>
            <Inline>Unassigned</Inline>
          </Flex>
        ) : (
          <AssigneeOption
            image={option.image}
            name={option.name}
            outOfOffice={option.outOfOffice}
          />
        )
      }
      value={value ?? "unassigned"}
      variant="inlineEdit"
    />
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
    <Select
      ariaLabel="Change status"
      disabled={disabled}
      onChange={onChange}
      options={workflowStates.map((state) => ({
        category: state.category,
        label: state.name,
        value: state.id,
      }))}
      renderValue={(option) => option.label ?? currentState?.name ?? value}
      value={value}
      variant="inlineEdit"
    />
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
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
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
    <Flex align="center" justify="between">
      <Typography variant="meta" color="secondary" className="min-w-24">
        {label}
      </Typography>
      <FlexItem flex="1">{children}</FlexItem>
    </Flex>
  );
}
