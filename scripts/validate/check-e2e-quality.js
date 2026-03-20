/**
 * CHECK: E2E Test Quality
 *
 * Catches common anti-patterns in E2E spec files that lead to flaky or
 * meaningless tests.
 *
 * Rules:
 * 1. `.first()` on broad page-level selectors (page.locator("tag").first())
 * 2. Generic CSS-class selectors on page (page.locator(".animate-pulse"))
 * 3. `waitForSelector` usage (use locator assertions instead)
 * 4. `waitForLoadState("networkidle")` — flaky, prefer element assertions
 * 5. Raw string getByTestId (use TEST_IDS constants)
 * 6. Unscoped .first() calls on page-level locators
 */

import fs from "node:fs";
import path from "node:path";
import { analyzeCountRatchet, loadCountBaseline } from "./ratchet-utils.js";
import { c, ROOT, relPath, walkDir } from "./utils.js";

const SCREENSHOT_HARNESS_REL_PATH = "e2e/screenshot-pages.ts";
const SCREENSHOT_HARNESS_BASELINE_PATH = path.join(
  ROOT,
  "scripts",
  "ci",
  "e2e-quality-screenshot-pages-baseline.json",
);

// ── Broad tag selectors that should never appear unscoped on `page` ──
const BROAD_TAG_SELECTORS = new Set([
  "img",
  "svg",
  "div",
  "span",
  "p",
  "a",
  "button",
  "input",
  "aside",
  "section",
  "article",
  "ul",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
]);

// ── Generic CSS classes that are too broad to select on directly ──
const BROAD_CLASS_PATTERNS = [
  /^\.animate-/,
  /^\.flex$/,
  /^\.hidden$/,
  /^\.grid$/,
  /^\.relative$/,
  /^\.absolute$/,
  /^\.overflow-/,
];

// ── Files/patterns to skip ──
const SKIP_FILES = new Set([
  "e2e/global-setup.ts", // Setup scaffolding, not a test
  "e2e/fixtures.ts", // Test fixture definitions
]);

// ── Directories to skip for certain checks ──
const SKIP_TESTID_CHECK_DIRS = [
  "/utils/", // Utility helpers define selectors dynamically
  "/pages/", // Page objects define selectors as properties
];

// ── Skip .first() check in page objects (they define scoped selectors) ──
const SKIP_FIRST_CHECK_DIRS = [
  "/pages/", // Page object selectors are intentionally defined with .first()
  "/utils/", // Utility helpers handle edge cases with .first()
];

export function run() {
  const E2E_DIR = path.join(ROOT, "e2e");

  const collectedIssues = [];

  function reportIssue(filePath, line, type, message) {
    collectedIssues.push({
      file: relPath(filePath),
      line,
      type,
      message,
    });
  }

  /**
   * Line-based checks — fast and simple, no AST needed.
   */
  function checkFile(filePath) {
    const rel = relPath(filePath);
    if (SKIP_FILES.has(rel)) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // ── Rule 1: .first() on broad page-level tag selectors ──
      // Matches: page.locator("img").first(), page.locator("aside").first()
      const tagFirstMatch = line.match(/page\.locator\(\s*["'`](\w+)["'`]\s*\)\.first\(\)/);
      if (tagFirstMatch && BROAD_TAG_SELECTORS.has(tagFirstMatch[1])) {
        reportIssue(
          filePath,
          lineNum,
          "BROAD_TAG_FIRST",
          `Broad selector page.locator("${tagFirstMatch[1]}").first() matches any <${tagFirstMatch[1]}> on page. Scope to a container or use data-testid.`,
        );
      }

      // ── Rule 2: Generic CSS-class selectors on page ──
      // Matches: page.locator(".animate-pulse"), page.locator(".flex")
      const classMatch = line.match(/page\.locator\(\s*["'`](\.[\w-]+)["'`]\s*\)/);
      if (classMatch) {
        const cls = classMatch[1];
        if (BROAD_CLASS_PATTERNS.some((pat) => pat.test(cls))) {
          reportIssue(
            filePath,
            lineNum,
            "BROAD_CLASS_SELECTOR",
            `Generic CSS class selector page.locator("${cls}") is too broad. Use a scoped container or data-testid instead.`,
          );
        }
      }

      // ── Rule 3: waitForSelector ──
      if (/\.waitForSelector\s*\(/.test(line)) {
        reportIssue(
          filePath,
          lineNum,
          "WAIT_FOR_SELECTOR",
          `waitForSelector() is deprecated Playwright style. Use locator().waitFor() or expect(locator).toBeVisible() instead.`,
        );
      }

      // ── Rule 4: networkidle ──
      if (/waitForLoadState\(\s*["'`]networkidle["'`]\s*\)/.test(line)) {
        reportIssue(
          filePath,
          lineNum,
          "NETWORKIDLE",
          `waitForLoadState("networkidle") is flaky. Prefer waiting for a specific element assertion.`,
        );
      }

      // ── Rule 5: Raw string getByTestId (only in spec files) ──
      // Matches: getByTestId("some-id") but not getByTestId(TEST_IDS.X)
      if (!SKIP_TESTID_CHECK_DIRS.some((d) => rel.includes(d))) {
        const testIdMatch = line.match(/getByTestId\(\s*["'`]([^"'`]+)["'`]\s*\)/);
        if (testIdMatch) {
          reportIssue(
            filePath,
            lineNum,
            "RAW_TEST_ID",
            `Raw string getByTestId("${testIdMatch[1]}") — use TEST_IDS constant instead.`,
          );
        }
      }

      // ── Rule 6: Unscoped .first() on page locator (spec files only) ──
      // Matches: page.locator(...).first() or page.getBy...().first()
      // Skip page objects and utils - they define selectors intentionally
      if (!SKIP_FIRST_CHECK_DIRS.some((d) => rel.includes(d))) {
        if (/page\.(locator|getBy\w+)\([^)]+\)\.first\(\)/.test(line)) {
          // Already caught by Rule 1 if it's a broad tag, but catch other cases too
          if (!tagFirstMatch) {
            reportIssue(
              filePath,
              lineNum,
              "UNSCOPED_FIRST",
              `Unscoped .first() on page-level locator. Scope to a container or use more specific selector.`,
            );
          }
        }
      }
    }
  }

  // Walk all E2E files
  const e2eFiles = walkDir(E2E_DIR, { extensions: new Set([".ts"]) });
  for (const file of e2eFiles) {
    // Skip locator factory and type files
    if (file.includes("/locators/")) continue;
    if (file.endsWith(".d.ts")) continue;
    checkFile(file);
  }

  const blockingIssues = collectedIssues.filter(
    (issue) => issue.file !== SCREENSHOT_HARNESS_REL_PATH,
  );
  const screenshotHarnessIssues = collectedIssues
    .filter((issue) => issue.file === SCREENSHOT_HARNESS_REL_PATH)
    .sort((a, b) => a.line - b.line);
  const screenshotHarnessBaselineByType = loadCountBaseline(
    SCREENSHOT_HARNESS_BASELINE_PATH,
    "issueCountsByType",
  );
  const screenshotHarnessIssuesByType = {};

  for (const issue of screenshotHarnessIssues) {
    const issuesForType = screenshotHarnessIssuesByType[issue.type] ?? [];
    issuesForType.push(issue);
    screenshotHarnessIssuesByType[issue.type] = issuesForType;
  }

  const screenshotHarnessRatchet = analyzeCountRatchet(
    screenshotHarnessIssuesByType,
    screenshotHarnessBaselineByType,
  );
  const screenshotHarnessRatchetIssues = Object.values(screenshotHarnessRatchet.overagesByKey)
    .flatMap((entry) => entry.overageItems)
    .sort((a, b) => a.line - b.line);

  const finalIssues = [...blockingIssues, ...screenshotHarnessRatchetIssues];
  const messages = finalIssues.map(
    (issue) => `  ${c.red}ERROR${c.reset} ${issue.file}:${issue.line} - ${issue.message}`,
  );
  const screenshotHarnessBaselineDetail =
    screenshotHarnessRatchet.totalCurrent > 0
      ? ` (${screenshotHarnessRatchet.totalCurrent} baselined screenshot harness quality issue(s))`
      : "";

  return {
    passed: finalIssues.length === 0,
    errors: finalIssues.length,
    detail:
      finalIssues.length > 0
        ? `${finalIssues.length} error(s)`
        : `no blocking issues${screenshotHarnessBaselineDetail}`,
    messages: messages.length > 0 ? messages : undefined,
  };
}
