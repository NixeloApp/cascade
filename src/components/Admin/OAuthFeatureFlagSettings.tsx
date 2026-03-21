import { api } from "@convex/_generated/api";
import { useState } from "react";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { ShieldCheck } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import {
  SettingsSection,
  SettingsSectionInset,
  SettingsSectionRow,
} from "../Settings/SettingsSection";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Input } from "../ui/form/Input";
import { Stack } from "../ui/Stack";
/**
 * Admin-facing kill switch for enabling or disabling Google OAuth sign-in.
 */
export function OAuthFeatureFlagSettings() {
  const { organizationId } = useOrganization();
  const [reason, setReason] = useState("");
  const isGoogleAuthEnabled = useAuthenticatedQuery(api.featureFlags.isGoogleAuthEnabled, {});
  const { mutate: setGoogleAuthEnabled } = useAuthenticatedMutation(
    api.featureFlags.setGoogleAuthEnabled,
  );

  if (!organizationId) {
    return null;
  }

  const enabled = isGoogleAuthEnabled !== false;

  const toggle = async () => {
    try {
      await setGoogleAuthEnabled({
        organizationId,
        enabled: !enabled,
        reason: reason.trim() || undefined,
      });
      showSuccess(!enabled ? "Google auth enabled" : "Google auth disabled");
      setReason("");
    } catch (error) {
      showError(error, "Failed to update Google auth flag");
    }
  };

  return (
    <SettingsSection
      title="Google Auth Emergency Toggle"
      description="Disable Google sign-in quickly during OAuth incidents without leaving the admin workspace."
      icon={ShieldCheck}
      iconTone={enabled ? "success" : "warning"}
      titleAdornment={
        <Badge variant={enabled ? "success" : "warning"}>{enabled ? "Enabled" : "Disabled"}</Badge>
      }
      action={
        <Button variant={enabled ? "danger" : "primary"} onClick={() => void toggle()}>
          {enabled ? "Disable Google Auth" : "Re-enable Google Auth"}
        </Button>
      }
    >
      <Stack gap="md">
        <SettingsSectionInset>
          <SettingsSectionRow
            title="Current Status"
            description={
              enabled
                ? "Google sign-in is currently available for members in this organization."
                : "Google sign-in is currently blocked. Members must use another supported sign-in path."
            }
            action={
              <Badge variant={enabled ? "success" : "warning"}>
                {enabled ? "Enabled" : "Disabled"}
              </Badge>
            }
          />
        </SettingsSectionInset>

        <SettingsSectionInset
          title="Change Reason"
          description="Optional incident context to include with the toggle action."
        >
          <Input
            label="Change Reason (optional)"
            placeholder="Example: provider outage, incident-123"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </SettingsSectionInset>
      </Stack>
    </SettingsSection>
  );
}
