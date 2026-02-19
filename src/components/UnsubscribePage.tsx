/**
 * Unsubscribe Page
 *
 * Allows users to unsubscribe from email notifications via one-click link.
 * Uses AuthPageLayout for consistent Mintlify-style auth page appearance.
 */

import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthPageLayout } from "@/components/Auth/AuthPageLayout";
import { Flex } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { Stack } from "@/components/ui/Stack";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { Typography } from "./ui/Typography";

interface UnsubscribePageProps {
  token: string;
}

export function UnsubscribePage({ token }: UnsubscribePageProps) {
  const [status, setStatus] = useState<"loading" | "success" | "error" | "invalid">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const getUserFromToken = useQuery(api.unsubscribe.getUserFromToken, { token });
  const unsubscribe = useMutation(api.unsubscribe.unsubscribe);

  useEffect(() => {
    if (getUserFromToken === undefined) return;

    if (getUserFromToken === null) {
      setStatus("invalid");
      return;
    }

    const doUnsubscribe = async () => {
      try {
        await unsubscribe({ token });
        setStatus("success");
      } catch (error) {
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Unknown error");
      }
    };

    void doUnsubscribe();
  }, [getUserFromToken, token, unsubscribe]);

  if (status === "loading") {
    return (
      <AuthPageLayout title="Unsubscribing...">
        <Stack align="center" gap="lg" className="py-8">
          <LoadingSpinner size="lg" />
          <Typography color="secondary">Processing your request</Typography>
        </Stack>
      </AuthPageLayout>
    );
  }

  if (status === "success") {
    return (
      <AuthPageLayout title="Unsubscribed">
        <Stack align="center" gap="lg" className="py-8">
          <Flex
            align="center"
            justify="center"
            className="w-12 h-12 rounded-full bg-status-success-bg"
          >
            <Icon icon={CheckCircle} size="lg" className="text-status-success" />
          </Flex>
          <Stack align="center" gap="sm">
            <Typography color="secondary">
              You've been unsubscribed from email notifications.
            </Typography>
            <Typography variant="muted">
              You can update preferences anytime in your account settings.
            </Typography>
          </Stack>
        </Stack>
      </AuthPageLayout>
    );
  }

  if (status === "invalid") {
    return (
      <AuthPageLayout title="Invalid link">
        <Stack align="center" gap="lg" className="py-8">
          <Flex
            align="center"
            justify="center"
            className="w-12 h-12 rounded-full bg-status-warning-bg"
          >
            <Icon icon={AlertTriangle} size="lg" className="text-status-warning" />
          </Flex>
          <Typography color="secondary" className="text-center">
            This unsubscribe link is invalid or has expired.
          </Typography>
        </Stack>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout title="Something went wrong">
      <Stack align="center" gap="lg" className="py-8">
        <Flex align="center" justify="center" className="w-12 h-12 rounded-full bg-status-error-bg">
          <Icon icon={XCircle} size="lg" className="text-status-error" />
        </Flex>
        <Typography color="secondary" className="text-center">
          We couldn't process your unsubscribe request.
        </Typography>
        {errorMessage && (
          <Typography variant="muted" className="text-center">
            {errorMessage}
          </Typography>
        )}
      </Stack>
    </AuthPageLayout>
  );
}
