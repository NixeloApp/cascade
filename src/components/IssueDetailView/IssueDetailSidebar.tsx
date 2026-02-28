import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { IssuePriority, IssueTypeWithSubtask } from "@convex/validators";
import { useMutation, useQuery } from "convex/react";
import type { ReactNode } from "react";
import { FileAttachments } from "@/components/FileAttachments";
import { IssueDependencies } from "@/components/IssueDependencies";
import { IssueMetadataSection } from "@/components/IssueDetail/IssueMetadataSection";
import { IssueWatchers } from "@/components/IssueWatchers";
import { TimeTracker } from "@/components/TimeTracker";
import { Card } from "@/components/ui/Card";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { showError } from "@/lib/toast";
import type { LabelInfo } from "../../../convex/lib/issueHelpers";

interface IssueDetailSidebarProps {
  issueId: Id<"issues">;
  projectId: Id<"projects">;
  status: string;
  type: string;
  priority: IssuePriority;
  assignee?: { _id: string; name: string; image?: string } | null;
  reporter?: { _id: string; name: string; image?: string } | null;
  storyPoints?: number;
  labels: LabelInfo[];
  estimatedHours?: number;
  billingEnabled: boolean;
  /** Whether the user can edit the issue */
  canEdit?: boolean;
}

function SidebarSection({ title, children }: { title: string; children: ReactNode }): ReactNode {
  return (
    <section className="pb-6 border-b border-ui-border/30 last:border-b-0 last:pb-0">
      <Stack gap="md">
        <Typography variant="caption" color="tertiary" className="uppercase tracking-widest">
          {title}
        </Typography>
        {children}
      </Stack>
    </section>
  );
}

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
  const project = useQuery(api.projects.getProject, { id: projectId });

  // Mutations for inline updates
  const updateIssue = useMutation(api.issues.update);
  const updateStatus = useMutation(api.issues.updateStatus);

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
    <Card
      padding="lg"
      radius="none"
      variant="ghost"
      className="w-full md:w-80 lg:w-96 bg-ui-bg-soft"
    >
      <Stack gap="xl">
        <SidebarSection title="Properties">
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

        <SidebarSection title="Time Tracking">
          <TimeTracker
            issueId={issueId}
            projectId={projectId}
            estimatedHours={estimatedHours}
            billingEnabled={billingEnabled}
          />
        </SidebarSection>

        <SidebarSection title="Attachments">
          <FileAttachments issueId={issueId} />
        </SidebarSection>

        <SidebarSection title="Watchers">
          <IssueWatchers issueId={issueId} />
        </SidebarSection>
        <SidebarSection title="Dependencies">
          <IssueDependencies issueId={issueId} projectId={projectId} />
        </SidebarSection>
      </Stack>
    </Card>
  );
}
