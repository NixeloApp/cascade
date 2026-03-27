import type { Page } from "@playwright/test";
import { CONVEX_SITE_URL } from "../config";

function collectBlockedConvexHosts(): string[] {
  const blockedHosts = new Set<string>();
  const candidates = [process.env.VITE_CONVEX_URL, CONVEX_SITE_URL];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    try {
      blockedHosts.add(new URL(candidate).host);
    } catch {
      // Ignore malformed env values in helper setup; callers will fail later
      // when the app itself cannot boot against the configured backend.
    }
  }

  return [...blockedHosts];
}

const BLOCKED_CONVEX_HOSTS = collectBlockedConvexHosts();

export async function installConvexLoadingBlocker(page: Page): Promise<void> {
  await page.addInitScript(
    ({ blockedHosts }: { blockedHosts: string[] }) => {
      const windowWithBlocker = window as Window & {
        __nixeloConvexLoadingBlockerInstalled__?: boolean;
        fetch: typeof window.fetch;
        WebSocket: typeof window.WebSocket;
      };

      if (windowWithBlocker.__nixeloConvexLoadingBlockerInstalled__ || blockedHosts.length === 0) {
        return;
      }

      const blockedHostSet = new Set(blockedHosts);
      const getHost = (value: string | URL): string | null => {
        try {
          return new URL(value.toString(), window.location.href).host;
        } catch {
          return null;
        }
      };
      const shouldBlock = (value: string | URL): boolean => {
        const host = getHost(value);
        return host !== null && blockedHostSet.has(host);
      };

      const originalFetch = window.fetch.bind(window);
      windowWithBlocker.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const requestUrl =
          typeof input === "string"
            ? input
            : input instanceof Request
              ? input.url
              : input.toString();
        if (shouldBlock(requestUrl)) {
          return new Promise<Response>(() => {});
        }
        return originalFetch(input, init);
      }) as typeof window.fetch;

      const OriginalWebSocket = window.WebSocket;

      class BlockedWebSocket extends EventTarget {
        static readonly CONNECTING = 0;
        static readonly OPEN = 1;
        static readonly CLOSING = 2;
        static readonly CLOSED = 3;

        binaryType: BinaryType = "blob";
        bufferedAmount = 0;
        extensions = "";
        onclose: ((this: BlockedWebSocket, ev: CloseEvent) => unknown) | null = null;
        onerror: ((this: BlockedWebSocket, ev: Event) => unknown) | null = null;
        onmessage: ((this: BlockedWebSocket, ev: MessageEvent) => unknown) | null = null;
        onopen: ((this: BlockedWebSocket, ev: Event) => unknown) | null = null;
        protocol = "";
        readyState = BlockedWebSocket.CONNECTING;
        readonly url = "";

        constructor(url: string | URL) {
          super();
          Object.defineProperty(this, "url", {
            configurable: true,
            enumerable: true,
            value: url.toString(),
            writable: false,
          });
        }

        close(code?: number, reason?: string): void {
          this.readyState = BlockedWebSocket.CLOSED;
          const event = new CloseEvent("close", {
            code: code ?? 1000,
            reason: reason ?? "",
            wasClean: false,
          });
          queueMicrotask(() => {
            this.dispatchEvent(event);
            this.onclose?.call(this, event);
          });
        }

        send(_data: string | ArrayBufferLike | Blob | ArrayBufferView): void {}
      }

      windowWithBlocker.WebSocket = new Proxy(OriginalWebSocket, {
        construct(target, argumentsList, newTarget) {
          const [url] = argumentsList as ConstructorParameters<typeof WebSocket>;
          const resolvedUrl = url.toString();

          if (!shouldBlock(resolvedUrl)) {
            return Reflect.construct(target, argumentsList, newTarget);
          }

          return new BlockedWebSocket(resolvedUrl);
        },
      }) as typeof window.WebSocket;
      windowWithBlocker.__nixeloConvexLoadingBlockerInstalled__ = true;
    },
    { blockedHosts: BLOCKED_CONVEX_HOSTS },
  );
}

export async function createConvexLoadingPage(sourcePage: Page): Promise<Page> {
  const loadingPage = await sourcePage.context().newPage();
  await installConvexLoadingBlocker(loadingPage);
  return loadingPage;
}
