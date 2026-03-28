import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { useSwUpdate } from "@/hooks/useSwUpdate";
import { cn } from "@/lib/utils";

interface PwaBannerShellProps {
  actions: ReactNode;
  body: string;
  className?: string;
  title: string;
}

function PwaBannerShell({ actions, body, className, title }: PwaBannerShellProps) {
  return (
    <Card
      variant="elevated"
      padding="md"
      radius="full"
      className={cn(
        "fixed inset-x-4 z-toast-critical mx-auto border-ui-border-secondary/90 shadow-elevated md:inset-x-auto md:left-1/2 md:w-full md:max-w-xl md:-translate-x-1/2",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Flex direction="column" gap="md" directionSm="row" alignSm="center" justifySm="between">
        <Stack gap="xs" className="min-w-0">
          <Typography variant="label">{title}</Typography>
          <Typography variant="small" color="secondary">
            {body}
          </Typography>
        </Stack>
        <Flex gap="sm" wrap className="shrink-0">
          {actions}
        </Flex>
      </Flex>
    </Card>
  );
}

/**
 * Render the app-shell install and update banners from the shared PWA hooks.
 */
export function PwaBanners() {
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);
  const { canInstall, dismissInstallPrompt, isPrompting, promptInstall } = usePwaInstall();
  const { applyUpdate, dismissUpdate, isUpdateAvailable } = useSwUpdate();

  useEffect(() => {
    if (!isUpdateAvailable) {
      setIsApplyingUpdate(false);
    }
  }, [isUpdateAvailable]);

  const handleInstall = async () => {
    await promptInstall();
  };

  const handleUpdate = () => {
    const didApply = applyUpdate();
    if (didApply) {
      setIsApplyingUpdate(true);
    }
  };

  return (
    <>
      {canInstall ? (
        <PwaBannerShell
          className="top-4 border-brand-border/60"
          title="Install Nixelo"
          body="Add Nixelo to your device for faster launches and a more app-like experience."
          actions={
            <>
              <Button variant="primary" onClick={handleInstall} isLoading={isPrompting}>
                Install
              </Button>
              <Button variant="outline" onClick={dismissInstallPrompt}>
                Not now
              </Button>
            </>
          }
        />
      ) : null}

      {isUpdateAvailable ? (
        <PwaBannerShell
          className="bottom-4"
          title="Update available"
          body="A newer version of Nixelo is ready. Refresh into the latest service worker when you’re ready."
          actions={
            <>
              <Button variant="primary" onClick={handleUpdate} isLoading={isApplyingUpdate}>
                Update now
              </Button>
              <Button variant="outline" onClick={dismissUpdate}>
                Later
              </Button>
            </>
          }
        />
      ) : null}
    </>
  );
}
