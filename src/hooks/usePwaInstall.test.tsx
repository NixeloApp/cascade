import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@/test/custom-render";

function createBeforeInstallPromptEvent(outcome: "accepted" | "dismissed" = "accepted") {
  const prompt = vi.fn().mockResolvedValue(undefined);
  const promptEvent = new Event("beforeinstallprompt");

  Object.defineProperty(promptEvent, "preventDefault", {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(promptEvent, "prompt", {
    configurable: true,
    value: prompt,
  });
  Object.defineProperty(promptEvent, "userChoice", {
    configurable: true,
    value: Promise.resolve({ outcome }),
  });

  return { prompt, promptEvent };
}

describe("usePwaInstall", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: vi.fn(() => null),
        removeItem: vi.fn(),
        setItem: vi.fn(),
      },
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("tracks install prompt availability and persists dismissals", async () => {
    const { usePwaInstall } = await import("./usePwaInstall");
    const { result } = renderHook(() => usePwaInstall());
    const { promptEvent } = createBeforeInstallPromptEvent();

    await act(async () => {
      window.dispatchEvent(promptEvent);
    });

    expect(result.current.canInstall).toBe(true);

    await act(async () => {
      result.current.dismissInstallPrompt();
    });

    expect(result.current.canInstall).toBe(false);
    expect(window.localStorage.setItem).toHaveBeenCalledWith("pwa-install-dismissed", "true");
  });

  it("forwards prompt requests to the deferred browser event", async () => {
    const { usePwaInstall } = await import("./usePwaInstall");
    const { result } = renderHook(() => usePwaInstall());
    const { prompt, promptEvent } = createBeforeInstallPromptEvent();

    await act(async () => {
      window.dispatchEvent(promptEvent);
    });

    await act(async () => {
      await result.current.promptInstall();
    });

    await waitFor(() => {
      expect(prompt).toHaveBeenCalledTimes(1);
    });
    expect(result.current.canInstall).toBe(false);
  });
});
