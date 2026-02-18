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

type SetupStep = "idle" | "setup" | "verify" | "backup" | "complete";

/**
 * Two-Factor Authentication settings component.
 * Allows users to enable/disable 2FA and manage backup codes.
 */
export function TwoFactorSettings() {
  const status = useQuery(api.twoFactor.getStatus);
  const beginSetup = useMutation(api.twoFactor.beginSetup);
  const completeSetup = useMutation(api.twoFactor.completeSetup);
  const disable = useMutation(api.twoFactor.disable);
  const regenerateBackupCodes = useMutation(api.twoFactor.regenerateBackupCodes);

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
      const result = await disable({
        code: disableCode,
        isBackupCode: disableCode.includes("-"),
      });
      if (result.success) {
        showSuccess("2FA has been disabled");
        setDisableDialogOpen(false);
        setDisableCode("");
      } else {
        showError(new Error(result.error || "Failed to disable 2FA"), "Error");
      }
    } catch (error) {
      showError(error, "Failed to disable 2FA");
    } finally {
      setIsLoading(false);
    }
  }, [disable, disableCode]);

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
    const codesText = backupCodes.join("\n");
    try {
      await navigator.clipboard.writeText(codesText);
      showSuccess("Backup codes copied to clipboard");
    } catch (error) {
      console.error("Failed to copy backup codes:", error);
      showError(error, "Failed to copy to clipboard");
    }
  }, [backupCodes]);

  const handleFinish = useCallback(() => {
    setStep("idle");
    setVerificationCode("");
    setBackupCodes([]);
    setSecret("");
    setOtpauthUrl("");
  }, []);

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
      <Card className="p-6">
        <Flex align="center" justify="center" className="py-4">
          <LoadingSpinner size="md" />
        </Flex>
      </Card>
    );
  }

  // Show backup codes after setup or regeneration
  if (step === "backup" && backupCodes.length > 0) {
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
            <Button onClick={copyBackupCodes} variant="secondary">
              <Icon icon={Copy} size="sm" />
              Copy Codes
            </Button>
            <Button onClick={handleFinish}>I&apos;ve Saved My Codes</Button>
          </Flex>
        </Flex>
      </Card>
    );
  }

  // Show setup wizard
  if (step === "setup" || step === "verify") {
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
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="font-mono text-center text-lg tracking-widest"
                maxLength={6}
              />
              <Button
                onClick={handleVerifyCode}
                disabled={isLoading || verificationCode.length !== 6}
              >
                {isLoading ? <LoadingSpinner size="sm" /> : "Verify"}
              </Button>
            </Flex>
          </div>

          <Button variant="ghost" onClick={handleFinish} className="self-start">
            Cancel Setup
          </Button>
        </Flex>
      </Card>
    );
  }

  // Show enabled/disabled status
  return (
    <Card className="p-6">
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
          <Badge variant={status.enabled ? "success" : "secondary"}>
            {status.enabled ? "Enabled" : "Disabled"}
          </Badge>
        </Flex>

        {status.enabled ? (
          <Flex direction="column" gap="md">
            <Alert variant="success">
              <AlertTitle>2FA is active</AlertTitle>
              <AlertDescription>
                Your account is protected with two-factor authentication.
                {status.hasBackupCodes && " You have backup codes saved."}
              </AlertDescription>
            </Alert>

            <Flex gap="sm">
              <Button variant="secondary" onClick={() => setRegenerateDialogOpen(true)}>
                <Icon icon={Key} size="sm" />
                Regenerate Backup Codes
              </Button>
              <Button variant="ghost" onClick={() => setDisableDialogOpen(true)}>
                Disable 2FA
              </Button>
            </Flex>
          </Flex>
        ) : (
          <Flex direction="column" gap="md">
            <Typography variant="small" color="secondary">
              Use an authenticator app to generate one-time codes for signing in. This provides
              better security than SMS-based verification.
            </Typography>

            <Button onClick={handleBeginSetup} disabled={isLoading} className="self-start">
              {isLoading ? <LoadingSpinner size="sm" /> : "Enable 2FA"}
            </Button>
          </Flex>
        )}
      </Flex>

      {/* Disable 2FA Dialog */}
      <Dialog
        open={disableDialogOpen}
        onOpenChange={setDisableDialogOpen}
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
        <Input
          label="Verification Code"
          value={disableCode}
          onChange={(e) => setDisableCode(e.target.value)}
          placeholder="6-digit code or backup code"
          className="font-mono"
        />
      </Dialog>

      {/* Regenerate Backup Codes Dialog */}
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
