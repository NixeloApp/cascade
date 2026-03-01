import type { Doc } from "../_generated/dataModel";

export type IssueCounts = {
  total: Record<string, number>;
  visible: Record<string, number>;
  hidden: Record<string, number>;
};

export const INITIAL_COUNTS: IssueCounts = {
  total: { todo: 0, inprogress: 0, done: 0 },
  visible: { todo: 0, inprogress: 0, done: 0 },
  hidden: { todo: 0, inprogress: 0, done: 0 },
};

/** Calculates issue counts by status category (todo/inprogress/done) for visible and hidden issues. */
export function calculateIssueCounts(
  issues: Doc<"issues">[],
  statusCategoryMap: Map<string, string> | Record<string, string>,
  doneThreshold: number,
): IssueCounts {
  const byStatus: IssueCounts = {
    total: { ...INITIAL_COUNTS.total },
    visible: { ...INITIAL_COUNTS.visible },
    hidden: { ...INITIAL_COUNTS.hidden },
  };

  for (const issue of issues) {
    const category =
      (statusCategoryMap instanceof Map
        ? statusCategoryMap.get(issue.status)
        : statusCategoryMap[issue.status]) || "todo";

    byStatus.total[category] = (byStatus.total[category] || 0) + 1;

    if (category === "done") {
      if (issue.updatedAt >= doneThreshold) {
        byStatus.visible[category] = (byStatus.visible[category] || 0) + 1;
      } else {
        byStatus.hidden[category] = (byStatus.hidden[category] || 0) + 1;
      }
    } else {
      byStatus.visible[category] = (byStatus.visible[category] || 0) + 1;
    }
  }

  return byStatus;
}
