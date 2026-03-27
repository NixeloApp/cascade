/**
 * CLI parsing for the screenshot capture tool.
 */

import type { CliOptions } from "./config";

export function parseCsvValues(rawValues: string[]): string[] {
  return rawValues
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

export function collectFlagValues(args: string[], flag: string): string[] {
  const values: string[] = [];

  for (let index = 0; index < args.length; index++) {
    const current = args[index];
    if (current === flag) {
      const next = args[index + 1];
      if (next && !next.startsWith("--")) {
        values.push(next);
        index++;
      }
      continue;
    }

    if (current.startsWith(`${flag}=`)) {
      values.push(current.slice(flag.length + 1));
    }
  }

  return parseCsvValues(values);
}

export function collectSingleFlagValue(args: string[], flag: string): string | null {
  const values = collectFlagValues(args, flag);
  if (values.length === 0) {
    return null;
  }
  if (values.length > 1) {
    throw new Error(`${flag} may only be provided once`);
  }
  return values[0] ?? null;
}

export function parsePositiveIntegerFlagValue(rawValue: string, flagName: string): number {
  const parsedValue = Number.parseInt(rawValue, 10);
  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`${flagName} must be a positive integer`);
  }
  return parsedValue;
}

export function parseCliOptions(args: string[]): CliOptions {
  const configFilters = collectFlagValues(args, "--config");
  const specFilters = collectFlagValues(args, "--spec").map((value) => value.toLowerCase());
  const matchFilters = collectFlagValues(args, "--match").map((value) => value.toLowerCase());

  let shardIndex: number | null = null;
  let shardTotal: number | null = null;
  const shardValue = collectSingleFlagValue(args, "--shard");
  if (shardValue) {
    const [indexPart, totalPart] = shardValue.split("/");
    if (!indexPart || !totalPart) {
      throw new Error("--shard must use the form <index>/<total>, e.g. --shard 2/4");
    }

    shardIndex = parsePositiveIntegerFlagValue(indexPart, "--shard index");
    shardTotal = parsePositiveIntegerFlagValue(totalPart, "--shard total");
    if (shardIndex > shardTotal) {
      throw new Error("--shard index cannot be greater than the shard total");
    }
  } else {
    const shardIndexValue = collectSingleFlagValue(args, "--shard-index");
    const shardTotalValue = collectSingleFlagValue(args, "--shard-total");
    if (shardIndexValue || shardTotalValue) {
      if (!shardIndexValue || !shardTotalValue) {
        throw new Error("--shard-index and --shard-total must be provided together");
      }

      shardIndex = parsePositiveIntegerFlagValue(shardIndexValue, "--shard-index");
      shardTotal = parsePositiveIntegerFlagValue(shardTotalValue, "--shard-total");
      if (shardIndex > shardTotal) {
        throw new Error("--shard-index cannot be greater than --shard-total");
      }
    }
  }

  return {
    headless: !args.includes("--headed"),
    dryRun: args.includes("--dry-run"),
    configFilters: configFilters.length > 0 ? new Set(configFilters) : null,
    specFilters,
    matchFilters,
    shardIndex,
    shardTotal,
    help: args.includes("--help"),
  };
}

export function printUsage(): void {
  console.log("Usage:");
  console.log("  pnpm screenshots");
  console.log("  pnpm screenshots -- --headed");
  console.log("  pnpm screenshots -- --spec 11-calendar --config mobile-light");
  console.log("  pnpm screenshots -- --shard 2/4");
  console.log(
    "  pnpm screenshots -- --spec calendar --match event --config desktop-light,mobile-light",
  );
  console.log("");
  console.log("Flags:");
  console.log("  --headed              Run the browser visibly");
  console.log("  --config <list>       Filter configs, e.g. desktop-light,mobile-light");
  console.log("  --spec <list>         Filter spec folders or names, e.g. 11-calendar,settings");
  console.log("  --shard <n/m>         Run a deterministic screenshot shard, e.g. 2/4");
  console.log("  --shard-index <n>     Shard index for CI matrix runs");
  console.log("  --shard-total <m>     Total shard count for CI matrix runs");
  console.log(
    "  --match <list>        Filter by page id/name/spec substring, e.g. calendar,event-modal",
  );
  console.log("  --dry-run             List what would be captured without launching a browser");
  console.log("  --help                Show this help");
}
