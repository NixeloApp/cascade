/**
 * Issue Detail Sidebar
 *
 * Right sidebar for issue detail view with metadata editing.
 * Includes time tracking, attachments, watchers, and dependencies.
 * Supports inline property updates with error handling.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { LabelInfo } from "@convex/lib/issueHelpers";
import type { IssuePriority, IssueTypeWithSubtask } from "@convex/validators";
import type { ReactNode } from "react";
import { FileAttachments } from "@/components/FileAttachments";
import { IssueDependencies } from "@/components/IssueDependencies";
import { IssueMetadataSection } from "@/components/IssueDetail/IssueMetadataSection";
import { IssueWatchers } from "@/components/IssueWatchers";
import { TimeTracker } from "@/components/TimeTracker";
import { Card } from "@/components/ui/Card";
import { FlexItem } from "@/components/ui/Flex";
import { Stack } from "@/components/ui/Stack";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import type { UserSummary, UserSummaryWithOutOfOffice } from "@/lib/entitySummaries";
import { showError } from "@/lib/toast";
import { IssueDetailSection } from "./IssueDetailSection";

interface IssueDetailSidebarProps {
  issueId: Id<"issues">;
  projectId: Id<"projects">;
  status: string;
  type: IssueTypeWithSubtask;
  priority: IssuePriority;
  assignee?: UserSummaryWithOutOfOffice | null;
  reporter?: UserSummary | null;
  storyPoints?: number;
  labels: LabelInfo[];
  estimatedHours?: number;
  billingEnabled: boolean;
  /** Whether the user can edit the issue */
  canEdit?: boolean;
}

function SidebarSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}): ReactNode {
  return (
    <IssueDetailSection title={title} description={description} compact>
      {children}
    </IssueDetailSection>
  );
}

/** Sidebar with issue metadata fields (status, assignee, priority, labels, etc.). */
export function IssueDetailSidebar({
  issueId,
  projectId,
  status,
  type,
  priority,
  assignee,
  reporter,
  storyPoints,
  labels,
  estimatedHours,
  billingEnabled,
  canEdit = true,
}: IssueDetailSidebarProps): ReactNode {
  // Fetch project for members and workflow states
  const project = useAuthenticatedQuery(api.projects.getProject, { id: projectId });

  // Mutations for inline updates
  const { mutate: updateIssue } = useAuthenticatedMutation(api.issues.update);
  const { mutate: updateStatus } = useAuthenticatedMutation(api.issues.updateStatus);

  // Extract project data for inline editing
  const members = project?.members ?? [];
  const workflowStates = project?.workflowStates ?? [];

  // Handler for status changes (uses different mutation)
  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus({ issueId, newStatus, newOrder: 0 });
    } catch (error) {
      showError(error, "Failed to update status");
    }
  };

  // Handler for other property changes
  const handleTypeChange = async (newType: IssueTypeWithSubtask) => {
    try {
      await updateIssue({ issueId, type: newType });
    } catch (error) {
      showError(error, "Failed to update type");
    }
  };

  const handlePriorityChange = async (newPriority: IssuePriority) => {
    try {
      await updateIssue({ issueId, priority: newPriority });
    } catch (error) {
      showError(error, "Failed to update priority");
    }
  };

  const handleAssigneeChange = async (newAssigneeId: Id<"users"> | null) => {
    try {
      await updateIssue({ issueId, assigneeId: newAssigneeId });
    } catch (error) {
      showError(error, "Failed to update assignee");
    }
  };

  const handleStoryPointsChange = async (newStoryPoints: number | null) => {
    try {
      await updateIssue({ issueId, storyPoints: newStoryPoints });
    } catch (error) {
      showError(error, "Failed to update story points");
    }
  };

  return (
    <FlexItem shrink={false} className="w-full md:w-80 lg:w-96">
      <Card padding="lg">
        <Stack gap="xl">
          <SidebarSection
            title="Properties"
            description="Status, ownership, and planning fields stay together here."
          >
            <IssueMetadataSection
              status={status}
              type={type}
              priority={priority}
              assignee={assignee}
              reporter={reporter}
              storyPoints={storyPoints}
              labels={labels}
              editable={canEdit && !!project}
              members={members}
              workflowStates={workflowStates}
              onStatusChange={handleStatusChange}
              onTypeChange={handleTypeChange}
              onPriorityChange={handlePriorityChange}
              onAssigneeChange={handleAssigneeChange}
              onStoryPointsChange={handleStoryPointsChange}
            />
          </SidebarSection>

          <SidebarSection
            title="Time Tracking"
            description="Log work against the issue and compare it with the estimate."
          >
            <TimeTracker
              issueId={issueId}
              projectId={projectId}
              estimatedHours={estimatedHours}
              billingEnabled={billingEnabled}
            />
          </SidebarSection>

          <SidebarSection
            title="Attachments"
            description="Keep reference files and supporting material with the work item."
          >
            <FileAttachments issueId={issueId} />
          </SidebarSection>

          <SidebarSection
            title="Watchers"
            description="Followers will be notified as the issue changes."
          >
            <IssueWatchers issueId={issueId} />
          </SidebarSection>
          <SidebarSection
            title="Dependencies"
            description="Track the linked issues that block or depend on this work."
          >
            <IssueDependencies issueId={issueId} />
          </SidebarSection>
        </Stack>
      </Card>
    </FlexItem>
  );
}
