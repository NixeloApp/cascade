/**
 * Sprint Workload Distribution
 *
 * Shows assignee breakdown with progress for a sprint.
 * Expandable popover showing who has how many issues.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Progress } from "@/components/ui/Progress";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { Users } from "@/lib/icons";

interface SprintWorkloadProps {
  sprintId: Id<"sprints">;
}

export function SprintWorkload({ sprintId }: SprintWorkloadProps) {
  const breakdown = useAuthenticatedQuery(api.analytics.getSprintAssigneeBreakdown, {
    sprintId,
  });

  if (!breakdown || breakdown.totalIssues === 0) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm">
          <Icon icon={Users} size="sm" />
          <Typography variant="small">{breakdown.assignees.length} assignees</Typography>
        </Button>
      </PopoverTrigger>
      <PopoverContent recipe="sprintWorkload" align="end">
        <Card recipe="sprintWorkloadHeader" padding="sm">
          <Typography variant="label">Workload Distribution</Typography>
          <Typography variant="caption" color="secondary">
            {breakdown.totalIssues} issues in sprint
          </Typography>
        </Card>
        <Stack gap="none" className="max-h-64 overflow-y-auto">
          {breakdown.assignees.map((assignee) => (
            <Card key={assignee.id} recipe="sprintWorkloadRow" padding="sm">
              <Flex align="center" gap="sm">
                <Avatar name={assignee.name} size="sm" />
                <FlexItem flex="1" className="min-w-0">
                  <Typography variant="small" className="truncate">
                    {assignee.name}
                  </Typography>
                  <Flex align="center" gap="xs">
                    <FlexItem flex="1">
                      <Progress
                        value={assignee.percent}
                        variant={assignee.percent === 100 ? "success" : "default"}
                        className="h-1.5"
                        aria-label={`${assignee.name} workload completion`}
                      />
                    </FlexItem>
                    <Typography variant="caption" color="secondary" className="whitespace-nowrap">
                      {assignee.done}/{assignee.total}
                    </Typography>
                  </Flex>
                </FlexItem>
              </Flex>
            </Card>
          ))}
          {breakdown.unassigned && (
            <Card recipe="sprintWorkloadRowBordered" padding="sm">
              <Flex align="center" gap="sm">
                <Avatar name="?" size="sm" variant="neutral" />
                <FlexItem flex="1" className="min-w-0">
                  <Typography variant="small" color="secondary">
                    Unassigned
                  </Typography>
                  <Typography variant="caption" color="secondary">
                    {breakdown.unassigned.done}/{breakdown.unassigned.total} done
                  </Typography>
                </FlexItem>
              </Flex>
            </Card>
          )}
        </Stack>
      </PopoverContent>
    </Popover>
  );
}
