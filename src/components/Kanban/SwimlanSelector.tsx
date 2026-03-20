/**
 * SwimlanSelector - Dropdown for selecting swimlane grouping
 *
 * Matches Plane's sub_group_by pattern with options for:
 * - None (no swimlanes)
 * - Priority
 * - Assignee
 * - Type
 * - Label
 */

import { ChevronDown, Rows3 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import type { SwimlanGroupBy } from "@/lib/swimlane-utils";
import { getSwimlanGroupByLabel, getSwimlanGroupByOptions } from "@/lib/swimlane-utils";
import { Icon } from "../ui/Icon";

interface SwimlanSelectorProps {
  value: SwimlanGroupBy;
  onChange: (value: SwimlanGroupBy) => void;
}

export function SwimlanSelector({ value, onChange }: SwimlanSelectorProps) {
  const options = getSwimlanGroupByOptions();
  const currentLabel = getSwimlanGroupByLabel(value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-ui-text-secondary"
          leftIcon={<Icon icon={Rows3} size="sm" />}
          rightIcon={<Icon icon={ChevronDown} size="xs" tone="tertiary" />}
        >
          <span className="hidden sm:inline">{value === "none" ? "Swimlanes" : currentLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={value === option.value}
            onCheckedChange={() => onChange(option.value)}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
