import type { LabelInfo } from "../../../convex/lib/issueHelpers";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Stack } from "../ui/Stack";
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
    <Stack gap="md">
      {/* Metadata Grid */}
      <Card padding="md" variant="flat" className="border-ui-border/30">
        <Grid cols={1} colsSm={2} gap="lg">
          <Stack gap="xs">
            <Typography variant="meta" color="secondary">
              Status
            </Typography>
            <Typography variant="label">{status}</Typography>
          </Stack>
          <Stack gap="xs">
            <Typography variant="meta" color="secondary">
              Type
            </Typography>
            <Typography variant="label" className="capitalize">
              {type}
            </Typography>
          </Stack>
          <Stack gap="xs">
            <Typography variant="meta" color="secondary">
              Assignee
            </Typography>
            <Typography variant="label">{assignee?.name || "Unassigned"}</Typography>
          </Stack>
          <Stack gap="xs">
            <Typography variant="meta" color="secondary">
              Reporter
            </Typography>
            <Typography variant="label">{reporter?.name || "Unknown"}</Typography>
          </Stack>
          <Stack gap="xs">
            <Typography variant="meta" color="secondary">
              Story Points
            </Typography>
            <Typography variant="label">{storyPoints ?? "Not set"}</Typography>
          </Stack>
        </Grid>
      </Card>

      {/* Labels */}
      {labels.length > 0 && (
        <Stack gap="sm">
          <Typography variant="meta" color="secondary">
            Labels
          </Typography>
          <Flex wrap gap="sm">
            {labels.map((label) => (
              <Badge
                key={label.name}
                size="sm"
                className="text-brand-foreground transition-transform duration-default hover:scale-105"
                style={{ backgroundColor: label.color }}
              >
                {label.name}
              </Badge>
            ))}
          </Flex>
        </Stack>
      )}
    </Stack>
  );
}
