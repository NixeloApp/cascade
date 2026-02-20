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
  return (
    <Card padding="lg" className="max-w-3xl mx-auto">
      <CardHeader
        title="Project Settings"
        description="Manage your project configuration and team"
      />
      <CardBody>
        <Stack gap="xl">
          <GeneralSettings
            projectId={projectId}
            name={name}
            projectKey={projectKey}
            description={description}
          />

          <MemberManagement
            projectId={projectId}
            members={members}
            createdBy={createdBy}
            ownerId={ownerId}
          />

          <WorkflowSettings projectId={projectId} workflowStates={workflowStates} />

          {isOwner && (
            <DangerZone
              projectId={projectId}
              projectName={name}
              projectKey={projectKey}
              isOwner={isOwner}
              orgSlug={orgSlug}
            />
          )}
        </Stack>
      </CardBody>
    </Card>
  );
}

export { DangerZone } from "./DangerZone";
export { GeneralSettings } from "./GeneralSettings";
export { MemberManagement } from "./MemberManagement";
export { WorkflowSettings } from "./WorkflowSettings";
