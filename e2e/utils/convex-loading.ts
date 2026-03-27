import type { Page, Route } from "@playwright/test";
import { CONVEX_SITE_URL } from "../config";
import { withIsolatedPageTarget, withSiblingPageTarget } from "./page-targets";

type BlockedConvexPageTarget = "isolated" | "sibling";

export type BlockedConvexPagePolicy =
  | {
      kind: "transport";
      target: BlockedConvexPageTarget;
    }
  | {
      kind: "queries";
      paths: string[];
      target: BlockedConvexPageTarget;
    }
  | {
      kind: "mutations";
      paths: string[];
      target: BlockedConvexPageTarget;
    };

type NormalizedBlockedConvexPagePolicy =
  | {
      kind: "transport";
      target: BlockedConvexPageTarget;
    }
  | {
      kind: "queries";
      paths: string[];
      target: BlockedConvexPageTarget;
    }
  | {
      kind: "mutations";
      paths: string[];
      target: BlockedConvexPageTarget;
    };

function getBlockedRequestPaths(
  policy: Extract<BlockedConvexPagePolicy, { kind: "queries" | "mutations" }>,
): string[] {
  if (policy.paths.length === 0) {
    throw new Error(`Blocked Convex ${policy.kind} policy requires at least one path`);
  }

  const normalizedPaths = policy.paths.map((path) => path.trim());
  if (normalizedPaths.some((path) => path.length === 0)) {
    throw new Error(`Blocked Convex ${policy.kind} policy must not include empty paths`);
  }

  return [...new Set(normalizedPaths)];
}

function normalizeBlockedConvexPagePolicy(
  policy: BlockedConvexPagePolicy,
): NormalizedBlockedConvexPagePolicy {
  if (policy.kind === "transport") {
    return policy;
  }

  return {
    ...policy,
    paths: getBlockedRequestPaths(policy),
  };
}

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

function isBlockedConvexHost(requestUrl: string): boolean {
  try {
    return BLOCKED_CONVEX_HOSTS.includes(new URL(requestUrl).host);
  } catch {
    return false;
  }
}

function getConvexRequestPath(
  route: Route,
  endpointSuffix: "/api/mutation" | "/api/query",
): string | null {
  const request = route.request();
  if (request.method() !== "POST" || !request.url().endsWith(endpointSuffix)) {
    return null;
  }

  if (BLOCKED_CONVEX_HOSTS.length > 0 && !isBlockedConvexHost(request.url())) {
    return null;
  }

  const body = request.postData();
  if (!body) {
    return null;
  }

  try {
    const parsed = JSON.parse(body) as { path?: unknown };
    return typeof parsed.path === "string" ? parsed.path : null;
  } catch {
    return null;
  }
}

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

async function blockConvexRequestPath(
  page: Page,
  requestPath: string,
  endpointSuffix: "/api/mutation" | "/api/query",
): Promise<() => Promise<void>> {
  const handler = async (route: Route): Promise<void> => {
    const routedPath = getConvexRequestPath(route, endpointSuffix);

    if (routedPath === requestPath) {
      return new Promise<void>(() => {});
    }

    await route.continue();
  };

  await page.route(`**${endpointSuffix}`, handler);

  return async () => {
    await page.unroute(`**${endpointSuffix}`, handler);
  };
}

async function blockConvexMutation(page: Page, mutationPath: string): Promise<() => Promise<void>> {
  return blockConvexRequestPath(page, mutationPath, "/api/mutation");
}

async function blockConvexQuery(page: Page, queryPath: string): Promise<() => Promise<void>> {
  return blockConvexRequestPath(page, queryPath, "/api/query");
}

async function releaseBlockedRoutes(releaseBlocks: Array<() => Promise<void>>): Promise<void> {
  await Promise.all([...releaseBlocks].reverse().map((releaseBlock) => releaseBlock()));
}

async function installBlockedRoutes(
  page: Page,
  policy: NormalizedBlockedConvexPagePolicy,
): Promise<Array<() => Promise<void>>> {
  if (policy.kind === "transport") {
    return [];
  }

  const releaseBlocks: Array<() => Promise<void>> = [];

  try {
    for (const path of policy.paths) {
      releaseBlocks.push(
        await (policy.kind === "queries"
          ? blockConvexQuery(page, path)
          : blockConvexMutation(page, path)),
      );
    }

    return releaseBlocks;
  } catch (error) {
    await releaseBlockedRoutes(releaseBlocks);
    throw error;
  }
}

async function withBlockedRoutes<T>(
  page: Page,
  policy: NormalizedBlockedConvexPagePolicy,
  run: (page: Page) => Promise<T>,
): Promise<T> {
  if (policy.kind === "transport") {
    await installConvexLoadingBlocker(page);
  }

  const releaseBlocks = await installBlockedRoutes(page, policy);
  try {
    return await run(page);
  } finally {
    await releaseBlockedRoutes(releaseBlocks);
  }
}

async function withBlockedPageTarget<T>(
  sourcePage: Page,
  policy: BlockedConvexPagePolicy,
  run: (page: Page) => Promise<T>,
): Promise<T> {
  const normalizedPolicy = normalizeBlockedConvexPagePolicy(policy);

  if (normalizedPolicy.target === "isolated") {
    return withIsolatedPageTarget(sourcePage, ({ page }) =>
      withBlockedRoutes(page, normalizedPolicy, run),
    );
  }

  return withSiblingPageTarget(sourcePage, ({ page }) =>
    withBlockedRoutes(page, normalizedPolicy, run),
  );
}

export async function withBlockedConvexPage<T>(
  sourcePage: Page,
  policy: BlockedConvexPagePolicy,
  run: (blockedPage: Page) => Promise<T>,
): Promise<T> {
  return withBlockedPageTarget(sourcePage, policy, run);
}
