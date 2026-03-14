/**
 * IssueDetailSheet - Side panel view for issue details
 *
 * Displays issue details in a slide-out sheet from the right side,
 * allowing users to view issue details while maintaining context of the list/board.
 */

import type { Id } from "@convex/_generated/dataModel";
import type { ReactNode } from "react";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Stack } from "@/components/ui/Stack";
import { useOrganization } from "@/hooks/useOrgContext";
import { Check, Copy } from "@/lib/icons";
import { getPriorityColor, ISSUE_TYPE_ICONS } from "@/lib/issue-utils";
import { TEST_IDS } from "@/lib/test-ids";
import { IssueDetailLayout, useIssueDetail } from "./IssueDetail";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Icon } from "./ui/Icon";
import { Sheet } from "./ui/Sheet";
import { Skeleton, SkeletonText } from "./ui/Skeleton";
import { Tooltip } from "./ui/Tooltip";
import { Typography } from "./ui/Typography";

interface IssueDetailSheetProps {
  issueId: Id<"issues">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit?: boolean;
}

export function IssueDetailSheet({
  issueId,
  open,
  onOpenChange,
  canEdit = true,
}: IssueDetailSheetProps): ReactNode {
  const { billingEnabled } = useOrganization();
  const detail = useIssueDetail(issueId);

  if (!detail.issue) {
    return (
      <Sheet
        open={open}
        onOpenChange={onOpenChange}
        title="Loading issue details"
        description="Loading content..."
        side="right"
        layout="panel"
        className="w-full sm:max-w-xl lg:max-w-2xl"
      >
        <Card padding="lg" variant="ghost" radius="none">
          <Stack as="output" aria-live="polite" aria-busy="true" gap="lg">
            <span className="sr-only">Loading...</span>
            <Skeleton className="h-8 w-3/4" />
            <SkeletonText lines={2} />
          </Stack>
        </Card>
      </Sheet>
    );
  }

  const { issue } = detail;

  // Custom header with issue metadata
  const header = (
    <Card recipe="issueDetailSheetHeader" padding="lg" radius="none">
      {/* Issue key and priority */}
      <Flex align="center" gap="sm">
        <Icon icon={ISSUE_TYPE_ICONS[issue.type]} size="lg" />
        <Flex align="center" gap="xs">
          <Typography variant="mono">{issue.key}</Typography>
          <Tooltip content={detail.hasCopied ? "Copied!" : "Copy issue key"}>
            <Button
              variant="ghost"
              size="sm"
              onClick={detail.handleCopyKey}
              aria-label="Copy issue key"
            >
              {detail.hasCopied ? (
                <Check className="w-3.5 h-3.5 text-status-success" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </Button>
          </Tooltip>
          <Badge size="md" className={getPriorityColor(issue.priority, "badge")}>
            {issue.priority}
          </Badge>
        </Flex>
      </Flex>
      {/* Issue title */}
      <Typography as="h2" variant="h5">
        {issue.title}
      </Typography>
      {/* Edit button */}
      {canEdit && !detail.isEditing && (
        <Flex>
          <Button variant="ghost" size="sm" onClick={detail.handleEdit}>
            Edit
          </Button>
        </Flex>
      )}
    </Card>
  );

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={issue.title}
      description={`${issue.key} - View and edit issue details`}
      side="right"
      layout="panel"
      header={header}
      className="w-full sm:max-w-xl lg:max-w-2xl"
      data-testid={TEST_IDS.ISSUE.DETAIL_MODAL}
    >
      <FlexItem flex="1" className="min-h-0 overflow-y-auto">
        <Card padding="lg" variant="ghost" radius="none">
          <IssueDetailLayout detail={detail} billingEnabled={billingEnabled} canEdit={canEdit} />
        </Card>
      </FlexItem>
    </Sheet>
  );
}
