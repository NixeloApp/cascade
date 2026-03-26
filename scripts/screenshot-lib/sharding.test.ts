import { describe, expect, it } from "vitest";
import { resolveCaptureTarget } from "../../e2e/screenshot-lib/routing";
import {
  buildScreenshotShards,
  getCaptureTargetBucketKey,
  isCaptureTargetInShard,
} from "../../e2e/screenshot-lib/sharding";
import { SCREENSHOT_PAGE_IDS } from "../../e2e/screenshot-lib/targets";

const SHARD_COUNT = 4;
const SHARD_INDICES = Array.from({ length: SHARD_COUNT }, (_, index) => index + 1);

describe("buildScreenshotShards", () => {
  it("keeps the screenshot target registry unique", () => {
    expect(new Set(SCREENSHOT_PAGE_IDS).size).toBe(SCREENSHOT_PAGE_IDS.length);
  });

  it("assigns every capture bucket to exactly one shard", () => {
    const shards = buildScreenshotShards(SCREENSHOT_PAGE_IDS, SHARD_COUNT);
    const allKeys = shards.flatMap((shard) => shard.keys);
    const expectedKeys = new Set(
      SCREENSHOT_PAGE_IDS.map((pageId) => {
        const separatorIndex = pageId.indexOf("-");
        const prefix = separatorIndex === -1 ? pageId : pageId.slice(0, separatorIndex);
        const name = separatorIndex === -1 ? "" : pageId.slice(separatorIndex + 1);
        return getCaptureTargetBucketKey(resolveCaptureTarget(prefix, name));
      }),
    );

    expect(new Set(allKeys).size).toBe(allKeys.length);
    expect([...allKeys].sort()).toEqual([...expectedKeys].sort());
    expect(shards).toHaveLength(SHARD_COUNT);
    expect(shards.every((shard) => shard.keys.length > 0)).toBe(true);
  });

  it("keeps a capture target in exactly one shard", () => {
    const target = resolveCaptureTarget("filled", "project-PROJ-roadmap-detail");
    const owningShards = SHARD_INDICES.filter((shardIndex) =>
      isCaptureTargetInShard(target, SCREENSHOT_PAGE_IDS, shardIndex, SHARD_COUNT),
    );

    expect(owningShards).toHaveLength(1);
  });

  it("builds stable shard plans for the current repo targets", () => {
    const first = buildScreenshotShards(SCREENSHOT_PAGE_IDS, SHARD_COUNT);
    const second = buildScreenshotShards(SCREENSHOT_PAGE_IDS, SHARD_COUNT);

    expect(second).toEqual(first);
  });

  it("rejects invalid shard indices", () => {
    const target = resolveCaptureTarget("filled", "project-PROJ-roadmap-detail");

    expect(() => isCaptureTargetInShard(target, SCREENSHOT_PAGE_IDS, 0, SHARD_COUNT)).toThrow(
      `Screenshot shard index must be between 1 and ${SHARD_COUNT}`,
    );
    expect(() =>
      isCaptureTargetInShard(target, SCREENSHOT_PAGE_IDS, SHARD_COUNT + 1, SHARD_COUNT),
    ).toThrow(`Screenshot shard index must be between 1 and ${SHARD_COUNT}`);
  });
});
