import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestProject, createTestUser } from "./testUtils";
import type { Id } from "./_generated/dataModel";

describe("Label Fetching Benchmark", () => {
  it("measure fetching strategies", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    const labelNames: string[] = [];

    // Create 100 labels
    await t.run(async (ctx) => {
      for (let i = 0; i < 100; i++) {
        const name = `Label ${i}`;
        labelNames.push(name);
        await ctx.db.insert("labels", {
          projectId,
          name,
          color: "#123456",
          createdBy: userId,
        });
      }
    });

    const runBenchmark = async (count: number) => {
      const targetLabels = labelNames.slice(0, count);

      const startIndividual = performance.now();
      await t.run(async (ctx) => {
        // Strategy A: Individual fetches (simulated)
        await Promise.all(
          targetLabels.map((name) =>
            ctx.db
              .query("labels")
              .withIndex("by_project_name", (q) => q.eq("projectId", projectId).eq("name", name))
              .first(),
          ),
        );
      });
      const endIndividual = performance.now();

      const startScan = performance.now();
      await t.run(async (ctx) => {
        // Strategy B: Scan all (simulated)
        await ctx.db
          .query("labels")
          .withIndex("by_project", (q) => q.eq("projectId", projectId))
          .take(200);
      });
      const endScan = performance.now();

      const timeIndividual = endIndividual - startIndividual;
      const timeScan = endScan - startScan;

      console.log(`[Benchmark] Count ${count}: Individual=${timeIndividual.toFixed(2)}ms, Scan=${timeScan.toFixed(2)}ms`);
      return { individual: timeIndividual, scan: timeScan };
    };

    // Warm up
    await runBenchmark(5);

    // Run scenarios
    const r5 = await runBenchmark(5);
    const r10 = await runBenchmark(10);
    const r20 = await runBenchmark(20);

    // Just ensure it runs without error
    expect(r20.scan).toBeDefined();
    expect(r20.individual).toBeDefined();
  });
});
