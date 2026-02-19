import type { IssueTypeWithSubtask } from "@convex/validators";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
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
              <Button
                variant="ghost"
                size="sm"
                onClick={onCopyKey}
                aria-label={hasCopied ? "Copied" : "Copy issue key"}
                className="h-6 w-6 p-0 transition-colors duration-default hover:bg-ui-bg-hover"
              >
                {hasCopied ? (
                  <Check className="w-3 h-3 text-status-success" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
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
