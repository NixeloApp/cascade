/**
 * Invite Token Page
 *
 * Landing page for organization/workspace invite links.
 * Validates invite token and allows users to accept invitations.
 * Handles both authenticated and unauthenticated user flows.
 */

import { api } from "@convex/_generated/api";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { AlertCircle, CheckCircle, Clock, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { AuthRedirect, SignInForm } from "@/components/Auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { IconCircle } from "@/components/ui/IconCircle";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedMutation, usePublicQuery } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
export const Route = createFileRoute("/invite/$token")({
  component: InviteRoute,
  ssr: false, // No SSR needed for invite page
});

interface InviteStateScreenProps {
  actionLabel: string;
  body: ReactNode;
  icon: ReactNode;
  iconVariant: "error" | "warning" | "success";
  onAction: () => void;
  title: string;
}

function InviteStateScreen({
  actionLabel,
  body,
  icon,
  iconVariant,
  onAction,
  title,
}: InviteStateScreenProps) {
  return (
    <Flex align="center" justify="center" className="min-h-screen bg-ui-bg-secondary p-6">
      <div className="max-w-md w-full text-center">
        <IconCircle size="xl" variant={iconVariant} className="mx-auto mb-6">
          {icon}
        </IconCircle>
        <Typography variant="h3" className="mb-3">
          {title}
        </Typography>
        <Typography variant="p" color="secondary" className="mb-6">
          {body}
        </Typography>
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
    </Flex>
  );
}

function InviteRoute() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [inviteAccepted, setInviteAccepted] = useState(false);

  // Get invite details (public endpoint - works for unauthenticated users)
  const invite = usePublicQuery(api.invites.getInviteByToken, { token });
  const { mutate: acceptInvite } = useAuthenticatedMutation(api.invites.acceptInvite);

  const goToHome = () => {
    navigate({ to: ROUTES.home.path });
  };

  const handleAcceptInvite = async () => {
    setIsAccepting(true);
    setAcceptError(null);
    try {
      const result = await acceptInvite({ token });
      const successMessage = result.projectId
        ? "Welcome! You've joined the project."
        : "Welcome! You've joined the team.";
      showSuccess(successMessage);
      // Trigger redirect to user's organization dashboard
      setInviteAccepted(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to accept invite";
      setAcceptError(message);
      showError(error, "Failed to accept invite");
    } finally {
      setIsAccepting(false);
    }
  };

  // After accepting invite, redirect to user's organization dashboard
  // AuthRedirect will query getRedirectDestination and navigate appropriately
  if (inviteAccepted) {
    return <AuthRedirect>{null}</AuthRedirect>;
  }

  // Loading state
  if (invite === undefined) {
    return (
      <Flex align="center" justify="center" className="min-h-screen bg-ui-bg-secondary">
        <div className="text-center">
          <Icon icon={Loader2} size="xl" tone="brand" animation="spin" className="mx-auto mb-4" />
          <Typography className="text-ui-text-secondary">Loading invitation...</Typography>
        </div>
      </Flex>
    );
  }

  // Invalid token
  if (invite === null) {
    return (
      <InviteStateScreen
        actionLabel="Go to Home"
        body="This invitation link is invalid or has been removed. Please contact the person who invited you for a new link."
        icon={<Icon icon={AlertCircle} size="xl" tone="error" />}
        iconVariant="error"
        onAction={goToHome}
        title="Invalid Invitation"
      />
    );
  }

  // Expired invite (isExpired is computed from status === "pending" && expiresAt < now)
  if (invite.isExpired) {
    return (
      <InviteStateScreen
        actionLabel="Go to Home"
        body={
          <>
            This invitation has expired. Please contact{" "}
            <Typography as="strong" variant="strong">
              {invite.inviterName}
            </Typography>{" "}
            to send a new invitation.
          </>
        }
        icon={<Icon icon={Clock} size="xl" className="text-status-warning-text" />}
        iconVariant="warning"
        onAction={goToHome}
        title="Invitation Expired"
      />
    );
  }

  // Already accepted
  if (invite.status === "accepted") {
    return (
      <InviteStateScreen
        actionLabel="Go to Dashboard"
        body="This invitation has already been accepted. You can sign in to access your account."
        icon={<Icon icon={CheckCircle} size="xl" tone="success" />}
        iconVariant="success"
        onAction={goToHome}
        title="Already Accepted"
      />
    );
  }

  // Revoked invite
  if (invite.status === "revoked") {
    return (
      <InviteStateScreen
        actionLabel="Go to Home"
        body="This invitation has been revoked. Please contact the team administrator if you believe this is a mistake."
        icon={<Icon icon={AlertCircle} size="xl" tone="error" />}
        iconVariant="error"
        onAction={goToHome}
        title="Invitation Revoked"
      />
    );
  }

  // Determine if this is a project invite
  const isProjectInvite = !!invite.projectId;

  // Valid pending invite - show different UI based on auth state
  return (
    <Flex direction="column" className="min-h-screen bg-ui-bg-secondary">
      {/* Header */}
      <header className="p-6 flex items-center justify-center">
        <Flex align="center" gap="sm">
          <Flex align="center" justify="center" className="size-8 rounded-lg bg-brand-main">
            <Typography as="span" variant="label" className="text-ui-bg">
              N
            </Typography>
          </Flex>
          <Typography variant="large">Nixelo</Typography>
        </Flex>
      </header>

      {/* Main Content */}
      <FlexItem as="main" flex="1" className="flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          {/* Invitation Card */}
          <Card radius="full" padding="xl" className="mb-6">
            <div className="text-center mb-6">
              <Typography variant="h3" className="mb-2">
                You're Invited!
              </Typography>
              <Typography variant="p" color="secondary">
                <Typography as="strong" variant="strong" className="text-ui-text">
                  {invite.inviterName}
                </Typography>{" "}
                {isProjectInvite ? (
                  <>
                    has invited you to join the project{" "}
                    <Typography as="strong" variant="strong" className="text-ui-text">
                      {invite.projectName}
                    </Typography>
                  </>
                ) : (
                  "has invited you to join Nixelo"
                )}
              </Typography>
            </div>

            {/* Invite Details */}
            <div className="bg-ui-bg-secondary p-4 mb-6">
              <Flex justify="between" align="center" className="text-sm">
                <Typography variant="muted">Invited email</Typography>
                <Typography variant="small">{invite.email}</Typography>
              </Flex>
              {isProjectInvite ? (
                <>
                  <Flex justify="between" align="center" className="text-sm mt-2">
                    <Typography variant="muted">Project</Typography>
                    <Typography variant="small">{invite.projectName}</Typography>
                  </Flex>
                  <Flex justify="between" align="center" className="text-sm mt-2">
                    <Typography variant="muted">Project Role</Typography>
                    <Typography variant="small" className="capitalize">
                      {invite.projectRole || "editor"}
                    </Typography>
                  </Flex>
                </>
              ) : (
                <Flex justify="between" align="center" className="text-sm mt-2">
                  <Typography variant="muted">Role</Typography>
                  <Typography variant="small" className="capitalize">
                    {invite.role}
                  </Typography>
                </Flex>
              )}
            </div>

            {/* Auth-dependent content */}
            {invite.status === "pending" && (
              <Authenticated>
                {/* User is logged in - show accept button */}
                <div className="space-y-4">
                  {acceptError && (
                    <Typography
                      variant="small"
                      className="p-3 rounded-lg bg-status-error-bg text-status-error-text"
                    >
                      {acceptError}
                    </Typography>
                  )}
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleAcceptInvite}
                    disabled={isAccepting}
                  >
                    {isAccepting ? (
                      <>
                        <Icon icon={Loader2} size="sm" animation="spin" className="mr-2" />
                        Accepting...
                      </>
                    ) : (
                      "Accept Invitation"
                    )}
                  </Button>
                  <Typography variant="caption" className="text-center">
                    By accepting, you'll join the team and can start collaborating
                  </Typography>
                </div>
              </Authenticated>
            )}

            {invite.status === "pending" && (
              <Unauthenticated>
                {/* User is not logged in - show sign up/in form */}
                <div className="space-y-4">
                  <Typography variant="small" color="secondary" className="mb-4 text-center">
                    Sign in or create an account with{" "}
                    <Typography as="strong" variant="strong" className="text-ui-text">
                      {invite.email}
                    </Typography>{" "}
                    to accept this invitation
                  </Typography>
                  <SignInForm />
                </div>
              </Unauthenticated>
            )}
          </Card>
        </div>
      </FlexItem>
    </Flex>
  );
}
