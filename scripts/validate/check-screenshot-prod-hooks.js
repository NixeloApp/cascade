import fs from "node:fs";
import path from "node:path";
import { createValidatorResult } from "./result-utils.js";
import { c, ROOT, relPath, walkDir } from "./utils.js";

const BANNED_SCREENSHOT_HOOK_PATTERNS = [
  "nixelo:e2e-set-editor-markdown",
  "nixelo:e2e-set-editor-value",
  "nixelo:e2e-open-markdown-preview",
  "nixelo:e2e-open-slash-menu",
  "nixelo:e2e-open-floating-toolbar",
  "__NIXELO_E2E_MARKDOWN_IMPORT__",
  "nixelo:e2e:roadmap-state",
  "__NIXELO_E2E_ROADMAP_STATE__",
  "e2e-roadmap",
  "nixelo:e2e:notifications-state",
  "nixelo:e2e:project-inbox-state",
  "nixelo:e2e:invoices-state",
  "nixelo:e2e:time-tracking-state",
  "__NIXELO_E2E_TIME_TRACKING_STATE__",
  "nixelo:e2e:my-issues-state",
  "__NIXELO_E2E_MY_ISSUES_LOADING__",
  "__NIXELO_E2E_ORG_CALENDAR_LOADING__",
  "__NIXELO_E2E_INVOICES_LOADING__",
  "__NIXELO_E2E_BOARD_LOADING__",
  "__NIXELO_E2E_NOTIFICATIONS_LOADING__",
  "__NIXELO_E2E_PROJECTS_LOADING__",
];

export function collectBannedScreenshotProdHooks(source, filePath) {
  const lines = source.split("\n");
  const violations = [];

  for (const pattern of BANNED_SCREENSHOT_HOOK_PATTERNS) {
    for (const [index, line] of lines.entries()) {
      if (!line.includes(pattern)) {
        continue;
      }

      violations.push({
        file: relPath(filePath),
        line: index + 1,
        pattern,
      });
    }
  }

  return violations;
}

export function run() {
  const srcDir = path.join(ROOT, "src");
  const sourceFiles = walkDir(srcDir, { extensions: new Set([".ts", ".tsx"]) }).filter(
    (filePath) => !filePath.endsWith(".test.ts") && !filePath.endsWith(".test.tsx"),
  );

  const violations = sourceFiles.flatMap((filePath) =>
    collectBannedScreenshotProdHooks(fs.readFileSync(filePath, "utf8"), filePath),
  );

  const messages = violations.map(
    (violation) =>
      `  ${c.red}ERROR${c.reset} ${violation.file}:${violation.line} - Remove screenshot-only production hook "${violation.pattern}" and drive the state through reusable E2E/page-object logic instead.`,
  );

  return createValidatorResult({
    errors: violations.length,
    detail:
      violations.length > 0
        ? `${violations.length} screenshot-only production hook(s)`
        : "no screenshot-only production hooks found",
    messages,
  });
}
