import type { Id } from "@convex/_generated/dataModel";
import type { WorkflowState } from "@convex/shared/types";
import { Flex } from "../ui/Flex";
import { Typography } from "../ui/Typography";
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
    <div className="max-w-3xl mx-auto">
      <Flex direction="column" gap="lg">
        <div>
          <Typography variant="h2" className="text-xl font-semibold">
            Project Settings
          </Typography>
          <Typography variant="p" color="secondary" className="mt-1">
            Manage your project configuration and team
          </Typography>
        </div>

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

        <DangerZone
          projectId={projectId}
          projectName={name}
          projectKey={projectKey}
          isOwner={isOwner}
          orgSlug={orgSlug}
        />
      </Flex>
    </div>
  );
}

export { DangerZone } from "./DangerZone";
export { GeneralSettings } from "./GeneralSettings";
export { MemberManagement } from "./MemberManagement";
export { WorkflowSettings } from "./WorkflowSettings";
