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
import { IssueDetailLayout, useIssueDetail } from "./IssueDetailView";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Icon } from "./ui/Icon";
import { Sheet } from "./ui/Sheet";
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
        className="w-full sm:max-w-xl lg:max-w-2xl"
      >
        <Stack as="output" aria-live="polite" aria-busy="true" gap="lg" className="p-6">
          <span className="sr-only">Loading...</span>
          <div className="animate-pulse bg-ui-bg-tertiary rounded h-8 w-3/4" />
          <Stack gap="xs">
            <div className="animate-pulse bg-ui-bg-tertiary rounded h-4 w-full" />
            <div className="animate-pulse bg-ui-bg-tertiary rounded h-4 w-2/3" />
          </Stack>
        </Stack>
      </Sheet>
    );
  }

  const { issue } = detail;

  // Custom header with issue metadata
  const header = (
    <Flex direction="column" gap="sm" className="p-6 border-b border-ui-border">
      {/* Issue key and priority */}
      <Flex align="center" gap="sm">
        <Icon icon={ISSUE_TYPE_ICONS[issue.type]} size="lg" />
        <Flex align="center" gap="xs">
          <Typography variant="small" className="font-mono tracking-tight text-ui-text-secondary">
            {issue.key}
          </Typography>
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
      <Typography variant="p" className="font-semibold text-ui-text">
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
    </Flex>
  );

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={issue.title}
      description={`${issue.key} - View and edit issue details`}
      side="right"
      header={header}
      className="w-full sm:max-w-xl lg:max-w-2xl"
      data-testid={TEST_IDS.ISSUE.DETAIL_MODAL}
    >
      <FlexItem flex="1" className="overflow-y-auto p-6">
        <IssueDetailLayout detail={detail} billingEnabled={billingEnabled} canEdit={canEdit} />
      </FlexItem>
    </Sheet>
  );
}
