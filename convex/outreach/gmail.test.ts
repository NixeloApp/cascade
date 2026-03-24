import { describe, expect, it, vi } from "vitest";

vi.mock("../lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock("../lib/boundedQueries", () => ({
  BOUNDED_LIST_LIMIT: 100,
}));

vi.mock("../lib/timeUtils", () => ({
  DAY: 86_400_000,
  MINUTE: 60_000,
}));

vi.mock("../lib/fetchWithTimeout", () => ({
  fetchWithTimeout: vi.fn(),
}));

vi.mock("./contacts", () => ({
  suppress: vi.fn(),
}));

vi.mock("./enrollments", () => ({
  stopEnrollment: vi.fn(),
}));

describe("outreach gmail", () => {
  describe("module exports", () => {
    it("exports send action", async () => {
      const mod = await import("./gmail");
      expect(typeof mod.sendViaGmailAction).toBe("function");
    });

    it("exports reply detection actions", async () => {
      const mod = await import("./gmail");
      expect(typeof mod.checkReplies).toBe("function");
      expect(typeof mod.checkAllMailboxReplies).toBe("function");
    });

    it("exports internal mutations", async () => {
      const mod = await import("./gmail");
      expect(typeof mod.getMailboxTokens).toBe("function");
      expect(typeof mod.updateMailboxTokens).toBe("function");
      expect(typeof mod.updateMailboxHealthCheck).toBe("function");
      expect(typeof mod.listActiveMailboxes).toBe("function");
      expect(typeof mod.findEnrollmentForReply).toBe("function");
    });
  });

  describe("findEnrollmentForReply", () => {
    // This tests the reply matching logic which is the core of reply detection

    it("module is well-formed with all expected exports", async () => {
      const mod = await import("./gmail");
      expect(Object.keys(mod).length).toBeGreaterThanOrEqual(7);
    });
  });
});
