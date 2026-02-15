import { api } from "@convex/_generated/api";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Authenticated, Unauthenticated, useMutation, useQuery } from "convex/react";
import { AlertCircle, CheckCircle, Clock, Loader2 } from "lucide-react";
import { useState } from "react";
import { AuthRedirect, SignInForm } from "@/components/Auth";
import { Button } from "@/components/ui/Button";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { showError, showSuccess } from "@/lib/toast";

export const Route = createFileRoute("/invite/$token")({
  component: InviteRoute,
  ssr: false, // No SSR needed for invite page
});

function InviteRoute() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [inviteAccepted, setInviteAccepted] = useState(false);

  // Get invite details
  const invite = useQuery(api.invites.getInviteByToken, { token });
  const acceptInvite = useMutation(api.invites.acceptInvite);

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
          <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto mb-4" />
          <Typography className="text-ui-text-secondary">Loading invitation...</Typography>
        </div>
      </Flex>
    );
  }

  // Invalid token
  if (invite === null) {
    return (
      <Flex align="center" justify="center" className="min-h-screen bg-ui-bg-secondary p-6">
        <div className="max-w-md w-full text-center">
          <div className="p-4 rounded-full bg-status-error-bg w-fit mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-status-error" />
          </div>
          <Typography variant="h3" className="mb-3">
            Invalid Invitation
          </Typography>
          <Typography variant="p" color="secondary" className="mb-6">
            This invitation link is invalid or has been removed. Please contact the person who
            invited you for a new link.
          </Typography>
          <Button variant="primary" onClick={goToHome}>
            Go to Home
          </Button>
        </div>
      </Flex>
    );
  }

  // Expired invite (isExpired is computed from status === "pending" && expiresAt < now)
  if (invite.isExpired) {
    return (
      <Flex align="center" justify="center" className="min-h-screen bg-ui-bg-secondary p-6">
        <div className="max-w-md w-full text-center">
          <div className="p-4 rounded-full bg-status-warning-bg w-fit mx-auto mb-6">
            <Clock className="w-12 h-12 text-status-warning-text" />
          </div>
          <Typography variant="h3" className="mb-3">
            Invitation Expired
          </Typography>
          <Typography variant="p" color="secondary" className="mb-6">
            This invitation has expired. Please contact{" "}
            <strong className="font-medium">{invite.inviterName}</strong> to send a new invitation.
          </Typography>
          <Button variant="primary" onClick={goToHome}>
            Go to Home
          </Button>
        </div>
      </Flex>
    );
  }

  // Already accepted
  if (invite.status === "accepted") {
    return (
      <Flex align="center" justify="center" className="min-h-screen bg-ui-bg-secondary p-6">
        <div className="max-w-md w-full text-center">
          <div className="p-4 rounded-full bg-status-success-bg w-fit mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-status-success" />
          </div>
          <Typography variant="h3" className="mb-3">
            Already Accepted
          </Typography>
          <Typography variant="p" color="secondary" className="mb-6">
            This invitation has already been accepted. You can sign in to access your account.
          </Typography>
          <Button variant="primary" onClick={goToHome}>
            Go to Dashboard
          </Button>
        </div>
      </Flex>
    );
  }

  // Revoked invite
  if (invite.status === "revoked") {
    return (
      <Flex align="center" justify="center" className="min-h-screen bg-ui-bg-secondary p-6">
        <div className="max-w-md w-full text-center">
          <div className="p-4 rounded-full bg-status-error-bg w-fit mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-status-error" />
          </div>
          <Typography variant="h3" className="mb-3">
            Invitation Revoked
          </Typography>
          <Typography variant="p" color="secondary" className="mb-6">
            This invitation has been revoked. Please contact the team administrator if you believe
            this is a mistake.
          </Typography>
          <Button variant="primary" onClick={goToHome}>
            Go to Home
          </Button>
        </div>
      </Flex>
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
          <Flex align="center" justify="center" className="h-8 w-8 rounded-lg bg-brand-main">
            <Typography variant="small" className="font-bold text-ui-bg">
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
          <div className="bg-ui-bg rounded-2xl shadow-lg p-8 mb-6">
            <div className="text-center mb-6">
              <Typography variant="h3" className="mb-2">
                You're Invited!
              </Typography>
              <Typography variant="p" color="secondary">
                <strong className="font-semibold text-ui-text">{invite.inviterName}</strong>{" "}
                {isProjectInvite ? (
                  <>
                    has invited you to join the project{" "}
                    <strong className="font-semibold text-ui-text">{invite.projectName}</strong>
                  </>
                ) : (
                  "has invited you to join Nixelo"
                )}
              </Typography>
            </div>

            {/* Invite Details */}
            <div className="bg-ui-bg-secondary rounded-lg p-4 mb-6">
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
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Accepting...
                      </>
                    ) : (
                      "Accept Invitation"
                    )}
                  </Button>
                  <Typography className="text-xs text-center text-ui-text-tertiary">
                    By accepting, you'll join the team and can start collaborating
                  </Typography>
                </div>
              </Authenticated>
            )}

            {invite.status === "pending" && (
              <Unauthenticated>
                {/* User is not logged in - show sign up/in form */}
                <div className="space-y-4">
                  <Typography className="text-sm text-center text-ui-text-secondary mb-4">
                    Sign in or create an account with{" "}
                    <strong className="font-semibold text-ui-text">{invite.email}</strong> to accept
                    this invitation
                  </Typography>
                  <SignInForm />
                </div>
              </Unauthenticated>
            )}
          </div>
        </div>
      </FlexItem>
    </Flex>
  );
}
