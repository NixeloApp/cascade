import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { ReactNode } from "react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { act, renderHook, waitFor } from "@/test/custom-render";
import { showError, showSuccess } from "./toast";
import { useWebPush, WebPushProvider } from "./webPush";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("./toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockShowError = vi.mocked(showError);
const mockShowSuccess = vi.mocked(showSuccess);

const mockSubscribeMutation = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;
const mockUnsubscribeMutation = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;

const PUSH_ENDPOINT_STORAGE_KEY = "nixelo-push-endpoint";

function createSubscription(endpoint: string): PushSubscription {
  const p256dh = Uint8Array.from([1, 2, 3]).buffer;
  const auth = Uint8Array.from([4, 5, 6]).buffer;

  return {
    endpoint,
    expirationTime: null,
    options: {
      applicationServerKey: null,
      userVisibleOnly: true,
    },
    getKey: vi.fn((name: string) => {
      if (name === "p256dh") {
        return p256dh;
      }
      if (name === "auth") {
        return auth;
      }
      return null;
    }),
    toJSON: () => ({
      endpoint,
      expirationTime: null,
      keys: {
        auth: "BAUG",
        p256dh: "AQID",
      },
    }),
    unsubscribe: vi.fn().mockResolvedValue(true),
  } as PushSubscription;
}

function createWrapper(vapidPublicKey = "test-vapid-key") {
  return function WebPushTestProvider({ children }: { children: ReactNode }) {
    return <WebPushProvider vapidPublicKey={vapidPublicKey}>{children}</WebPushProvider>;
  };
}

describe("WebPushProvider", () => {
  const pushManager = {
    getSubscription: vi.fn<() => Promise<PushSubscription | null>>(),
    subscribe: vi.fn<() => Promise<PushSubscription>>(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();

    Object.defineProperty(window, "PushManager", {
      configurable: true,
      value: class PushManager {},
    });

    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: {
        permission: "granted",
        requestPermission: vi.fn().mockResolvedValue("granted"),
      },
    });

    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        ready: Promise.resolve({
          pushManager,
        }),
      },
    });

    let mutationCallCount = 0;
    const mutationResults = [
      {
        mutate: mockSubscribeMutation,
        canAct: true,
        isAuthLoading: false,
      },
      {
        mutate: mockUnsubscribeMutation,
        canAct: true,
        isAuthLoading: false,
      },
    ];
    mockUseAuthenticatedMutation.mockImplementation(() => {
      const result = mutationResults[mutationCallCount % mutationResults.length];
      mutationCallCount += 1;
      return result;
    });
    mockUseAuthenticatedQuery.mockReturnValue(false);
    mockSubscribeMutation.mockResolvedValue({ success: true });
    mockUnsubscribeMutation.mockResolvedValue({ success: true });
  });

  it("does not auto-subscribe a fresh browser just because another device is subscribed", async () => {
    pushManager.getSubscription.mockResolvedValue(null);
    mockUseAuthenticatedQuery.mockReturnValue(true);

    renderHook(() => useWebPush(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(pushManager.getSubscription).toHaveBeenCalledTimes(1));

    expect(pushManager.subscribe).not.toHaveBeenCalled();
    expect(mockSubscribeMutation).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(PUSH_ENDPOINT_STORAGE_KEY)).toBeNull();
  });

  it("recovers a lost subscription only when this browser previously had one", async () => {
    const previousEndpoint = "https://push.example.com/old-endpoint";
    const recoveredSubscription = createSubscription("https://push.example.com/new-endpoint");

    window.localStorage.setItem(PUSH_ENDPOINT_STORAGE_KEY, previousEndpoint);
    pushManager.getSubscription.mockResolvedValue(null);
    pushManager.subscribe.mockResolvedValue(recoveredSubscription);
    mockUseAuthenticatedQuery.mockReturnValue(true);

    const { result } = renderHook(() => useWebPush(), {
      wrapper: createWrapper(),
    });

    await waitFor(() =>
      expect(mockSubscribeMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: recoveredSubscription.endpoint,
          previousEndpoint,
        }),
      ),
    );

    expect(pushManager.subscribe).toHaveBeenCalledTimes(1);
    expect(result.current.isSubscribed).toBe(true);
    expect(window.localStorage.getItem(PUSH_ENDPOINT_STORAGE_KEY)).toBe(
      recoveredSubscription.endpoint,
    );
  });

  it("syncs a rotated browser subscription and removes the prior endpoint server-side", async () => {
    const previousEndpoint = "https://push.example.com/old-endpoint";
    const currentSubscription = createSubscription("https://push.example.com/current-endpoint");

    window.localStorage.setItem(PUSH_ENDPOINT_STORAGE_KEY, previousEndpoint);
    pushManager.getSubscription.mockResolvedValue(currentSubscription);
    mockUseAuthenticatedQuery.mockReturnValue(true);

    renderHook(() => useWebPush(), {
      wrapper: createWrapper(),
    });

    await waitFor(() =>
      expect(mockSubscribeMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: currentSubscription.endpoint,
          previousEndpoint,
        }),
      ),
    );

    expect(pushManager.subscribe).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(PUSH_ENDPOINT_STORAGE_KEY)).toBe(
      currentSubscription.endpoint,
    );
  });

  it("clears the stored endpoint after a successful unsubscribe", async () => {
    const currentSubscription = createSubscription("https://push.example.com/current-endpoint");

    window.localStorage.setItem(PUSH_ENDPOINT_STORAGE_KEY, currentSubscription.endpoint);
    pushManager.getSubscription.mockResolvedValue(currentSubscription);
    mockUseAuthenticatedQuery.mockReturnValue(true);

    const { result } = renderHook(() => useWebPush(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSubscribed).toBe(true));

    await act(async () => {
      await result.current.unsubscribe();
    });

    expect(currentSubscription.unsubscribe).toHaveBeenCalledTimes(1);
    expect(mockUnsubscribeMutation).toHaveBeenCalledWith({
      endpoint: currentSubscription.endpoint,
    });
    expect(window.localStorage.getItem(PUSH_ENDPOINT_STORAGE_KEY)).toBeNull();
    expect(mockShowSuccess).toHaveBeenCalledWith("Push notifications disabled");
    expect(mockShowError).not.toHaveBeenCalled();
  });
});
