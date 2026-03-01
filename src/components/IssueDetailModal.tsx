import type { Id } from "@convex/_generated/dataModel";
import type { ReactNode } from "react";
import { Flex } from "@/components/ui/Flex";
import { Stack } from "@/components/ui/Stack";
import { useOrganization } from "@/hooks/useOrgContext";
import { Check, Copy } from "@/lib/icons";
import { getPriorityColor, ISSUE_TYPE_ICONS } from "@/lib/issue-utils";
import { TEST_IDS } from "@/lib/test-ids";
import { IssueDetailLayout, useIssueDetail } from "./IssueDetailView";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Dialog } from "./ui/Dialog";
import { Icon } from "./ui/Icon";
import { Tooltip } from "./ui/Tooltip";
import { Typography } from "./ui/Typography";

interface IssueDetailModalProps {
  issueId: Id<"issues">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit?: boolean;
}

export function IssueDetailModal({
  issueId,
  open,
  onOpenChange,
  canEdit = true,
}: IssueDetailModalProps): ReactNode {
  const { billingEnabled } = useOrganization();
  const detail = useIssueDetail(issueId);

  if (!detail.issue) {
    return (
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        title="Loading issue details"
        description="Loading content..."
        size="xl"
      >
        <Stack as="output" aria-live="polite" aria-busy="true" gap="lg" className="block">
          <span className="sr-only">Loading...</span>
          <div className="animate-pulse bg-ui-bg-tertiary rounded h-8 w-3/4" />
          <Stack gap="xs">
            <div className="animate-pulse bg-ui-bg-tertiary rounded h-4 w-full" />
            <div className="animate-pulse bg-ui-bg-tertiary rounded h-4 w-2/3" />
          </Stack>
        </Stack>
      </Dialog>
    );
  }

  const { issue } = detail;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={issue.title}
      description={`${issue.key} - View and edit issue details`}
      size="2xl"
      className="overflow-y-auto bg-ui-bg-elevated border border-ui-border shadow-elevated"
      data-testid={TEST_IDS.ISSUE.DETAIL_MODAL}
    >
      {/* Additional issue metadata with icon, badge, and edit button */}
      <Flex align="center" justify="between" className="-mt-2 mb-4">
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
        {canEdit && !detail.isEditing && (
          <Button variant="ghost" size="sm" onClick={detail.handleEdit}>
            Edit
          </Button>
        )}
      </Flex>
      <IssueDetailLayout detail={detail} billingEnabled={billingEnabled} canEdit={canEdit} />
    </Dialog>
  );
}
