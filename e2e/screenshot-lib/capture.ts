/**
 * Screenshot Capture Infrastructure
 *
 * Manages the screenshot capture pipeline: filtering, path resolution,
 * staging, hash guards, and the core takeScreenshot / captureCurrentView
 * functions.
 *
 * State is managed via a singleton CaptureState that must be initialized
 * before use. This keeps call sites clean (no ctx parameter threading).
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { Page } from "@playwright/test";
import {
  assertScreenshotHashIsNotLoadingState,
  getScreenshotHash,
} from "../utils/screenshot-hash-guards";
import type { SeedScreenshotResult } from "../utils/test-user-service";
import { waitForScreenshotReady } from "../utils/wait-helpers";
import {
  BASE_URL,
  type CaptureTarget,
  type CliOptions,
  FALLBACK_SCREENSHOT_DIR,
  MODAL_SPECS_BASE_DIR,
  SPECS_BASE_DIR,
  type ThemeName,
  type ViewportName,
} from "./config";
import { resolveCaptureTarget } from "./routing";
import { isCaptureTargetInShard } from "./sharding";
import { SCREENSHOT_PAGE_IDS } from "./targets";

// =============================================================================
// Capture State — mutable singleton for the capture session
// =============================================================================

export const captureState = {
  currentConfigPrefix: "",
  counters: new Map<string, number>(),
  totalScreenshots: 0,
  captureSkips: 0,
  captureFailures: 0,
  stagingRootDir: "",
  cliOptions: {
    headless: true,
    dryRun: false,
    configFilters: null,
    specFilters: [],
    matchFilters: [],
    shardIndex: null,
    shardTotal: null,
    help: false,
  } as CliOptions,
};

export function resetCounters(): void {
  captureState.counters = new Map<string, number>();
}

export function nextIndex(prefix: string): number {
  const n = (captureState.counters.get(prefix) ?? 0) + 1;
  captureState.counters.set(prefix, n);
  return n;
}

// =============================================================================
// Filtering — should we capture this screenshot?
// =============================================================================

export function matchesSpecFilters(target: CaptureTarget): boolean {
  if (captureState.cliOptions.specFilters.length === 0) {
    return true;
  }

  const candidates = [
    target.specFolder?.toLowerCase(),
    target.modalSpecSlug?.toLowerCase(),
    target.modalSpecSlug ? "modals" : null,
    target.modalSpecSlug ? `modals/${target.modalSpecSlug.toLowerCase()}` : null,
  ].filter((value): value is string => typeof value === "string");

  return captureState.cliOptions.specFilters.some((filter) =>
    candidates.some((candidate) => candidate.includes(filter)),
  );
}

export function matchesMatchFilters(prefix: string, name: string, target: CaptureTarget): boolean {
  if (captureState.cliOptions.matchFilters.length === 0) {
    return true;
  }

  const haystacks = [
    prefix,
    name,
    target.pageId,
    target.specFolder ?? "",
    target.modalSpecSlug ?? "",
  ].map((value) => value.toLowerCase());

  return captureState.cliOptions.matchFilters.some((filter) =>
    haystacks.some((candidate) => candidate.includes(filter)),
  );
}

export function isConfigSelected(viewport: ViewportName, theme: ThemeName): boolean {
  if (!captureState.cliOptions.configFilters) {
    return true;
  }
  return captureState.cliOptions.configFilters.has(`${viewport}-${theme}`);
}

export function shouldCapture(prefix: string, name: string): boolean {
  if (
    captureState.cliOptions.configFilters &&
    !captureState.cliOptions.configFilters.has(captureState.currentConfigPrefix)
  ) {
    return false;
  }

  const target = resolveCaptureTarget(prefix, name);
  if (
    captureState.cliOptions.shardIndex !== null &&
    captureState.cliOptions.shardTotal !== null &&
    !isCaptureTargetInShard(
      target,
      SCREENSHOT_PAGE_IDS,
      captureState.cliOptions.shardIndex,
      captureState.cliOptions.shardTotal,
    )
  ) {
    return false;
  }

  return matchesSpecFilters(target) && matchesMatchFilters(prefix, name, target);
}

export function shouldCaptureAny(prefix: string, names: string[]): boolean {
  return names.some((name) => shouldCapture(prefix, name));
}

// =============================================================================
// Config-specific helpers
// =============================================================================

export function getCurrentConfigUnsubscribeToken(seed: SeedScreenshotResult): string | undefined {
  switch (captureState.currentConfigPrefix) {
    case "desktop-dark":
      return seed.unsubscribeTokens?.desktopDark;
    case "desktop-light":
      return seed.unsubscribeTokens?.desktopLight;
    case "tablet-light":
      return seed.unsubscribeTokens?.tabletLight;
    case "mobile-light":
      return seed.unsubscribeTokens?.mobileLight;
    default:
      return undefined;
  }
}

// =============================================================================
// Path resolution & staging
// =============================================================================

export function getFinalScreenshotPaths(prefix: string, name: string): string[] {
  const target = resolveCaptureTarget(prefix, name);
  const finalPaths: string[] = [];

  const filename = target.filenameSuffix
    ? `${captureState.currentConfigPrefix}${target.filenameSuffix}.png`
    : `${captureState.currentConfigPrefix}.png`;

  // Compute paths only — directory creation is deferred to getStagedScreenshotPath
  // so that --dry-run doesn't modify the filesystem.
  if (target.specFolder) {
    const specScreenshotDir = path.join(SPECS_BASE_DIR, target.specFolder, "screenshots");
    finalPaths.push(path.join(specScreenshotDir, filename));
  } else {
    const fallbackFilename = `${captureState.currentConfigPrefix}-${prefix}-${name}.png`;
    finalPaths.push(path.join(FALLBACK_SCREENSHOT_DIR, fallbackFilename));
  }

  if (target.modalSpecSlug) {
    finalPaths.push(
      path.join(
        MODAL_SPECS_BASE_DIR,
        `${target.modalSpecSlug}-${captureState.currentConfigPrefix}.png`,
      ),
    );
  }

  return [...new Set(finalPaths)];
}

function ensureStagingRoot(): string {
  if (!captureState.stagingRootDir) {
    throw new Error("Screenshot staging directory has not been initialized");
  }
  return captureState.stagingRootDir;
}

export function getStagingRoot(): string {
  return ensureStagingRoot();
}

export function getStagedScreenshotPath(finalPath: string): string {
  const relativePath = path.relative(process.cwd(), finalPath);
  const stagedPath = path.join(ensureStagingRoot(), relativePath);
  fs.mkdirSync(path.dirname(stagedPath), { recursive: true });
  return stagedPath;
}

export function collectFilesRecursively(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectFilesRecursively(entryPath);
    }
    return [entryPath];
  });
}

export function getStagedOutputSummary(): Map<string, number> {
  const summary = new Map<string, number>();
  const specsPrefix = path.join("docs", "design", "specs", "pages") + path.sep;
  const modalSpecsPrefix = path.join("docs", "design", "specs", "modals", "screenshots") + path.sep;
  const fallbackPrefix = path.join("e2e", "screenshots") + path.sep;

  for (const stagedFile of collectFilesRecursively(ensureStagingRoot())) {
    const relativePath = path.relative(ensureStagingRoot(), stagedFile);
    let bucket: string | null = null;

    if (relativePath.startsWith(specsPrefix)) {
      const specRelativePath = relativePath.slice(specsPrefix.length);
      const [specFolder, screenshotsFolder] = specRelativePath.split(path.sep);
      if (specFolder && screenshotsFolder === "screenshots") {
        bucket = path.join("docs/design/specs/pages", specFolder, "screenshots");
      }
    } else if (relativePath.startsWith(modalSpecsPrefix)) {
      bucket = "docs/design/specs/modals/screenshots";
    } else if (relativePath.startsWith(fallbackPrefix)) {
      bucket = "e2e/screenshots";
    }

    if (!bucket) {
      continue;
    }

    summary.set(bucket, (summary.get(bucket) ?? 0) + 1);
  }

  return new Map([...summary.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

export function promoteStagedScreenshots(): void {
  const stagedFiles = collectFilesRecursively(ensureStagingRoot());

  const targetDirToFiles = new Map<string, Set<string>>();
  for (const stagedFile of stagedFiles) {
    const relativePath = path.relative(ensureStagingRoot(), stagedFile);
    const finalPath = path.join(process.cwd(), relativePath);
    const targetDir = path.dirname(finalPath);
    if (!targetDirToFiles.has(targetDir)) {
      targetDirToFiles.set(targetDir, new Set());
    }
    targetDirToFiles.get(targetDir)?.add(path.basename(finalPath));
  }

  const isExhaustiveRun =
    !captureState.cliOptions.configFilters &&
    captureState.cliOptions.specFilters.length === 0 &&
    captureState.cliOptions.matchFilters.length === 0;

  if (isExhaustiveRun) {
    for (const [targetDir, expectedFiles] of targetDirToFiles) {
      if (!fs.existsSync(targetDir)) continue;
      for (const existingFile of fs.readdirSync(targetDir)) {
        if (existingFile.startsWith("reference-")) continue;
        if (existingFile.endsWith(".png") && !expectedFiles.has(existingFile)) {
          const stalePath = path.join(targetDir, existingFile);
          fs.rmSync(stalePath, { force: true });
          console.log(`  🗑️  Removed stale: ${path.relative(process.cwd(), stalePath)}`);
        }
      }
    }
  }

  for (const stagedFile of stagedFiles) {
    const relativePath = path.relative(ensureStagingRoot(), stagedFile);
    const finalPath = path.join(process.cwd(), relativePath);
    fs.mkdirSync(path.dirname(finalPath), { recursive: true });
    fs.copyFileSync(stagedFile, finalPath);
  }
}

// =============================================================================
// Core capture functions
// =============================================================================

/** Capture a screenshot buffer with animations disabled. */
export async function captureScreenshotBuffer(page: Page): Promise<Buffer> {
  return page.screenshot({ animations: "disabled" });
}

/**
 * Registered callback for page-specific content readiness checks.
 * Must be set via `registerWaitForExpectedContent` before `takeScreenshot` is called.
 */
let waitForExpectedContentFn:
  | ((page: Page, url: string, name: string, prefix?: string) => Promise<void>)
  | null = null;

/** Register the page-readiness callback used by takeScreenshot. */
export function registerWaitForExpectedContent(
  fn: (page: Page, url: string, name: string, prefix?: string) => Promise<void>,
): void {
  waitForExpectedContentFn = fn;
}

/**
 * Navigate to a URL, wait for readiness, and capture a screenshot.
 *
 * Requires `registerWaitForExpectedContent` to have been called first.
 */
export async function takeScreenshot(
  page: Page,
  prefix: string,
  name: string,
  url: string,
): Promise<void> {
  if (!shouldCapture(prefix, name)) {
    return;
  }

  const n = nextIndex(prefix);
  const num = String(n).padStart(2, "0");
  const finalPaths = getFinalScreenshotPaths(prefix, name);
  const relativePaths = finalPaths.map((fp) => path.relative(process.cwd(), fp));
  const relativePathLabel = relativePaths.join(" + ");

  if (captureState.cliOptions.dryRun) {
    captureState.totalScreenshots++;
    console.log(`    ${num}  [${prefix}] ${name} → ${relativePathLabel}`);
    return;
  }

  const startTime = performance.now();

  try {
    await page.goto(`${BASE_URL}${url}`, { waitUntil: "load", timeout: 30000 });
  } catch {
    // Navigation timeout is acceptable -- page may still be usable
  }
  await waitForScreenshotReady(page);
  if (waitForExpectedContentFn) {
    await waitForExpectedContentFn(page, url, name, prefix);
  }
  await waitForScreenshotReady(page);
  const screenshot = await captureScreenshotBuffer(page);
  const screenshotHash = getScreenshotHash(screenshot);
  assertScreenshotHashIsNotLoadingState(screenshotHash, relativePathLabel);
  for (const finalPath of finalPaths) {
    fs.writeFileSync(getStagedScreenshotPath(finalPath), screenshot);
  }
  captureState.totalScreenshots++;

  const elapsed = Math.round(performance.now() - startTime);
  console.log(`    ${num}  [${prefix}] ${name} → ${relativePathLabel}  (${elapsed}ms)`);
}

/**
 * Capture a screenshot of the current page state (no navigation).
 * Used for modal/dialog captures and interactive state captures.
 */
export async function captureCurrentView(
  page: Page,
  prefix: string,
  name: string,
  options?: { skipReadyCheck?: boolean },
): Promise<void> {
  if (!shouldCapture(prefix, name)) {
    return;
  }

  const n = nextIndex(prefix);
  const num = String(n).padStart(2, "0");
  const finalPaths = getFinalScreenshotPaths(prefix, name);
  const relativePaths = finalPaths.map((fp) => path.relative(process.cwd(), fp));
  const relativePathLabel = relativePaths.join(" + ");

  if (captureState.cliOptions.dryRun) {
    captureState.totalScreenshots++;
    console.log(`    ${num}  [${prefix}] ${name} → ${relativePathLabel}`);
    return;
  }

  const startTime = performance.now();

  if (!options?.skipReadyCheck) {
    await waitForScreenshotReady(page);
  }
  const screenshot = await captureScreenshotBuffer(page);
  const screenshotHash = getScreenshotHash(screenshot);
  assertScreenshotHashIsNotLoadingState(screenshotHash, relativePathLabel);
  for (const finalPath of finalPaths) {
    fs.writeFileSync(getStagedScreenshotPath(finalPath), screenshot);
  }
  captureState.totalScreenshots++;

  const elapsed = Math.round(performance.now() - startTime);
  console.log(`    ${num}  [${prefix}] ${name} → ${relativePathLabel}  (${elapsed}ms)`);
}

// =============================================================================
// Error handling
// =============================================================================

/** Detect errors that indicate the browser/page has crashed. */
export function isCrashLikeError(message: string): boolean {
  return (
    message.includes("Target page, context or browser has been closed") ||
    message.includes("Browser has been closed") ||
    message.includes("Connection closed") ||
    message.includes("Target closed")
  );
}

/** Run a capture step, soft-skipping on non-crash errors. */
export async function runCaptureStep(label: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isCrashLikeError(message)) {
      throw error;
    }
    captureState.captureSkips++;
    console.log(`    ⚠️  skipped ${label}: ${message}`);
  }
}

/** Run a required capture step — non-crash errors are re-thrown with context. */
export async function runRequiredCaptureStep(
  label: string,
  fn: () => Promise<void>,
): Promise<void> {
  try {
    await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isCrashLikeError(message)) {
      throw error;
    }
    throw new Error(`Required capture failed for ${label}: ${message}`);
  }
}
