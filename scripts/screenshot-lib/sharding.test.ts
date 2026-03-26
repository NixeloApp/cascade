import { describe, expect, it } from "vitest";
import { resolveCaptureTarget } from "../../e2e/screenshot-lib/routing";
import { buildScreenshotShards, isCaptureTargetInShard } from "../../e2e/screenshot-lib/sharding";
import { SCREENSHOT_PAGE_IDS } from "../../e2e/screenshot-lib/targets";

describe("buildScreenshotShards", () => {
  it("keeps the screenshot target registry unique", () => {
    expect(new Set(SCREENSHOT_PAGE_IDS).size).toBe(SCREENSHOT_PAGE_IDS.length);
  });

  it("assigns every capture bucket to exactly one shard", () => {
    const shards = buildScreenshotShards(SCREENSHOT_PAGE_IDS, 4);
    const allKeys = shards.flatMap((shard) => shard.keys);

    expect(new Set(allKeys).size).toBe(allKeys.length);
    expect(shards).toHaveLength(4);
    expect(shards.every((shard) => shard.keys.length > 0)).toBe(true);
  });

  it("keeps a capture target in exactly one shard", () => {
    const target = resolveCaptureTarget("filled", "project-PROJ-roadmap-detail");
    const owningShards = [1, 2, 3, 4].filter((shardIndex) =>
      isCaptureTargetInShard(target, SCREENSHOT_PAGE_IDS, shardIndex, 4),
    );

    expect(owningShards).toHaveLength(1);
  });

  it("builds stable shard plans for the current repo targets", () => {
    const first = buildScreenshotShards(SCREENSHOT_PAGE_IDS, 4);
    const second = buildScreenshotShards(SCREENSHOT_PAGE_IDS, 4);

    expect(second).toEqual(first);
  });
});
