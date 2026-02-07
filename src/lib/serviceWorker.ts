// Service Worker Registration Utility

// Extend Navigator interface for iOS standalone mode
interface NavigatorStandalone extends Navigator {
  standalone?: boolean;
}

// Type for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function register() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          // Check for updates periodically
          setInterval(
            () => {
              registration.update();
            },
            60 * 60 * 1000,
          ); // Check every hour

          // Handle updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  // New service worker available
                  showUpdateNotification();
                }
              });
            }
          });
        })
        .catch((_error) => {
          // Service worker registration errors are non-critical
        });

      // Handle controller change (new SW activated)
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });
    });
  }
}

export function unregister() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((_error) => {
        // Unregister errors are non-critical
      });
  }
}

export function clearCache() {
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "CLEAR_CACHE",
    });
  }
}

function showUpdateNotification() {
  // Create a simple banner to notify users of an update
  const banner = document.createElement("div");
  banner.id = "sw-update-banner";
  banner.className =
    "fixed bottom-5 left-1/2 -translate-x-1/2 bg-brand text-ui-text-inverse px-6 py-4 rounded-lg shadow-xl z-toast-critical flex items-center gap-4 font-sans max-w-toast";
  banner.innerHTML = `
    <span>A new version is available!</span>
    <button id="sw-update-button" class="bg-ui-bg text-brand border-none px-4 py-2 rounded font-semibold cursor-pointer">Update</button>
    <button id="sw-dismiss-button" class="bg-transparent text-ui-text-inverse border border-ui-text-inverse px-4 py-2 rounded font-semibold cursor-pointer">Dismiss</button>
  `;

  document.body.appendChild(banner);

  // Handle update button click
  document.getElementById("sw-update-button")?.addEventListener("click", () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
    }
  });

  // Handle dismiss button click
  document.getElementById("sw-dismiss-button")?.addEventListener("click", () => {
    banner.remove();
  });
}

// Check if app is running in standalone mode (installed as PWA)
export function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as NavigatorStandalone).standalone === true
  );
}

// Prompt user to install PWA
export function promptInstall() {
  let deferredPrompt: BeforeInstallPromptEvent | null = null;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;

    // Show custom install button/banner
    showInstallPrompt(() => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: { outcome: "accepted" | "dismissed" }) => {
          if (choiceResult.outcome === "accepted") {
            // User accepted the install prompt
          } else {
            // User dismissed the install prompt
          }
          deferredPrompt = null;
        });
      }
    });
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
  });
}

function showInstallPrompt(onInstall: () => void) {
  // Only show if not already installed
  if (isStandalone()) return;

  // Check if user has previously dismissed
  if (localStorage.getItem("pwa-install-dismissed") === "true") return;

  const banner = document.createElement("div");
  banner.id = "pwa-install-banner";
  banner.className =
    "fixed top-5 left-1/2 -translate-x-1/2 bg-ui-bg-elevated text-ui-text px-6 py-4 rounded-container shadow-xl z-toast-critical flex items-center gap-4 font-sans max-w-toast border-2 border-brand";

  banner.innerHTML = `
    <span>Install Nixelo for quick access!</span>
    <button id="pwa-install-button" class="bg-brand text-ui-text-inverse border-none px-4 py-2 rounded font-semibold cursor-pointer">Install</button>
    <button id="pwa-dismiss-button" class="bg-transparent text-brand border border-brand px-4 py-2 rounded font-semibold cursor-pointer">Not now</button>
  `;

  document.body.appendChild(banner);

  document.getElementById("pwa-install-button")?.addEventListener("click", () => {
    onInstall();
    banner.remove();
  });

  document.getElementById("pwa-dismiss-button")?.addEventListener("click", () => {
    localStorage.setItem("pwa-install-dismissed", "true");
    banner.remove();
  });
}
