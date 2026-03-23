import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Flex } from "@/components/ui/Flex";
import { Checkbox, Input, Textarea } from "@/components/ui/form";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { showError, showSuccess } from "@/lib/toast";
import { useTeamLayout } from "./route";

export const Route = createFileRoute(
  "/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug/settings",
)({
  component: TeamSettings,
});

function TeamSettings() {
  const { orgSlug } = useOrganization();
  const { teamId, workspaceSlug } = useTeamLayout();
  const navigate = useNavigate();

  const team = useAuthenticatedQuery(api.teams.getTeam, { teamId });
  const members = useAuthenticatedQuery(api.teams.getTeamMembers, { teamId });

  if (team === undefined) {
    return (
      <Flex align="center" justify="center" className="min-h-content-block">
        <LoadingSpinner />
      </Flex>
    );
  }

  if (!team) {
    return <Typography variant="h3">Team not found</Typography>;
  }

  const isLead = team.userRole === "admin" || team.isAdmin;

  return (
    <Stack gap="xl">
      <GeneralSection
        teamId={team._id}
        name={team.name}
        description={team.description}
        isPrivate={team.isPrivate ?? false}
        canEdit={isLead}
      />
      <MembersSection teamId={team._id} members={members ?? []} canEdit={isLead} />
      {isLead && (
        <DangerSection
          teamId={team._id}
          teamName={team.name}
          orgSlug={orgSlug}
          workspaceSlug={workspaceSlug}
          onDeleted={() =>
            navigate({
              to: ROUTES.workspaces.detail.path,
              params: { orgSlug, workspaceSlug },
            })
          }
        />
      )}
    </Stack>
  );
}

// ── General Settings ──

interface GeneralSectionProps {
  teamId: Id<"teams">;
  name: string;
  description?: string;
  isPrivate: boolean;
  canEdit: boolean;
}

function GeneralSection({ teamId, name, description, isPrivate, canEdit }: GeneralSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editDescription, setEditDescription] = useState(description ?? "");
  const [editPrivate, setEditPrivate] = useState(isPrivate);
  const [isSaving, setIsSaving] = useState(false);

  const { mutate: updateTeam } = useAuthenticatedMutation(api.teams.updateTeam);

  const handleSave = async () => {
    const trimmedName = editName.trim();
    if (!trimmedName) {
      showError("Team name is required");
      return;
    }
    setIsSaving(true);
    try {
      await updateTeam({
        teamId,
        name: trimmedName !== name ? trimmedName : undefined,
        description: editDescription.trim() || undefined,
        isPrivate: editPrivate !== isPrivate ? editPrivate : undefined,
      });
      showSuccess("Team updated");
      setIsEditing(false);
    } catch (error) {
      showError(error, "Failed to update team");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card variant="outline" padding="md" className="sm:p-6">
      <Stack gap="lg">
        <Flex justify="between" align="center">
          <Typography variant="h4">General</Typography>
          {canEdit && !isEditing && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setEditName(name);
                setEditDescription(description ?? "");
                setEditPrivate(isPrivate);
                setIsEditing(true);
              }}
            >
              Edit
            </Button>
          )}
        </Flex>

        {isEditing ? (
          <Stack gap="md">
            <Input
              label="Team Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <Textarea
              label="Description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="What does this team work on?"
              rows={3}
            />
            <Checkbox
              checked={editPrivate}
              onChange={(e) => setEditPrivate(e.target.checked)}
              label="Private team (only members can see this team)"
            />
            <Flex gap="sm">
              <Button onClick={handleSave} isLoading={isSaving} disabled={isSaving}>
                Save Changes
              </Button>
              <Button variant="secondary" onClick={() => setIsEditing(false)} disabled={isSaving}>
                Cancel
              </Button>
            </Flex>
          </Stack>
        ) : (
          <Stack gap="sm">
            <Flex gap="sm" align="center">
              <Typography variant="label">{name}</Typography>
              {isPrivate && (
                <Badge variant="outline" size="sm">
                  Private
                </Badge>
              )}
            </Flex>
            {description && (
              <Typography variant="small" color="secondary">
                {description}
              </Typography>
            )}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}

// ── Members Section ──

interface TeamMember {
  _id: Id<"teamMembers">;
  userId: Id<"users">;
  role: string;
  user?: { name?: string; email?: string; image?: string } | null;
}

interface MembersSectionProps {
  teamId: Id<"teams">;
  members: TeamMember[];
  canEdit: boolean;
}

const TEAM_ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
];

function MembersSection({ teamId, members, canEdit }: MembersSectionProps) {
  const [removingUserId, setRemovingUserId] = useState<Id<"users"> | null>(null);
  const [changingRoleFor, setChangingRoleFor] = useState<Id<"users"> | null>(null);

  const { mutate: updateRole } = useAuthenticatedMutation(api.teams.updateTeamMemberRole);
  const { mutate: removeMember } = useAuthenticatedMutation(api.teams.removeTeamMember);

  const handleRoleChange = async (userId: Id<"users">, newRole: string) => {
    setChangingRoleFor(userId);
    try {
      await updateRole({ teamId, userId, role: newRole as "admin" | "member" });
      showSuccess("Role updated");
    } catch (error) {
      showError(error, "Failed to update role");
    } finally {
      setChangingRoleFor(null);
    }
  };

  const handleRemove = async () => {
    if (!removingUserId) return;
    try {
      await removeMember({ teamId, userId: removingUserId });
      showSuccess("Member removed");
    } catch (error) {
      showError(error, "Failed to remove member");
    } finally {
      setRemovingUserId(null);
    }
  };

  return (
    <Card variant="outline" padding="md" className="sm:p-6">
      <Stack gap="lg">
        <Flex justify="between" align="center">
          <Stack gap="xs">
            <Typography variant="h4">Members</Typography>
            <Typography variant="small" color="secondary">
              {members.length} member{members.length !== 1 ? "s" : ""}
            </Typography>
          </Stack>
        </Flex>

        <Stack gap="sm">
          {members.map((member) => (
            <Card key={member._id} variant="section" padding="sm" className="bg-ui-bg">
              <Flex align="center" justify="between">
                <Flex gap="md" align="center">
                  <Avatar name={member.user?.name} src={member.user?.image} size="sm" />
                  <Stack gap="none">
                    <Typography variant="label">{member.user?.name ?? "Unknown User"}</Typography>
                    <Typography variant="small" color="secondary">
                      {member.user?.email ?? ""}
                    </Typography>
                  </Stack>
                </Flex>
                <Flex gap="sm" align="center">
                  {canEdit ? (
                    <>
                      <Select
                        value={member.role}
                        onValueChange={(value) => handleRoleChange(member.userId, value)}
                        disabled={changingRoleFor === member.userId}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TEAM_ROLE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghostDanger"
                        size="sm"
                        onClick={() => setRemovingUserId(member.userId)}
                      >
                        Remove
                      </Button>
                    </>
                  ) : (
                    <Badge variant="neutral" size="sm">
                      {member.role}
                    </Badge>
                  )}
                </Flex>
              </Flex>
            </Card>
          ))}
          {members.length === 0 && (
            <Typography variant="small" color="tertiary" className="text-center">
              No members yet
            </Typography>
          )}
        </Stack>
      </Stack>

      <ConfirmDialog
        isOpen={!!removingUserId}
        onClose={() => setRemovingUserId(null)}
        onConfirm={handleRemove}
        title="Remove Member"
        message="Remove this member from the team? They will lose access to team resources."
        variant="danger"
        confirmLabel="Remove"
      />
    </Card>
  );
}

// ── Danger Zone ──

interface DangerSectionProps {
  teamId: Id<"teams">;
  teamName: string;
  orgSlug: string;
  workspaceSlug: string;
  onDeleted: () => void;
}

function DangerSection({ teamId, teamName, onDeleted }: DangerSectionProps) {
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { mutate: deleteTeam } = useAuthenticatedMutation(api.teams.softDeleteTeam);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTeam({ teamId });
      showSuccess("Team deleted");
      onDeleted();
    } catch (error) {
      showError(error, "Failed to delete team");
    } finally {
      setIsDeleting(false);
      setShowDelete(false);
    }
  };

  return (
    <Card variant="outline" padding="md" className="sm:p-6 border-status-error/30">
      <Stack gap="lg">
        <Stack gap="xs">
          <Typography variant="h4" color="error">
            Danger Zone
          </Typography>
          <Typography variant="small" color="secondary">
            Irreversible actions that affect the entire team.
          </Typography>
        </Stack>
        <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>
          Delete Team
        </Button>
      </Stack>

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Team"
        message={`Are you sure you want to delete "${teamName}"? This will remove all team members and cannot be undone.`}
        variant="danger"
        confirmLabel={isDeleting ? "Deleting..." : "Delete Team"}
      />
    </Card>
  );
}
