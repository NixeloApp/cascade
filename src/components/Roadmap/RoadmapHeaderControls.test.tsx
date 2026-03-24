import { describe, expect, it } from "vitest";

// Minimal smoke test — full interaction tests are in RoadmapView.test.tsx
describe("RoadmapHeaderControls", () => {
  it("module exports without error", async () => {
    const mod = await import("./RoadmapHeaderControls");
    expect(typeof mod.RoadmapHeaderControls).toBe("function");
  });
});
