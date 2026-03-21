/**
 * IssueDetailSheet - Side panel view for issue details
 *
 * Displays issue details in a slide-out sheet from the right side,
 * allowing users to view issue details while maintaining context of the list/board.
 */

import type { Id } from "@convex/_generated/dataModel";
import type { ReactNode } from "react";
import { Flex } from "@/components/ui/Flex";
import { Stack } from "@/components/ui/Stack";
import { useOrganization } from "@/hooks/useOrgContext";
import { Check, Copy } from "@/lib/icons";
import { getPriorityBadgeTone, ISSUE_TYPE_ICONS } from "@/lib/issue-utils";
import { TEST_IDS } from "@/lib/test-ids";
import { IssueDetailLayout, useIssueDetail } from "./IssueDetail";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
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
        bodyClassName="px-6 pb-6"
        className="w-full sm:max-w-xl lg:max-w-2xl"
      >
        <Stack as="output" aria-live="polite" aria-busy="true" gap="lg">
          <span className="sr-only">Loading...</span>
          <Skeleton className="h-8 w-3/4" />
          <SkeletonText lines={2} />
        </Stack>
      </Sheet>
    );
  }

  const { issue } = detail;

  // Custom header with issue metadata
  const header = (
    <Stack gap="md">
      <Flex align="center" gap="sm" wrap>
        <Icon icon={ISSUE_TYPE_ICONS[issue.type]} size="lg" />
        <Flex align="center" gap="xs" wrap>
          <Typography variant="mono">{issue.key}</Typography>
          <Tooltip content={detail.hasCopied ? "Copied!" : "Copy issue key"}>
            <Button
              variant="ghost"
              size="sm"
              onClick={detail.handleCopyKey}
              aria-label="Copy issue key"
            >
              <Icon
                icon={detail.hasCopied ? Check : Copy}
                size="xsPlus"
                tone={detail.hasCopied ? "success" : "secondary"}
              />
            </Button>
          </Tooltip>
          <Badge size="md" priorityTone={getPriorityBadgeTone(issue.priority)}>
            {issue.priority}
          </Badge>
        </Flex>
      </Flex>
      <Flex align="start" justify="between" gap="md" wrap>
        <Typography as="h2" variant="h5" className="max-w-3xl">
          {issue.title}
        </Typography>
        {canEdit && !detail.isEditing && (
          <Button variant="ghost" size="sm" onClick={detail.handleEdit}>
            Edit
          </Button>
        )}
      </Flex>
    </Stack>
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
      bodyClassName="p-0"
      className="w-full sm:max-w-xl lg:max-w-2xl"
      data-testid={TEST_IDS.ISSUE.DETAIL_MODAL}
    >
      <IssueDetailLayout detail={detail} billingEnabled={billingEnabled} canEdit={canEdit} />
    </Sheet>
  );
}
