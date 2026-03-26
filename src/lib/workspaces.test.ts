import { describe, expect, it } from "vitest";
import {
  buildWorkspaceSlug,
  filterWorkspaces,
  getWorkspaceOverviewCopy,
  getWorkspaceSearchEmptyState,
  getWorkspaceSearchSummary,
  normalizeWorkspaceSearchQuery,
  shouldShowWorkspaceSearch,
} from "./workspaces";

const WORKSPACES = [
  {
    name: "Platform Operations",
    slug: "platform-ops",
    description: "Core product systems and delivery",
  },
  {
    name: "Revenue",
    slug: "revenue",
    description: "Sales, billing, and client expansion",
  },
] as const;

describe("workspaces helpers", () => {
  it("builds normalized workspace slugs from mixed input", () => {
    expect(buildWorkspaceSlug("  Platform Operations  ")).toBe("platform-operations");
    expect(buildWorkspaceSlug("Client Success & Support")).toBe("client-success-support");
  });

  it("normalizes workspace search queries", () => {
    expect(normalizeWorkspaceSearchQuery("  Platform  ")).toBe("platform");
  });

  it("filters workspaces by name, slug, and description", () => {
    expect(filterWorkspaces(WORKSPACES, "platform")).toEqual([WORKSPACES[0]]);
    expect(filterWorkspaces(WORKSPACES, "REVENUE")).toEqual([WORKSPACES[1]]);
    expect(filterWorkspaces(WORKSPACES, "client expansion")).toEqual([WORKSPACES[1]]);
    expect(filterWorkspaces(WORKSPACES, "   ")).toEqual([...WORKSPACES]);
  });

  it("reports when workspace search should be visible", () => {
    expect(shouldShowWorkspaceSearch(0, "")).toBe(false);
    expect(shouldShowWorkspaceSearch(1, "")).toBe(true);
    expect(shouldShowWorkspaceSearch(1, "ops")).toBe(true);
  });

  it("builds search summaries and empty-state copy from the active query", () => {
    expect(getWorkspaceSearchSummary(2, "  platform  ")).toBe('2 workspaces matching "platform"');
    expect(getWorkspaceSearchEmptyState("  platform  ")).toEqual({
      title: 'No workspaces match "platform"',
      description:
        "Try a different workspace name, slug, or description, or clear the current search.",
    });
  });

  it("builds concrete workspace overview copy from structure counts", () => {
    expect(
      getWorkspaceOverviewCopy({
        workspaceCount: 1,
        totalTeams: 2,
        totalProjects: 4,
      }),
    ).toEqual({
      eyebrow: "Organization footprint",
      title: "Structure at a glance",
      description: "This organization currently has 1 workspace, 2 teams, and 4 projects.",
    });
  });
});
