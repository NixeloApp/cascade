import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const registerMock = vi.fn();
const readyRegistration = {
  unregister: vi.fn(),
};
const serviceWorkerController = {
  postMessage: vi.fn(),
};

const ONE_HOUR_MS = 3_600_000;

vi.mock("@convex/lib/timeUtils", () => ({
  HOUR: ONE_HOUR_MS,
}));

describe("serviceWorker helpers", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.useFakeTimers();

    Object.defineProperty(document, "readyState", {
      configurable: true,
      value: "complete",
    });

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
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
        register: registerMock,
        ready: Promise.resolve(readyRegistration),
        controller: serviceWorkerController,
        addEventListener: vi.fn(),
      },
    });

    registerMock.mockResolvedValue({
      update: vi.fn(),
      installing: null,
      addEventListener: vi.fn(),
    });

    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("registers immediately when the page is already loaded", async () => {
    const serviceWorker = await import("./serviceWorker");

    serviceWorker.register();
    await Promise.resolve();

    expect(registerMock).toHaveBeenCalledWith("/service-worker.js");
  });

  it("posts CLEAR_CACHE to the active controller", async () => {
    const serviceWorker = await import("./serviceWorker");

    serviceWorker.clearCache();

    expect(serviceWorkerController.postMessage).toHaveBeenCalledWith({
      type: "CLEAR_CACHE",
    });
  });

  it("tracks install prompt availability and stores dismissal state", async () => {
    const serviceWorker = await import("./serviceWorker");

    serviceWorker.ensureInstallPromptTracking();
    serviceWorker.ensureInstallPromptTracking();

    const promptEvent = new Event("beforeinstallprompt");
    Object.defineProperty(promptEvent, "preventDefault", {
      value: vi.fn(),
    });
    Object.defineProperty(promptEvent, "prompt", {
      value: vi.fn().mockResolvedValue(undefined),
    });
    Object.defineProperty(promptEvent, "userChoice", {
      value: Promise.resolve({ outcome: "dismissed" }),
    });

    window.dispatchEvent(promptEvent);

    expect(serviceWorker.getPwaInstallSnapshot()).toEqual({
      canInstall: true,
      isPrompting: false,
    });
    expect(window.localStorage.getItem).toHaveBeenCalledWith("pwa-install-dismissed");

    serviceWorker.dismissPwaInstall();

    expect(window.localStorage.setItem).toHaveBeenCalledWith("pwa-install-dismissed", "true");
    expect(serviceWorker.getPwaInstallSnapshot()).toEqual({
      canInstall: false,
      isPrompting: false,
    });
  });

  it("tracks update availability and posts SKIP_WAITING when applied", async () => {
    const serviceWorker = await import("./serviceWorker");

    const listeners = new Map<string, EventListener>();
    const waitingWorkerPostMessage = vi.fn();
    const installingWorker = {
      state: "installing",
      addEventListener: vi.fn((event: string, listener: EventListener) => {
        listeners.set(event, listener);
      }),
    };
    const registrationListenerMap = new Map<string, EventListener>();

    const mockRegistration = {
      update: vi.fn(),
      installing: installingWorker,
      waiting: { postMessage: waitingWorkerPostMessage },
      addEventListener: vi.fn((event: string, listener: EventListener) => {
        registrationListenerMap.set(event, listener);
      }),
    };

    registerMock.mockResolvedValue(mockRegistration);

    serviceWorker.register();
    await Promise.resolve();

    registrationListenerMap.get("updatefound")?.(new Event("updatefound"));
    installingWorker.state = "installed";
    listeners.get("statechange")?.(new Event("statechange"));
    listeners.get("statechange")?.(new Event("statechange"));

    expect(serviceWorker.getSwUpdateSnapshot()).toEqual({
      isUpdateAvailable: true,
    });

    expect(serviceWorker.applySwUpdate()).toBe(true);

    expect(waitingWorkerPostMessage).toHaveBeenCalledWith({
      type: "SKIP_WAITING",
    });
    expect(serviceWorker.getSwUpdateSnapshot()).toEqual({
      isUpdateAvailable: false,
    });
  });
});
