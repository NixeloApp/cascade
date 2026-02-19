import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Flex } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { Wrench } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

/**
 * Developer Tools Tab
 *
 * Only visible in development mode.
 * Provides utilities for testing and debugging.
 */
export function DevToolsTab() {
  const currentUser = useQuery(api.users.getCurrent);
  const resetOnboardingMutation = useMutation(api.onboarding.resetOnboarding);
  const [isResettingOnboarding, setIsResettingOnboarding] = useState(false);

  const handleResetOnboarding = async () => {
    setIsResettingOnboarding(true);
    try {
      await resetOnboardingMutation();
      showSuccess("Onboarding reset! Refresh the page to see onboarding again.");
    } catch (error) {
      showError(error, "Failed to reset onboarding");
    } finally {
      setIsResettingOnboarding(false);
    }
  };

  return (
    <Stack gap="lg">
      {/* Info Banner */}
      <Card padding="md" className="bg-status-info-bg border-status-info">
        <Flex align="start" gap="md">
          <Icon icon={Wrench} size="lg" className="text-status-info-text" />
          <Stack gap="xs">
            <Typography variant="h3" className="text-status-info-text">
              Test Account Tools
            </Typography>
            <Typography variant="small" className="text-status-info-text">
              These tools are only visible for test accounts (@inbox.mailtrap.io).
            </Typography>
          </Stack>
        </Flex>
      </Card>

      {/* Onboarding Section */}
      <Card padding="lg">
        <Typography variant="h3" className="mb-2">
          Onboarding
        </Typography>
        <Typography variant="small" color="secondary" className="mb-4">
          Reset your onboarding state to test the onboarding flow again. After resetting, refresh
          the page to see the onboarding wizard.
        </Typography>
        <Flex align="center" gap="lg">
          <Button
            onClick={handleResetOnboarding}
            disabled={isResettingOnboarding || !currentUser}
            variant="secondary"
          >
            {isResettingOnboarding ? "Resetting..." : "Reset Onboarding"}
          </Button>
          {currentUser?.email && (
            <Typography variant="caption">Current user: {currentUser.email}</Typography>
          )}
        </Flex>
      </Card>

      {/* User Info Section */}
      <Card padding="lg">
        <Typography variant="h3" className="mb-2">
          Current User Info
        </Typography>
        {currentUser ? (
          <Stack gap="sm">
            <Flex gap="sm">
              <Typography variant="small" color="secondary">
                ID:
              </Typography>
              <Typography variant="mono">{currentUser._id}</Typography>
            </Flex>
            <Flex gap="sm">
              <Typography variant="small" color="secondary">
                Email:
              </Typography>
              <Typography variant="mono">{currentUser.email}</Typography>
            </Flex>
            <Flex gap="sm">
              <Typography variant="small" color="secondary">
                Test User:
              </Typography>
              <Typography variant="mono">{currentUser.isTestUser ? "Yes" : "No"}</Typography>
            </Flex>
          </Stack>
        ) : (
          <Typography variant="small" color="secondary">
            Loading user info...
          </Typography>
        )}
      </Card>
    </Stack>
  );
}
