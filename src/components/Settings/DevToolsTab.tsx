import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Flex } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { Wrench } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
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
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-status-info-bg border border-status-info rounded-lg p-4">
        <Flex align="start" gap="md">
          <Icon icon={Wrench} size="lg" className="text-status-info-text" />
          <div>
            <Typography variant="h3" className="font-medium text-status-info-text">
              Test Account Tools
            </Typography>
            <Typography className="text-sm text-status-info-text mt-1">
              These tools are only visible for test accounts (@inbox.mailtrap.io).
            </Typography>
          </div>
        </Flex>
      </div>

      {/* Onboarding Section */}
      <div className="bg-ui-bg rounded-lg border border-ui-border p-6">
        <Typography variant="h3" className="mb-2">
          Onboarding
        </Typography>
        <Typography variant="p" color="secondary" className="mb-4 text-sm">
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
      </div>

      {/* User Info Section */}
      <div className="bg-ui-bg rounded-lg border border-ui-border p-6">
        <Typography variant="h3" className="mb-2">
          Current User Info
        </Typography>
        {currentUser ? (
          <div className="text-sm space-y-2">
            <Flex gap="sm">
              <Typography variant="small" color="secondary">
                ID:
              </Typography>
              <code className="text-ui-text font-mono">{currentUser._id}</code>
            </Flex>
            <Flex gap="sm">
              <Typography variant="small" color="secondary">
                Email:
              </Typography>
              <code className="text-ui-text font-mono">{currentUser.email}</code>
            </Flex>
            <Flex gap="sm">
              <Typography variant="small" color="secondary">
                Test User:
              </Typography>
              <code className="text-ui-text font-mono">
                {currentUser.isTestUser ? "Yes" : "No"}
              </code>
            </Flex>
          </div>
        ) : (
          <Typography className="text-sm text-ui-text-secondary">Loading user info...</Typography>
        )}
      </div>
    </div>
  );
}
