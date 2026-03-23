import { describe, expect, it } from "vitest";

describe("RoadmapRows", () => {
  it("exports all row components", async () => {
    const mod = await import("./RoadmapRows");
    expect(typeof mod.RoadmapTimelineBar).toBe("function");
    expect(typeof mod.RoadmapGroupRow).toBe("function");
    expect(typeof mod.RoadmapIssueIdentity).toBe("function");
    expect(typeof mod.RoadmapSummaryBar).toBe("function");
    expect(typeof mod.RoadmapIssueRow).toBe("function");
  });
});
