import { useSyncExternalStore } from "react";
import {
  applySwUpdate,
  dismissSwUpdate,
  getSwUpdateSnapshot,
  subscribeToSwUpdate,
} from "@/lib/serviceWorker";

/**
 * Subscribe to service worker update availability and actions from React.
 */
export function useSwUpdate() {
  const snapshot = useSyncExternalStore(
    subscribeToSwUpdate,
    getSwUpdateSnapshot,
    getSwUpdateSnapshot,
  );

  return {
    ...snapshot,
    applyUpdate: applySwUpdate,
    dismissUpdate: dismissSwUpdate,
  };
}
