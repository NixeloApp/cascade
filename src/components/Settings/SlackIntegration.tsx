/**
 * Slack Integration
 *
 * OAuth integration card for connecting a Slack workspace.
 * Stores workspace metadata and incoming webhook capability for notifications.
 */

import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { Check } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL as string;
const SLACK_AUTH_URL = `${CONVEX_URL?.replace(".cloud", ".site")}/slack/auth`;

interface SlackConnectionData {
  teamId: string;
  teamName: string;
  accessToken: string;
  botUserId?: string;
  scope?: string;
  incomingWebhookUrl?: string;
  incomingWebhookChannel?: string;
}

export function SlackIntegration() {
  const slackConnection = useQuery(api.slack.getConnection);
  const connectSlack = useMutation(api.slack.connectSlack);
  const disconnectSlack = useMutation(api.slack.disconnectSlack);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type !== "slack-connected") {
        return;
      }

      const data = event.data.data as SlackConnectionData;
      setIsConnecting(true);
      try {
        await connectSlack({
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

  const handleDisconnect = async () => {
    if (!confirm("Disconnect Slack workspace?")) {
      return;
    }

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
    <Card padding="lg">
      <Flex justify="between" align="start">
        <Flex gap="lg" align="center">
          <Card padding="sm" className="bg-ui-bg-tertiary">
            <MessageSquare className="h-6 w-6" />
          </Card>
          <Stack gap="xs">
            <Typography variant="h3">Slack</Typography>
            <Typography variant="small" color="secondary">
              Connect Slack to send issue notifications to your workspace
            </Typography>
            {slackConnection && (
              <Stack gap="xs">
                <Flex align="center" gap="xs" className="text-status-success">
                  <Check className="h-4 w-4" />
                  <Typography variant="small">Connected to {slackConnection.teamName}</Typography>
                </Flex>
                <Typography variant="caption" color="tertiary">
                  Incoming webhook: {slackConnection.hasIncomingWebhook ? "Enabled" : "Unavailable"}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Flex>
        <div>
          {slackConnection ? (
            <Button
              variant="danger"
              size="sm"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? "Disconnecting..." : "Disconnect"}
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={handleConnect} disabled={isConnecting}>
              {isConnecting ? "Connecting..." : "Connect Slack"}
            </Button>
          )}
        </div>
      </Flex>
    </Card>
  );
}
