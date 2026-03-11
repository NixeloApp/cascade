import type { Id } from "@convex/_generated/dataModel";
import type { WorkflowState } from "@convex/shared/types";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { Stack } from "../ui/Stack";
import { DangerZone } from "./DangerZone";
import { GeneralSettings } from "./GeneralSettings";
import { MemberManagement } from "./MemberManagement";
import { WorkflowSettings } from "./WorkflowSettings";

interface Member {
  _id: Id<"users">;
  name: string;
  email: string | undefined;
  image: string | undefined;
  role: "admin" | "editor" | "viewer";
  addedAt: number;
}

interface ProjectSettingsProps {
  projectId: Id<"projects">;
  name: string;
  projectKey: string;
  description: string | undefined;
  workflowStates: WorkflowState[];
  members: Member[];
  createdBy: Id<"users">;
  ownerId: Id<"users"> | undefined;
  isOwner: boolean;
  orgSlug: string;
}

export function ProjectSettings({
  projectId,
  name,
  projectKey,
  description,
  workflowStates,
  members,
  createdBy,
  ownerId,
  isOwner,
  orgSlug,
}: ProjectSettingsProps) {
  const sections = [
    <GeneralSettings
      key="general"
      projectId={projectId}
      name={name}
      projectKey={projectKey}
      description={description}
    />,
    <MemberManagement
      key="members"
      projectId={projectId}
      members={members}
      createdBy={createdBy}
      ownerId={ownerId}
    />,
    <WorkflowSettings key="workflow" projectId={projectId} workflowStates={workflowStates} />,
    ...(isOwner
      ? [
          <DangerZone
            key="danger"
            projectId={projectId}
            projectName={name}
            projectKey={projectKey}
            isOwner={isOwner}
            orgSlug={orgSlug}
          />,
        ]
      : []),
  ];

  return (
    <Card
      variant="ghost"
      padding="none"
      className="mx-auto max-w-3xl overflow-hidden sm:border sm:border-ui-border-secondary/85 sm:bg-linear-to-b sm:from-ui-bg sm:via-ui-bg-elevated/98 sm:to-ui-bg-secondary/50 sm:shadow-card"
    >
      <CardHeader
        title="Project Settings"
        description="Manage your project configuration and team"
        className="border-b-0 px-1 py-1 sm:border-b sm:border-ui-border sm:px-6 sm:py-5"
      />
      <CardBody className="p-0 sm:p-6">
        <Stack gap="lg">{sections}</Stack>
      </CardBody>
    </Card>
  );
}

export { DangerZone } from "./DangerZone";
export { GeneralSettings } from "./GeneralSettings";
export { MemberManagement } from "./MemberManagement";
export { WorkflowSettings } from "./WorkflowSettings";
