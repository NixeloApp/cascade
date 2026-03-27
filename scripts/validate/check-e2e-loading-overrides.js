import fs from "node:fs";
import path from "node:path";
import { createValidatorResult } from "./result-utils.js";
import { c, ROOT, relPath, walkDir } from "./utils.js";

const BANNED_LOADING_OVERRIDE_PATTERNS = [
  "__NIXELO_E2E_ISSUES_LOADING__",
  "isE2ELoadingOverrideEnabled(",
  "createIsolatedLoadingOverridePage(",
  "e2e-loading-overrides",
];

function collectLoadingOverrideViolations(filePath, source) {
  const lines = source.split("\n");
  const violations = [];

  for (const pattern of BANNED_LOADING_OVERRIDE_PATTERNS) {
    for (const [index, line] of lines.entries()) {
      if (!line.includes(pattern)) {
        continue;
      }

      violations.push({
        file: relPath(filePath),
        line: index + 1,
        message: `Remove screenshot-only loading override usage (${pattern}).`,
      });
    }
  }

  return violations;
}

export function run() {
  const sourceFiles = walkDir(path.join(ROOT, "src"), {
    extensions: new Set([".ts", ".tsx"]),
  }).filter((filePath) => !filePath.endsWith(".test.ts") && !filePath.endsWith(".test.tsx"));

  const e2eFiles = walkDir(path.join(ROOT, "e2e"), {
    extensions: new Set([".ts", ".tsx"]),
  }).filter((filePath) => !filePath.endsWith(".test.ts") && !filePath.endsWith(".test.tsx"));

  const productionViolations = sourceFiles.flatMap((filePath) =>
    collectLoadingOverrideViolations(filePath, fs.readFileSync(filePath, "utf8")),
  );

  const e2eViolations = e2eFiles.flatMap((filePath) =>
    collectLoadingOverrideViolations(filePath, fs.readFileSync(filePath, "utf8")),
  );

  const violations = [...productionViolations, ...e2eViolations];
  const messages = violations.map(
    (violation) =>
      `  ${c.red}ERROR${c.reset} ${violation.file}:${violation.line} - ${violation.message}`,
  );

  return createValidatorResult({
    errors: violations.length,
    detail:
      violations.length > 0
        ? `${violations.length} E2E loading override violation(s)`
        : "No screenshot-only loading overrides remain",
    messages,
  });
}
