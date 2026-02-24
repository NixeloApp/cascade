import type { IssueTypeWithSubtask } from "@convex/validators";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { IconButton } from "@/components/ui/IconButton";
import { Tooltip } from "@/components/ui/Tooltip";
import { Typography } from "@/components/ui/Typography";
import { Check, Copy } from "@/lib/icons";
import { ISSUE_TYPE_ICONS } from "@/lib/issue-utils";
import { Icon } from "../ui/Icon";

interface IssueDetailHeaderProps {
  issueKey: string;
  issueType: IssueTypeWithSubtask;
  hasCopied: boolean;
  onCopyKey: () => void;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
}

export function IssueDetailHeader({
  issueKey,
  issueType,
  hasCopied,
  onCopyKey,
  breadcrumb,
  actions,
}: IssueDetailHeaderProps): ReactNode {
  return (
    <Card padding="sm" radius="none" variant="ghost" className="border-b border-ui-border px-6">
      <Flex align="center" justify="between">
        <Flex align="center" gap="md">
          {breadcrumb}
          {breadcrumb && (
            <Typography as="span" color="tertiary">
              /
            </Typography>
          )}
          <Flex align="center" gap="sm">
            <Icon icon={ISSUE_TYPE_ICONS[issueType]} size="md" />
            <Typography variant="inlineCode" color="secondary">
              {issueKey}
            </Typography>
            <Tooltip content={hasCopied ? "Copied!" : "Copy issue key"}>
              <IconButton
                variant="ghost"
                size="xs"
                onClick={onCopyKey}
                aria-label={hasCopied ? "Copied" : "Copy issue key"}
              >
                {hasCopied ? (
                  <Check className="w-3 h-3 text-status-success" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </IconButton>
            </Tooltip>
          </Flex>
        </Flex>
        {actions && (
          <Flex gap="sm" align="center">
            {actions}
          </Flex>
        )}
      </Flex>
    </Card>
  );
}
