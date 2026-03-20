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
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { EmptyState } from "../ui/EmptyState";
import { Flex } from "../ui/Flex";
import { Input } from "../ui/form";
import { Label } from "../ui/Label";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import { Stack } from "../ui/Stack";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/Table";
import { Tabs, TabsList, TabsTrigger } from "../ui/Tabs";
import { Typography } from "../ui/Typography";

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

export function UserManagement() {
  const { organizationId } = useOrganization();
  const [activeTab, setActiveTab] = useState<"invites" | "users">("invites");
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
    <Flex direction="column" gap="xl" data-testid={TEST_IDS.SETTINGS.USER_MANAGEMENT_SECTION}>
      {/* Header */}
      <Flex justify="between" align="center">
        <Stack gap="xs">
          <Typography variant="h3">User Management</Typography>
          <Typography variant="p" color="secondary">
            Manage user invitations and platform access
          </Typography>
        </Stack>
        {activeTab === "invites" && (
          <Button onClick={() => setShowInviteForm(true)}>Invite User</Button>
        )}
      </Flex>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "invites" | "users")}>
        <TabsList variant="underline">
          <TabsTrigger value="invites" variant="underline">
            Invitations
          </TabsTrigger>
          <TabsTrigger value="users" variant="underline">
            Users
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Invite Form Modal */}
      {showInviteForm && (
        <Card>
          <CardHeader
            title="Send Invitation"
            description="Invite a new user to join the platform"
          />
          <CardBody>
            <form onSubmit={handleSendInvite}>
              <Stack gap="lg">
                <Stack gap="sm">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    onValueChange={(value) => setRole(value as "user" | "superAdmin")}
                  >
                    <SelectTrigger className="w-full" data-testid={TEST_IDS.INVITE.ROLE_SELECT}>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="superAdmin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Typography variant="caption">
                    Super Admins have full system access and can manage all users
                  </Typography>
                </Stack>

                <Flex gap="md">
                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    data-testid={TEST_IDS.INVITE.SEND_BUTTON}
                  >
                    Send Invitation
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowInviteForm(false);
                      setEmail("");
                      setRole("user");
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </Flex>
              </Stack>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Content */}
      {activeTab === "invites" && (
        <Card>
          <CardBody>
            {!invites ? (
              <Flex justify="center" align="center" className="min-h-32">
                <LoadingSpinner />
              </Flex>
            ) : invites.length === 0 ? (
              <EmptyState
                icon={Mail}
                title="No invitations"
                description="Send your first invitation to get started"
                action={{
                  label: "Invite User",
                  onClick: () => setShowInviteForm(true),
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
                  {invites.map(
                    (
                      invite: Doc<"invites"> & { acceptedByName?: string; inviterName?: string },
                    ) => (
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
                            {invite.status === "pending" && (
                              <>
                                <Button
                                  onClick={() => handleResendInvite(invite._id)}
                                  variant="link"
                                  size="sm"
                                  aria-label="Resend invitation"
                                >
                                  Resend
                                </Button>
                                <Button
                                  onClick={() => handleRevokeClick(invite._id)}
                                  variant="ghostDanger"
                                  size="sm"
                                  aria-label="Revoke invitation"
                                >
                                  Revoke
                                </Button>
                              </>
                            )}
                            {invite.status === "accepted" && invite.acceptedByName && (
                              <Typography variant="caption" color="secondary">
                                Accepted by {invite.acceptedByName}
                              </Typography>
                            )}
                          </Flex>
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>
      )}

      {activeTab === "users" && (
        <Card>
          <CardBody>
            {!users ? (
              <Flex justify="center" align="center" className="min-h-32">
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
    </Flex>
  );
}
