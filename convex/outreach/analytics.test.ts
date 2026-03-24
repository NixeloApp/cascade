import { describe, expect, it, vi } from "vitest";

vi.mock("../lib/boundedQueries", () => ({
  BOUNDED_LIST_LIMIT: 100,
}));

describe("outreach analytics", () => {
  describe("module exports", () => {
    it("exports all analytics queries", async () => {
      const mod = await import("./analytics");
      expect(typeof mod.getSequenceStats).toBe("function");
      expect(typeof mod.getSequenceFunnel).toBe("function");
      expect(typeof mod.getContactTimeline).toBe("function");
      expect(typeof mod.getOrganizationOverview).toBe("function");
      expect(typeof mod.getMailboxHealth).toBe("function");
    });
  });
});
