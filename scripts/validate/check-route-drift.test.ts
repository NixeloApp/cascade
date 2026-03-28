import { describe, expect, it } from "vitest";
import {
  analyzeRouteDrift,
  extractFileRouteDefinitions,
  extractRouteConfigEntries,
  findRouteTestPlacementIssues,
  normalizePublicRoutePath,
  run,
} from "./check-route-drift.js";

describe("check-route-drift", () => {
  it("normalizes internal layout-prefixed file routes to their public paths", () => {
    expect(normalizePublicRoutePath("/_auth/_app/$orgSlug/dashboard")).toBe("/$orgSlug/dashboard");
    expect(normalizePublicRoutePath("/_auth/onboarding")).toBe("/onboarding");
    expect(normalizePublicRoutePath("/_auth/_app")).toBeNull();
  });

  it("extracts nested ROUTES entries from shared route config", () => {
    const entries = extractRouteConfigEntries(`
      export const ROUTES = {
        home: {
          path: "/" as const,
        },
        documents: {
          list: {
            path: "/$orgSlug/documents" as const,
          },
        },
      };
    `);

    expect(entries).toEqual([
      { key: "home", path: "/" },
      { key: "documents.list", path: "/$orgSlug/documents" },
    ]);
  });

  it("extracts multi-line createFileRoute definitions", () => {
    const definitions = extractFileRouteDefinitions(
      `
        export const Route = createFileRoute(
          "/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug",
        )({});
      `,
      "src/routes/example.tsx",
    );

    expect(definitions).toEqual([
      {
        filePath: "src/routes/example.tsx",
        rawPath: "/_auth/_app/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug",
        publicPath: "/$orgSlug/workspaces/$workspaceSlug/teams/$teamSlug",
      },
    ]);
  });

  it("allows explicitly known route drift while flagging new mismatches", () => {
    const result = analyzeRouteDrift({
      routeConfigEntries: [
        { key: "dashboard", path: "/$orgSlug/dashboard" },
        { key: "inbox", path: "/$orgSlug/inbox" },
      ],
      routeDefinitions: [
        {
          filePath: "src/routes/dashboard.tsx",
          rawPath: "/_auth/_app/$orgSlug/dashboard",
          publicPath: "/$orgSlug/dashboard",
        },
        {
          filePath: "src/routes/reports.tsx",
          rawPath: "/_auth/_app/$orgSlug/reports",
          publicPath: "/$orgSlug/reports",
        },
      ],
      knownConfigOnlyRoutePaths: new Map([["/$orgSlug/inbox", "known gap"]]),
      knownUnsharedPublicRoutePaths: new Map(),
    });

    expect(result.missingConfigPaths).toEqual([]);
    expect(result.unexpectedPublicPaths).toEqual([
      {
        path: "/$orgSlug/reports",
        files: ["src/routes/reports.tsx"],
      },
    ]);
  });

  it("flags route tests that live directly inside src/routes", () => {
    expect(
      findRouteTestPlacementIssues([
        "src/routes/__tests__/signup.test.tsx",
        "src/routes/_auth/_app/$orgSlug/__tests__/calendar.test.tsx",
        "src/routes/-invite.$token.test.tsx",
      ]),
    ).toEqual([
      {
        filePath: "src/routes/-invite.$token.test.tsx",
        message: "Route tests must live in an adjacent __tests__/ directory.",
      },
    ]);
  });

  it("passes against the current repo state", () => {
    const result = run();

    expect(result.passed).toBe(true);
    expect(result.errors).toBe(0);
  });
});
