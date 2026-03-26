import { describe, expect, it } from "vitest";
import {
  collectOutreachMailboxRateLimitIssues,
  run,
} from "./check-outreach-mailbox-rate-limits.js";

describe("check-outreach-mailbox-rate-limits", () => {
  it("flags outreach mailbox inserts that omit minute-window counters", () => {
    const issues = collectOutreachMailboxRateLimitIssues(
      `
        export const example = internalMutation({
          args: {},
          handler: async (ctx) => {
            await ctx.db.insert("outreachMailboxes", {
              userId: "user",
              organizationId: "org",
              provider: "google",
              email: "founder@example.com",
              displayName: "Founder",
              accessToken: "token",
              dailySendLimit: 50,
              todaySendCount: 0,
              todayResetAt: Date.now(),
              isActive: true,
              updatedAt: Date.now(),
            });
          },
        });
      `,
      "/tmp/example.ts",
    );

    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain("minute-window counters");
  });

  it("allows outreach mailbox inserts that spread rate limit defaults", () => {
    const issues = collectOutreachMailboxRateLimitIssues(
      `
        export const example = internalMutation({
          args: {},
          handler: async (ctx) => {
            const rateLimitDefaults = buildMailboxRateLimitDefaults();
            await ctx.db.insert("outreachMailboxes", {
              userId: "user",
              organizationId: "org",
              provider: "google",
              email: "founder@example.com",
              displayName: "Founder",
              accessToken: "token",
              dailySendLimit: 50,
              todaySendCount: 0,
              todayResetAt: Date.now(),
              ...rateLimitDefaults,
              isActive: true,
              updatedAt: Date.now(),
            });
          },
        });
      `,
      "/tmp/example.ts",
    );

    expect(issues).toEqual([]);
  });

  it("passes against the current repo state", () => {
    const result = run();

    expect(result.passed).toBe(true);
    expect(result.errors).toBe(0);
  });
});
