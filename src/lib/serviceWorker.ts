/**
 * Service Worker Registration
 *
 * PWA service worker registration and lifecycle management.
 * Handles periodic updates, cache clearing, install prompts, and React-facing
 * state for install/update banners.
 */

import { HOUR } from "@convex/lib/timeUtils";

// Extend Navigator interface for iOS standalone mode
interface NavigatorStandalone extends Navigator {
  standalone?: boolean;
}

// Type for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PwaInstallState {
  isAvailable: boolean;
  isDismissed: boolean;
  isPrompting: boolean;
}

interface SwUpdateState {
  isDismissed: boolean;
  isUpdateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
}

export interface PwaInstallSnapshot {
  canInstall: boolean;
  isPrompting: boolean;
}

export interface SwUpdateSnapshot {
  isUpdateAvailable: boolean;
}

type StoreListener = () => void;

const PWA_INSTALL_DISMISSED_KEY = "pwa-install-dismissed";

let hasRegisteredServiceWorker = false;
let hasBoundInstallPrompt = false;
let hasBoundControllerChange = false;
let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

const pwaInstallListeners = new Set<StoreListener>();
const swUpdateListeners = new Set<StoreListener>();

const pwaInstallState: PwaInstallState = {
  isAvailable: false,
  isDismissed: false,
  isPrompting: false,
};

const swUpdateState: SwUpdateState = {
  isDismissed: false,
  isUpdateAvailable: false,
  registration: null,
};

let pwaInstallSnapshot: PwaInstallSnapshot = {
  canInstall: false,
  isPrompting: false,
};

let swUpdateSnapshot: SwUpdateSnapshot = {
  isUpdateAvailable: false,
};

function updatePwaInstallSnapshot() {
  const nextCanInstall =
    pwaInstallState.isAvailable && !pwaInstallState.isDismissed && !isStandalone();

  if (
    pwaInstallSnapshot.canInstall === nextCanInstall &&
    pwaInstallSnapshot.isPrompting === pwaInstallState.isPrompting
  ) {
    return;
  }

  pwaInstallSnapshot = {
    canInstall: nextCanInstall,
    isPrompting: pwaInstallState.isPrompting,
  };
}

function updateSwUpdateSnapshot() {
  const nextIsUpdateAvailable = swUpdateState.isUpdateAvailable && !swUpdateState.isDismissed;

  if (swUpdateSnapshot.isUpdateAvailable === nextIsUpdateAvailable) {
    return;
  }

  swUpdateSnapshot = {
    isUpdateAvailable: nextIsUpdateAvailable,
  };
}

function notifyPwaInstallListeners() {
  updatePwaInstallSnapshot();
  for (const listener of pwaInstallListeners) {
    listener();
  }
}

function notifySwUpdateListeners() {
  updateSwUpdateSnapshot();
  for (const listener of swUpdateListeners) {
    listener();
  }
}

function readInstallPromptDismissal(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(PWA_INSTALL_DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
}

function writeInstallPromptDismissal(isDismissed: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (isDismissed) {
      window.localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, "true");
      return;
    }

    window.localStorage.removeItem(PWA_INSTALL_DISMISSED_KEY);
  } catch {
    // Persistence failures should not break the app shell.
  }
}

function setPwaInstallAvailability(isAvailable: boolean) {
  pwaInstallState.isAvailable = isAvailable;
  notifyPwaInstallListeners();
}

function setSwUpdateAvailable(registration: ServiceWorkerRegistration) {
  swUpdateState.registration = registration;
  swUpdateState.isDismissed = false;
  swUpdateState.isUpdateAvailable = true;
  notifySwUpdateListeners();
}

function reloadOnControllerChange() {
  window.location.reload();
}

function bindControllerChangeReload() {
  if (hasBoundControllerChange || !("serviceWorker" in navigator)) {
    return;
  }

  navigator.serviceWorker.addEventListener("controllerchange", reloadOnControllerChange);
  hasBoundControllerChange = true;
}

function handleBeforeInstallPrompt(event: Event) {
  const promptEvent = event as BeforeInstallPromptEvent;
  promptEvent.preventDefault();
  deferredInstallPrompt = promptEvent;
  pwaInstallState.isDismissed = readInstallPromptDismissal();
  pwaInstallState.isPrompting = false;
  setPwaInstallAvailability(true);
}

function handleAppInstalled() {
  deferredInstallPrompt = null;
  pwaInstallState.isDismissed = false;
  pwaInstallState.isPrompting = false;
  writeInstallPromptDismissal(false);
  setPwaInstallAvailability(false);
}

export function ensureInstallPromptTracking() {
  if (hasBoundInstallPrompt || typeof window === "undefined") {
    return;
  }

  hasBoundInstallPrompt = true;
  pwaInstallState.isDismissed = readInstallPromptDismissal();
  notifyPwaInstallListeners();

  window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  window.addEventListener("appinstalled", handleAppInstalled);
}

function trackRegistrationUpdates(registration: ServiceWorkerRegistration) {
  swUpdateState.registration = registration;

  if (registration.waiting && navigator.serviceWorker.controller) {
    setSwUpdateAvailable(registration);
  }

  registration.addEventListener("updatefound", () => {
    const newWorker = registration.installing;
    if (!newWorker) {
      return;
    }

    newWorker.addEventListener("statechange", () => {
      if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
        setSwUpdateAvailable(registration);
      }
    });
  });
}

function startServiceWorkerRegistration() {
  if (!("serviceWorker" in navigator) || hasRegisteredServiceWorker) {
    return;
  }

  hasRegisteredServiceWorker = true;

  navigator.serviceWorker
    .register("/service-worker.js")
    .then((registration) => {
      trackRegistrationUpdates(registration);

      // Check for updates every hour
      setInterval(() => {
        void registration.update();
      }, HOUR);
    })
    .catch(() => {
      hasRegisteredServiceWorker = false;
      // Service worker registration errors are non-critical
    });
}

/**
 * Registers the service worker for PWA functionality.
 * Sets up periodic update checks and handles SW lifecycle events.
 */
export function register() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  bindControllerChangeReload();

  if (document.readyState === "complete") {
    startServiceWorkerRegistration();
    return;
  }

  window.addEventListener("load", startServiceWorkerRegistration, { once: true });
}

/**
 * Unregisters the service worker, disabling PWA functionality.
 */
export function unregister() {
  if ("serviceWorker" in navigator) {
    hasRegisteredServiceWorker = false;
    swUpdateState.registration = null;
    swUpdateState.isDismissed = false;
    swUpdateState.isUpdateAvailable = false;
    notifySwUpdateListeners();

    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch(() => {
        // Unregister errors are non-critical
      });
  }
}

/**
 * Clears the service worker cache by sending a message to the active worker.
 */
export function clearCache() {
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "CLEAR_CACHE",
    });
  }
}

/**
 * Checks if the app is running in standalone mode (installed as PWA).
 * Detects both standard display-mode and iOS standalone property.
 */
export function isStandalone(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const displayModeStandalone =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(display-mode: standalone)").matches
      : false;

  return displayModeStandalone || (window.navigator as NavigatorStandalone).standalone === true;
}

export function subscribeToPwaInstall(listener: StoreListener) {
  pwaInstallListeners.add(listener);
  return () => {
    pwaInstallListeners.delete(listener);
  };
}

export function getPwaInstallSnapshot(): PwaInstallSnapshot {
  updatePwaInstallSnapshot();
  return pwaInstallSnapshot;
}

export async function promptToInstallPwa(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferredInstallPrompt) {
    return "unavailable";
  }

  pwaInstallState.isPrompting = true;
  notifyPwaInstallListeners();

  try {
    await deferredInstallPrompt.prompt();
    const choiceResult = await deferredInstallPrompt.userChoice;
    return choiceResult.outcome;
  } finally {
    deferredInstallPrompt = null;
    pwaInstallState.isPrompting = false;
    setPwaInstallAvailability(false);
  }
}

export function dismissPwaInstall() {
  deferredInstallPrompt = null;
  pwaInstallState.isDismissed = true;
  pwaInstallState.isPrompting = false;
  writeInstallPromptDismissal(true);
  setPwaInstallAvailability(false);
}

export function subscribeToSwUpdate(listener: StoreListener) {
  swUpdateListeners.add(listener);
  return () => {
    swUpdateListeners.delete(listener);
  };
}

export function getSwUpdateSnapshot(): SwUpdateSnapshot {
  updateSwUpdateSnapshot();
  return swUpdateSnapshot;
}

export function dismissSwUpdate() {
  swUpdateState.isDismissed = true;
  swUpdateState.isUpdateAvailable = false;
  notifySwUpdateListeners();
}

export function applySwUpdate(): boolean {
  const waitingWorker = swUpdateState.registration?.waiting;
  if (!waitingWorker) {
    return false;
  }

  waitingWorker.postMessage({ type: "SKIP_WAITING" });
  swUpdateState.isUpdateAvailable = false;
  notifySwUpdateListeners();
  return true;
}
