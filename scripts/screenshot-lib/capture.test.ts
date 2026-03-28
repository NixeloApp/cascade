import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { Page } from "@playwright/test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { captureState, takeScreenshot } from "../../e2e/screenshot-lib/capture";
import {
  cleanupScreenshotStagingRoot,
  initializeScreenshotStagingRoot,
  resetScreenshotCaptureSessionState,
} from "../../e2e/screenshot-lib/session";
import { waitForExpectedContent } from "../../e2e/utils/page-readiness";
import { waitForScreenshotReady } from "../../e2e/utils/wait-helpers";

vi.mock("../../e2e/utils/page-readiness", () => ({
  waitForExpectedContent: vi.fn(),
}));

vi.mock("../../e2e/utils/wait-helpers", () => ({
  waitForScreenshotReady: vi.fn(),
}));

vi.mock("../../e2e/utils/screenshot-hash-guards", () => ({
  assertScreenshotHashIsNotLoadingState: vi.fn(),
  getScreenshotHash: vi.fn(() => "hash"),
}));

describe("screenshot capture helpers", () => {
  afterEach(() => {
    cleanupScreenshotStagingRoot();
    resetScreenshotCaptureSessionState();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("uses the shared page-readiness helper during navigation captures", async () => {
    const stagingBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), "cascade-screenshot-capture-"));
    initializeScreenshotStagingRoot(stagingBaseDir);
    captureState.currentConfigPrefix = "desktop-dark";
    captureState.cliOptions = {
      configFilters: null,
      dryRun: false,
      headless: true,
      help: false,
      matchFilters: [],
      shardIndex: null,
      shardTotal: null,
      specFilters: [],
    };
    const page = {
      goto: vi.fn(async () => {}),
      screenshot: vi.fn(async () => Buffer.from("png")),
    } as Partial<Page> as Page;

    await takeScreenshot(page, "public", "landing", "/");

    expect(page.goto).toHaveBeenCalledWith(expect.stringMatching(/\/$/), {
      timeout: 30000,
      waitUntil: "load",
    });
    expect(waitForScreenshotReady).toHaveBeenCalledTimes(2);
    expect(waitForExpectedContent).toHaveBeenCalledWith(page, "/", "landing", "public");
    expect(captureState.totalScreenshots).toBe(1);
    expect(fs.readdirSync(captureState.stagingRootDir, { recursive: true }).length).toBeGreaterThan(
      0,
    );
    fs.rmSync(stagingBaseDir, { force: true, recursive: true });
  });
});
