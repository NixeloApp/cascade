import { WifiOff } from "lucide-react";
import { Flex } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";
import { useOnlineStatus } from "@/hooks/useOffline";

/**
 * Banner displayed when the app is offline.
 * Shows at the top of the app to inform users they're working offline.
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <Flex
      align="center"
      justify="center"
      gap="sm"
      className="bg-status-warning-bg text-status-warning-text px-4 py-2 animate-slide-up"
    >
      <WifiOff className="h-4 w-4" />
      <Typography variant="small" className="font-medium">
        You're offline. Changes will sync when you reconnect.
      </Typography>
    </Flex>
  );
}
