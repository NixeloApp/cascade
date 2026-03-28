import { useEffect, useSyncExternalStore } from "react";
import {
  dismissPwaInstall,
  ensureInstallPromptTracking,
  getPwaInstallSnapshot,
  promptToInstallPwa,
  subscribeToPwaInstall,
} from "@/lib/serviceWorker";

/**
 * Subscribe to the browser install-prompt lifecycle through a React-friendly API.
 */
export function usePwaInstall() {
  const snapshot = useSyncExternalStore(
    subscribeToPwaInstall,
    getPwaInstallSnapshot,
    getPwaInstallSnapshot,
  );

  useEffect(() => {
    ensureInstallPromptTracking();
  }, []);

  return {
    ...snapshot,
    dismissInstallPrompt: dismissPwaInstall,
    promptInstall: promptToInstallPwa,
  };
}
