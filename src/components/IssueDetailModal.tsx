import type { Id } from "@convex/_generated/dataModel";
import type { ReactNode } from "react";
import { Flex } from "@/components/ui/Flex";
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
        className="sm:max-w-4xl"
      >
        <output aria-live="polite" aria-busy="true" className="space-y-6 block">
          <span className="sr-only">Loading...</span>
          <div className="animate-pulse bg-ui-bg-tertiary rounded h-8 w-3/4" />
          <div className="space-y-2">
            <div className="animate-pulse bg-ui-bg-tertiary rounded h-4 w-full" />
            <div className="animate-pulse bg-ui-bg-tertiary rounded h-4 w-2/3" />
          </div>
        </output>
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
      className="sm:max-w-5xl max-h-panel-lg overflow-y-auto bg-ui-bg-elevated border border-ui-border shadow-elevated"
      data-testid={TEST_IDS.ISSUE.DETAIL_MODAL}
    >
      {/* Additional issue metadata with icon, badge, and edit button */}
      <Flex align="center" justify="between" className="-mt-2 mb-4">
        <Flex align="center" gap="sm">
          <Icon icon={ISSUE_TYPE_ICONS[issue.type]} size="lg" />
          <Flex align="center" gap="xs">
            <Typography variant="muted" className="text-sm font-mono tracking-tight">
              {issue.key}
            </Typography>
            <Tooltip content={detail.hasCopied ? "Copied!" : "Copy issue key"}>
              <Button
                variant="ghost"
                size="sm"
                onClick={detail.handleCopyKey}
                aria-label="Copy issue key"
                className="transition-colors duration-default hover:bg-ui-bg-hover"
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
          <Button
            variant="ghost"
            size="sm"
            onClick={detail.handleEdit}
            className="transition-colors duration-default hover:bg-ui-bg-hover"
          >
            Edit
          </Button>
        )}
      </Flex>
      <IssueDetailLayout detail={detail} billingEnabled={billingEnabled} />
    </Dialog>
  );
}
