import type { Id } from "@convex/_generated/dataModel";
import type { WorkflowState } from "@convex/shared/types";
import { Container } from "../ui/Container";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";
import { DangerZone } from "./DangerZone";
import { GeneralSettings } from "./GeneralSettings";
import { IntakeSettings } from "./IntakeSettings";
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
    <IntakeSettings key="intake" projectId={projectId} />,
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
    <Container size="sm" padding="none">
      <Stack gap="lg">
        <Stack gap="xs">
          <Typography variant="h3">Project Settings</Typography>
          <Typography variant="small" color="secondary">
            Manage your project configuration and team
          </Typography>
        </Stack>

        <Stack gap="lg">{sections}</Stack>
      </Stack>
    </Container>
  );
}

export { DangerZone } from "./DangerZone";
export { GeneralSettings } from "./GeneralSettings";
export { IntakeSettings } from "./IntakeSettings";
export { MemberManagement } from "./MemberManagement";
export { WorkflowSettings } from "./WorkflowSettings";
