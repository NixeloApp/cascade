/**
 * Two-Factor Authentication Settings
 *
 * Setup and management UI for TOTP-based 2FA.
 * Guides users through QR code scanning, verification, and backup codes.
 * Allows disabling 2FA with proper re-authentication.
 */

import { api } from "@convex/_generated/api";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Flex } from "@/components/ui/Flex";
import { Input } from "@/components/ui/form";
import { Grid } from "@/components/ui/Grid";
import { Icon } from "@/components/ui/Icon";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { Copy, Key, ShieldCheck } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { SettingsSection, SettingsSectionInset, SettingsSectionRow } from "./SettingsSection";

type SetupStep = "idle" | "setup" | "verify" | "backup" | "complete";
interface TwoFactorStatus {
  enabled: boolean;
  hasBackupCodes: boolean;
}

type BeginSetupMutation = () => Promise<{ secret: string; otpauthUrl: string }>;
type CompleteSetupMutation = (args: { code: string }) => Promise<{
  success: boolean;
  backupCodes?: string[];
  error?: string;
}>;
type DisableMutation = (args: { code: string; isBackupCode: boolean }) => Promise<{
  success: boolean;
  error?: string;
}>;
type RegenerateBackupCodesMutation = (args: { totpCode: string }) => Promise<{
  success: boolean;
  backupCodes?: string[];
  error?: string;
}>;

const TOTP_CODE_LENGTH = 6;

function sanitizeTotpCode(value: string) {
  return value.replace(/\D/g, "").slice(0, TOTP_CODE_LENGTH);
}

function isBackupCode(value: string) {
  return value.includes("-");
}

async function beginTwoFactorSetup(beginSetup: BeginSetupMutation) {
  return await beginSetup();
}

async function completeTwoFactorSetup(completeSetup: CompleteSetupMutation, code: string) {
  const result = await completeSetup({ code });
  if (result.success && result.backupCodes) {
    return result.backupCodes;
  }

  throw new Error(result.error || "Verification failed");
}

async function disableTwoFactorAuth(disable: DisableMutation, code: string) {
  const result = await disable({
    code,
    isBackupCode: isBackupCode(code),
  });

  if (!result.success) {
    throw new Error(result.error || "Failed to disable 2FA");
  }
}

async function regenerateTwoFactorBackupCodes(
  regenerateBackupCodes: RegenerateBackupCodesMutation,
  code: string,
) {
  const result = await regenerateBackupCodes({ totpCode: code });
  if (result.success && result.backupCodes) {
    return result.backupCodes;
  }

  throw new Error(result.error || "Failed to regenerate codes");
}

function hasValidDisableCode(value: string) {
  const normalizedCode = value.trim();
  if (normalizedCode.length < TOTP_CODE_LENGTH) {
    return false;
  }

  return (
    isBackupCode(normalizedCode) || sanitizeTotpCode(normalizedCode).length === TOTP_CODE_LENGTH
  );
}

/** Backup codes display view */
function BackupCodesView({
  backupCodes,
  onCopy,
  onFinish,
}: {
  backupCodes: string[];
  onCopy: () => void;
  onFinish: () => void;
}) {
  return (
    <SettingsSection
      title="Save Your Backup Codes"
      description="Store these single-use recovery codes somewhere safe before you leave this step."
      icon={Key}
      iconTone="warning"
      titleAdornment={
        <Badge variant="warning" size="sm">
          Final step
        </Badge>
      }
    >
      <Alert variant="warning">
        <AlertTitle>Important: Save these codes now</AlertTitle>
        <AlertDescription>
          These backup codes can be used to access your account if you lose your authenticator. Each
          code can only be used once. Store them in a secure location.
        </AlertDescription>
      </Alert>

      <SettingsSectionInset
        title="Recovery codes"
        description="Each code works once. Keep them in a password manager or another secure place."
      >
        <Grid cols={2} gap="sm">
          {backupCodes.map((code) => (
            <Card key={code} variant="section" padding="sm">
              <Typography as="code" variant="mono" className="block text-center">
                {code}
              </Typography>
            </Card>
          ))}
        </Grid>
      </SettingsSectionInset>

      <Flex gap="sm" wrap>
        <Button onClick={onCopy} variant="secondary">
          <Icon icon={Copy} size="sm" />
          Copy Codes
        </Button>
        <Button onClick={onFinish}>I&apos;ve Saved My Codes</Button>
      </Flex>
    </SettingsSection>
  );
}

/** QR code setup wizard view */
function SetupWizardView({
  otpauthUrl,
  secret,
  verificationCode,
  isLoading,
  onCodeChange,
  onVerify,
  onCancel,
}: {
  otpauthUrl: string;
  secret: string;
  verificationCode: string;
  isLoading: boolean;
  onCodeChange: (code: string) => void;
  onVerify: () => void;
  onCancel: () => void;
}) {
  return (
    <SettingsSection
      title="Set Up Two-Factor Authentication"
      description="Scan the QR code with your authenticator app, then verify the generated code."
      icon={ShieldCheck}
      action={
        <Button variant="ghost" onClick={onCancel}>
          Cancel Setup
        </Button>
      }
      data-testid={TEST_IDS.SETTINGS.TWO_FACTOR_SECTION}
    >
      <SettingsSectionInset
        title="Scan with your authenticator"
        description="Supports Google Authenticator, Authy, 1Password, and other TOTP apps."
      >
        <Stack align="center" gap="md">
          {otpauthUrl && (
            <Card padding="md" variant="section">
              <QRCodeSVG value={otpauthUrl} size={200} />
            </Card>
          )}
        </Stack>
      </SettingsSectionInset>

      <SettingsSectionInset
        title="Manual setup code"
        description="If scanning is unavailable, enter this secret directly in your authenticator app."
      >
        <Card padding="sm" variant="section">
          <Typography as="code" variant="mono" className="block select-all text-center">
            {secret}
          </Typography>
        </Card>
      </SettingsSectionInset>

      <SettingsSectionInset
        title="Verify setup"
        description="Enter the 6-digit code currently shown in your authenticator app."
      >
        <Stack gap="sm">
          <Flex gap="sm">
            <Input
              value={verificationCode}
              onChange={(e) => onCodeChange(sanitizeTotpCode(e.target.value))}
              placeholder="000000"
              maxLength={TOTP_CODE_LENGTH}
            />
            <Button
              onClick={onVerify}
              disabled={isLoading || verificationCode.length !== TOTP_CODE_LENGTH}
            >
              {isLoading ? <LoadingSpinner size="sm" /> : "Verify"}
            </Button>
          </Flex>
        </Stack>
      </SettingsSectionInset>
    </SettingsSection>
  );
}

interface TwoFactorOverviewViewProps {
  status: TwoFactorStatus;
  isLoading: boolean;
  disableDialogOpen: boolean;
  disableCode: string;
  regenerateDialogOpen: boolean;
  regenerateCode: string;
  onBeginSetup: () => void;
  onOpenRegenerateDialog: () => void;
  onOpenDisableDialog: () => void;
  onDisableDialogOpenChange: (open: boolean) => void;
  onRegenerateDialogOpenChange: (open: boolean) => void;
  onDisableCodeChange: (value: string) => void;
  onRegenerateCodeChange: (value: string) => void;
  onDisable: () => void;
  onRegenerateBackupCodes: () => void;
}

function TwoFactorOverviewActions({
  enabled,
  isLoading,
  onBeginSetup,
  onOpenRegenerateDialog,
  onOpenDisableDialog,
}: {
  enabled: boolean;
  isLoading: boolean;
  onBeginSetup: () => void;
  onOpenRegenerateDialog: () => void;
  onOpenDisableDialog: () => void;
}) {
  if (enabled) {
    return (
      <Flex gap="sm" wrap>
        <Button variant="secondary" size="sm" onClick={onOpenRegenerateDialog}>
          <Icon icon={Key} size="sm" />
          Regenerate Backup Codes
        </Button>
        <Button variant="ghost" size="sm" onClick={onOpenDisableDialog}>
          Disable 2FA
        </Button>
      </Flex>
    );
  }

  return (
    <Button onClick={onBeginSetup} disabled={isLoading} size="sm">
      {isLoading ? <LoadingSpinner size="sm" /> : "Enable 2FA"}
    </Button>
  );
}

function EnabledTwoFactorContent({ hasBackupCodes }: { hasBackupCodes: boolean }) {
  return (
    <Stack gap="md">
      <Alert variant="success">
        <AlertTitle>2FA is active</AlertTitle>
        <AlertDescription>
          Your account is protected with two-factor authentication.
          {hasBackupCodes && " You have backup codes saved."}
        </AlertDescription>
      </Alert>
      <SettingsSectionInset
        title="Recovery access"
        description={
          hasBackupCodes
            ? "Backup codes are available if you lose access to your authenticator."
            : "Generate backup codes so you still have a recovery path if your device is unavailable."
        }
      >
        <SettingsSectionRow
          title="Authenticator app"
          description="Use a TOTP app like 1Password, Authy, or Google Authenticator when signing in."
          action={
            <Badge variant="success" size="sm">
              Required
            </Badge>
          }
        />
        <SettingsSectionRow
          title="Backup codes"
          description={
            hasBackupCodes
              ? "Single-use recovery codes are ready if your authenticator app is unavailable."
              : "No backup codes are currently available."
          }
          action={
            <Badge variant={hasBackupCodes ? "success" : "warning"} size="sm">
              {hasBackupCodes ? "Saved" : "Needs refresh"}
            </Badge>
          }
        />
      </SettingsSectionInset>
    </Stack>
  );
}

function DisabledTwoFactorContent() {
  return (
    <Stack gap="md">
      <Typography variant="small" color="secondary">
        Use an authenticator app to generate one-time codes for signing in. This provides better
        security than SMS-based verification.
      </Typography>
      <SettingsSectionInset
        title="What you&apos;ll get"
        description="Security stays with your account even if you sign in from a new browser or device."
      >
        <SettingsSectionRow
          title="Authenticator verification"
          description="A time-based code is required in addition to your password."
        />
        <SettingsSectionRow
          title="Backup recovery codes"
          description="You’ll generate one-time backup codes at the end of setup."
        />
      </SettingsSectionInset>
    </Stack>
  );
}

function TwoFactorOverviewView({
  status,
  isLoading,
  disableDialogOpen,
  disableCode,
  regenerateDialogOpen,
  regenerateCode,
  onBeginSetup,
  onOpenRegenerateDialog,
  onOpenDisableDialog,
  onDisableDialogOpenChange,
  onRegenerateDialogOpenChange,
  onDisableCodeChange,
  onRegenerateCodeChange,
  onDisable,
  onRegenerateBackupCodes,
}: TwoFactorOverviewViewProps) {
  return (
    <>
      <SettingsSection
        title="Two-Factor Authentication"
        description="Add an extra layer of security to your account."
        icon={ShieldCheck}
        titleAdornment={
          <Badge variant={status.enabled ? "success" : "secondary"}>
            {status.enabled ? "Enabled" : "Disabled"}
          </Badge>
        }
        action={
          <TwoFactorOverviewActions
            enabled={status.enabled}
            isLoading={isLoading}
            onBeginSetup={onBeginSetup}
            onOpenRegenerateDialog={onOpenRegenerateDialog}
            onOpenDisableDialog={onOpenDisableDialog}
          />
        }
        data-testid={TEST_IDS.SETTINGS.TWO_FACTOR_SECTION}
      >
        {status.enabled ? (
          <EnabledTwoFactorContent hasBackupCodes={status.hasBackupCodes} />
        ) : (
          <DisabledTwoFactorContent />
        )}
      </SettingsSection>

      <Dialog
        open={disableDialogOpen}
        onOpenChange={onDisableDialogOpenChange}
        title="Disable Two-Factor Authentication"
        description="Enter your authenticator code or a backup code to disable 2FA"
        footer={
          <>
            <Button variant="secondary" onClick={() => onDisableDialogOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onDisable} disabled={isLoading}>
              {isLoading ? <LoadingSpinner size="sm" /> : "Disable 2FA"}
            </Button>
          </>
        }
      >
        <Input
          label="Verification Code"
          value={disableCode}
          onChange={(e) => onDisableCodeChange(e.target.value)}
          placeholder="6-digit code or backup code"
        />
      </Dialog>

      <Dialog
        open={regenerateDialogOpen}
        onOpenChange={onRegenerateDialogOpenChange}
        title="Regenerate Backup Codes"
        description="Enter your authenticator code to generate new backup codes. This will invalidate all existing backup codes."
        footer={
          <>
            <Button variant="secondary" onClick={() => onRegenerateDialogOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onRegenerateBackupCodes} disabled={isLoading}>
              {isLoading ? <LoadingSpinner size="sm" /> : "Generate New Codes"}
            </Button>
          </>
        }
      >
        <Input
          label="Authenticator Code"
          value={regenerateCode}
          onChange={(e) => onRegenerateCodeChange(sanitizeTotpCode(e.target.value))}
          placeholder="000000"
          maxLength={TOTP_CODE_LENGTH}
        />
      </Dialog>
    </>
  );
}

/**
 * Two-Factor Authentication settings component.
 * Allows users to enable/disable 2FA and manage backup codes.
 */
export function TwoFactorSettings() {
  const status = useAuthenticatedQuery(api.twoFactor.getStatus, {});
  const { mutate: beginSetup } = useAuthenticatedMutation(api.twoFactor.beginSetup);
  const { mutate: completeSetup } = useAuthenticatedMutation(api.twoFactor.completeSetup);
  const { mutate: disable } = useAuthenticatedMutation(api.twoFactor.disable);
  const { mutate: regenerateBackupCodes } = useAuthenticatedMutation(
    api.twoFactor.regenerateBackupCodes,
  );

  const [step, setStep] = useState<SetupStep>("idle");
  const [otpauthUrl, setOtpauthUrl] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [regenerateCode, setRegenerateCode] = useState("");

  const handleBeginSetup = async () => {
    setIsLoading(true);
    try {
      const result = await beginTwoFactorSetup(beginSetup);
      setSecret(result.secret);
      setOtpauthUrl(result.otpauthUrl);
      setStep("setup");
    } catch (error) {
      showError(error, "Failed to start 2FA setup");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== TOTP_CODE_LENGTH) {
      showError(new Error("Please enter a 6-digit code"), "Invalid code");
      return;
    }

    setIsLoading(true);
    try {
      const nextBackupCodes = await completeTwoFactorSetup(completeSetup, verificationCode);
      setBackupCodes(nextBackupCodes);
      setStep("backup");
      showSuccess("2FA enabled successfully!");
    } catch (error) {
      showError(error, "Invalid code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    const normalizedCode = disableCode.trim();
    if (!hasValidDisableCode(normalizedCode)) {
      showError(new Error("Please enter a valid code"), "Invalid code");
      return;
    }

    setIsLoading(true);
    try {
      await disableTwoFactorAuth(disable, normalizedCode);
      showSuccess("2FA has been disabled");
      handleDisableDialogOpenChange(false);
    } catch (error) {
      showError(error, "Failed to disable 2FA");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (regenerateCode.length !== TOTP_CODE_LENGTH) {
      showError(new Error("Please enter a 6-digit code"), "Invalid code");
      return;
    }

    setIsLoading(true);
    try {
      const nextBackupCodes = await regenerateTwoFactorBackupCodes(
        regenerateBackupCodes,
        regenerateCode,
      );
      setBackupCodes(nextBackupCodes);
      setStep("backup");
      handleRegenerateDialogOpenChange(false);
      showSuccess("New backup codes generated");
    } catch (error) {
      showError(error, "Failed to regenerate backup codes");
    } finally {
      setIsLoading(false);
    }
  };

  const copyBackupCodes = async () => {
    const codesText = backupCodes.join("\n");
    try {
      await navigator.clipboard.writeText(codesText);
      showSuccess("Backup codes copied to clipboard");
    } catch (error) {
      showError(error, "Failed to copy to clipboard");
    }
  };

  const handleFinish = () => {
    setStep("idle");
    setVerificationCode("");
    setBackupCodes([]);
    setSecret("");
    setOtpauthUrl("");
  };

  const handleDisableDialogOpenChange = (open: boolean) => {
    setDisableDialogOpen(open);
    if (!open) {
      setDisableCode("");
    }
  };

  const handleRegenerateDialogOpenChange = (open: boolean) => {
    setRegenerateDialogOpen(open);
    if (!open) {
      setRegenerateCode("");
    }
  };

  // Reset step when status changes
  useEffect(() => {
    if (status?.enabled && step === "backup") {
      // Keep showing backup codes if we just enabled
    } else if (step !== "idle" && step !== "setup" && step !== "verify" && step !== "backup") {
      setStep("idle");
    }
  }, [status?.enabled, step]);

  if (status === undefined) {
    return (
      <SettingsSection
        title="Two-Factor Authentication"
        description="Add an extra layer of security to your account."
        icon={ShieldCheck}
        data-testid={TEST_IDS.SETTINGS.TWO_FACTOR_SECTION}
      >
        <SettingsSectionInset>
          <Flex align="center" justify="center">
            <LoadingSpinner size="md" />
          </Flex>
        </SettingsSectionInset>
      </SettingsSection>
    );
  }

  // Show backup codes after setup or regeneration
  if (step === "backup" && backupCodes.length > 0) {
    return (
      <BackupCodesView backupCodes={backupCodes} onCopy={copyBackupCodes} onFinish={handleFinish} />
    );
  }

  // Show setup wizard
  if (step === "setup" || step === "verify") {
    return (
      <SetupWizardView
        otpauthUrl={otpauthUrl}
        secret={secret}
        verificationCode={verificationCode}
        isLoading={isLoading}
        onCodeChange={setVerificationCode}
        onVerify={handleVerifyCode}
        onCancel={handleFinish}
      />
    );
  }

  return (
    <TwoFactorOverviewView
      status={status}
      isLoading={isLoading}
      disableDialogOpen={disableDialogOpen}
      disableCode={disableCode}
      regenerateDialogOpen={regenerateDialogOpen}
      regenerateCode={regenerateCode}
      onBeginSetup={() => void handleBeginSetup()}
      onOpenRegenerateDialog={() => setRegenerateDialogOpen(true)}
      onOpenDisableDialog={() => setDisableDialogOpen(true)}
      onDisableDialogOpenChange={handleDisableDialogOpenChange}
      onRegenerateDialogOpenChange={handleRegenerateDialogOpenChange}
      onDisableCodeChange={setDisableCode}
      onRegenerateCodeChange={setRegenerateCode}
      onDisable={() => void handleDisable()}
      onRegenerateBackupCodes={() => void handleRegenerateBackupCodes()}
    />
  );
}
