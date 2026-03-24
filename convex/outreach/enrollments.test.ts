import { describe, expect, it, vi } from "vitest";
import { DAY, MINUTE } from "../lib/timeUtils";
import { calculateNextSendTime } from "./enrollments";

vi.mock("../lib/boundedQueries", () => ({
  BOUNDED_LIST_LIMIT: 100,
}));

vi.mock("./contacts", () => ({
  isSuppressed: vi.fn().mockResolvedValue(false),
}));

describe("outreach enrollments", () => {
  describe("module exports", () => {
    it("exports query and mutation functions", async () => {
      const mod = await import("./enrollments");
      expect(typeof mod.listBySequence).toBe("function");
      expect(typeof mod.getByContact).toBe("function");
      expect(typeof mod.getEvents).toBe("function");
      expect(typeof mod.createEnrollments).toBe("function");
      expect(typeof mod.cancelEnrollment).toBe("function");
    });

    it("exports helper functions", async () => {
      const mod = await import("./enrollments");
      expect(typeof mod.calculateNextSendTime).toBe("function");
      expect(typeof mod.advanceEnrollment).toBe("function");
      expect(typeof mod.stopEnrollment).toBe("function");
    });
  });

  describe("calculateNextSendTime", () => {
    it("returns a time within 5 minutes for delay=0", () => {
      const now = Date.now();
      const result = calculateNextSendTime(0);

      expect(result).toBeGreaterThanOrEqual(now);
      expect(result).toBeLessThanOrEqual(now + 5 * MINUTE + 1000); // 5 min + 1s buffer
    });

    it("skips weekends for delay > 0", () => {
      // Run multiple times to account for randomization
      for (let i = 0; i < 10; i++) {
        const result = calculateNextSendTime(1);
        const date = new Date(result);
        const day = date.getUTCDay();

        // Should never land on Saturday (6) or Sunday (0)
        expect(day).not.toBe(0);
        expect(day).not.toBe(6);
      }
    });

    it("sets send time during business hours (9-17 UTC)", () => {
      for (let i = 0; i < 20; i++) {
        const result = calculateNextSendTime(1);
        const date = new Date(result);
        const hour = date.getUTCHours();

        // Should be between 8 and 17 (accounting for ±30 min jitter)
        expect(hour).toBeGreaterThanOrEqual(8);
        expect(hour).toBeLessThanOrEqual(17);
      }
    });

    it("adds correct number of business days", () => {
      const result3days = calculateNextSendTime(3);
      const result1day = calculateNextSendTime(1);

      // 3 business days should be further in the future than 1 business day
      expect(result3days).toBeGreaterThan(result1day);
    });

    it("handles large delays", () => {
      const now = Date.now();
      const result = calculateNextSendTime(20); // 20 business days ~ 4 weeks

      // Should be at least 20 calendar days in the future
      expect(result).toBeGreaterThan(now + 20 * DAY);
    });
  });

  describe("advanceEnrollment", () => {
    it("marks enrollment as completed when on last step", async () => {
      const mockPatch = vi.fn();
      const mockCtx = {
        db: {
          get: vi.fn().mockResolvedValue({
            _id: "enr1",
            currentStep: 2,
            status: "active",
          }),
          patch: mockPatch,
        },
      };

      const { advanceEnrollment } = await import("./enrollments");
      await advanceEnrollment(mockCtx as any, "enr1" as any, 3, undefined);

      expect(mockPatch).toHaveBeenCalledWith("enr1", {
        currentStep: 3,
        status: "completed",
        completedAt: expect.any(Number),
        nextSendAt: undefined,
      });
    });

    it("schedules next step when more steps remain", async () => {
      const mockPatch = vi.fn();
      const mockCtx = {
        db: {
          get: vi.fn().mockResolvedValue({
            _id: "enr1",
            currentStep: 0,
            status: "active",
          }),
          patch: mockPatch,
        },
      };

      const { advanceEnrollment } = await import("./enrollments");
      await advanceEnrollment(mockCtx as any, "enr1" as any, 3, 3);

      expect(mockPatch).toHaveBeenCalledWith("enr1", {
        currentStep: 1,
        nextSendAt: expect.any(Number),
      });
    });

    it("does nothing for non-active enrollments", async () => {
      const mockPatch = vi.fn();
      const mockCtx = {
        db: {
          get: vi.fn().mockResolvedValue({
            _id: "enr1",
            currentStep: 0,
            status: "replied", // Already terminal
          }),
          patch: mockPatch,
        },
      };

      const { advanceEnrollment } = await import("./enrollments");
      await advanceEnrollment(mockCtx as any, "enr1" as any, 3, 3);

      expect(mockPatch).not.toHaveBeenCalled();
    });
  });

  describe("stopEnrollment", () => {
    it("stops active enrollment with replied status", async () => {
      const mockPatch = vi.fn();
      const mockCtx = {
        db: {
          get: vi.fn().mockResolvedValue({
            _id: "enr1",
            status: "active",
          }),
          patch: mockPatch,
        },
      };

      const { stopEnrollment } = await import("./enrollments");
      await stopEnrollment(mockCtx as any, "enr1" as any, "replied");

      expect(mockPatch).toHaveBeenCalledWith(
        "enr1",
        expect.objectContaining({
          status: "replied",
          completedAt: expect.any(Number),
          nextSendAt: undefined,
        }),
      );
    });

    it("stops paused enrollment", async () => {
      const mockPatch = vi.fn();
      const mockCtx = {
        db: {
          get: vi.fn().mockResolvedValue({
            _id: "enr1",
            status: "paused",
          }),
          patch: mockPatch,
        },
      };

      const { stopEnrollment } = await import("./enrollments");
      await stopEnrollment(mockCtx as any, "enr1" as any, "bounced");

      expect(mockPatch).toHaveBeenCalledWith(
        "enr1",
        expect.objectContaining({
          status: "bounced",
        }),
      );
    });

    it("does not stop already-terminal enrollments", async () => {
      const mockPatch = vi.fn();
      const mockCtx = {
        db: {
          get: vi.fn().mockResolvedValue({
            _id: "enr1",
            status: "completed", // Already terminal
          }),
          patch: mockPatch,
        },
      };

      const { stopEnrollment } = await import("./enrollments");
      await stopEnrollment(mockCtx as any, "enr1" as any, "replied");

      expect(mockPatch).not.toHaveBeenCalled();
    });

    it("handles null enrollment gracefully", async () => {
      const mockPatch = vi.fn();
      const mockCtx = {
        db: {
          get: vi.fn().mockResolvedValue(null),
          patch: mockPatch,
        },
      };

      const { stopEnrollment } = await import("./enrollments");
      await stopEnrollment(mockCtx as any, "enr1" as any, "replied");

      expect(mockPatch).not.toHaveBeenCalled();
    });
  });
});
