import type { Browser, BrowserContext, Page } from "@playwright/test";
import { describe, expect, it, vi } from "vitest";
import {
  prepareBlockedConvexPagePolicy,
  resolveBlockedConvexHosts,
  withBlockedConvexPage,
} from "./convex-loading";

function createConvexLoadingHarness() {
  const siblingPage = {
    addInitScript: vi.fn(async () => {}),
    close: vi.fn(async () => {}),
    isClosed: vi.fn(() => false),
    route: vi.fn(async () => {}),
    unroute: vi.fn(async () => {}),
  } satisfies Partial<Page>;
  const isolatedPage = {
    addInitScript: vi.fn(async () => {}),
    close: vi.fn(async () => {}),
    isClosed: vi.fn(() => false),
    route: vi.fn(async () => {}),
    unroute: vi.fn(async () => {}),
  } satisfies Partial<Page>;
  const isolatedContext = {
    close: vi.fn(async () => {}),
    newPage: vi.fn(async () => isolatedPage as Page),
  } satisfies Partial<BrowserContext>;
  const browser = {
    newContext: vi.fn(async () => isolatedContext as BrowserContext),
  } satisfies Partial<Browser>;
  const sourceContext = {
    browser: vi.fn(() => browser as Browser),
    newPage: vi.fn(async () => siblingPage as Page),
    storageState: vi.fn(async () => ({ cookies: [], origins: [] })),
  } satisfies Partial<BrowserContext>;
  const sourcePage = {
    context: vi.fn(() => sourceContext as BrowserContext),
    viewportSize: vi.fn(() => ({ height: 900, width: 1440 })),
  } satisfies Partial<Page>;

  return {
    isolatedContext,
    isolatedPage,
    siblingPage,
    sourcePage: sourcePage as Page,
  };
}

describe("convex loading helpers", () => {
  it("dedupes valid blocked convex hosts and ignores malformed candidates", () => {
    expect(
      resolveBlockedConvexHosts([
        "https://demo.convex.cloud",
        "https://demo.convex.cloud",
        "https://demo.convex.site",
        "not-a-url",
        undefined,
      ]),
    ).toEqual(["demo.convex.cloud", "demo.convex.site"]);
  });

  it("prepares blocked-page policy with normalized paths and resolved hosts", () => {
    expect(
      prepareBlockedConvexPagePolicy(
        {
          kind: "queries",
          paths: [
            " issues/queries:listOrganizationIssues ",
            "issues/queries:listOrganizationIssues",
          ],
          target: "isolated",
        },
        ["https://demo.convex.cloud", "https://demo.convex.site"],
      ),
    ).toEqual({
      blockedHosts: ["demo.convex.cloud", "demo.convex.site"],
      kind: "queries",
      paths: ["issues/queries:listOrganizationIssues"],
      target: "isolated",
    });
  });

  it("rejects blocked policies when no valid convex hosts can be resolved", () => {
    expect(() =>
      prepareBlockedConvexPagePolicy({ kind: "transport", target: "sibling" }, ["", "not-a-url"]),
    ).toThrow("Blocked Convex transport policy requires at least one valid Convex host candidate");
  });

  it("installs the transport blocker on sibling loading pages and closes them", async () => {
    const harness = createConvexLoadingHarness();
    const result = await withBlockedConvexPage(
      harness.sourcePage,
      { kind: "transport", target: "sibling" },
      async (loadingPage) => {
        expect(loadingPage).toBe(harness.siblingPage);
        return "done";
      },
    );

    expect(result).toBe("done");
    expect(harness.siblingPage.addInitScript).toHaveBeenCalledTimes(1);
    expect(harness.siblingPage.close).toHaveBeenCalledTimes(1);
  });

  it("releases blocked queries and closes the isolated context after the run", async () => {
    const harness = createConvexLoadingHarness();

    await withBlockedConvexPage(
      harness.sourcePage,
      {
        kind: "queries",
        paths: ["issues/queries:listOrganizationIssues", "notifications:list"],
        target: "isolated",
      },
      async (blockedPage) => {
        expect(blockedPage).toBe(harness.isolatedPage);
      },
    );

    expect(harness.isolatedPage.route).toHaveBeenCalledTimes(2);
    expect(harness.isolatedPage.unroute).toHaveBeenCalledTimes(2);
    expect(harness.isolatedContext.close).toHaveBeenCalledTimes(1);
  });

  it("installs the transport blocker on isolated loading pages and closes their context", async () => {
    const harness = createConvexLoadingHarness();

    const result = await withBlockedConvexPage(
      harness.sourcePage,
      { kind: "transport", target: "isolated" },
      async (loadingPage) => {
        expect(loadingPage).toBe(harness.isolatedPage);
        return "done";
      },
    );

    expect(result).toBe("done");
    expect(harness.isolatedPage.addInitScript).toHaveBeenCalledTimes(1);
    expect(harness.isolatedContext.close).toHaveBeenCalledTimes(1);
  });

  it("releases blocked mutations and closes the isolated context after failures", async () => {
    const harness = createConvexLoadingHarness();

    await expect(
      withBlockedConvexPage(
        harness.sourcePage,
        {
          kind: "mutations",
          paths: ["notifications:markAllAsRead"],
          target: "isolated",
        },
        async () => {
          throw new Error("capture failed");
        },
      ),
    ).rejects.toThrow("capture failed");

    expect(harness.isolatedPage.route).toHaveBeenCalledTimes(1);
    expect(harness.isolatedPage.unroute).toHaveBeenCalledTimes(1);
    expect(harness.isolatedContext.close).toHaveBeenCalledTimes(1);
  });

  it("normalizes blocked request paths before installing routes", async () => {
    const harness = createConvexLoadingHarness();

    await withBlockedConvexPage(
      harness.sourcePage,
      {
        kind: "queries",
        paths: [" issues/queries:listOrganizationIssues ", "issues/queries:listOrganizationIssues"],
        target: "isolated",
      },
      async () => undefined,
    );

    expect(harness.isolatedPage.route).toHaveBeenCalledTimes(1);
    expect(harness.isolatedPage.unroute).toHaveBeenCalledTimes(1);
  });

  it("unwinds already-installed blocked routes when later route setup fails", async () => {
    const harness = createConvexLoadingHarness();
    harness.isolatedPage.route
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("route install failed"));

    await expect(
      withBlockedConvexPage(
        harness.sourcePage,
        {
          kind: "queries",
          paths: ["issues/queries:listOrganizationIssues", "notifications:list"],
          target: "isolated",
        },
        async () => "unreachable",
      ),
    ).rejects.toThrow("route install failed");

    expect(harness.isolatedPage.unroute).toHaveBeenCalledTimes(1);
    expect(harness.isolatedContext.close).toHaveBeenCalledTimes(1);
  });

  it("rejects empty blocked-query policies before running the capture", async () => {
    const harness = createConvexLoadingHarness();

    await expect(
      withBlockedConvexPage(
        harness.sourcePage,
        { kind: "queries", paths: [], target: "isolated" },
        async () => "unreachable",
      ),
    ).rejects.toThrow("Blocked Convex queries policy requires at least one path");

    expect(harness.isolatedPage.route).not.toHaveBeenCalled();
    expect(harness.isolatedPage.unroute).not.toHaveBeenCalled();
    expect(harness.isolatedContext.close).not.toHaveBeenCalled();
  });

  it("rejects blocked-query policies with empty path values", async () => {
    const harness = createConvexLoadingHarness();

    await expect(
      withBlockedConvexPage(
        harness.sourcePage,
        { kind: "queries", paths: ["   "], target: "isolated" },
        async () => "unreachable",
      ),
    ).rejects.toThrow("Blocked Convex queries policy must not include empty paths");

    expect(harness.isolatedPage.route).not.toHaveBeenCalled();
    expect(harness.isolatedPage.unroute).not.toHaveBeenCalled();
    expect(harness.isolatedContext.close).not.toHaveBeenCalled();
  });
});
