import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@/test/custom-render";

const registerMock = vi.fn();
const readyRegistration = {
  unregister: vi.fn(),
};
const serviceWorkerController = {
  postMessage: vi.fn(),
};

function createBeforeInstallPromptEvent() {
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
    value: Promise.resolve({ outcome: "accepted" }),
  });

  return { prompt, promptEvent };
}

describe("PwaBanners", () => {
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

    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        reload: vi.fn(),
      },
    });

    Object.defineProperty(document, "readyState", {
      configurable: true,
      value: "complete",
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

    registerMock.mockResolvedValue({
      addEventListener: vi.fn(),
      installing: null,
      update: vi.fn(),
      waiting: null,
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders the install prompt banner from React state and persists dismissal", async () => {
    const { PwaBanners } = await import("./PwaBanners");

    await act(async () => {
      render(<PwaBanners />);
    });

    const { promptEvent } = createBeforeInstallPromptEvent();
    await act(async () => {
      window.dispatchEvent(promptEvent);
    });

    expect(await screen.findByText("Install Nixelo")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Not now" }));

    expect(window.localStorage.setItem).toHaveBeenCalledWith("pwa-install-dismissed", "true");
    expect(screen.queryByText("Install Nixelo")).not.toBeInTheDocument();
  });

  it("calls the browser install prompt from the React banner action", async () => {
    const { PwaBanners } = await import("./PwaBanners");

    await act(async () => {
      render(<PwaBanners />);
    });

    const { prompt, promptEvent } = createBeforeInstallPromptEvent();
    await act(async () => {
      window.dispatchEvent(promptEvent);
    });

    fireEvent.click(await screen.findByRole("button", { name: "Install" }));

    await waitFor(() => {
      expect(prompt).toHaveBeenCalledTimes(1);
    });
  });

  it("renders the update banner from React state and applies the waiting worker", async () => {
    const { PwaBanners } = await import("./PwaBanners");
    const serviceWorker = await import("@/lib/serviceWorker");
    const stateListeners = new Map<string, EventListener>();
    const registrationListeners = new Map<string, EventListener>();
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

    await act(async () => {
      render(<PwaBanners />);
    });

    await act(async () => {
      serviceWorker.register();
      await Promise.resolve();
    });

    await act(async () => {
      registrationListeners.get("updatefound")?.(new Event("updatefound"));
      installingWorker.state = "installed";
      stateListeners.get("statechange")?.(new Event("statechange"));
    });

    expect(await screen.findByText("Update available")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Update now" }));

    expect(waitingWorkerPostMessage).toHaveBeenCalledWith({
      type: "SKIP_WAITING",
    });
    expect(screen.queryByText("Update available")).not.toBeInTheDocument();
  });
});
