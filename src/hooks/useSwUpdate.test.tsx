import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@/test/custom-render";

const registerMock = vi.fn();
const readyRegistration = {
  unregister: vi.fn(),
};
const serviceWorkerController = {
  postMessage: vi.fn(),
};

describe("useSwUpdate", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    Object.defineProperty(document, "readyState", {
      configurable: true,
      value: "complete",
    });

    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        reload: vi.fn(),
      },
    });

    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        addEventListener: vi.fn(),
        controller: serviceWorkerController,
        ready: Promise.resolve(readyRegistration),
        register: registerMock,
      },
    });
  });

  it("tracks waiting updates and applies them through the hook API", async () => {
    const { useSwUpdate } = await import("./useSwUpdate");
    const serviceWorker = await import("@/lib/serviceWorker");
    const registrationListeners = new Map<string, EventListener>();
    const stateListeners = new Map<string, EventListener>();
    const waitingWorkerPostMessage = vi.fn();
    const installingWorker = {
      state: "installing",
      addEventListener: vi.fn((event: string, listener: EventListener) => {
        stateListeners.set(event, listener);
      }),
    };

    registerMock.mockResolvedValue({
      addEventListener: vi.fn((event: string, listener: EventListener) => {
        registrationListeners.set(event, listener);
      }),
      installing: installingWorker,
      update: vi.fn(),
      waiting: { postMessage: waitingWorkerPostMessage },
    });

    const { result } = renderHook(() => useSwUpdate());

    await act(async () => {
      serviceWorker.register();
      await Promise.resolve();
    });

    await act(async () => {
      registrationListeners.get("updatefound")?.(new Event("updatefound"));
      installingWorker.state = "installed";
      stateListeners.get("statechange")?.(new Event("statechange"));
    });

    expect(result.current.isUpdateAvailable).toBe(true);

    await act(async () => {
      result.current.applyUpdate();
    });

    expect(waitingWorkerPostMessage).toHaveBeenCalledWith({
      type: "SKIP_WAITING",
    });
    expect(result.current.isUpdateAvailable).toBe(false);
  });
});
