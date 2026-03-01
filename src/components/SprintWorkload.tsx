/**
 * Sprint Workload Distribution
 *
 * Shows assignee breakdown with progress for a sprint.
 * Expandable popover showing who has how many issues.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Users } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { Flex, FlexItem } from "./ui/Flex";
import { Icon } from "./ui/Icon";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/Popover";
import { Stack } from "./ui/Stack";
import { Typography } from "./ui/Typography";

interface SprintWorkloadProps {
  sprintId: Id<"sprints">;
}

export function SprintWorkload({ sprintId }: SprintWorkloadProps) {
  const breakdown = useQuery(api.analytics.getSprintAssigneeBreakdown, {
    sprintId,
  });

  if (!breakdown || breakdown.totalIssues === 0) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <Icon icon={Users} size="sm" />
          <Typography variant="small">{breakdown.assignees.length} assignees</Typography>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <div className="p-3 border-b border-ui-border">
          <Typography variant="label">Workload Distribution</Typography>
          <Typography variant="caption" color="secondary">
            {breakdown.totalIssues} issues in sprint
          </Typography>
        </div>
        <Stack gap="none" className="max-h-64 overflow-y-auto">
          {breakdown.assignees.map((assignee) => (
            <Flex
              key={assignee.id}
              align="center"
              gap="sm"
              className="px-3 py-2 hover:bg-ui-bg-secondary"
            >
              <Avatar name={assignee.name} size="sm" />
              <FlexItem flex="1" className="min-w-0">
                <Typography variant="small" className="truncate">
                  {assignee.name}
                </Typography>
                <Flex align="center" gap="xs">
                  {/* Mini progress bar */}
                  <FlexItem
                    flex="1"
                    className="h-1.5 bg-ui-bg-secondary rounded-full overflow-hidden"
                  >
                    <div
                      className={cn(
                        "h-full rounded-full",
                        assignee.percent === 100 ? "bg-status-success" : "bg-brand",
                      )}
                      style={{ width: `${assignee.percent}%` }}
                    />
                  </FlexItem>
                  <Typography variant="caption" color="secondary" className="whitespace-nowrap">
                    {assignee.done}/{assignee.total}
                  </Typography>
                </Flex>
              </FlexItem>
            </Flex>
          ))}
          {breakdown.unassigned && (
            <Flex
              align="center"
              gap="sm"
              className="px-3 py-2 hover:bg-ui-bg-secondary border-t border-ui-border"
            >
              <Flex
                align="center"
                justify="center"
                className="w-6 h-6 rounded-full bg-ui-bg-tertiary"
              >
                <Typography variant="caption" color="secondary">
                  ?
                </Typography>
              </Flex>
              <FlexItem flex="1" className="min-w-0">
                <Typography variant="small" color="secondary">
                  Unassigned
                </Typography>
                <Typography variant="caption" color="secondary">
                  {breakdown.unassigned.done}/{breakdown.unassigned.total} done
                </Typography>
              </FlexItem>
            </Flex>
          )}
        </Stack>
      </PopoverContent>
    </Popover>
  );
}
