/**
 * TypeCell - Inline issue type dropdown
 */

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Flex } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { Typography } from "@/components/ui/Typography";
import type { IssueType } from "@/lib/issue-utils";
import { getTypeLabel, ISSUE_TYPE_ICONS } from "@/lib/issue-utils";
import { cn } from "@/lib/utils";

const TYPE_OPTIONS: IssueType[] = ["task", "bug", "story", "epic"];

interface TypeCellProps {
  type: IssueType;
  onUpdate?: (type: IssueType) => void;
}

export function TypeCell({ type, onUpdate }: TypeCellProps) {
  const TypeIcon = ISSUE_TYPE_ICONS[type];

  const content = (
    <Flex
      align="center"
      gap="xs"
      className={cn(
        "cursor-pointer px-1.5 py-0.5 rounded transition-colors",
        onUpdate && "hover:bg-ui-bg-secondary",
      )}
    >
      <Icon icon={TypeIcon} size="sm" />
      <Typography variant="small" className="capitalize">
        {type}
      </Typography>
    </Flex>
  );

  if (!onUpdate) {
    return content;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{content}</DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {TYPE_OPTIONS.map((option) => {
          const OptionIcon = ISSUE_TYPE_ICONS[option];
          return (
            <DropdownMenuItem
              key={option}
              onClick={() => onUpdate(option)}
              className={cn(type === option && "bg-ui-bg-secondary")}
            >
              <Flex align="center" gap="sm">
                <Icon icon={OptionIcon} size="sm" />
                <span>{getTypeLabel(option)}</span>
              </Flex>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
