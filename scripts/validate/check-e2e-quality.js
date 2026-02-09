/**
 * CHECK 8: E2E Test Quality
 *
 * Catches common anti-patterns in E2E spec files that lead to flaky or
 * meaningless tests.
 *
 * Rules:
 * 1. `.first()` on broad page-level selectors (page.locator("tag").first())
 * 2. Generic CSS-class selectors on page (page.locator(".animate-pulse"))
 * 3. `waitForSelector` usage (use locator assertions instead)
 * 4. `waitForLoadState("networkidle")` — flaky, prefer element assertions
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

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

export function run() {
  const E2E_DIR = path.join(ROOT, "e2e");

  let errorCount = 0;
  const messages = [];

  function report(filePath, line, message) {
    const rel = relPath(filePath);
    messages.push(`  ${c.red}ERROR${c.reset} ${rel}:${line} - ${message}`);
    errorCount++;
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
        report(
          filePath,
          lineNum,
          `Broad selector page.locator("${tagFirstMatch[1]}").first() matches any <${tagFirstMatch[1]}> on page. Scope to a container or use data-testid.`,
        );
      }

      // ── Rule 2: Generic CSS-class selectors on page ──
      // Matches: page.locator(".animate-pulse"), page.locator(".flex")
      const classMatch = line.match(/page\.locator\(\s*["'`](\.[\w-]+)["'`]\s*\)/);
      if (classMatch) {
        const cls = classMatch[1];
        if (BROAD_CLASS_PATTERNS.some((pat) => pat.test(cls))) {
          report(
            filePath,
            lineNum,
            `Generic CSS class selector page.locator("${cls}") is too broad. Use a scoped container or data-testid instead.`,
          );
        }
      }

      // ── Rule 3: waitForSelector ──
      if (/\.waitForSelector\s*\(/.test(line)) {
        report(
          filePath,
          lineNum,
          `waitForSelector() is deprecated Playwright style. Use locator().waitFor() or expect(locator).toBeVisible() instead.`,
        );
      }

      // ── Rule 4: networkidle ──
      if (/waitForLoadState\(\s*["'`]networkidle["'`]\s*\)/.test(line)) {
        report(
          filePath,
          lineNum,
          `waitForLoadState("networkidle") is flaky. Prefer waiting for a specific element assertion.`,
        );
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

  return {
    passed: errorCount === 0,
    errors: errorCount,
    detail: errorCount > 0 ? `${errorCount} error(s)` : undefined,
    messages: messages.length > 0 ? messages : undefined,
  };
}
