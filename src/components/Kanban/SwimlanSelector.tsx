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
        <Button variant="ghost" size="sm" className="gap-1.5 text-ui-text-secondary">
          <Rows3 className="w-4 h-4" />
          <span className="hidden sm:inline">{value === "none" ? "Swimlanes" : currentLabel}</span>
          <ChevronDown className="w-3 h-3 opacity-50" />
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
