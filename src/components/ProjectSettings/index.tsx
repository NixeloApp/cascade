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
    <Card variant="outline" padding="none" className="mx-auto max-w-3xl overflow-hidden">
      <CardHeader
        title="Project Settings"
        description="Manage your project configuration and team"
        className="border-ui-border-secondary/85"
      />
      <CardBody>
        <Stack gap="lg">{sections}</Stack>
      </CardBody>
    </Card>
  );
}

export { DangerZone } from "./DangerZone";
export { GeneralSettings } from "./GeneralSettings";
export { MemberManagement } from "./MemberManagement";
export { WorkflowSettings } from "./WorkflowSettings";
