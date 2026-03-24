import { describe, expect, it, vi } from "vitest";

// Mock the internal modules before imports
vi.mock("../lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock("./contacts", () => ({
  isSuppressed: vi.fn().mockResolvedValue(false),
}));

vi.mock("./enrollments", () => ({
  advanceEnrollment: vi.fn(),
}));

vi.mock("../lib/boundedQueries", () => ({
  BOUNDED_LIST_LIMIT: 100,
}));

vi.mock("../lib/timeUtils", () => ({
  MINUTE: 60_000,
}));

describe("outreach sendEngine", () => {
  describe("module exports", () => {
    it("exports all required functions", async () => {
      const mod = await import("./sendEngine");
      expect(typeof mod.findDueEnrollments).toBe("function");
      expect(typeof mod.processDueEnrollments).toBe("function");
      expect(typeof mod.checkPreSend).toBe("function");
      expect(typeof mod.sendSequenceEmail).toBe("function");
      expect(typeof mod.recordSendResult).toBe("function");
      expect(typeof mod.resetDailySendCounts).toBe("function");
      expect(typeof mod.updateEnrollmentNextSend).toBe("function");
    });
  });

  describe("module completeness", () => {
    it("exports expected send engine functions", async () => {
      const mod = await import("./sendEngine");
      expect(typeof mod.processDueEnrollments).toBe("function");
      expect(typeof mod.recordSendResult).toBe("function");
      expect(typeof mod.sendSequenceEmail).toBe("function");
    });
  });
});
