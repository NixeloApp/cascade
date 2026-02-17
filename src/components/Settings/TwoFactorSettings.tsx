import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useState } from "react";
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
import { Typography } from "@/components/ui/Typography";
import { Copy, Key, ShieldCheck } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";

// ============================================================================
// Types
// ============================================================================

type SetupStep = "idle" | "setup" | "verify" | "backup" | "complete";

// ============================================================================
// Subcomponents
// ============================================================================

function LoadingState() {
  return (
    <Card className="p-6">
      <Flex align="center" justify="center" className="py-4">
        <LoadingSpinner size="md" />
      </Flex>
    </Card>
  );
}

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
    <Card className="p-6">
      <Flex direction="column" gap="lg">
        <Flex align="center" gap="sm">
          <Icon icon={Key} size="lg" className="text-status-warning" />
          <Typography variant="h4">Save Your Backup Codes</Typography>
        </Flex>

        <Alert variant="warning">
          <AlertTitle>Important: Save these codes now</AlertTitle>
          <AlertDescription>
            These backup codes can be used to access your account if you lose your authenticator.
            Each code can only be used once. Store them in a secure location.
          </AlertDescription>
        </Alert>

        <div className="bg-ui-bg-secondary rounded-lg p-4">
          <Grid cols={2} gap="sm">
            {backupCodes.map((code) => (
              <code
                key={code}
                className="font-mono text-sm bg-ui-bg p-2 rounded border border-ui-border text-center"
              >
                {code}
              </code>
            ))}
          </Grid>
        </div>

        <Flex gap="sm">
          <Button onClick={onCopy} variant="secondary">
            <Icon icon={Copy} size="sm" />
            Copy Codes
          </Button>
          <Button onClick={onFinish}>I&apos;ve Saved My Codes</Button>
        </Flex>
      </Flex>
    </Card>
  );
}

function SetupWizard({
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
    <Card className="p-6">
      <Flex direction="column" gap="lg">
        <Flex align="center" gap="sm">
          <Icon icon={ShieldCheck} size="lg" className="text-brand" />
          <Typography variant="h4">Set Up Two-Factor Authentication</Typography>
        </Flex>

        <Typography variant="small" color="secondary">
          Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password,
          etc.)
        </Typography>

        <Flex direction="column" align="center" gap="md" className="py-4">
          {otpauthUrl && (
            <div className="p-4 bg-white rounded-lg border border-ui-border">
              <QRCodeSVG value={otpauthUrl} size={200} />
            </div>
          )}

          <div className="text-center">
            <Typography variant="caption">Can&apos;t scan? Enter this code manually:</Typography>
            <code className="block mt-2 font-mono text-sm bg-ui-bg-secondary p-2 rounded select-all">
              {secret}
            </code>
          </div>
        </Flex>

        <div className="border-t border-ui-border pt-4">
          <Typography variant="label" className="mb-2">
            Enter the 6-digit code from your authenticator app:
          </Typography>
          <Flex gap="sm">
            <Input
              value={verificationCode}
              onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="font-mono text-center text-lg tracking-widest"
              maxLength={6}
            />
            <Button onClick={onVerify} disabled={isLoading || verificationCode.length !== 6}>
              {isLoading ? <LoadingSpinner size="sm" /> : "Verify"}
            </Button>
          </Flex>
        </div>

        <Button variant="ghost" onClick={onCancel} className="self-start">
          Cancel Setup
        </Button>
      </Flex>
    </Card>
  );
}

function StatusView({
  enabled,
  hasBackupCodes,
  isLoading,
  onBeginSetup,
  onOpenDisable,
  onOpenRegenerate,
}: {
  enabled: boolean;
  hasBackupCodes: boolean;
  isLoading: boolean;
  onBeginSetup: () => void;
  onOpenDisable: () => void;
  onOpenRegenerate: () => void;
}) {
  return (
    <Flex direction="column" gap="lg">
      <Flex align="center" justify="between">
        <Flex align="center" gap="sm">
          <Icon icon={ShieldCheck} size="lg" className="text-brand" />
          <div>
            <Typography variant="h5">Two-Factor Authentication</Typography>
            <Typography variant="caption">
              Add an extra layer of security to your account
            </Typography>
          </div>
        </Flex>
        <Badge variant={enabled ? "success" : "secondary"}>
          {enabled ? "Enabled" : "Disabled"}
        </Badge>
      </Flex>

      {enabled ? (
        <Flex direction="column" gap="md">
          <Alert variant="success">
            <AlertTitle>2FA is active</AlertTitle>
            <AlertDescription>
              Your account is protected with two-factor authentication.
              {hasBackupCodes && " You have backup codes saved."}
            </AlertDescription>
          </Alert>

          <Flex gap="sm">
            <Button variant="secondary" onClick={onOpenRegenerate}>
              <Icon icon={Key} size="sm" />
              Regenerate Backup Codes
            </Button>
            <Button variant="ghost" onClick={onOpenDisable}>
              Disable 2FA
            </Button>
          </Flex>
        </Flex>
      ) : (
        <Flex direction="column" gap="md">
          <Typography variant="small" color="secondary">
            Use an authenticator app to generate one-time codes for signing in. This provides better
            security than SMS-based verification.
          </Typography>

          <Button onClick={onBeginSetup} disabled={isLoading} className="self-start">
            {isLoading ? <LoadingSpinner size="sm" /> : "Enable 2FA"}
          </Button>
        </Flex>
      )}
    </Flex>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function TwoFactorSettings() {
  const status = useQuery(api.twoFactor.getStatus);
  const beginSetup = useMutation(api.twoFactor.beginSetup);
  const completeSetup = useMutation(api.twoFactor.completeSetup);
  const disable = useMutation(api.twoFactor.disable);
  const regenerateBackupCodes = useMutation(api.twoFactor.regenerateBackupCodes);

  const [step, setStep] = useState<SetupStep>("idle");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [regenerateCode, setRegenerateCode] = useState("");

  const resetState = useCallback(() => {
    setStep("idle");
    setVerificationCode("");
    setBackupCodes([]);
    setSecret("");
    setOtpauthUrl("");
  }, []);

  const handleBeginSetup = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await beginSetup();
      setSecret(result.secret);
      setOtpauthUrl(result.otpauthUrl);
      setStep("setup");
    } catch (error) {
      showError(error, "Failed to start 2FA setup");
    } finally {
      setIsLoading(false);
    }
  }, [beginSetup]);

  const handleVerifyCode = useCallback(async () => {
    if (verificationCode.length !== 6) {
      showError(new Error("Please enter a 6-digit code"), "Invalid code");
      return;
    }

    setIsLoading(true);
    try {
      const result = await completeSetup({ code: verificationCode });
      if (result.success && result.backupCodes) {
        setBackupCodes(result.backupCodes);
        setStep("backup");
        showSuccess("2FA enabled successfully!");
      } else {
        showError(new Error(result.error || "Verification failed"), "Invalid code");
      }
    } catch (error) {
      showError(error, "Failed to verify code");
    } finally {
      setIsLoading(false);
    }
  }, [completeSetup, verificationCode]);

  const handleDisable = useCallback(async () => {
    if (disableCode.length < 6) {
      showError(new Error("Please enter a valid code"), "Invalid code");
      return;
    }

    setIsLoading(true);
    try {
      const result = await disable({ code: disableCode, isBackupCode: useBackupCode });
      if (result.success) {
        showSuccess("2FA has been disabled");
        setDisableDialogOpen(false);
        setDisableCode("");
        setUseBackupCode(false);
      } else {
        showError(new Error(result.error || "Failed to disable 2FA"), "Error");
      }
    } catch (error) {
      showError(error, "Failed to disable 2FA");
    } finally {
      setIsLoading(false);
    }
  }, [disable, disableCode, useBackupCode]);

  const handleRegenerateBackupCodes = useCallback(async () => {
    if (regenerateCode.length !== 6) {
      showError(new Error("Please enter a 6-digit code"), "Invalid code");
      return;
    }

    setIsLoading(true);
    try {
      const result = await regenerateBackupCodes({ totpCode: regenerateCode });
      if (result.success && result.backupCodes) {
        setBackupCodes(result.backupCodes);
        setStep("backup");
        setRegenerateDialogOpen(false);
        setRegenerateCode("");
        showSuccess("New backup codes generated");
      } else {
        showError(new Error(result.error || "Failed to regenerate codes"), "Error");
      }
    } catch (error) {
      showError(error, "Failed to regenerate backup codes");
    } finally {
      setIsLoading(false);
    }
  }, [regenerateBackupCodes, regenerateCode]);

  const copyBackupCodes = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join("\n"));
      showSuccess("Backup codes copied to clipboard");
    } catch (error) {
      showError(error, "Failed to copy to clipboard");
    }
  }, [backupCodes]);

  useEffect(() => {
    if (status?.enabled && step === "backup") {
      // Keep showing backup codes if we just enabled
    } else if (step === "complete") {
      setStep("idle");
    }
  }, [status?.enabled, step]);

  if (status === undefined) {
    return <LoadingState />;
  }

  if (step === "backup" && backupCodes.length > 0) {
    return (
      <BackupCodesView backupCodes={backupCodes} onCopy={copyBackupCodes} onFinish={resetState} />
    );
  }

  if (step === "setup" || step === "verify") {
    return (
      <SetupWizard
        otpauthUrl={otpauthUrl}
        secret={secret}
        verificationCode={verificationCode}
        isLoading={isLoading}
        onCodeChange={setVerificationCode}
        onVerify={handleVerifyCode}
        onCancel={resetState}
      />
    );
  }

  return (
    <Card className="p-6">
      <StatusView
        enabled={status.enabled}
        hasBackupCodes={status.hasBackupCodes}
        isLoading={isLoading}
        onBeginSetup={handleBeginSetup}
        onOpenDisable={() => setDisableDialogOpen(true)}
        onOpenRegenerate={() => setRegenerateDialogOpen(true)}
      />

      <Dialog
        open={disableDialogOpen}
        onOpenChange={(open) => {
          setDisableDialogOpen(open);
          if (!open) {
            setDisableCode("");
            setUseBackupCode(false);
          }
        }}
        title="Disable Two-Factor Authentication"
        description="Enter your authenticator code or a backup code to disable 2FA"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDisableDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDisable} disabled={isLoading}>
              {isLoading ? <LoadingSpinner size="sm" /> : "Disable 2FA"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Flex align="center" gap="sm">
            <input
              type="checkbox"
              id="useBackupCode"
              checked={useBackupCode}
              onChange={(e) => setUseBackupCode(e.target.checked)}
              className="w-4 h-4 text-brand focus:ring-brand-ring focus:ring-2 rounded"
            />
            <label htmlFor="useBackupCode" className="text-sm cursor-pointer">
              Use backup code instead
            </label>
          </Flex>
          <Input
            label={useBackupCode ? "Backup Code" : "Authenticator Code"}
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value)}
            placeholder={useBackupCode ? "XXXX-XXXX" : "000000"}
            className="font-mono"
          />
        </div>
      </Dialog>

      <Dialog
        open={regenerateDialogOpen}
        onOpenChange={setRegenerateDialogOpen}
        title="Regenerate Backup Codes"
        description="Enter your authenticator code to generate new backup codes. This will invalidate all existing backup codes."
        footer={
          <>
            <Button variant="secondary" onClick={() => setRegenerateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRegenerateBackupCodes} disabled={isLoading}>
              {isLoading ? <LoadingSpinner size="sm" /> : "Generate New Codes"}
            </Button>
          </>
        }
      >
        <Input
          label="Authenticator Code"
          value={regenerateCode}
          onChange={(e) => setRegenerateCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          className="font-mono text-center tracking-widest"
          maxLength={6}
        />
      </Dialog>
    </Card>
  );
}
