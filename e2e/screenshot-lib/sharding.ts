import type { CaptureTarget } from "./config";
import { resolveCaptureTarget } from "./routing";

export interface ScreenshotShardInfo {
  index: number;
  keys: string[];
  targetCount: number;
}

const shardPlanCache = new Map<string, ScreenshotShardInfo[]>();

export function getCaptureTargetBucketKey(target: CaptureTarget): string {
  return target.modalSpecSlug
    ? `modal:${target.modalSpecSlug}`
    : target.specFolder
      ? `spec:${target.specFolder}`
      : `page:${target.pageId}`;
}

export function buildScreenshotShards(
  pageIds: readonly string[],
  shardTotal: number,
): ScreenshotShardInfo[] {
  if (!Number.isInteger(shardTotal) || shardTotal <= 0) {
    throw new Error("Screenshot shard total must be a positive integer");
  }

  const cacheKey = `${shardTotal}:${pageIds.join("|")}`;
  const cachedShards = shardPlanCache.get(cacheKey);
  if (cachedShards) {
    return cachedShards.map((shard) => ({
      ...shard,
      keys: [...shard.keys],
    }));
  }

  const shards: ScreenshotShardInfo[] = Array.from({ length: shardTotal }, (_, index) => ({
    index: index + 1,
    keys: [],
    targetCount: 0,
  }));

  const bucketCounts = new Map<string, number>();
  for (const pageId of pageIds) {
    const separatorIndex = pageId.indexOf("-");
    const prefix = separatorIndex === -1 ? pageId : pageId.slice(0, separatorIndex);
    const name = separatorIndex === -1 ? "" : pageId.slice(separatorIndex + 1);
    const target = resolveCaptureTarget(prefix, name);
    const bucketKey = getCaptureTargetBucketKey(target);
    bucketCounts.set(bucketKey, (bucketCounts.get(bucketKey) ?? 0) + 1);
  }

  const shardBuckets = [...bucketCounts.entries()]
    .map(([key, targetCount]) => ({ key, targetCount }))
    .sort((a, b) => {
      if (b.targetCount !== a.targetCount) {
        return b.targetCount - a.targetCount;
      }
      return a.key.localeCompare(b.key);
    });

  for (const bucket of shardBuckets) {
    const lightestShard = shards.reduce((best, current) => {
      if (current.targetCount !== best.targetCount) {
        return current.targetCount < best.targetCount ? current : best;
      }
      return current.index < best.index ? current : best;
    }, shards[0]);

    lightestShard.keys.push(bucket.key);
    lightestShard.targetCount += bucket.targetCount;
  }

  for (const shard of shards) {
    shard.keys.sort((a, b) => a.localeCompare(b));
  }

  shardPlanCache.set(
    cacheKey,
    shards.map((shard) => ({
      ...shard,
      keys: [...shard.keys],
    })),
  );

  return shards;
}

export function isCaptureTargetInShard(
  target: CaptureTarget,
  pageIds: readonly string[],
  shardIndex: number,
  shardTotal: number,
): boolean {
  if (!Number.isInteger(shardIndex) || shardIndex < 1 || shardIndex > shardTotal) {
    throw new Error(`Screenshot shard index must be between 1 and ${shardTotal}`);
  }

  const shard = buildScreenshotShards(pageIds, shardTotal).find(
    (entry) => entry.index === shardIndex,
  );
  if (!shard) {
    return false;
  }
  const bucketKey = getCaptureTargetBucketKey(target);
  return shard.keys.includes(bucketKey);
}
