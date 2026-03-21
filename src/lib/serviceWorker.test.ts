import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const registerMock = vi.fn();
const readyRegistration = {
  unregister: vi.fn(),
};
const serviceWorkerController = {
  postMessage: vi.fn(),
};

vi.mock("@convex/lib/timeUtils", () => ({
  HOUR: 60 * 60 * 1000,
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

  it("shows the install banner once and stores dismissal", async () => {
    const serviceWorker = await import("./serviceWorker");

    serviceWorker.promptInstall();
    serviceWorker.promptInstall();

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

    expect(document.getElementById("pwa-install-banner")).not.toBeNull();
    expect(window.localStorage.getItem).toHaveBeenCalledWith("pwa-install-dismissed");

    document.getElementById("pwa-dismiss-button")?.dispatchEvent(new MouseEvent("click"));

    expect(window.localStorage.setItem).toHaveBeenCalledWith("pwa-install-dismissed", "true");
    expect(document.getElementById("pwa-install-banner")).toBeNull();
  });

  it("shows only one update banner and posts SKIP_WAITING when accepted", async () => {
    const serviceWorker = await import("./serviceWorker");

    const listeners = new Map<string, EventListener>();
    const installingWorker = {
      state: "installing",
      addEventListener: vi.fn((event: string, listener: EventListener) => {
        listeners.set(event, listener);
      }),
    };
    const registrationListenerMap = new Map<string, EventListener>();

    registerMock.mockResolvedValue({
      update: vi.fn(),
      installing: installingWorker,
      addEventListener: vi.fn((event: string, listener: EventListener) => {
        registrationListenerMap.set(event, listener);
      }),
    });

    serviceWorker.register();
    await Promise.resolve();

    registrationListenerMap.get("updatefound")?.(new Event("updatefound"));
    installingWorker.state = "installed";
    listeners.get("statechange")?.(new Event("statechange"));
    listeners.get("statechange")?.(new Event("statechange"));

    expect(document.querySelectorAll("#sw-update-banner")).toHaveLength(1);

    document.getElementById("sw-update-button")?.dispatchEvent(new MouseEvent("click"));

    expect(serviceWorkerController.postMessage).toHaveBeenCalledWith({
      type: "SKIP_WAITING",
    });
  });
});
