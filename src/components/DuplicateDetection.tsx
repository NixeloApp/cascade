/**
 * DuplicateDetection - Shows potential duplicate issues while creating a new issue
 *
 * Displays a list of existing issues that might be duplicates based on title similarity.
 * Helps users avoid creating redundant issues.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useDebounce } from "@/hooks/useDebounce";
import { AlertTriangle } from "@/lib/icons";
import type { IssueType } from "@/lib/issue-utils";
import { ISSUE_TYPE_ICONS } from "@/lib/issue-utils";
import { TEST_IDS } from "@/lib/test-ids";

interface DuplicateDetectionProps {
  title: string;
  projectId: Id<"projects">;
  /** Called when user clicks an existing issue */
  onIssueClick?: (issueId: Id<"issues">) => void;
}

/** Shows potential duplicate issues based on title similarity when creating issues. */
export function DuplicateDetection({ title, projectId, onIssueClick }: DuplicateDetectionProps) {
  // Debounce the title to avoid too many queries
  const debouncedTitle = useDebounce(title, 300);

  // Skip query if title is too short
  const shouldQuery = debouncedTitle.trim().length >= 3;

  const similarIssues = useAuthenticatedQuery(
    api.issues.findSimilarIssues,
    shouldQuery ? { query: debouncedTitle, projectId, limit: 5 } : "skip",
  );

  // Don't show anything while loading or if no results
  if (!shouldQuery || !similarIssues || similarIssues.length === 0) {
    return null;
  }

  return (
    <Card
      padding="md"
      className="bg-status-warning-bg/30 border-status-warning-border/30"
      data-testid={TEST_IDS.ISSUE.CREATE_DUPLICATE_DETECTION}
    >
      <Stack gap="sm">
        <Flex align="center" gap="xs">
          <Icon icon={AlertTriangle} size="sm" tone="warningText" />
          <Typography variant="small" color="secondary">
            Potential duplicates found
          </Typography>
        </Flex>
        <Stack gap="xs">
          {similarIssues.map((issue) => (
            <Button
              key={issue._id}
              variant="ghost"
              size="sm"
              data-testid={TEST_IDS.ISSUE.CREATE_DUPLICATE_ITEM(issue.key)}
              onClick={() => onIssueClick?.(issue._id)}
              className="w-full justify-start"
            >
              <Flex align="center" gap="sm" className="w-full">
                <Icon
                  icon={ISSUE_TYPE_ICONS[issue.type as IssueType]}
                  size="sm"
                  tone="secondary"
                  className="shrink-0"
                />
                <Typography variant="small" className="font-mono text-ui-text-secondary shrink-0">
                  {issue.key}
                </Typography>
                <Typography variant="small" className="truncate text-left">
                  {issue.title}
                </Typography>
              </Flex>
            </Button>
          ))}
        </Stack>
        <Typography variant="caption" color="tertiary">
          Click an issue to view it, or continue creating a new one
        </Typography>
      </Stack>
    </Card>
  );
}
