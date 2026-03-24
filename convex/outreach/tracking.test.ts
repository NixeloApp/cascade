import { describe, expect, it } from "vitest";

describe("outreach tracking", () => {
  it("exports tracking functions", async () => {
    const mod = await import("./tracking");
    expect(typeof mod.recordOpen).toBe("function");
    expect(typeof mod.recordClick).toBe("function");
  });
});
