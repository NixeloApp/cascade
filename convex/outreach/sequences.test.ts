import { describe, expect, it, vi } from "vitest";

vi.mock("../lib/boundedQueries", () => ({
  BOUNDED_LIST_LIMIT: 100,
}));

describe("outreach sequences", () => {
  describe("module exports", () => {
    it("exports query functions", async () => {
      const mod = await import("./sequences");
      expect(typeof mod.list).toBe("function");
      expect(typeof mod.get).toBe("function");
    });

    it("exports mutation functions", async () => {
      const mod = await import("./sequences");
      expect(typeof mod.create).toBe("function");
      expect(typeof mod.update).toBe("function");
      expect(typeof mod.updateSequenceStatus).toBe("function");
      expect(typeof mod.pause).toBe("function");
      expect(typeof mod.remove).toBe("function");
    });
  });
});
