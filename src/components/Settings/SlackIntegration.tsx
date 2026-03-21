/**
 * Slack Integration
 *
 * OAuth integration card for connecting a Slack workspace.
 * Stores workspace metadata and incoming webhook capability for notifications.
 */

import { api } from "@convex/_generated/api";
import { useEffect, useState } from "react";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { Check, MessageSquare } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Flex } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";
import { SettingsIntegrationMeta, SettingsIntegrationSection } from "./SettingsIntegrationSection";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL as string;
const SLACK_AUTH_URL = `${CONVEX_URL?.replace(".cloud", ".site")}/slack/auth`;

function getAllowedOrigins(): Set<string> {
  const allowed = new Set<string>([window.location.origin]);
  try {
    allowed.add(new URL(SLACK_AUTH_URL).origin);
  } catch {
    // Ignore malformed auth URL and fall back to same-origin only.
  }
  return allowed;
}

interface SlackConnectionData {
  slackUserId?: string;
  teamId: string;
  teamName: string;
  accessToken: string;
  botUserId?: string;
  scope?: string;
  incomingWebhookUrl?: string;
  incomingWebhookChannel?: string;
}

const MAX_SLACK_OAUTH_FIELD_LENGTH = 512;

function isOptionalValidString(value: unknown): value is string | undefined {
  return (
    value === undefined ||
    (typeof value === "string" && value.length > 0 && value.length <= MAX_SLACK_OAUTH_FIELD_LENGTH)
  );
}

function parseSlackConnectionData(value: unknown): SlackConnectionData | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const teamId = candidate.teamId;
  const teamName = candidate.teamName;
  const accessToken = candidate.accessToken;
  if (
    typeof teamId !== "string" ||
    teamId.length === 0 ||
    teamId.length > MAX_SLACK_OAUTH_FIELD_LENGTH ||
    typeof teamName !== "string" ||
    teamName.length === 0 ||
    teamName.length > MAX_SLACK_OAUTH_FIELD_LENGTH ||
    typeof accessToken !== "string" ||
    accessToken.length === 0 ||
    accessToken.length > MAX_SLACK_OAUTH_FIELD_LENGTH
  ) {
    return null;
  }

  if (
    !isOptionalValidString(candidate.slackUserId) ||
    !isOptionalValidString(candidate.botUserId) ||
    !isOptionalValidString(candidate.scope) ||
    !isOptionalValidString(candidate.incomingWebhookUrl) ||
    !isOptionalValidString(candidate.incomingWebhookChannel)
  ) {
    return null;
  }

  return {
    teamId,
    teamName,
    accessToken,
    slackUserId: candidate.slackUserId,
    botUserId: candidate.botUserId,
    scope: candidate.scope,
    incomingWebhookUrl: candidate.incomingWebhookUrl,
    incomingWebhookChannel: candidate.incomingWebhookChannel,
  };
}

export function SlackIntegration() {
  const slackConnection = useAuthenticatedQuery(api.slack.getConnection, {});
  const { mutate: connectSlack } = useAuthenticatedMutation(api.slack.connectSlack);
  const { mutate: disconnectSlack } = useAuthenticatedMutation(api.slack.disconnectSlack);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [disconnectConfirmOpen, setDisconnectConfirmOpen] = useState(false);

  useEffect(() => {
    const allowedOrigins = getAllowedOrigins();

    const handleMessage = async (event: MessageEvent) => {
      if (!allowedOrigins.has(event.origin)) {
        return;
      }

      if (event.data?.type !== "slack-connected") {
        return;
      }

      const data = parseSlackConnectionData(event.data?.data);
      if (!data) {
        return;
      }
      setIsConnecting(true);
      try {
        await connectSlack({
          slackUserId: data.slackUserId,
          teamId: data.teamId,
          teamName: data.teamName,
          accessToken: data.accessToken,
          botUserId: data.botUserId,
          scope: data.scope,
          incomingWebhookUrl: data.incomingWebhookUrl,
          incomingWebhookChannel: data.incomingWebhookChannel,
        });
        showSuccess(`Connected to Slack workspace ${data.teamName}`);
      } catch (error) {
        showError(error, "Failed to save Slack connection");
      } finally {
        setIsConnecting(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [connectSlack]);

  const handleConnect = () => {
    const width = 640;
    const height = 760;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      SLACK_AUTH_URL,
      "slack-oauth",
      `width=${width},height=${height},left=${left},top=${top},popup=yes`,
    );
  };

  const handleDisconnectConfirm = async () => {
    setIsDisconnecting(true);
    try {
      await disconnectSlack();
      showSuccess("Slack disconnected");
    } catch (error) {
      showError(error, "Failed to disconnect Slack");
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <SettingsIntegrationSection
      title="Slack"
      description="Send issue activity into Slack and keep workspace alerts connected to the right team."
      icon={MessageSquare}
      iconTone="accent"
      status={
        slackConnection
          ? { label: "Connected", variant: "success" }
          : { label: "Not Connected", variant: "neutral" }
      }
      action={
        slackConnection ? (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDisconnectConfirmOpen(true)}
            disabled={isDisconnecting}
          >
            {isDisconnecting ? "Disconnecting..." : "Disconnect"}
          </Button>
        ) : (
          <Button variant="primary" size="sm" onClick={handleConnect} disabled={isConnecting}>
            {isConnecting ? "Connecting..." : "Connect Slack"}
          </Button>
        )
      }
      summary={
        slackConnection ? (
          <SettingsIntegrationMeta label="Workspace connection">
            <Stack gap="xs">
              <Flex align="center" gap="xs">
                <Icon icon={Check} size="sm" tone="success" />
                <Typography variant="small">{slackConnection.teamName}</Typography>
              </Flex>
              <Typography variant="caption" color="tertiary">
                Incoming webhook: {slackConnection.hasIncomingWebhook ? "Enabled" : "Unavailable"}
              </Typography>
            </Stack>
          </SettingsIntegrationMeta>
        ) : (
          <SettingsIntegrationMeta label="Connection status">
            <Typography variant="small" color="secondary">
              Connect Slack to route issue notifications into one workspace channel flow.
            </Typography>
          </SettingsIntegrationMeta>
        )
      }
    >
      <ConfirmDialog
        isOpen={disconnectConfirmOpen}
        onClose={() => setDisconnectConfirmOpen(false)}
        onConfirm={handleDisconnectConfirm}
        title="Disconnect Slack"
        message="Are you sure you want to disconnect your Slack workspace?"
        variant="danger"
        confirmLabel="Disconnect"
      />
    </SettingsIntegrationSection>
  );
}
