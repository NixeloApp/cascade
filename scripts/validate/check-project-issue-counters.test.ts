import { describe, expect, it } from "vitest";
import { collectProjectInsertCounterIssues, run } from "./check-project-issue-counters.js";

describe("check-project-issue-counters", () => {
  it("flags project inserts that omit nextIssueNumber", () => {
    const issues = collectProjectInsertCounterIssues(
      `
        export const example = internalMutation({
          args: {},
          handler: async (ctx) => {
            await ctx.db.insert("projects", {
              name: "Demo",
              key: "DEMO",
            });
          },
        });
      `,
      "/tmp/example.ts",
    );

    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain("nextIssueNumber");
  });

  it("allows project inserts that initialize nextIssueNumber", () => {
    const issues = collectProjectInsertCounterIssues(
      `
        export const example = internalMutation({
          args: {},
          handler: async (ctx) => {
            await ctx.db.insert("projects", {
              name: "Demo",
              key: "DEMO",
              nextIssueNumber: 0,
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
