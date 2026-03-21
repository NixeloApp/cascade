/**
 * GitHub Integration
 *
 * OAuth integration for connecting GitHub accounts.
 * Manages repository linking and connection status.
 * Handles popup-based OAuth flow with message passing.
 */

import { api } from "@convex/_generated/api";
import { useEffect, useState } from "react";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { Check, Github } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Flex } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import { Typography } from "../ui/Typography";
import { LinkedRepositories } from "./LinkedRepositories";
import {
  SettingsIntegrationInset,
  SettingsIntegrationMeta,
  SettingsIntegrationSection,
} from "./SettingsIntegrationSection";

// Get the Convex HTTP URL for GitHub OAuth
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL as string;
const GITHUB_AUTH_URL = `${CONVEX_URL?.replace(".cloud", ".site")}/github/auth`;

interface GitHubConnectionData {
  githubUserId: string;
  githubUsername: string;
  accessToken: string;
}

/**
 * GitHub integration card
 * Handles OAuth flow for connecting GitHub account
 */
export function GitHubIntegration() {
  const githubConnection = useAuthenticatedQuery(api.github.getConnection, {});
  const { mutate: connectGitHub } = useAuthenticatedMutation(api.github.connectGitHub);
  const { mutate: disconnectGitHub } = useAuthenticatedMutation(api.github.disconnectGitHub);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [disconnectConfirmOpen, setDisconnectConfirmOpen] = useState(false);

  // Listen for OAuth callback message
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Validate message origin for security
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type === "github-connected") {
        const data = event.data.data as GitHubConnectionData;
        setIsConnecting(true);
        try {
          await connectGitHub({
            githubUserId: data.githubUserId,
            githubUsername: data.githubUsername,
            accessToken: data.accessToken,
          });
          showSuccess(`Connected to GitHub as @${data.githubUsername}`);
        } catch (error) {
          showError(error, "Failed to save GitHub connection");
        } finally {
          setIsConnecting(false);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [connectGitHub]);

  const handleDisconnectConfirm = async () => {
    setIsDisconnecting(true);
    try {
      await disconnectGitHub();
      showSuccess("GitHub disconnected successfully");
    } catch (error) {
      showError(error, "Failed to disconnect GitHub");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleConnect = () => {
    // Open GitHub OAuth in a popup window
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      GITHUB_AUTH_URL,
      "github-oauth",
      `width=${width},height=${height},left=${left},top=${top},popup=yes`,
    );
  };

  return (
    <SettingsIntegrationSection
      title="GitHub"
      description="Link repositories and keep pull request and commit context attached to work."
      icon={Github}
      iconTone="secondary"
      data-testid={TEST_IDS.SETTINGS.GITHUB_INTEGRATION}
      status={
        githubConnection
          ? {
              label: "Connected",
              variant: "success",
            }
          : {
              label: "Not Connected",
              variant: "neutral",
            }
      }
      action={
        githubConnection ? (
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
            {isConnecting ? "Connecting..." : "Connect GitHub"}
          </Button>
        )
      }
      summary={
        githubConnection ? (
          <SettingsIntegrationMeta label="Connected account">
            <Flex align="center" gap="xs">
              <Icon icon={Check} size="sm" tone="success" />
              <Typography variant="small">@{githubConnection.githubUsername}</Typography>
            </Flex>
          </SettingsIntegrationMeta>
        ) : (
          <SettingsIntegrationMeta label="Connection status">
            <Typography variant="small" color="secondary">
              Connect GitHub to link repositories and pull request activity to projects.
            </Typography>
          </SettingsIntegrationMeta>
        )
      }
    >
      {githubConnection ? (
        <SettingsIntegrationInset>
          <LinkedRepositories showHeading={false} />
        </SettingsIntegrationInset>
      ) : null}

      <ConfirmDialog
        isOpen={disconnectConfirmOpen}
        onClose={() => setDisconnectConfirmOpen(false)}
        onConfirm={handleDisconnectConfirm}
        title="Disconnect GitHub"
        message="Are you sure you want to disconnect your GitHub account?"
        variant="danger"
        confirmLabel="Disconnect"
      />
    </SettingsIntegrationSection>
  );
}
