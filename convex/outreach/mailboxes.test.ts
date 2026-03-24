import { describe, expect, it, vi } from "vitest";

vi.mock("../lib/boundedQueries", () => ({
  BOUNDED_LIST_LIMIT: 100,
}));

describe("outreach mailboxes", () => {
  describe("module exports", () => {
    it("exports query functions", async () => {
      const mod = await import("./mailboxes");
      expect(typeof mod.list).toBe("function");
      expect(typeof mod.get).toBe("function");
    });

    it("exports mutation functions", async () => {
      const mod = await import("./mailboxes");
      expect(typeof mod.createMailbox).toBe("function");
      expect(typeof mod.disconnect).toBe("function");
      expect(typeof mod.updateLimit).toBe("function");
    });
  });
});
