import fs from "node:fs";
import path from "node:path";
import { createValidatorResult } from "./result-utils.js";
import { c, ROOT, relPath, walkDir } from "./utils.js";

const LOADING_OVERRIDE_WINDOW_KEYS = ["__NIXELO_E2E_ISSUES_LOADING__"];

const ALLOWED_PRODUCTION_FILES = new Set(["src/lib/e2e-loading-overrides.ts"]);
const ALLOWED_E2E_FILES = new Set(["e2e/utils/convex-loading.ts"]);
const ALLOWED_OVERRIDE_CALLERS = new Set(["src/routes/_auth/_app/$orgSlug/issues/index.tsx"]);

function collectWindowKeyViolations(filePath, source, allowedFiles) {
  if (allowedFiles.has(relPath(filePath))) {
    return [];
  }

  const lines = source.split("\n");
  const violations = [];

  for (const windowKey of LOADING_OVERRIDE_WINDOW_KEYS) {
    for (const [index, line] of lines.entries()) {
      if (!line.includes(windowKey)) {
        continue;
      }

      violations.push({
        file: relPath(filePath),
        line: index + 1,
        message: `Use the centralized E2E loading override contract instead of hardcoding ${windowKey}.`,
      });
    }
  }

  return violations;
}

function collectOverrideCallerViolations(filePath, source) {
  const relativePath = relPath(filePath);
  const lines = source.split("\n");
  const violations = [];

  for (const [index, line] of lines.entries()) {
    if (!line.includes("isE2ELoadingOverrideEnabled(")) {
      continue;
    }

    if (
      line.includes("function isE2ELoadingOverrideEnabled(") ||
      line.includes("export function isE2ELoadingOverrideEnabled(")
    ) {
      continue;
    }

    if (ALLOWED_OVERRIDE_CALLERS.has(relativePath)) {
      continue;
    }

    violations.push({
      file: relativePath,
      line: index + 1,
      message: "Only the documented issues route may read E2E loading overrides.",
    });
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

  const productionViolations = sourceFiles.flatMap((filePath) => {
    const source = fs.readFileSync(filePath, "utf8");
    return [
      ...collectWindowKeyViolations(filePath, source, ALLOWED_PRODUCTION_FILES),
      ...collectOverrideCallerViolations(filePath, source),
    ];
  });

  const e2eViolations = e2eFiles.flatMap((filePath) =>
    collectWindowKeyViolations(filePath, fs.readFileSync(filePath, "utf8"), ALLOWED_E2E_FILES),
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
        : "E2E loading override contract is centralized",
    messages,
  });
}
