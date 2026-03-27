import type { Page, Route } from "@playwright/test";
import { CONVEX_SITE_URL } from "../config";
import { withIsolatedPageTarget, withSiblingPageTarget } from "./page-targets";

type BlockedConvexPageTarget = "isolated" | "sibling";
type BlockedConvexRequestKind = "mutations" | "queries";
type BlockedConvexRequestEndpointSuffix = "/api/mutation" | "/api/query";

type BlockedConvexRequestPolicy = {
  kind: BlockedConvexRequestKind;
  paths: string[];
  target: BlockedConvexPageTarget;
};

export type BlockedConvexPagePolicy =
  | {
      kind: "transport";
      target: BlockedConvexPageTarget;
    }
  | BlockedConvexRequestPolicy;

type NormalizedBlockedConvexPagePolicy =
  | {
      kind: "transport";
      target: BlockedConvexPageTarget;
    }
  | BlockedConvexRequestPolicy;

type PreparedBlockedConvexPagePolicy = NormalizedBlockedConvexPagePolicy & {
  blockedHosts: string[];
};

type BlockedConvexRequestBehavior = {
  endpointSuffix: BlockedConvexRequestEndpointSuffix;
  label: BlockedConvexRequestKind;
};

export function getBlockedConvexRequestBehavior(
  kind: BlockedConvexRequestKind,
): BlockedConvexRequestBehavior {
  if (kind === "queries") {
    return {
      endpointSuffix: "/api/query",
      label: "queries",
    };
  }

  return {
    endpointSuffix: "/api/mutation",
    label: "mutations",
  };
}

function getBlockedRequestPaths(policy: BlockedConvexRequestPolicy): string[] {
  const behavior = getBlockedConvexRequestBehavior(policy.kind);
  if (policy.paths.length === 0) {
    throw new Error(`Blocked Convex ${behavior.label} policy requires at least one path`);
  }

  const normalizedPaths = policy.paths.map((path) => path.trim());
  if (normalizedPaths.some((path) => path.length === 0)) {
    throw new Error(`Blocked Convex ${behavior.label} policy must not include empty paths`);
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

export function resolveBlockedConvexHosts(candidates: Array<string | undefined>): string[] {
  const blockedHosts = new Set<string>();

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

function getDefaultBlockedConvexHostCandidates(): Array<string | undefined> {
  return [process.env.VITE_CONVEX_URL, CONVEX_SITE_URL];
}

function isBlockedConvexHost(requestUrl: string, blockedHosts: string[]): boolean {
  try {
    return blockedHosts.includes(new URL(requestUrl).host);
  } catch {
    return false;
  }
}

function getConvexRequestPath(
  route: Route,
  endpointSuffix: BlockedConvexRequestEndpointSuffix,
  blockedHosts: string[],
): string | null {
  const request = route.request();
  if (request.method() !== "POST" || !request.url().endsWith(endpointSuffix)) {
    return null;
  }

  if (!isBlockedConvexHost(request.url(), blockedHosts)) {
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

export async function installConvexLoadingBlocker(
  page: Page,
  blockedHosts: string[],
): Promise<void> {
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
    { blockedHosts },
  );
}

export function prepareBlockedConvexPagePolicy(
  policy: BlockedConvexPagePolicy,
  candidates: Array<string | undefined> = getDefaultBlockedConvexHostCandidates(),
): PreparedBlockedConvexPagePolicy {
  const normalizedPolicy = normalizeBlockedConvexPagePolicy(policy);
  const blockedHosts = resolveBlockedConvexHosts(candidates);

  if (blockedHosts.length === 0) {
    throw new Error(
      `Blocked Convex ${normalizedPolicy.kind} policy requires at least one valid Convex host candidate`,
    );
  }

  return {
    ...normalizedPolicy,
    blockedHosts,
  };
}

async function blockConvexRequestPaths(
  page: Page,
  requestPaths: string[],
  endpointSuffix: BlockedConvexRequestEndpointSuffix,
  blockedHosts: string[],
): Promise<() => Promise<void>> {
  const blockedPathSet = new Set(requestPaths);

  const handler = async (route: Route): Promise<void> => {
    const routedPath = getConvexRequestPath(route, endpointSuffix, blockedHosts);

    if (routedPath !== null && blockedPathSet.has(routedPath)) {
      return new Promise<void>(() => {});
    }

    await route.fallback();
  };

  await page.route(`**${endpointSuffix}`, handler);

  return async () => {
    await page.unroute(`**${endpointSuffix}`, handler);
  };
}

async function releaseBlockedRoutes(releaseBlocks: Array<() => Promise<void>>): Promise<void> {
  await Promise.all([...releaseBlocks].reverse().map((releaseBlock) => releaseBlock()));
}

async function installBlockedRoutes(
  page: Page,
  policy: PreparedBlockedConvexPagePolicy,
): Promise<Array<() => Promise<void>>> {
  if (policy.kind === "transport") {
    return [];
  }

  const behavior = getBlockedConvexRequestBehavior(policy.kind);
  const release = await blockConvexRequestPaths(
    page,
    policy.paths,
    behavior.endpointSuffix,
    policy.blockedHosts,
  );

  return [release];
}

async function withBlockedRoutes<T>(
  page: Page,
  policy: PreparedBlockedConvexPagePolicy,
  run: (page: Page) => Promise<T>,
): Promise<T> {
  if (policy.kind === "transport") {
    await installConvexLoadingBlocker(page, policy.blockedHosts);
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
  const preparedPolicy = prepareBlockedConvexPagePolicy(policy);

  if (preparedPolicy.target === "isolated") {
    return withIsolatedPageTarget(sourcePage, ({ page }) =>
      withBlockedRoutes(page, preparedPolicy, run),
    );
  }

  return withSiblingPageTarget(sourcePage, ({ page }) =>
    withBlockedRoutes(page, preparedPolicy, run),
  );
}

export async function withBlockedConvexPage<T>(
  sourcePage: Page,
  policy: BlockedConvexPagePolicy,
  run: (blockedPage: Page) => Promise<T>,
): Promise<T> {
  return withBlockedPageTarget(sourcePage, policy, run);
}
