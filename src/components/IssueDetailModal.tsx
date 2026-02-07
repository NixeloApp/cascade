import type { Id } from "@convex/_generated/dataModel";
import type { ReactNode } from "react";
import { Flex } from "@/components/ui/Flex";
import { useOrganization } from "@/hooks/useOrgContext";
import { Check, Copy } from "@/lib/icons";
import { getPriorityColor } from "@/lib/issue-utils";
import { IssueTypeIcon } from "./ui/IssueTypeIcon";
import { TEST_IDS } from "@/lib/test-ids";
import { IssueDetailLayout, useIssueDetail } from "./IssueDetailView";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/Dialog";
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
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="sr-only">Loading issue details</DialogTitle>
          </DialogHeader>
          <DialogDescription className="sr-only">Loading content...</DialogDescription>
          <output aria-live="polite" aria-busy="true" className="space-y-6 block">
            <span className="sr-only">Loading...</span>
            <div className="animate-pulse bg-ui-bg-tertiary rounded h-8 w-3/4" />
            <div className="space-y-2">
              <div className="animate-pulse bg-ui-bg-tertiary rounded h-4 w-full" />
              <div className="animate-pulse bg-ui-bg-tertiary rounded h-4 w-2/3" />
            </div>
          </output>
        </DialogContent>
      </Dialog>
    );
  }

  const { issue } = detail;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-5xl max-h-panel-lg overflow-y-auto p-0 bg-ui-bg-elevated border border-ui-border shadow-elevated"
        data-testid={TEST_IDS.ISSUE.DETAIL_MODAL}
      >
        <DialogHeader className="px-6 pt-6 pb-0">
          <Flex align="center" justify="between">
            <Flex align="center" className="space-x-3">
              <IssueTypeIcon type={issue.type} size="lg" />
              <div>
                <DialogTitle className="flex items-center space-x-2">
                  <Flex align="center" className="gap-1.5">
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
                  </Flex>
                  <Badge size="md" className={getPriorityColor(issue.priority, "badge")}>
                    {issue.priority}
                  </Badge>
                </DialogTitle>
              </div>
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
        </DialogHeader>
        <DialogDescription className="sr-only">View and edit issue details</DialogDescription>
        <IssueDetailLayout detail={detail} billingEnabled={billingEnabled} />
      </DialogContent>
    </Dialog>
  );
}
