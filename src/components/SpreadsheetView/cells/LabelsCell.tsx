/**
 * LabelsCell - Display labels (read-only for now)
 */

import { Badge } from "@/components/ui/Badge";
import { Flex } from "@/components/ui/Flex";
import { Tooltip } from "@/components/ui/Tooltip";
import { Typography } from "@/components/ui/Typography";
import type { LabelInfo } from "../../../../convex/lib/issueHelpers";

interface LabelsCellProps {
  labels: LabelInfo[];
}

export function LabelsCell({ labels }: LabelsCellProps) {
  if (labels.length === 0) {
    return (
      <Typography variant="small" color="tertiary">
        No labels
      </Typography>
    );
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
