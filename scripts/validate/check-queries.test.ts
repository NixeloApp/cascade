import { describe, expect, it } from "vitest";
import { _private, run } from "./check-queries.js";

describe("check-queries", () => {
  it("flags plain unbounded collect calls", () => {
    const source = `
      export const listIssues = async (ctx) => {
        return await ctx.db.query("issues").collect();
      };
    `;

    const issues = _private.collectUnboundedCollectIssues(source, source.split("\n"));

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      type: "UNBOUNDED_COLLECT",
      line: 3,
    });
  });

  it("allows explicit unbounded collect ignores with a concrete annotation", () => {
    const source = `
      export const bootstrapKeys = async (ctx) => {
        // @convex-validation-ignore UNBOUNDED_COLLECT: approved full scan must inspect all rows once.
        return await ctx.db.query("issues").collect();
      };
    `;

    const issues = _private.collectUnboundedCollectIssues(source, source.split("\n"));

    expect(issues).toEqual([]);
  });

  it("ignores collect mentions in comments and docs", () => {
    const source = `
      // ctx.db.query("issues").collect()
      export const note = "query.collect() is documented here";
    `;

    const issues = _private.collectUnboundedCollectIssues(source, source.split("\n"));

    expect(issues).toEqual([]);
  });

  it("passes against the current repo state", () => {
    const result = run();

    expect(result.passed).toBe(true);
    expect(result.errors).toBe(0);
  });
});
