/**
 * GanttSidebar - Left sidebar showing issue list
 */

import { Flex, FlexItem } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { Typography } from "@/components/ui/Typography";
import type { IssueType } from "@/lib/issue-utils";
import { ISSUE_TYPE_ICONS } from "@/lib/issue-utils";
import type { EnrichedIssue } from "../../../convex/lib/issueHelpers";

interface GanttSidebarProps {
  issues: EnrichedIssue[];
  rowHeight: number;
  width: number;
}

export function GanttSidebar({ issues, rowHeight, width }: GanttSidebarProps) {
  return (
    <FlexItem shrink={false} className="border-r border-ui-border bg-ui-bg-soft" style={{ width }}>
      {/* Header */}
      <Flex
        align="center"
        className="sticky top-0 z-10 bg-ui-bg-soft border-b border-ui-border px-3"
        style={{ height: rowHeight }}
      >
        <Typography variant="label" color="secondary">
          Issues
        </Typography>
      </Flex>

      {/* Issue rows */}
      {issues.map((issue) => (
        <Flex
          key={issue._id}
          align="center"
          gap="sm"
          className="px-3 border-b border-ui-border/50 hover:bg-ui-bg-hover"
          style={{ height: rowHeight }}
        >
          <Icon icon={ISSUE_TYPE_ICONS[issue.type as IssueType]} size="sm" className="shrink-0" />
          <Typography variant="inlineCode" className="shrink-0 text-xs">
            {issue.key}
          </Typography>
          <Typography variant="small" className="truncate">
            {issue.title}
          </Typography>
        </Flex>
      ))}

      {/* Empty state */}
      {issues.length === 0 && (
        <Flex align="center" justify="center" className="h-32">
          <Typography variant="small" color="tertiary">
            No issues with dates
          </Typography>
        </Flex>
      )}
    </FlexItem>
  );
}
