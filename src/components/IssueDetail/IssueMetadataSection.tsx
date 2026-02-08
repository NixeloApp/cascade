import type { LabelInfo } from "../../../convex/lib/issueHelpers";
import { Flex } from "../ui/Flex";
import { Typography } from "../ui/Typography";

interface IssueMetadataProps {
  status: string;
  type: string;
  assignee?: { name: string } | null;
  reporter?: { name: string } | null;
  storyPoints?: number | null;
  labels: LabelInfo[];
}

/**
 * Displays issue metadata grid and labels
 * Extracted from IssueDetailModal for better organization
 */
export function IssueMetadataSection({
  status,
  type,
  assignee,
  reporter,
  storyPoints,
  labels,
}: IssueMetadataProps) {
  return (
    <>
      {/* Metadata Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-ui-bg-soft rounded-lg border border-ui-border/30">
        <div className="space-y-1">
          <Typography variant="muted" className="text-xs text-ui-text-secondary">
            Status
          </Typography>
          <Typography variant="p" className="font-medium text-ui-text">
            {status}
          </Typography>
        </div>
        <div className="space-y-1">
          <Typography variant="muted" className="text-xs text-ui-text-secondary">
            Type
          </Typography>
          <Typography variant="p" className="font-medium capitalize text-ui-text">
            {type}
          </Typography>
        </div>
        <div className="space-y-1">
          <Typography variant="muted" className="text-xs text-ui-text-secondary">
            Assignee
          </Typography>
          <Typography variant="p" className="font-medium text-ui-text">
            {assignee?.name || "Unassigned"}
          </Typography>
        </div>
        <div className="space-y-1">
          <Typography variant="muted" className="text-xs text-ui-text-secondary">
            Reporter
          </Typography>
          <Typography variant="p" className="font-medium text-ui-text">
            {reporter?.name || "Unknown"}
          </Typography>
        </div>
        <div className="space-y-1">
          <Typography variant="muted" className="text-xs text-ui-text-secondary">
            Story Points
          </Typography>
          <Typography variant="p" className="font-medium text-ui-text">
            {storyPoints ?? "Not set"}
          </Typography>
        </div>
      </div>

      {/* Labels */}
      {labels.length > 0 && (
        <div className="pt-4">
          <Typography variant="muted" className="text-xs text-ui-text-secondary mb-2">
            Labels
          </Typography>
          <Flex wrap gap="sm">
            {labels.map((label) => (
              <span
                key={label.name}
                className="px-2 py-0.5 text-xs font-medium rounded-md text-brand-foreground transition-transform duration-default hover:scale-105"
                style={{ backgroundColor: label.color }}
              >
                {label.name}
              </span>
            ))}
          </Flex>
        </div>
      )}
    </>
  );
}
