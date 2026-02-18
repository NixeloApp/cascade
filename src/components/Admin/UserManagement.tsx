import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { useOrganization } from "@/hooks/useOrgContext";
import { Mail, Users } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Flex } from "../ui/Flex";
import { Input } from "../ui/form";
import { Label } from "../ui/Label";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import { Stack } from "../ui/Stack";
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
    <tr className="transition-default hover:bg-ui-bg-hover">
      <td className="px-6 py-4 whitespace-nowrap">
        <Flex align="center" gap="md">
          <Avatar src={user.image} name={user.name} email={user.email} size="sm" />
          <Typography variant="label">{user.name || "Anonymous"}</Typography>
        </Flex>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Typography variant="small" color="secondary">
          {user.email || "No email"}
        </Typography>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
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
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Typography variant="small" color="secondary">
          {user.projectsCreated}
        </Typography>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Typography variant="small" color="secondary">
          {user.projectMemberships}
        </Typography>
      </td>
    </tr>
  );
}

export function UserManagement() {
  const { organizationId } = useOrganization();
  const [activeTab, setActiveTab] = useState<"invites" | "users">("invites");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"user" | "superAdmin">("user");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  // Queries
  const invites = useQuery(api.invites.listInvites, organizationId ? { organizationId } : "skip");
  const users = useQuery(api.invites.listUsers, organizationId ? { organizationId } : "skip");

  // Mutations
  const sendInvite = useMutation(api.invites.sendInvite);
  const revokeInvite = useMutation(api.invites.revokeInvite);
  const resendInvite = useMutation(api.invites.resendInvite);

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

  const handleRevokeInvite = async (inviteId: Id<"invites">) => {
    if (!confirm("Are you sure you want to revoke this invitation?")) return;

    try {
      await revokeInvite({ inviteId });
      showSuccess("Invitation revoked");
    } catch (error) {
      showError(error, "Failed to revoke invitation");
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

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: "bg-status-warning-bg text-status-warning",
      accepted: "bg-status-success-bg text-status-success",
      revoked: "bg-status-error-bg text-status-error",
      expired: "bg-ui-bg-tertiary text-ui-text-secondary",
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  return (
    <Flex direction="column" gap="xl">
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
      <div className="border-b border-ui-border">
        <nav className="-mb-px flex space-x-8" aria-label="User management tabs">
          <button
            type="button"
            onClick={() => setActiveTab("invites")}
            className={cn(
              "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
              activeTab === "invites"
                ? "border-brand-ring text-brand"
                : "border-transparent text-ui-text-secondary hover:text-ui-text hover:border-ui-border-secondary",
            )}
          >
            Invitations
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={cn(
              "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
              activeTab === "users"
                ? "border-brand-ring text-brand"
                : "border-transparent text-ui-text-secondary hover:text-ui-text hover:border-ui-border-secondary",
            )}
          >
            Users
          </button>
        </nav>
      </div>

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
              <Flex justify="center" className="py-8">
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
              <div className="overflow-x-auto">
                <table
                  className="min-w-full divide-y divide-ui-border"
                  aria-label="User invitations"
                  data-testid={TEST_IDS.INVITE.TABLE}
                >
                  <thead className="bg-ui-bg-secondary">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-ui-text-secondary uppercase tracking-wider"
                      >
                        Email
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-ui-text-secondary uppercase tracking-wider"
                      >
                        Role
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-ui-text-secondary uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-ui-text-secondary uppercase tracking-wider"
                      >
                        Invited By
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-ui-text-secondary uppercase tracking-wider"
                      >
                        Sent
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-ui-text-secondary uppercase tracking-wider"
                      >
                        Expires
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-ui-text-secondary uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-ui-bg divide-y divide-ui-border">
                    {invites.map(
                      (
                        invite: Doc<"invites"> & { acceptedByName?: string; inviterName?: string },
                      ) => (
                        <tr key={invite._id} data-testid={TEST_IDS.INVITE.ROW}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-ui-text">
                            {invite.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Badge
                              size="sm"
                              className="capitalize bg-brand-subtle text-brand-active"
                            >
                              {invite.role}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Badge
                              size="sm"
                              className={cn("capitalize", getStatusBadge(invite.status))}
                            >
                              {invite.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-ui-text-secondary">
                            {invite.inviterName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-ui-text-secondary">
                            {formatDate(invite._creationTime)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-ui-text-secondary">
                            {invite.status === "pending" ? formatDate(invite.expiresAt) : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Flex justify="end" gap="sm">
                              {invite.status === "pending" && (
                                <>
                                  <Button
                                    onClick={() => handleResendInvite(invite._id)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-brand hover:text-brand-hover"
                                    aria-label="Resend invitation"
                                  >
                                    Resend
                                  </Button>
                                  <Button
                                    onClick={() => handleRevokeInvite(invite._id)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-status-error hover:bg-status-error-bg"
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
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {activeTab === "users" && (
        <Card>
          <CardBody>
            {!users ? (
              <Flex justify="center" className="py-8">
                <LoadingSpinner />
              </Flex>
            ) : users.length === 0 ? (
              <EmptyState icon={Users} title="No users" description="No users have joined yet" />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-ui-border" aria-label="Platform users">
                  <thead className="bg-ui-bg-secondary">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-ui-text-secondary uppercase tracking-wider"
                      >
                        User
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-ui-text-secondary uppercase tracking-wider"
                      >
                        Email
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-ui-text-secondary uppercase tracking-wider"
                      >
                        Type
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-ui-text-secondary uppercase tracking-wider"
                      >
                        Workspaces Created
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-ui-text-secondary uppercase tracking-wider"
                      >
                        Project Memberships
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-ui-bg divide-y divide-ui-border">
                    {users.map((user) => (
                      <UserRow key={user._id} user={user} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </Flex>
  );
}
