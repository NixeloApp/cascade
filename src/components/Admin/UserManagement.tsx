import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { useOrganization } from "@/hooks/useOrgContext";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Flex } from "../ui/Flex";
import { Input } from "../ui/form";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
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
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <Flex align="center">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || user.email || "User"}
              className="h-8 w-8 rounded-full mr-3"
            />
          ) : (
            <Flex
              align="center"
              justify="center"
              className="h-8 w-8 rounded-full bg-brand-600 text-white font-semibold mr-3"
            >
              {(user.name || user.email || "?")[0].toUpperCase()}
            </Flex>
          )}
          <div className="text-sm font-medium text-ui-text-primary">{user.name || "Anonymous"}</div>
        </Flex>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-ui-text-secondary">
        {user.email || "No email"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        {user.isAnonymous ? (
          <span className="px-2 py-1 rounded text-xs font-medium bg-ui-bg-tertiary text-ui-text-secondary">
            Anonymous
          </span>
        ) : user.emailVerificationTime ? (
          <span className="px-2 py-1 rounded text-xs font-medium bg-status-success-bg text-status-success">
            Verified
          </span>
        ) : (
          <span className="px-2 py-1 rounded text-xs font-medium bg-status-warning-bg text-status-warning">
            Unverified
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-ui-text-secondary">
        {user.projectsCreated}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-ui-text-secondary">
        {user.projectMemberships}
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
  const invites = useQuery(api.invites.listInvites, {});
  const users = useQuery(api.invites.listUsers, {});

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
      pending:
        "bg-status-warning-bg dark:bg-status-warning-dark text-status-warning dark:text-status-warning-dark",
      accepted:
        "bg-status-success-bg dark:bg-status-success-dark text-status-success dark:text-status-success-dark",
      revoked:
        "bg-status-error-bg dark:bg-status-error-dark text-status-error dark:text-status-error-dark",
      expired:
        "bg-ui-bg-tertiary dark:bg-ui-bg-tertiary-dark text-ui-text-secondary dark:text-ui-text-secondary-dark",
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  return (
    <Flex direction="column" gap="xl">
      {/* Header */}
      <Flex justify="between" align="center">
        <div>
          <Typography variant="h2" className="text-2xl font-bold text-ui-text-primary">
            User Management
          </Typography>
          <Typography variant="p" className="text-ui-text-secondary mt-1">
            Manage user invitations and platform access
          </Typography>
        </div>
        {activeTab === "invites" && (
          <Button onClick={() => setShowInviteForm(true)}>Invite User</Button>
        )}
      </Flex>

      {/* Tabs */}
      <div className="border-b border-ui-border-primary">
        <nav className="-mb-px flex space-x-8" aria-label="User management tabs">
          <button
            type="button"
            onClick={() => setActiveTab("invites")}
            className={cn(
              "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
              activeTab === "invites"
                ? "border-brand-500 text-brand-600 dark:text-brand-400"
                : "border-transparent text-ui-text-secondary dark:text-ui-text-secondary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark hover:border-ui-border-secondary dark:hover:border-ui-border-secondary-dark",
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
                ? "border-brand-500 text-brand-600 dark:text-brand-400"
                : "border-transparent text-ui-text-secondary dark:text-ui-text-secondary-dark hover:text-ui-text-primary dark:hover:text-ui-text-primary-dark hover:border-ui-border-secondary dark:hover:border-ui-border-secondary-dark",
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
              <Flex direction="column" gap="lg">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-ui-text-primary mb-2"
                  >
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-ui-text-primary mb-2"
                  >
                    Role
                  </label>
                  <Select
                    value={role}
                    onValueChange={(value) => setRole(value as "user" | "superAdmin")}
                  >
                    <SelectTrigger className="w-full px-3 py-2 border border-ui-border-primary rounded-md bg-ui-bg-primary text-ui-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="superAdmin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Typography variant="p" className="mt-1 text-sm text-ui-text-secondary">
                    Super Admins have full system access and can manage all users
                  </Typography>
                </div>

                <Flex gap="md">
                  <Button type="submit" isLoading={isSubmitting}>
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
              </Flex>
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
                icon="✉️"
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
                  className="min-w-full divide-y divide-ui-border-primary dark:divide-ui-border-primary-dark"
                  aria-label="User invitations"
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
                  <tbody className="bg-ui-bg-primary divide-y divide-ui-border-primary dark:divide-ui-border-primary-dark">
                    {invites.map(
                      (
                        invite: Doc<"invites"> & { acceptedByName?: string; inviterName?: string },
                      ) => (
                        <tr key={invite._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-ui-text-primary">
                            {invite.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className="px-2 py-1 rounded text-xs font-medium bg-brand-100 dark:bg-brand-900 text-brand-800 dark:text-brand-200 capitalize">
                              {invite.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={cn(
                                "px-2 py-1 rounded text-xs font-medium capitalize",
                                getStatusBadge(invite.status),
                              )}
                            >
                              {invite.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-ui-text-secondary">
                            {invite.inviterName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-ui-text-secondary">
                            {formatDate(invite.createdAt)}
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
                                    className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
                                    aria-label="Resend invitation"
                                  >
                                    Resend
                                  </Button>
                                  <Button
                                    onClick={() => handleRevokeInvite(invite._id)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-status-error hover:text-status-error dark:hover:text-status-error"
                                    aria-label="Revoke invitation"
                                  >
                                    Revoke
                                  </Button>
                                </>
                              )}
                              {invite.status === "accepted" && invite.acceptedByName && (
                                <span className="text-ui-text-secondary text-xs">
                                  Accepted by {invite.acceptedByName}
                                </span>
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
              <EmptyState icon="👥" title="No users" description="No users have joined yet" />
            ) : (
              <div className="overflow-x-auto">
                <table
                  className="min-w-full divide-y divide-ui-border-primary dark:divide-ui-border-primary-dark"
                  aria-label="Platform users"
                >
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
                  <tbody className="bg-ui-bg-primary divide-y divide-ui-border-primary dark:divide-ui-border-primary-dark">
                    {users.map(
                      (
                        user: Doc<"users"> & {
                          projectsCreated: number;
                          projectMemberships: number;
                        },
                      ) => (
                        <UserRow key={user._id} user={user} />
                      ),
                    )}
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
