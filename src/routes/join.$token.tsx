/**
 * Join Link Page
 *
 * Landing page for organization/workspace join links.
 * Validates invite token and allows users to accept invitations.
 * Handles both authenticated and unauthenticated user flows.
 */

import { api } from "@convex/_generated/api";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";
import { AuthRedirect, SignInForm } from "@/components/Auth";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CardSection } from "@/components/ui/CardSection";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { IconCircle } from "@/components/ui/IconCircle";
import { Stack } from "@/components/ui/Stack";
import { LargeText, Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedMutation, usePublicQuery } from "@/hooks/useConvexHelpers";
import { AlertCircle, CheckCircle, Clock, Loader2 } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";

type JoinPreviewState = "accepted" | "expired" | "revoked";

interface JoinSearch {
  previewState?: JoinPreviewState;
}

interface JoinTerminalInvite {
  inviterName: string;
  isExpired: boolean;
  status: string;
}

const SCREENSHOT_PREVIEW_TOKEN = "screenshot-test-token";
const JOIN_PREVIEW_INVITER_NAME = "Emily Chen";

export const Route = createFileRoute("/join/$token")({
  component: JoinRoute,
  ssr: false,
  validateSearch: (search: Record<string, unknown>): JoinSearch => ({
    previewState:
      search.previewState === "accepted" ||
      search.previewState === "expired" ||
      search.previewState === "revoked"
        ? search.previewState
        : undefined,
  }),
});

interface JoinStateScreenProps {
  actionLabel: string;
  body: ReactNode;
  icon: ReactNode;
  iconVariant: "error" | "warning" | "success";
  onAction: () => void;
  title: string;
}

function JoinBrandHeader() {
  return (
    <header className="p-6 flex items-center justify-center">
      <Flex align="center" gap="sm">
        <IconCircle size="sm" variant="brand">
          <Typography as="span" variant="label" className="text-ui-bg">
            N
          </Typography>
        </IconCircle>
        <LargeText>Nixelo</LargeText>
      </Flex>
    </header>
  );
}

function JoinStandaloneShell({ children }: { children: ReactNode }) {
  return (
    <Flex direction="column" className="min-h-screen bg-ui-bg-secondary">
      <JoinBrandHeader />
      <FlexItem as="main" flex="1" className="flex items-center justify-center p-6 pt-0">
        <div className="max-w-md w-full">{children}</div>
      </FlexItem>
    </Flex>
  );
}

function JoinSurfaceCard({
  children,
  ...props
}: { children: ReactNode } & Omit<ComponentProps<typeof Card>, "children">) {
  return (
    <Card radius="full" padding="xl" {...props}>
      {children}
    </Card>
  );
}

function JoinStateScreen({
  actionLabel,
  body,
  icon,
  iconVariant,
  onAction,
  title,
}: JoinStateScreenProps) {
  return (
    <JoinStandaloneShell>
      <JoinSurfaceCard data-testid={TEST_IDS.JOIN.STATE_SCREEN}>
        <Stack align="center" gap="md" className="text-center">
          <IconCircle size="xl" variant={iconVariant}>
            {icon}
          </IconCircle>
          <Stack gap="sm">
            <Typography variant="h3">{title}</Typography>
            <Typography variant="p" color="secondary">
              {body}
            </Typography>
          </Stack>
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        </Stack>
      </JoinSurfaceCard>
    </JoinStandaloneShell>
  );
}

function renderJoinPreviewState(previewState: JoinPreviewState | undefined, onAction: () => void) {
  if (previewState === "expired") {
    return (
      <JoinStateScreen
        actionLabel="Go to Home"
        body={
          <>
            This invitation has expired. Please contact{" "}
            <Typography as="strong" variant="strong">
              {JOIN_PREVIEW_INVITER_NAME}
            </Typography>{" "}
            to send a new invitation.
          </>
        }
        icon={<Icon icon={Clock} size="xl" />}
        iconVariant="warning"
        onAction={onAction}
        title="Invitation Expired"
      />
    );
  }

  if (previewState === "accepted") {
    return (
      <JoinStateScreen
        actionLabel="Go to Dashboard"
        body="This invitation has already been accepted. You can sign in to access your account."
        icon={<Icon icon={CheckCircle} size="xl" tone="success" />}
        iconVariant="success"
        onAction={onAction}
        title="Already Accepted"
      />
    );
  }

  if (previewState === "revoked") {
    return (
      <JoinStateScreen
        actionLabel="Go to Home"
        body="This invitation has been revoked. Please contact the team administrator if you believe this is a mistake."
        icon={<Icon icon={AlertCircle} size="xl" tone="error" />}
        iconVariant="error"
        onAction={onAction}
        title="Invitation Revoked"
      />
    );
  }

  return null;
}

function renderJoinTerminalState(invite: JoinTerminalInvite | null, onAction: () => void) {
  if (invite === null) {
    return (
      <JoinStateScreen
        actionLabel="Go to Home"
        body="This invitation link is invalid or has been removed. Please contact the person who invited you for a new link."
        icon={<Icon icon={AlertCircle} size="xl" tone="error" />}
        iconVariant="error"
        onAction={onAction}
        title="Invalid Invitation"
      />
    );
  }

  if (invite.isExpired) {
    return (
      <JoinStateScreen
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
        icon={<Icon icon={Clock} size="xl" />}
        iconVariant="warning"
        onAction={onAction}
        title="Invitation Expired"
      />
    );
  }

  if (invite.status === "accepted") {
    return (
      <JoinStateScreen
        actionLabel="Go to Dashboard"
        body="This invitation has already been accepted. You can sign in to access your account."
        icon={<Icon icon={CheckCircle} size="xl" tone="success" />}
        iconVariant="success"
        onAction={onAction}
        title="Already Accepted"
      />
    );
  }

  if (invite.status === "revoked") {
    return (
      <JoinStateScreen
        actionLabel="Go to Home"
        body="This invitation has been revoked. Please contact the team administrator if you believe this is a mistake."
        icon={<Icon icon={AlertCircle} size="xl" tone="error" />}
        iconVariant="error"
        onAction={onAction}
        title="Invitation Revoked"
      />
    );
  }

  return null;
}

export function JoinRoute() {
  const { token } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [inviteAccepted, setInviteAccepted] = useState(false);

  // Get invite details (public endpoint - works for unauthenticated users)
  const invite = usePublicQuery(api.invites.getInviteByToken, { token });
  const { mutate: acceptInvite } = useAuthenticatedMutation(api.invites.acceptInvite);
  const invitePreviewState = token === SCREENSHOT_PREVIEW_TOKEN ? search.previewState : undefined;

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
      <JoinStandaloneShell>
        <JoinSurfaceCard data-testid={TEST_IDS.JOIN.LOADING}>
          <Stack align="center" gap="lg" className="text-center">
            <Icon icon={Loader2} size="xl" tone="brand" animation="spin" />
            <Typography className="text-ui-text-secondary">Loading invitation...</Typography>
          </Stack>
        </JoinSurfaceCard>
      </JoinStandaloneShell>
    );
  }

  const previewScreen = renderJoinPreviewState(invitePreviewState, goToHome);
  if (previewScreen) {
    return previewScreen;
  }

  const terminalScreen = renderJoinTerminalState(invite, goToHome);
  if (terminalScreen) {
    return terminalScreen;
  }

  if (invite === null) {
    return null;
  }

  // Determine if this is a project invite
  const isProjectInvite = !!invite.projectId;

  // Valid pending invite - show different UI based on auth state
  return (
    <JoinStandaloneShell>
      <JoinSurfaceCard>
        <Stack gap="sm" className="text-center mb-6">
          <Typography variant="h3">You're Invited!</Typography>
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
        </Stack>

        <CardSection size="md" className="mb-6">
          <Flex justify="between" align="center" className="text-sm">
            <Typography variant="muted">Invited email</Typography>
            <Typography variant="small">{invite.email}</Typography>
          </Flex>
          {isProjectInvite ? (
            <>
              <Flex justify="between" align="center" className="text-sm">
                <Typography variant="muted">Project</Typography>
                <Typography variant="small">{invite.projectName}</Typography>
              </Flex>
              <Flex justify="between" align="center" className="text-sm">
                <Typography variant="muted">Project Role</Typography>
                <Typography variant="small" className="capitalize">
                  {invite.projectRole || "editor"}
                </Typography>
              </Flex>
            </>
          ) : (
            <Flex justify="between" align="center" className="text-sm">
              <Typography variant="muted">Role</Typography>
              <Typography variant="small" className="capitalize">
                {invite.role}
              </Typography>
            </Flex>
          )}
        </CardSection>

        {invite.status === "pending" && (
          <Authenticated>
            <div className="space-y-4">
              {acceptError && (
                <Alert variant="error">
                  <Typography variant="small">{acceptError}</Typography>
                </Alert>
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
      </JoinSurfaceCard>
    </JoinStandaloneShell>
  );
}
