/**
 * Unsubscribe Page
 *
 * Allows users to unsubscribe from email notifications via one-click link.
 * Uses AuthPageLayout for consistent Mintlify-style auth page appearance.
 */

import { api } from "@convex/_generated/api";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthPageLayout } from "@/components/Auth/AuthPageLayout";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { IconCircle } from "@/components/ui/IconCircle";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { usePublicMutation, usePublicQuery } from "@/hooks/useConvexHelpers";

interface UnsubscribePageProps {
  token: string;
}

export function UnsubscribePage({ token }: UnsubscribePageProps) {
  const [status, setStatus] = useState<"loading" | "success" | "error" | "invalid">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  // Public endpoints - unsubscribe works without auth via email link
  const getUserFromToken = usePublicQuery(api.unsubscribe.getUserFromToken, { token });
  const { mutate: unsubscribe } = usePublicMutation(api.unsubscribe.unsubscribe);

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
        <Card padding="xl" variant="ghost">
          <Stack align="center" gap="lg">
            <LoadingSpinner size="lg" />
            <Typography color="secondary">Processing your request</Typography>
          </Stack>
        </Card>
      </AuthPageLayout>
    );
  }

  if (status === "success") {
    return (
      <AuthPageLayout title="Unsubscribed">
        <Card padding="xl" variant="ghost">
          <Stack align="center" gap="lg">
            <IconCircle size="md" variant="success">
              <Icon icon={CheckCircle} size="lg" tone="success" />
            </IconCircle>
            <Stack align="center" gap="sm">
              <Typography color="secondary">
                You've been unsubscribed from email notifications.
              </Typography>
              <Typography variant="muted">
                You can update preferences anytime in your account settings.
              </Typography>
            </Stack>
          </Stack>
        </Card>
      </AuthPageLayout>
    );
  }

  if (status === "invalid") {
    return (
      <AuthPageLayout title="Invalid link">
        <Card padding="xl" variant="ghost">
          <Stack align="center" gap="lg">
            <IconCircle size="md" variant="warning">
              <Icon icon={AlertTriangle} size="lg" tone="warning" />
            </IconCircle>
            <Typography color="secondary" className="text-center">
              This unsubscribe link is invalid or has expired.
            </Typography>
          </Stack>
        </Card>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout title="Something went wrong">
      <Card padding="xl" variant="ghost">
        <Stack align="center" gap="lg">
          <IconCircle size="md" variant="error">
            <Icon icon={XCircle} size="lg" tone="error" />
          </IconCircle>
          <Typography color="secondary" className="text-center">
            We couldn't process your unsubscribe request.
          </Typography>
          {errorMessage && (
            <Typography variant="muted" className="text-center">
              {errorMessage}
            </Typography>
          )}
        </Stack>
      </Card>
    </AuthPageLayout>
  );
}
