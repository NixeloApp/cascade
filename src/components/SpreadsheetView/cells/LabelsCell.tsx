/**
 * LabelsCell - Display labels (read-only for now)
 */

import { Badge } from "@/components/ui/Badge";
import { Flex } from "@/components/ui/Flex";
import { Tooltip } from "@/components/ui/Tooltip";
import type { LabelInfo } from "../../../../convex/lib/issueHelpers";

interface LabelsCellProps {
  labels: LabelInfo[];
}

export function LabelsCell({ labels }: LabelsCellProps) {
  if (labels.length === 0) {
    return <span className="text-sm text-ui-text-tertiary">No labels</span>;
  }

  const visibleLabels = labels.slice(0, 2);
  const hiddenLabels = labels.slice(2);

  return (
    <Flex wrap gap="xs">
      {visibleLabels.map((label) => (
        <Badge
          key={label.name}
          size="sm"
          className="text-brand-foreground"
          style={{ backgroundColor: label.color }}
        >
          {label.name}
        </Badge>
      ))}
      {hiddenLabels.length > 0 && (
        <Tooltip content={hiddenLabels.map((l) => l.name).join(", ")}>
          <Badge variant="neutral" size="sm" className="cursor-help">
            +{hiddenLabels.length}
          </Badge>
        </Tooltip>
      )}
    </Flex>
  );
}
