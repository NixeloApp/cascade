/**
 * User Management
 *
 * Admin panel for organization user management.
 * Lists all users with role editing, removal, and invitation capabilities.
 * Supports bulk actions and user search/filtering.
 */

import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { Mail, Users } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { PageControlsGroup, PageControlsRow, SectionControls } from "../layout";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardBody } from "../ui/Card";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Dialog } from "../ui/Dialog";
import { EmptyState } from "../ui/EmptyState";
import { Flex } from "../ui/Flex";
import { Input } from "../ui/form";
import { Label } from "../ui/Label";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { SegmentedControl, SegmentedControlItem } from "../ui/SegmentedControl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import { Stack } from "../ui/Stack";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/Table";
import { Typography } from "../ui/Typography";

type UserManagementTab = "invites" | "users";

function isUserManagementTab(value: string): value is UserManagementTab {
  return value === "invites" || value === "users";
}

/**
 * User row component for displaying user information in table
 */
function UserRow({
  user,
}: {
  user: Doc<"users"> & { projectsCreated: number; projectMemberships: number };
}) {
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap">
        <Flex align="center" gap="md">
          <Avatar src={user.image} name={user.name} email={user.email} size="sm" />
          <Typography variant="label">{user.name || "Anonymous"}</Typography>
        </Flex>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Typography variant="small" color="secondary">
          {user.email || "No email"}
        </Typography>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {user.isAnonymous ? (
          <Badge variant="neutral" size="sm">
            Anonymous
          </Badge>
        ) : user.emailVerificationTime ? (
          <Badge variant="success" size="sm">
            Verified
          </Badge>
        ) : (
          <Badge variant="warning" size="sm">
            Unverified
          </Badge>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Typography variant="small" color="secondary">
          {user.projectsCreated}
        </Typography>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Typography variant="small" color="secondary">
          {user.projectMemberships}
        </Typography>
      </TableCell>
    </TableRow>
  );
}

function InviteFormDialog({
  email,
  role,
  isOpen,
  isSubmitting,
  onEmailChange,
  onRoleChange,
  onOpenChange,
  onSubmit,
}: {
  email: string;
  role: "user" | "superAdmin";
  isOpen: boolean;
  isSubmitting: boolean;
  onEmailChange: (value: string) => void;
  onRoleChange: (value: "user" | "superAdmin") => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: React.FormEvent) => Promise<void>;
}) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
      title="Send Invitation"
      description="Invite a new user to join the platform."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="invite-form"
            isLoading={isSubmitting}
            disabled={!email.trim()}
            data-testid={TEST_IDS.INVITE.SEND_BUTTON}
          >
            Send Invitation
          </Button>
        </>
      }
    >
      <form id="invite-form" onSubmit={(event) => void onSubmit(event)}>
        <Stack gap="lg">
          <Stack gap="sm">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="user@example.com"
              required
              autoFocus
              data-testid={TEST_IDS.INVITE.EMAIL_INPUT}
            />
          </Stack>

          <Stack gap="sm">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={(value) => onRoleChange(value as "user" | "superAdmin")}
            >
              <SelectTrigger data-testid={TEST_IDS.INVITE.ROLE_SELECT}>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="superAdmin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
            <Typography variant="caption">
              Super Admins have full system access and can manage all users.
            </Typography>
          </Stack>
        </Stack>
      </form>
    </Dialog>
  );
}

function UserManagementControls({
  activeTab,
  onTabChange,
  onInviteClick,
}: {
  activeTab: UserManagementTab;
  onTabChange: (value: UserManagementTab) => void;
  onInviteClick: () => void;
}) {
  return (
    <SectionControls>
      <PageControlsRow>
        <SegmentedControl
          value={activeTab}
          onValueChange={(value) => {
            if (isUserManagementTab(value)) {
              onTabChange(value);
            }
          }}
          size="sm"
          aria-label="User management sections"
        >
          <SegmentedControlItem value="invites">Invitations</SegmentedControlItem>
          <SegmentedControlItem value="users" data-testid={TEST_IDS.SETTINGS.ADMIN_USERS_TAB}>
            Users
          </SegmentedControlItem>
        </SegmentedControl>

        {activeTab === "invites" ? (
          <PageControlsGroup className="sm:justify-end">
            <Button onClick={onInviteClick} data-testid={TEST_IDS.SETTINGS.INVITE_BUTTON}>
              Invite User
            </Button>
          </PageControlsGroup>
        ) : null}
      </PageControlsRow>
    </SectionControls>
  );
}

function InvitationsPanel({
  invites,
  onInviteClick,
  onResendInvite,
  onRevokeInvite,
  formatDate,
  getStatusBadgeVariant,
}: {
  invites: (Doc<"invites"> & { acceptedByName?: string; inviterName?: string })[] | undefined;
  onInviteClick: () => void;
  onResendInvite: (inviteId: Id<"invites">) => void;
  onRevokeInvite: (inviteId: Id<"invites">) => void;
  formatDate: (timestamp: number) => string;
  getStatusBadgeVariant: (status: string) => React.ComponentProps<typeof Badge>["variant"];
}) {
  return (
    <Card>
      <CardBody>
        {!invites ? (
          <Flex justify="center" align="center" className="min-h-content-block">
            <LoadingSpinner />
          </Flex>
        ) : invites.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="No invitations"
            description="Send your first invitation to get started"
            action={{
              label: "Invite User",
              onClick: onInviteClick,
            }}
          />
        ) : (
          <Table aria-label="User invitations" data-testid={TEST_IDS.INVITE.TABLE}>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Email</TableHead>
                <TableHead className="whitespace-nowrap">Role</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="whitespace-nowrap">Invited By</TableHead>
                <TableHead className="whitespace-nowrap">Sent</TableHead>
                <TableHead className="whitespace-nowrap">Expires</TableHead>
                <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((invite) => (
                <TableRow key={invite._id} data-testid={TEST_IDS.INVITE.ROW}>
                  <TableCell className="whitespace-nowrap">
                    <Typography variant="small">{invite.email}</Typography>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge size="sm" variant="brand" className="capitalize">
                      {invite.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge
                      size="sm"
                      variant={getStatusBadgeVariant(invite.status)}
                      className="capitalize"
                    >
                      {invite.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Typography variant="small" color="secondary">
                      {invite.inviterName}
                    </Typography>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Typography variant="small" color="secondary">
                      {formatDate(invite._creationTime)}
                    </Typography>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Typography variant="small" color="secondary">
                      {invite.status === "pending" ? formatDate(invite.expiresAt) : "-"}
                    </Typography>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <Flex justify="end" gap="sm">
                      {invite.status === "pending" ? (
                        <>
                          <Button
                            onClick={() => onResendInvite(invite._id)}
                            variant="link"
                            size="sm"
                            aria-label="Resend invitation"
                          >
                            Resend
                          </Button>
                          <Button
                            onClick={() => onRevokeInvite(invite._id)}
                            variant="ghostDanger"
                            size="sm"
                            aria-label="Revoke invitation"
                          >
                            Revoke
                          </Button>
                        </>
                      ) : null}
                      {invite.status === "accepted" && invite.acceptedByName ? (
                        <Typography variant="caption" color="secondary">
                          Accepted by {invite.acceptedByName}
                        </Typography>
                      ) : null}
                    </Flex>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardBody>
    </Card>
  );
}

function UsersPanel({
  users,
}: {
  users:
    | (Doc<"users"> & {
        projectsCreated: number;
        projectMemberships: number;
      })[]
    | undefined;
}) {
  return (
    <Card>
      <CardBody>
        {!users ? (
          <Flex justify="center" align="center" className="min-h-content-block">
            <LoadingSpinner />
          </Flex>
        ) : users.length === 0 ? (
          <EmptyState icon={Users} title="No users" description="No users have joined yet" />
        ) : (
          <Table aria-label="Platform users">
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">User</TableHead>
                <TableHead className="whitespace-nowrap">Email</TableHead>
                <TableHead className="whitespace-nowrap">Type</TableHead>
                <TableHead className="whitespace-nowrap">Workspaces Created</TableHead>
                <TableHead className="whitespace-nowrap">Project Memberships</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <UserRow key={user._id} user={user} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardBody>
    </Card>
  );
}

export function UserManagement() {
  const { organizationId } = useOrganization();
  const [activeTab, setActiveTab] = useState<UserManagementTab>("invites");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"user" | "superAdmin">("user");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false);
  const [pendingRevokeId, setPendingRevokeId] = useState<Id<"invites"> | null>(null);

  // Queries
  // Queries
  const invites = useAuthenticatedQuery(
    api.invites.listInvites,
    organizationId ? { organizationId } : "skip",
  );
  const users = useAuthenticatedQuery(
    api.invites.listUsers,
    organizationId ? { organizationId } : "skip",
  );

  // Mutations
  const { mutate: sendInvite } = useAuthenticatedMutation(api.invites.sendInvite);
  const { mutate: revokeInvite } = useAuthenticatedMutation(api.invites.revokeInvite);
  const { mutate: resendInvite } = useAuthenticatedMutation(api.invites.resendInvite);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      await sendInvite({ email: email.trim(), role, organizationId });
      showSuccess(`Invitation sent to ${email}`);
      setEmail("");
      setRole("user");
      setShowInviteForm(false);
    } catch (error) {
      showError(error, "Failed to send invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeClick = (inviteId: Id<"invites">) => {
    setPendingRevokeId(inviteId);
    setRevokeConfirmOpen(true);
  };

  const handleRevokeConfirm = async () => {
    if (!pendingRevokeId) return;
    try {
      await revokeInvite({ inviteId: pendingRevokeId });
      showSuccess("Invitation revoked");
    } catch (error) {
      showError(error, "Failed to revoke invitation");
    } finally {
      setPendingRevokeId(null);
    }
  };

  const handleResendInvite = async (inviteId: Id<"invites">) => {
    try {
      await resendInvite({ inviteId });
      showSuccess("Invitation resent successfully");
    } catch (error) {
      showError(error, "Failed to resend invitation");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeVariant = (status: string): React.ComponentProps<typeof Badge>["variant"] => {
    const badges = {
      pending: "warning",
      accepted: "success",
      revoked: "error",
      expired: "neutral",
    } as const;
    return badges[status as keyof typeof badges] || badges.pending;
  };

  return (
    <Stack gap="lg" data-testid={TEST_IDS.SETTINGS.USER_MANAGEMENT_SECTION}>
      <Stack gap="xs">
        <Stack gap="xs">
          <Typography variant="h3">User Management</Typography>
          <Typography variant="p" color="secondary">
            Manage user invitations and platform access
          </Typography>
        </Stack>
      </Stack>

      <UserManagementControls
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onInviteClick={() => setShowInviteForm(true)}
      />

      <InviteFormDialog
        email={email}
        role={role}
        isOpen={showInviteForm}
        isSubmitting={isSubmitting}
        onEmailChange={setEmail}
        onRoleChange={setRole}
        onOpenChange={(open) => {
          setShowInviteForm(open);
          if (!open) {
            setEmail("");
            setRole("user");
          }
        }}
        onSubmit={handleSendInvite}
      />

      {activeTab === "invites" ? (
        <InvitationsPanel
          invites={invites}
          onInviteClick={() => setShowInviteForm(true)}
          onResendInvite={(inviteId) => void handleResendInvite(inviteId)}
          onRevokeInvite={handleRevokeClick}
          formatDate={formatDate}
          getStatusBadgeVariant={getStatusBadgeVariant}
        />
      ) : (
        <UsersPanel users={users} />
      )}

      <ConfirmDialog
        isOpen={revokeConfirmOpen}
        onClose={() => setRevokeConfirmOpen(false)}
        onConfirm={handleRevokeConfirm}
        title="Revoke Invitation"
        message="Are you sure you want to revoke this invitation?"
        variant="danger"
        confirmLabel="Revoke"
      />
    </Stack>
  );
}
