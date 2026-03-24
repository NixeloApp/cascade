/**
 * CLI parsing for the screenshot capture tool.
 */

import type { CliOptions } from "./config";

function parseCsvValues(rawValues: string[]): string[] {
  return rawValues
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function collectFlagValues(args: string[], flag: string): string[] {
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

export function parseCliOptions(args: string[]): CliOptions {
  const configFilters = collectFlagValues(args, "--config");
  const specFilters = collectFlagValues(args, "--spec").map((value) => value.toLowerCase());
  const matchFilters = collectFlagValues(args, "--match").map((value) => value.toLowerCase());

  return {
    headless: !args.includes("--headed"),
    dryRun: args.includes("--dry-run"),
    configFilters: configFilters.length > 0 ? new Set(configFilters) : null,
    specFilters,
    matchFilters,
    help: args.includes("--help"),
  };
}

export function printUsage(): void {
  console.log("Usage:");
  console.log("  pnpm screenshots");
  console.log("  pnpm screenshots -- --headed");
  console.log("  pnpm screenshots -- --spec 11-calendar --config mobile-light");
  console.log(
    "  pnpm screenshots -- --spec calendar --match event --config desktop-light,mobile-light",
  );
  console.log("");
  console.log("Flags:");
  console.log("  --headed              Run the browser visibly");
  console.log("  --config <list>       Filter configs, e.g. desktop-light,mobile-light");
  console.log("  --spec <list>         Filter spec folders or names, e.g. 11-calendar,settings");
  console.log(
    "  --match <list>        Filter by page id/name/spec substring, e.g. calendar,event-modal",
  );
  console.log("  --dry-run             List what would be captured without launching a browser");
  console.log("  --help                Show this help");
}
