/**
 * Intake Token Settings
 *
 * Admin panel for managing external intake tokens.
 * Allows creating, viewing, copying, and revoking intake tokens
 * that external users/services use to submit issues to the project inbox.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { getConvexSiteUrl } from "@/lib/convex";
import { Check, Copy, Key, LinkIcon, RotateCcw, Trash2 } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { SettingsSection, SettingsSectionInset } from "../Settings/SettingsSection";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Flex } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

interface IntakeSettingsProps {
  projectId: Id<"projects">;
}

const INTAKE_ENDPOINT_PATH = "/api/intake";

function buildIntakeEndpoint(): string {
  return `${getConvexSiteUrl()}${INTAKE_ENDPOINT_PATH}`;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} aria-label={`Copy ${label}`}>
      <Icon icon={copied ? Check : Copy} size="sm" />
    </Button>
  );
}

function TokenDisplay({ token }: { token: string }) {
  const maskedToken = `${token.slice(0, 12)}${"•".repeat(8)}`;

  return (
    <SettingsSectionInset title="Intake Token" padding="sm">
      <Stack gap="xs">
        <Flex align="center" gap="sm">
          <Typography variant="small" className="font-mono select-all break-all">
            {maskedToken}
          </Typography>
          <CopyButton value={token} label="token" />
        </Flex>
      </Stack>
    </SettingsSectionInset>
  );
}

function EndpointDisplay() {
  const endpoint = buildIntakeEndpoint();

  return (
    <SettingsSectionInset title="Endpoint URL" padding="sm">
      <Stack gap="xs">
        <Flex align="center" gap="sm">
          <Typography variant="small" className="font-mono select-all break-all">
            {endpoint}
          </Typography>
          <CopyButton value={endpoint} label="endpoint URL" />
        </Flex>
      </Stack>
    </SettingsSectionInset>
  );
}

function UsageExample({ token }: { token: string }) {
  const endpoint = buildIntakeEndpoint();
  const curlExample = `curl -X POST ${endpoint} \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Bug report", "submitterEmail": "user@example.com"}'`;

  return (
    <SettingsSectionInset
      title="Example Request"
      action={<CopyButton value={curlExample} label="curl example" />}
      padding="sm"
    >
      <Stack gap="xs">
        <Typography variant="caption" className="font-mono whitespace-pre-wrap break-all">
          {curlExample}
        </Typography>
      </Stack>
    </SettingsSectionInset>
  );
}

export function IntakeSettings({ projectId }: IntakeSettingsProps) {
  const tokenStatus = useAuthenticatedQuery(api.intake.getTokenStatus, { projectId });
  const { mutate: createToken } = useAuthenticatedMutation(api.intake.createToken);
  const { mutate: revokeToken } = useAuthenticatedMutation(api.intake.revokeToken);
  const [isCreating, setIsCreating] = useState(false);
  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await createToken({ projectId });
      showSuccess("Intake token created");
    } catch (error) {
      showError(error, "Failed to create intake token");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRegenerate = async () => {
    setIsCreating(true);
    try {
      await revokeToken({ projectId });
      await createToken({ projectId });
      showSuccess("Intake token regenerated");
    } catch (error) {
      showError(error, "Failed to regenerate intake token");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async () => {
    setIsRevoking(true);
    try {
      await revokeToken({ projectId });
      showSuccess("Intake token revoked");
      setRevokeConfirmOpen(false);
    } catch (error) {
      showError(error, "Failed to revoke intake token");
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <SettingsSection
      title="External Intake"
      description="Allow external users or services to submit issues to this project's inbox via API."
      icon={LinkIcon}
      variant="outline"
      padding="lg"
    >
      <Stack gap="md">
        {tokenStatus === undefined ? (
          <Typography variant="caption" color="tertiary">
            Loading...
          </Typography>
        ) : tokenStatus.exists ? (
          <Stack gap="sm">
            <TokenDisplay token={tokenStatus.token} />
            <EndpointDisplay />
            <UsageExample token={tokenStatus.token} />
            <Flex gap="sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRevokeConfirmOpen(true)}
                leftIcon={<Icon icon={Trash2} size="sm" />}
              >
                Revoke Token
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRegenerate}
                disabled={isCreating}
                leftIcon={<Icon icon={RotateCcw} size="sm" />}
              >
                Regenerate
              </Button>
            </Flex>
          </Stack>
        ) : (
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={isCreating}
            leftIcon={<Icon icon={Key} size="sm" />}
          >
            {isCreating ? "Creating..." : "Enable External Intake"}
          </Button>
        )}
      </Stack>
      <ConfirmDialog
        isOpen={revokeConfirmOpen}
        onClose={() => setRevokeConfirmOpen(false)}
        title="Revoke Intake Token"
        message="This will immediately invalidate the current token. Any integrations using it will stop working. You can create a new token afterward."
        confirmLabel="Revoke Token"
        onConfirm={handleRevoke}
        isLoading={isRevoking}
        variant="danger"
      />
    </SettingsSection>
  );
}
