import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { useOrganization } from "@/hooks/useOrgContext";
import { showError, showSuccess } from "@/lib/toast";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Input } from "../ui/form/Input";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

/**
 * Admin-facing kill switch for enabling or disabling Google OAuth sign-in.
 */
export function OAuthFeatureFlagSettings() {
  const { organizationId } = useOrganization();
  const [reason, setReason] = useState("");
  const isGoogleAuthEnabled = useQuery(api.featureFlags.isGoogleAuthEnabled);
  const setGoogleAuthEnabled = useMutation(api.featureFlags.setGoogleAuthEnabled);

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
    <Card>
      <CardHeader
        title="Google Auth Emergency Toggle"
        description="Disable Google sign-in quickly during OAuth incidents."
      />
      <CardBody>
        <Stack gap="md">
          <Flex align="center" justify="between">
            <Typography variant="label">Current Status</Typography>
            <Badge variant={enabled ? "success" : "warning"}>
              {enabled ? "Enabled" : "Disabled"}
            </Badge>
          </Flex>

          <Input
            label="Change Reason (optional)"
            placeholder="Example: provider outage, incident-123"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />

          <Flex justify="end">
            <Button variant={enabled ? "danger" : "primary"} onClick={() => void toggle()}>
              {enabled ? "Disable Google Auth" : "Re-enable Google Auth"}
            </Button>
          </Flex>
        </Stack>
      </CardBody>
    </Card>
  );
}
