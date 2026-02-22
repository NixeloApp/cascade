/**
 * StatusCell - Inline status dropdown
 */

import type { WorkflowState } from "@convex/shared/types";
import { Badge } from "@/components/ui/Badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Flex } from "@/components/ui/Flex";
import { cn } from "@/lib/utils";

interface StatusCellProps {
  status: string;
  workflowStates: WorkflowState[];
  onUpdate?: (status: string) => void;
}

/** Get status category color */
function getStatusColor(category: string): string {
  switch (category) {
    case "done":
      return "bg-status-success-bg text-status-success-text";
    case "inprogress":
      return "bg-status-info-bg text-status-info-text";
    default:
      return "bg-ui-bg-tertiary text-ui-text-secondary";
  }
}

export function StatusCell({ status, workflowStates, onUpdate }: StatusCellProps) {
  const currentState = workflowStates.find((s) => s.id === status);
  const statusName = currentState?.name || status;
  const statusColor = currentState ? getStatusColor(currentState.category) : "";

  const content = (
    <Badge
      variant="neutral"
      size="sm"
      className={cn(
        "cursor-pointer transition-colors",
        statusColor,
        onUpdate && "hover:opacity-80",
      )}
    >
      {statusName}
    </Badge>
  );

  if (!onUpdate) {
    return content;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{content}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {workflowStates.map((state) => (
          <DropdownMenuItem
            key={state.id}
            onClick={() => onUpdate(state.id)}
            className={cn(status === state.id && "bg-ui-bg-secondary")}
          >
            <Flex align="center" gap="sm">
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  state.category === "done"
                    ? "bg-status-success"
                    : state.category === "inprogress"
                      ? "bg-status-info"
                      : "bg-ui-text-tertiary",
                )}
              />
              <span>{state.name}</span>
            </Flex>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
