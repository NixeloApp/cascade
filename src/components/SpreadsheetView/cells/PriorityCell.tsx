/**
 * PriorityCell - Inline priority dropdown
 */

import { Badge } from "@/components/ui/Badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Flex } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import type { IssuePriority } from "@/lib/issue-utils";
import { getPriorityColor, PRIORITY_ICONS } from "@/lib/issue-utils";
import { cn } from "@/lib/utils";

const PRIORITY_OPTIONS: { value: IssuePriority; label: string }[] = [
  { value: "highest", label: "Highest" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "lowest", label: "Lowest" },
];

interface PriorityCellProps {
  priority: IssuePriority;
  onUpdate?: (priority: IssuePriority) => void;
}

export function PriorityCell({ priority, onUpdate }: PriorityCellProps) {
  const PriorityIcon = PRIORITY_ICONS[priority];

  const content = (
    <Badge
      variant="neutral"
      size="sm"
      className={cn(
        "cursor-pointer transition-colors",
        getPriorityColor(priority, "badge"),
        onUpdate && "hover:opacity-80",
      )}
    >
      <Flex align="center" gap="xs">
        <Icon icon={PriorityIcon} size="xs" className={getPriorityColor(priority, "text")} />
        <span className="capitalize">{priority}</span>
      </Flex>
    </Badge>
  );

  if (!onUpdate) {
    return content;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{content}</DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {PRIORITY_OPTIONS.map((option) => {
          const OptionIcon = PRIORITY_ICONS[option.value];
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onUpdate(option.value)}
              className={cn(priority === option.value && "bg-ui-bg-secondary")}
            >
              <Flex align="center" gap="sm">
                <Icon
                  icon={OptionIcon}
                  size="sm"
                  className={getPriorityColor(option.value, "text")}
                />
                <span>{option.label}</span>
              </Flex>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
