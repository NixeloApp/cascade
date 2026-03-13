/**
 * Sprint Progress Bar
 *
 * Shows inline progress indicator for sprint completion.
 * Uses existing getIssueCounts query to display done/total ratio.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Progress } from "@/components/ui/Progress";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
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
  const counts = useAuthenticatedQuery(api.issues.getIssueCounts, { projectId, sprintId });
  const project = useAuthenticatedQuery(api.projects.getProject, { id: projectId });

  const progress =
    counts && project?.workflowStates ? calculateProgress(counts, project.workflowStates) : null;

  if (!progress || progress.total === 0) {
    return null;
  }

  return (
    <div className={cn("min-w-48", className)}>
      <Flex align="center" gap="sm">
        <FlexItem flex="1">
          <Progress
            value={progress.percent}
            variant={progress.percent === 100 ? "success" : "default"}
            className="h-2"
            aria-label="Sprint progress"
          />
        </FlexItem>

        <Typography variant="small" color="secondary" className="whitespace-nowrap">
          {progress.done}/{progress.total} ({progress.percent}%)
        </Typography>
      </Flex>
    </div>
  );
}
