/**
 * Web Push Notifications Context & Hook
 *
 * Provides React components for managing push notification subscriptions.
 * Cal.com parity - enables desktop/mobile push notifications for PWA.
 */

import { api } from "@convex/_generated/api";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "./toast";

declare global {
  interface Window {
    /**
     * Narrow E2E-only overrides for preview/runtime tests.
     * These exist because Playwright cannot reliably force real browser-level
     * notification permission and PushManager support transitions in CI.
     * See docs/guides/pwa.md for the current justification of each hook.
     */
    __NIXELO_E2E_NOTIFICATION_PERMISSION__?: NotificationPermission;
    __NIXELO_E2E_WEB_PUSH_SUPPORTED__?: boolean;
    __NIXELO_E2E_VAPID_PUBLIC_KEY__?: string;
  }
}

// ============================================================================
// Types
// ============================================================================

interface WebPushContextValue {
  /** Browser notification permission status */
  permission: NotificationPermission;
  /** Whether push manager is available */
  isSupported: boolean;
  /** Whether currently subscribing/unsubscribing */
  isLoading: boolean;
  /** Whether user has an active push subscription */
  isSubscribed: boolean;
  /** Subscribe to push notifications */
  subscribe: () => Promise<void>;
  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<void>;
}

interface WebPushProviderProps {
  children: React.ReactNode;
  /** VAPID public key for push subscription */
  vapidPublicKey?: string;
}

// ============================================================================
// Context
// ============================================================================

const WebPushContext = createContext<WebPushContextValue | null>(null);

const PUSH_ENDPOINT_STORAGE_KEY = "nixelo-push-endpoint";

interface SubscribeMutationArgs {
  endpoint: string;
  p256dh: string;
  auth: string;
  expirationTime?: number;
  previousEndpoint?: string;
  userAgent: string;
}

type SubscribeMutation = (args: SubscribeMutationArgs) => Promise<unknown>;
type UnsubscribeMutation = (args: { endpoint: string }) => Promise<unknown>;

// ============================================================================
// Utilities
// ============================================================================

/**
 * Attempt to recover a push subscription that the browser lost (e.g. after SW
 * replacement). Only runs when the server still has a record and the browser
 * has granted permission.
 */
async function recoverLostSubscription(
  pushManager: PushManager,
  vapidPublicKey: string,
  subscribeMutation: SubscribeMutation,
  previousEndpoint?: string,
): Promise<PushSubscription | null> {
  if (getBrowserNotificationPermission() !== "granted") return null;

  console.info("[push] Subscription lost after SW update, re-subscribing...");
  const keyArray = urlBase64ToUint8Array(vapidPublicKey);
  const recovered = await pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: keyArray.buffer as ArrayBuffer,
  });

  const p256dh = recovered.getKey("p256dh");
  const auth = recovered.getKey("auth");
  if (!p256dh || !auth) {
    // Keys missing — unsubscribe to avoid inconsistent state where
    // the browser has a subscription but the server doesn't know about it.
    await recovered.unsubscribe();
    return null;
  }

  await subscribeMutation({
    endpoint: recovered.endpoint,
    p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dh))),
    auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
    expirationTime: recovered.expirationTime ?? undefined,
    previousEndpoint:
      previousEndpoint && previousEndpoint !== recovered.endpoint ? previousEndpoint : undefined,
    userAgent: navigator.userAgent,
  });
  console.info("[push] Subscription recovered successfully");
  return recovered;
}

/**
 * Convert VAPID public key from base64 to Uint8Array
 * Required by PushManager.subscribe()
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function getNotificationPermissionOverride(): NotificationPermission | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.__NIXELO_E2E_NOTIFICATION_PERMISSION__;
}

function getWebPushSupportOverride(): boolean | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.__NIXELO_E2E_WEB_PUSH_SUPPORTED__;
}

function isWebPushSupported(): boolean {
  const supportOverride = getWebPushSupportOverride();
  if (supportOverride !== undefined) {
    return supportOverride;
  }

  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function getBrowserNotificationPermission(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }

  return getNotificationPermissionOverride() ?? Notification.permission;
}

function readStoredPushEndpoint(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(PUSH_ENDPOINT_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredPushEndpoint(endpoint: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(PUSH_ENDPOINT_STORAGE_KEY, endpoint);
  } catch {
    // Best-effort only. The server mutation is the source of truth.
  }
}

function clearStoredPushEndpoint() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(PUSH_ENDPOINT_STORAGE_KEY);
  } catch {
    // Best-effort only. Failure here should not block user actions.
  }
}

function getSubscriptionMutationArgs(
  subscription: PushSubscription,
  previousEndpoint?: string,
): SubscribeMutationArgs | null {
  const p256dh = subscription.getKey("p256dh");
  const auth = subscription.getKey("auth");

  if (!p256dh || !auth) {
    return null;
  }

  return {
    endpoint: subscription.endpoint,
    p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dh))),
    auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
    expirationTime: subscription.expirationTime ?? undefined,
    previousEndpoint:
      previousEndpoint && previousEndpoint !== subscription.endpoint ? previousEndpoint : undefined,
    userAgent: navigator.userAgent,
  };
}

async function syncSubscriptionRecord(
  subscription: PushSubscription,
  subscribeMutation: SubscribeMutation,
  previousEndpoint?: string,
) {
  const mutationArgs = getSubscriptionMutationArgs(subscription, previousEndpoint);
  if (!mutationArgs) {
    throw new Error("Failed to get push subscription keys");
  }

  await subscribeMutation(mutationArgs);
}

async function cleanupStoredSubscription(
  previousEndpoint: string | null,
  unsubscribeMutation: UnsubscribeMutation,
) {
  if (!previousEndpoint) {
    clearStoredPushEndpoint();
    return;
  }

  await unsubscribeMutation({ endpoint: previousEndpoint });
  clearStoredPushEndpoint();
}

async function syncCurrentBrowserSubscription(args: {
  previousEndpoint: string | null;
  serverHasSubscription: boolean | undefined;
  subscribeMutation: SubscribeMutation;
  subscription: PushSubscription;
}) {
  const { previousEndpoint, serverHasSubscription, subscribeMutation, subscription } = args;

  if (
    previousEndpoint !== subscription.endpoint ||
    previousEndpoint === null ||
    !serverHasSubscription
  ) {
    await syncSubscriptionRecord(subscription, subscribeMutation, previousEndpoint ?? undefined);
  }

  writeStoredPushEndpoint(subscription.endpoint);
}

async function recoverOrCleanupBrowserSubscription(args: {
  previousEndpoint: string | null;
  pushManager: PushManager;
  subscribeMutation: SubscribeMutation;
  unsubscribeMutation: UnsubscribeMutation;
  vapidPublicKey?: string;
}) {
  const { previousEndpoint, pushManager, subscribeMutation, unsubscribeMutation, vapidPublicKey } =
    args;

  if (previousEndpoint && vapidPublicKey) {
    const recovered = await recoverLostSubscription(
      pushManager,
      vapidPublicKey,
      subscribeMutation,
      previousEndpoint,
    );
    if (recovered) {
      writeStoredPushEndpoint(recovered.endpoint);
      return recovered;
    }
  }

  if (previousEndpoint) {
    await cleanupStoredSubscription(previousEndpoint, unsubscribeMutation);
  }

  return null;
}

async function initializeBrowserPushState(args: {
  isCancelled: () => boolean;
  serverHasSubscription: boolean | undefined;
  setCurrentSubscription: (subscription: PushSubscription | null) => void;
  setPushManager: (pushManager: PushManager) => void;
  subscribeMutation: SubscribeMutation;
  unsubscribeMutation: UnsubscribeMutation;
  vapidPublicKey?: string;
}) {
  const {
    isCancelled,
    serverHasSubscription,
    setCurrentSubscription,
    setPushManager,
    subscribeMutation,
    unsubscribeMutation,
    vapidPublicKey,
  } = args;

  const registration = await navigator.serviceWorker.ready;
  if (!("pushManager" in registration) || isCancelled()) {
    return;
  }

  setPushManager(registration.pushManager);
  const previousEndpoint = readStoredPushEndpoint();
  const subscription = await registration.pushManager.getSubscription();
  if (isCancelled()) {
    return;
  }

  setCurrentSubscription(subscription);
  if (subscription) {
    await syncCurrentBrowserSubscription({
      previousEndpoint,
      serverHasSubscription,
      subscribeMutation,
      subscription,
    });
    return;
  }

  const recovered = await recoverOrCleanupBrowserSubscription({
    previousEndpoint,
    pushManager: registration.pushManager,
    subscribeMutation,
    unsubscribeMutation,
    vapidPublicKey,
  });
  if (!isCancelled() && recovered) {
    setCurrentSubscription(recovered);
  }
}

// ============================================================================
// Provider
// ============================================================================

export function WebPushProvider({ children, vapidPublicKey }: WebPushProviderProps) {
  // State
  const [permission, setPermission] = useState<NotificationPermission>(
    getBrowserNotificationPermission,
  );
  const [pushManager, setPushManager] = useState<PushManager | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<PushSubscription | null>(null);

  // Convex mutations
  const { mutate: subscribeMutation } = useAuthenticatedMutation(api.pushNotifications.subscribe);
  const { mutate: unsubscribeMutation } = useAuthenticatedMutation(
    api.pushNotifications.unsubscribe,
  );

  // Check if push is supported
  const isSupported = isWebPushSupported();

  // Server-side subscription state for recovery detection
  const serverHasSubscription = useAuthenticatedQuery(api.pushNotifications.hasSubscription, {});

  // Initialize service worker and check subscription
  useEffect(() => {
    if (!isSupported) return;

    let isCancelled = false;

    const initServiceWorker = async () => {
      try {
        await initializeBrowserPushState({
          isCancelled: () => isCancelled,
          serverHasSubscription,
          setCurrentSubscription,
          setPushManager,
          subscribeMutation,
          unsubscribeMutation,
          vapidPublicKey,
        });
      } catch (error) {
        console.info("[push] Failed to initialize push manager:", error);
      }
    };

    initServiceWorker();

    return () => {
      isCancelled = true;
    };
  }, [isSupported, serverHasSubscription, subscribeMutation, unsubscribeMutation, vapidPublicKey]);

  // Subscribe to push notifications
  const subscribe = async () => {
    if (!isSupported || !pushManager || !vapidPublicKey) {
      showError("Push notifications are not supported in this browser");
      return;
    }

    setIsLoading(true);
    try {
      // Request notification permission
      const newPermission =
        getNotificationPermissionOverride() ?? (await Notification.requestPermission());
      setPermission(newPermission);

      if (newPermission !== "granted") {
        showError("Notification permission denied");
        return;
      }

      // Subscribe to push manager
      const keyArray = urlBase64ToUint8Array(vapidPublicKey);
      const subscription = await pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyArray.buffer as ArrayBuffer,
      });

      setCurrentSubscription(subscription);
      await syncSubscriptionRecord(
        subscription,
        subscribeMutation,
        readStoredPushEndpoint() ?? currentSubscription?.endpoint,
      );
      writeStoredPushEndpoint(subscription.endpoint);

      showSuccess("Push notifications enabled");
    } catch (error) {
      showError(error, "Failed to enable push notifications");
    } finally {
      setIsLoading(false);
    }
  };

  // Unsubscribe from push notifications
  const unsubscribe = async () => {
    if (!currentSubscription) return;

    setIsLoading(true);
    try {
      const endpoint = currentSubscription.endpoint;

      // Unsubscribe from push manager
      await currentSubscription.unsubscribe();
      setCurrentSubscription(null);

      // Remove from server
      await unsubscribeMutation({ endpoint });

      clearStoredPushEndpoint();
      showSuccess("Push notifications disabled");
    } catch (error) {
      showError(error, "Failed to disable push notifications");
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const value: WebPushContextValue = {
    permission,
    isSupported,
    isLoading,
    isSubscribed: !!currentSubscription,
    subscribe,
    unsubscribe,
  };

  return <WebPushContext.Provider value={value}>{children}</WebPushContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access web push notification functionality
 * Must be used within a WebPushProvider
 */
export function useWebPush(): WebPushContextValue {
  const context = useContext(WebPushContext);
  if (!context) {
    throw new Error("useWebPush must be used within a WebPushProvider");
  }
  return context;
}

// ============================================================================
// Export VAPID key getter
// ============================================================================

/**
 * Get VAPID public key from environment
 * Must be set in VITE_VAPID_PUBLIC_KEY
 */
export function getVapidPublicKey(): string | undefined {
  // Preview/runtime E2E can inject a deterministic key without requiring the
  // full production env surface inside Playwright.
  if (typeof window !== "undefined" && window.__NIXELO_E2E_VAPID_PUBLIC_KEY__) {
    return window.__NIXELO_E2E_VAPID_PUBLIC_KEY__;
  }

  return import.meta.env.VITE_VAPID_PUBLIC_KEY;
}
