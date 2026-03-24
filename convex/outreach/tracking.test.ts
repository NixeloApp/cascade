import { describe, expect, it, vi } from "vitest";

vi.mock("../lib/boundedQueries", () => ({
  BOUNDED_LIST_LIMIT: 100,
}));

vi.mock("./contacts", () => ({
  suppress: vi.fn(),
}));

vi.mock("./enrollments", () => ({
  stopEnrollment: vi.fn(),
}));

describe("outreach tracking", () => {
  describe("module exports", () => {
    it("exports HTTP handlers", async () => {
      const mod = await import("./tracking");
      expect(typeof mod.handleOpenPixel).toBe("function");
      expect(typeof mod.handleClickRedirect).toBe("function");
      expect(typeof mod.handleUnsubscribeGet).toBe("function");
      expect(typeof mod.handleUnsubscribePost).toBe("function");
    });

    it("exports internal mutations", async () => {
      const mod = await import("./tracking");
      expect(typeof mod.recordOpen).toBe("function");
      expect(typeof mod.recordClick).toBe("function");
      expect(typeof mod.getTrackingLink).toBe("function");
      expect(typeof mod.processUnsubscribe).toBe("function");
    });
  });

  describe("module completeness", () => {
    it("exports all HTTP handlers and mutations", async () => {
      const mod = await import("./tracking");
      expect(typeof mod.handleOpenPixel).toBe("function");
      expect(typeof mod.handleClickRedirect).toBe("function");
      expect(typeof mod.handleUnsubscribeGet).toBe("function");
      expect(typeof mod.handleUnsubscribePost).toBe("function");
      expect(typeof mod.processUnsubscribe).toBe("function");
    });
  });
});
