import { describe, expect, it } from "vitest";

describe("outreach sendEngine", () => {
  it("exports send engine functions", async () => {
    const mod = await import("./sendEngine");
    expect(typeof mod.processDueEnrollments).toBe("function");
    expect(typeof mod.resetDailySendCounts).toBe("function");
  });
});
