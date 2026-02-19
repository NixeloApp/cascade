import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { Check, Github } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";
import { LinkedRepositories } from "./LinkedRepositories";

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
  const githubConnection = useQuery(api.github.getConnection);
  const connectGitHub = useMutation(api.github.connectGitHub);
  const disconnectGitHub = useMutation(api.github.disconnectGitHub);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

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

  const handleDisconnect = async () => {
    if (
      !confirm(
        "Are you sure you want to disconnect GitHub? This will remove all linked repositories.",
      )
    ) {
      return;
    }

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
    <Card padding="lg">
      <Flex justify="between" align="start">
        <Flex gap="lg" align="center">
          <Card padding="sm" className="bg-ui-bg-tertiary">
            <Github className="h-6 w-6" />
          </Card>
          <Stack gap="xs">
            <Typography variant="h3">GitHub</Typography>
            <Typography variant="small" color="secondary">
              Link repositories and track PRs and commits
            </Typography>
            {githubConnection && (
              <Flex align="center" gap="xs" className="text-status-success">
                <Icon icon={Check} size="sm" />
                <Typography variant="small">
                  Connected as @{githubConnection.githubUsername}
                </Typography>
              </Flex>
            )}
          </Stack>
        </Flex>
        <div>
          {githubConnection ? (
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
              {isConnecting ? "Connecting..." : "Connect GitHub"}
            </Button>
          )}
        </div>
      </Flex>

      {githubConnection && (
        <div className="mt-6 pt-6 border-t border-ui-border">
          <LinkedRepositories />
        </div>
      )}
    </Card>
  );
}
