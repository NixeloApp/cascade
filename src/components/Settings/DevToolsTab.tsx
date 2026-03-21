import { api } from "@convex/_generated/api";
import { useState } from "react";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { Wrench } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "../ui/Button";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";
import { SettingsSection, SettingsSectionInset, SettingsSectionRow } from "./SettingsSection";
/**
 * Developer Tools Tab
 *
 * Only visible in development mode.
 * Provides utilities for testing and debugging.
 */
export function DevToolsTab() {
  const currentUser = useAuthenticatedQuery(api.users.getCurrent, {});
  const { mutate: resetOnboardingMutation } = useAuthenticatedMutation(
    api.onboarding.resetOnboarding,
  );
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
      <SettingsSection
        title="Test Account Tools"
        description="These utilities are only visible for test accounts (@inbox.mailtrap.io)."
        icon={Wrench}
        iconTone="info"
        data-testid={TEST_IDS.SETTINGS.DEVTOOLS_SECTION}
      >
        <SettingsSectionInset
          title="Onboarding"
          description="Reset your onboarding state to test the onboarding flow again. Refresh after the reset to see the wizard."
          action={
            <Button
              onClick={handleResetOnboarding}
              disabled={isResettingOnboarding || !currentUser}
              variant="secondary"
              size="sm"
            >
              {isResettingOnboarding ? "Resetting..." : "Reset Onboarding"}
            </Button>
          }
        >
          <SettingsSectionRow
            title="Current test account"
            description={
              currentUser?.email
                ? `Resetting uses ${currentUser.email} as the active test account.`
                : "Loading current account information..."
            }
          />
        </SettingsSectionInset>

        <SettingsSectionInset
          title="Current User Info"
          description="Use this to confirm which seeded test account is currently active."
        >
          {currentUser ? (
            <Stack gap="md">
              <SettingsSectionRow title="ID" description={currentUser._id} />
              <SettingsSectionRow title="Email" description={currentUser.email} />
              <SettingsSectionRow
                title="Test User"
                description={currentUser.isTestUser ? "Yes" : "No"}
              />
            </Stack>
          ) : (
            <Typography variant="small" color="secondary">
              Loading user info...
            </Typography>
          )}
        </SettingsSectionInset>
      </SettingsSection>
    </Stack>
  );
}
