import fs from "node:fs";

/**
 * Load a per-key count baseline from a JSON file.
 *
 * @param {string} baselinePath
 * @param {string} propertyName
 * @returns {Record<string, number>}
 */
export function loadCountBaseline(baselinePath, propertyName) {
  if (!fs.existsSync(baselinePath)) {
    return {};
  }

  const parsed = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
  return parsed[propertyName] ?? {};
}

/**
 * Compare grouped items against a per-key count baseline.
 *
 * Items in each group should already be sorted deterministically if the
 * validator needs stable "new overage" slicing.
 *
 * @template T
 * @param {Record<string, T[]>} itemsByKey
 * @param {Record<string, number>} baselineByKey
 * @returns {{
 *   activeKeyCount: number;
 *   currentCountByKey: Record<string, number>;
 *   overagesByKey: Record<string, { baselineCount: number; currentCount: number; overageItems: T[] }>;
 *   totalBaselined: number;
 *   totalCurrent: number;
 * }}
 */
export function analyzeCountRatchet(itemsByKey, baselineByKey) {
  const currentCountByKey = {};
  const overagesByKey = {};
  let totalCurrent = 0;
  let totalBaselined = 0;

  for (const key of Object.keys(itemsByKey).sort((a, b) => a.localeCompare(b))) {
    const items = itemsByKey[key] ?? [];
    const currentCount = items.length;
    const baselineCount = baselineByKey[key] ?? 0;
    currentCountByKey[key] = currentCount;
    totalCurrent += currentCount;
    totalBaselined += Math.min(currentCount, baselineCount);

    if (currentCount > baselineCount) {
      overagesByKey[key] = {
        baselineCount,
        currentCount,
        overageItems: items.slice(baselineCount),
      };
    }
  }

  return {
    activeKeyCount: Object.keys(currentCountByKey).length,
    currentCountByKey,
    overagesByKey,
    totalBaselined,
    totalCurrent,
  };
}
