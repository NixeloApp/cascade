/**
 * Web Push Notifications Context & Hook
 *
 * Provides React components for managing push notification subscriptions.
 * Cal.com parity - enables desktop/mobile push notifications for PWA.
 */

import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { showError, showSuccess } from "@/lib/toast";

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

// ============================================================================
// Utilities
// ============================================================================

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

// ============================================================================
// Provider
// ============================================================================

export function WebPushProvider({ children, vapidPublicKey }: WebPushProviderProps) {
  // State
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "denied",
  );
  const [pushManager, setPushManager] = useState<PushManager | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<PushSubscription | null>(null);

  // Convex mutations
  const subscribeMutation = useMutation(api.pushNotifications.subscribe);
  const unsubscribeMutation = useMutation(api.pushNotifications.unsubscribe);

  // Check if push is supported
  const isSupported = useMemo(
    () =>
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window,
    [],
  );

  // Initialize service worker and check subscription
  useEffect(() => {
    if (!isSupported) return;

    const initServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        if ("pushManager" in registration) {
          setPushManager(registration.pushManager);

          // Check for existing subscription
          const subscription = await registration.pushManager.getSubscription();
          setCurrentSubscription(subscription);
        }
      } catch (error) {
        console.error("Failed to initialize push manager:", error);
      }
    };

    initServiceWorker();
  }, [isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!isSupported || !pushManager || !vapidPublicKey) {
      showError("Push notifications are not supported in this browser");
      return;
    }

    setIsLoading(true);
    try {
      // Request notification permission
      const newPermission = await Notification.requestPermission();
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

      // Extract keys from subscription
      const p256dh = subscription.getKey("p256dh");
      const auth = subscription.getKey("auth");

      if (!p256dh || !auth) {
        throw new Error("Failed to get push subscription keys");
      }

      // Convert ArrayBuffer to base64 string
      const p256dhBase64 = btoa(String.fromCharCode(...new Uint8Array(p256dh)));
      const authBase64 = btoa(String.fromCharCode(...new Uint8Array(auth)));

      // Save subscription to server
      await subscribeMutation({
        endpoint: subscription.endpoint,
        p256dh: p256dhBase64,
        auth: authBase64,
        expirationTime: subscription.expirationTime ?? undefined,
        userAgent: navigator.userAgent,
      });

      showSuccess("Push notifications enabled");
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error);
      showError(error, "Failed to enable push notifications");
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, pushManager, vapidPublicKey, subscribeMutation]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!currentSubscription) return;

    setIsLoading(true);
    try {
      // Unsubscribe from push manager
      await currentSubscription.unsubscribe();

      // Remove from server
      await unsubscribeMutation({
        endpoint: currentSubscription.endpoint,
      });

      setCurrentSubscription(null);
      showSuccess("Push notifications disabled");
    } catch (error) {
      console.error("Failed to unsubscribe from push notifications:", error);
      showError(error, "Failed to disable push notifications");
    } finally {
      setIsLoading(false);
    }
  }, [currentSubscription, unsubscribeMutation]);

  // Context value
  const value = useMemo<WebPushContextValue>(
    () => ({
      permission,
      isSupported,
      isLoading,
      isSubscribed: !!currentSubscription,
      subscribe,
      unsubscribe,
    }),
    [permission, isSupported, isLoading, currentSubscription, subscribe, unsubscribe],
  );

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
  return import.meta.env.VITE_VAPID_PUBLIC_KEY;
}
