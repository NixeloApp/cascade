/**
 * StoryPointsCell - Inline story points editor
 */

import { Hash } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Flex } from "@/components/ui/Flex";
import { cn } from "@/lib/utils";

/** Common story point values (Fibonacci-ish) */
const POINT_OPTIONS = [0, 1, 2, 3, 5, 8, 13, 21];

interface StoryPointsCellProps {
  points?: number;
  onUpdate?: (points: number | undefined) => void;
}

export function StoryPointsCell({ points, onUpdate }: StoryPointsCellProps) {
  const [isOpen, setIsOpen] = useState(false);

  const content =
    points !== undefined ? (
      <Flex
        align="center"
        gap="xs"
        className={cn(
          "cursor-pointer px-1.5 py-0.5 rounded transition-colors text-sm",
          onUpdate && "hover:bg-ui-bg-secondary",
        )}
      >
        <Hash className="w-3 h-3 text-ui-text-tertiary" />
        <span>{points}</span>
      </Flex>
    ) : (
      <Flex
        align="center"
        gap="xs"
        className={cn(
          "cursor-pointer px-1.5 py-0.5 rounded transition-colors text-ui-text-tertiary text-sm",
          onUpdate && "hover:bg-ui-bg-secondary hover:text-ui-text-secondary",
        )}
      >
        <Hash className="w-3 h-3" />
        <span>–</span>
      </Flex>
    );

  if (!onUpdate) {
    return content;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>{content}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-24">
        {POINT_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => {
              onUpdate(option);
              setIsOpen(false);
            }}
            className={cn(points === option && "bg-ui-bg-secondary")}
          >
            {option === 0 ? "None" : option}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
