import { describe, expect, it } from "vitest";

describe("RoadmapDependencyPanel", () => {
  it("module exports without error", async () => {
    const mod = await import("./RoadmapDependencyPanel");
    expect(typeof mod.RoadmapDependencyPanel).toBe("function");
    expect(typeof mod.renderDependencyLine).toBe("function");
  });
});
