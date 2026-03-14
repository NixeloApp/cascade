import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
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

/** Layout container for issue detail with content and sidebar sections. */
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
        <Card recipe="issueDetailLayoutShell" className="mx-auto my-4 max-w-400">
          <Flex direction="column" directionMd="row">
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
        </Card>
      </FlexItem>
    </Flex>
  );
}
