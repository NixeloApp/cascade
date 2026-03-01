import type { ReactNode } from "react";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { IssueDetailContent } from "./IssueDetailContent";
import { IssueDetailSidebar } from "./IssueDetailSidebar";
import type { useIssueDetail } from "./useIssueDetail";

interface IssueDetailLayoutProps {
  detail: ReturnType<typeof useIssueDetail>;
  billingEnabled: boolean;
  header?: ReactNode;
  /** Whether the user can edit the issue (passed to sidebar for inline editing) */
  canEdit?: boolean;
}

export function IssueDetailLayout({
  detail,
  billingEnabled,
  header,
  canEdit = true,
}: IssueDetailLayoutProps): ReactNode {
  const { issue, subtasks } = detail;

  if (!issue) return null;

  return (
    <Flex direction="column" className="h-full bg-ui-bg">
      {header}

      <FlexItem flex="1" className="overflow-auto">
        <Flex
          direction="column"
          className="max-w-400 mx-auto md:flex-row bg-ui-bg-elevated border border-ui-border rounded-lg shadow-card m-4"
        >
          <IssueDetailContent
            issueId={issue._id}
            projectId={issue.projectId}
            issueTitle={issue.title}
            issueDescription={issue.description}
            issueType={issue.type}
            subtasks={subtasks}
            isEditing={detail.isEditing}
            editTitle={detail.title}
            editDescription={detail.description}
            onTitleChange={detail.setTitle}
            onDescriptionChange={detail.setDescription}
            onSave={detail.handleSave}
            onCancel={detail.handleCancelEdit}
          />

          <IssueDetailSidebar
            issueId={issue._id}
            projectId={issue.projectId}
            status={issue.status}
            type={issue.type}
            priority={issue.priority}
            assignee={issue.assignee}
            reporter={issue.reporter}
            storyPoints={issue.storyPoints}
            labels={issue.labels}
            estimatedHours={issue.estimatedHours}
            billingEnabled={billingEnabled}
            canEdit={canEdit}
          />
        </Flex>
      </FlexItem>
    </Flex>
  );
}
