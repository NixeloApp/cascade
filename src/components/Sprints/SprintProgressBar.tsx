/**
 * Sprint Progress Bar
 *
 * Shows inline progress indicator for sprint completion.
 * Uses existing getIssueCounts query to display done/total ratio.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";

interface SprintProgressBarProps {
  projectId: Id<"projects">;
  sprintId: Id<"sprints">;
  className?: string;
}

type IssueCounts = Record<string, { total: number } | unknown>;
type WorkflowState = { id: string; category: string };

function calculateProgress(
  counts: IssueCounts,
  workflowStates: WorkflowState[],
): { percent: number; done: number; total: number } {
  const doneStates = new Set(workflowStates.filter((s) => s.category === "done").map((s) => s.id));

  let total = 0;
  let done = 0;

  for (const [statusId, statusCounts] of Object.entries(counts)) {
    if (typeof statusCounts === "object" && statusCounts && "total" in statusCounts) {
      const count = (statusCounts as { total: number }).total;
      total += count;
      if (doneStates.has(statusId)) done += count;
    }
  }

  if (total === 0) return { percent: 0, done: 0, total: 0 };
  return { percent: Math.round((done / total) * 100), done, total };
}

export function SprintProgressBar({ projectId, sprintId, className }: SprintProgressBarProps) {
  const counts = useQuery(api.issues.getIssueCounts, { projectId, sprintId });
  const project = useQuery(api.projects.getProject, { id: projectId });

  const progress =
    counts && project?.workflowStates ? calculateProgress(counts, project.workflowStates) : null;

  if (!progress || progress.total === 0) {
    return null;
  }

  return (
    <Flex align="center" gap="sm" className={cn("min-w-48", className)}>
      {/* Progress bar */}
      <FlexItem flex="1" className="h-2 bg-ui-bg-secondary rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-default rounded-full",
            progress.percent === 100 ? "bg-status-success" : "bg-brand",
          )}
          style={{ width: `${progress.percent}%` }}
        />
      </FlexItem>

      {/* Stats */}
      <Typography variant="small" color="secondary" className="whitespace-nowrap">
        {progress.done}/{progress.total} ({progress.percent}%)
      </Typography>
    </Flex>
  );
}
