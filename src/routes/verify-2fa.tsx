import { api } from "@convex/_generated/api";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Input } from "@/components/ui/form";
import { Icon } from "@/components/ui/Icon";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";
import { ShieldCheck } from "@/lib/icons";
import { showError } from "@/lib/toast";

export const Route = createFileRoute("/verify-2fa")({
  component: Verify2FARoute,
  ssr: false,
});

function Verify2FARoute() {
  const navigate = useNavigate();
  const redirectPath = useQuery(api.auth.getRedirectDestination);
  const verifyCode = useMutation(api.twoFactor.verifyCode);
  const verifyBackupCode = useMutation(api.twoFactor.verifyBackupCode);

  const [code, setCode] = useState("");
  const [isBackupCode, setIsBackupCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // If redirect path changes to something other than /verify-2fa, navigate there
  // This happens after successful 2FA verification
  useEffect(() => {
    if (redirectPath && redirectPath !== ROUTES.verify2FA.path) {
      navigate({ to: redirectPath, replace: true });
    }
  }, [redirectPath, navigate]);

  const handleVerify = async () => {
    if (code.length < 6) {
      showError(new Error("Please enter a valid code"), "Invalid code");
      return;
    }

    setIsLoading(true);
    try {
      if (isBackupCode) {
        const result = await verifyBackupCode({ code });
        if (!result.success) {
          const failure = result as { error?: string };
          showError(new Error(failure.error || "Invalid backup code"), "Verification failed");
          setIsLoading(false);
          return;
        }
        // After successful verification, the redirectPath query will update
        // and redirect will happen automatically via the effect above
      } else {
        const result = await verifyCode({ code });
        if (!result.success) {
          const failure = result as { error?: string };
          showError(new Error(failure.error || "Invalid code"), "Verification failed");
          setIsLoading(false);
          return;
        }
      }
      // Query will re-run and redirect us
    } catch (error) {
      showError(error, "Failed to verify code");
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && code.length >= 6) {
      handleVerify();
    }
  };

  return (
    <Flex align="center" justify="center" className="min-h-screen bg-ui-bg-secondary p-4">
      <Card className="w-full max-w-md p-8">
        <Flex direction="column" align="center" gap="lg">
          <Flex align="center" justify="center" className="w-16 h-16 rounded-full bg-brand-subtle">
            <Icon icon={ShieldCheck} size="xl" className="text-brand" />
          </Flex>

          <div className="text-center">
            <Typography variant="h3" className="mb-2">
              Two-Factor Authentication
            </Typography>
            <Typography variant="small" color="secondary">
              {isBackupCode
                ? "Enter one of your backup codes to continue"
                : "Enter the 6-digit code from your authenticator app"}
            </Typography>
          </div>

          <div className="w-full">
            <Input
              value={code}
              onChange={(e) =>
                setCode(
                  isBackupCode
                    ? e.target.value.toUpperCase()
                    : e.target.value.replace(/\D/g, "").slice(0, 6),
                )
              }
              onKeyDown={handleKeyDown}
              placeholder={isBackupCode ? "XXXX-XXXX" : "000000"}
              className="font-mono text-center text-xl tracking-widest"
              maxLength={isBackupCode ? 9 : 6}
              autoFocus
            />
          </div>

          <Button
            onClick={handleVerify}
            disabled={isLoading || code.length < 6}
            className="w-full"
            size="lg"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : "Verify"}
          </Button>

          <div className="w-full border-t border-ui-border pt-4">
            {isBackupCode ? (
              <Button
                variant="ghost"
                onClick={() => {
                  setIsBackupCode(false);
                  setCode("");
                }}
                className="w-full"
              >
                Use authenticator app instead
              </Button>
            ) : (
              <Flex direction="column" gap="sm">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsBackupCode(true);
                    setCode("");
                  }}
                  className="w-full"
                >
                  Use a backup code
                </Button>

                <Alert variant="info">
                  <AlertTitle>Lost your authenticator?</AlertTitle>
                  <AlertDescription>
                    Use one of the backup codes you saved when setting up 2FA. If you don't have
                    your backup codes, contact support.
                  </AlertDescription>
                </Alert>
              </Flex>
            )}
          </div>
        </Flex>
      </Card>
    </Flex>
  );
}
