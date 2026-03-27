/**
 * Visual screenshot tool for reviewing all app pages.
 *
 * Captures screenshots across viewport/theme combinations:
 *   - desktop-dark (1920x1080)
 *   - desktop-light (1920x1080)
 *   - tablet-light (768x1024)
 *   - mobile-light (390x844)
 *
 * Output: Screenshots go to their corresponding spec folders:
 *   - docs/design/specs/pages/02-signin/screenshots/
 *   - docs/design/specs/pages/03-signup/screenshots/
 *   - etc.
 *
 * Pages without specs go to: e2e/screenshots/ (flat folder)
 *
 * Usage:
 *   pnpm screenshots              # capture all
 *   pnpm screenshots -- --headed  # visible browser
 *   pnpm screenshots -- --spec 11-calendar --config mobile-light
 *   pnpm screenshots -- --spec calendar --match event
 *
 * Requires dev server running (pnpm dev).
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { chromium } from "@playwright/test";
import {
  captureState,
  getStagedOutputSummary,
  getStagingRoot,
  isConfigSelected,
  promoteStagedScreenshots,
  registerWaitForExpectedContent,
} from "./screenshot-lib/capture";
import { parseCliOptions, printUsage } from "./screenshot-lib/cli";
import { BASE_URL, CONFIGS, SCREENSHOT_STAGING_BASE_DIR } from "./screenshot-lib/config";
import { waitForExpectedContent } from "./screenshot-lib/readiness";
import { getGeneratedSpecFolders } from "./screenshot-lib/routing";
import {
  captureConfiguredScreenshotStates,
  enumerateDryRunTargets,
} from "./screenshot-lib/session";
import { buildScreenshotShards } from "./screenshot-lib/sharding";
import { SCREENSHOT_PAGE_IDS } from "./screenshot-lib/targets";

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function run(): Promise<void> {
  captureState.cliOptions = parseCliOptions(process.argv.slice(2));
  registerWaitForExpectedContent(waitForExpectedContent);
  if (captureState.cliOptions.help) {
    printUsage();
    return;
  }

  const specFolders = getGeneratedSpecFolders();
  const selectedConfigs = CONFIGS.filter((config) =>
    isConfigSelected(config.viewport, config.theme),
  );

  if (selectedConfigs.length === 0) {
    throw new Error("No screenshot configs matched the provided --config filter");
  }

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║         NIXELO SCREENSHOT CAPTURE                          ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log(`\n  Base URL: ${BASE_URL}`);
  console.log(`  Configs: ${selectedConfigs.map((c) => `${c.viewport}-${c.theme}`).join(", ")}`);
  console.log(`  Spec folders: ${[...new Set(specFolders)].join(", ")}`);
  if (captureState.cliOptions.shardIndex !== null && captureState.cliOptions.shardTotal !== null) {
    const shards = buildScreenshotShards(SCREENSHOT_PAGE_IDS, captureState.cliOptions.shardTotal);
    const activeShard = shards.find((shard) => shard.index === captureState.cliOptions.shardIndex);
    if (!activeShard) {
      throw new Error("Active screenshot shard could not be resolved");
    }
    console.log(
      `  Shard: ${activeShard.index}/${captureState.cliOptions.shardTotal} (${activeShard.targetCount} target(s), ${activeShard.keys.length} bucket(s))`,
    );
  }
  if (captureState.cliOptions.specFilters.length > 0) {
    console.log(`  Spec filter: ${captureState.cliOptions.specFilters.join(", ")}`);
  }
  if (captureState.cliOptions.matchFilters.length > 0) {
    console.log(`  Match filter: ${captureState.cliOptions.matchFilters.join(", ")}`);
  }

  if (captureState.cliOptions.dryRun) {
    console.log("\n  🏃 DRY RUN — listing targets without launching a browser\n");
    enumerateDryRunTargets(selectedConfigs);
    return;
  }

  // Create staging directory only when we are actually capturing (not dry-run)
  fs.mkdirSync(SCREENSHOT_STAGING_BASE_DIR, { recursive: true });
  captureState.stagingRootDir = fs.mkdtempSync(path.join(SCREENSHOT_STAGING_BASE_DIR, "run-"));

  const headless = captureState.cliOptions.headless;
  const launchBrowser = () => chromium.launch({ headless });
  const captured = await captureConfiguredScreenshotStates(launchBrowser, selectedConfigs);
  if (!captured) {
    return;
  }

  if (captureState.captureFailures > 0) {
    fs.rmSync(getStagingRoot(), { recursive: true, force: true });
    captureState.stagingRootDir = "";
    throw new Error(
      `Screenshot capture had ${captureState.captureFailures} failure(s); staged output was not promoted`,
    );
  }

  if (captureState.totalScreenshots === 0) {
    fs.rmSync(getStagingRoot(), { recursive: true, force: true });
    captureState.stagingRootDir = "";
    throw new Error("No screenshots matched the provided filters");
  }

  promoteStagedScreenshots();
  const outputSummary = getStagedOutputSummary();
  fs.rmSync(getStagingRoot(), { recursive: true, force: true });
  captureState.stagingRootDir = "";

  const skipNote = captureState.captureSkips > 0 ? ` (${captureState.captureSkips} skipped)` : "";
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log(`║  ✅ COMPLETE: ${captureState.totalScreenshots} screenshots captured${skipNote}`);
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log("  Output:");
  for (const [folder, count] of outputSummary) {
    console.log(`    ${count.toString().padStart(3, " ")}  ${folder}`);
  }
  console.log("");
}

run().catch(console.error);
