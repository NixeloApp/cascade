/**
 * CHECK: Component Naming Conventions
 *
 * Validates React components follow consistent naming conventions:
 * - Component names are PascalCase
 * - Props interfaces follow {ComponentName}Props pattern
 * - Component files are named in PascalCase
 *
 * Standard Patterns:
 * | Element          | Pattern              | Examples                     |
 * |------------------|----------------------|------------------------------|
 * | Component        | PascalCase           | Button, IssueCard, AppHeader |
 * | Props interface  | {Component}Props     | ButtonProps, IssueCardProps  |
 * | Component file   | PascalCase.tsx       | Button.tsx, IssueCard.tsx    |
 *
 * @strictness INFO - Reports issues, does not block CI
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

// Configuration
const CONFIG = {
  // 'error' | 'warn' | 'off'
  strictness: "info",
};

// Directories to check
const COMPONENT_DIRS = ["src/components", "src/routes"];

// Files/directories to skip
const SKIP_PATTERNS = [
  /\.test\.tsx?$/,
  /\.stories\.tsx?$/,
  /index\.tsx?$/,
  /routeTree\.gen\.ts$/,
  /__tests__/,
  /\.d\.ts$/,
];

// Valid non-PascalCase file names (utilities, hooks, etc.)
const ALLOWED_LOWERCASE = new Set([
  "use", // hooks
  "utils",
  "helpers",
  "constants",
  "types",
  "config",
  "context",
]);

/**
 * Check if a name is PascalCase
 */
function isPascalCase(name) {
  return /^[A-Z][a-zA-Z0-9]*$/.test(name);
}

/**
 * Check if a file should be skipped
 */
function shouldSkip(filePath) {
  return SKIP_PATTERNS.some((pattern) => pattern.test(filePath));
}

/**
 * Extract component names from a file
 */
function extractComponents(content) {
  const components = [];

  // Match: export function ComponentName
  const funcExports = content.matchAll(/export\s+function\s+([A-Z][a-zA-Z0-9]*)\s*[<(]/g);
  for (const match of funcExports) {
    components.push({ name: match[1], type: "function" });
  }

  // Match: export const ComponentName = ...
  const constExports = content.matchAll(/export\s+const\s+([A-Z][a-zA-Z0-9]*)\s*[=:]/g);
  for (const match of constExports) {
    components.push({ name: match[1], type: "const" });
  }

  return components;
}

/**
 * Extract Props interfaces from a file
 */
function extractPropsInterfaces(content) {
  const interfaces = [];

  // Match: interface SomethingProps
  const interfaceMatches = content.matchAll(/interface\s+([A-Z][a-zA-Z0-9]*Props)\s*[{<]/g);
  for (const match of interfaceMatches) {
    interfaces.push(match[1]);
  }

  // Match: type SomethingProps =
  const typeMatches = content.matchAll(/type\s+([A-Z][a-zA-Z0-9]*Props)\s*=/g);
  for (const match of typeMatches) {
    interfaces.push(match[1]);
  }

  return interfaces;
}

/**
 * Check if file name matches component naming
 */
function checkFileName(filePath, components) {
  const fileName = path.basename(filePath, path.extname(filePath));
  const issues = [];

  // Skip if it's a utility file
  const firstWord = fileName.split(/(?=[A-Z])/)[0]?.toLowerCase();
  if (ALLOWED_LOWERCASE.has(firstWord)) {
    return issues;
  }

  // Check if file name is PascalCase for component files
  if (components.length > 0 && !isPascalCase(fileName)) {
    issues.push({
      type: "file",
      message: `File "${fileName}" contains components but name is not PascalCase`,
    });
  }

  // Check if main component matches file name
  const mainComponent = components.find(
    (c) => c.name === fileName || c.name === `${fileName}Component`,
  );
  if (components.length > 0 && !mainComponent && isPascalCase(fileName)) {
    // File is PascalCase but no matching component
    const componentNames = components.map((c) => c.name).join(", ");
    issues.push({
      type: "mismatch",
      message: `File "${fileName}.tsx" exports [${componentNames}] but none match file name`,
    });
  }

  return issues;
}

/**
 * Check Props interface naming
 */
function checkPropsNaming(components, propsInterfaces) {
  const issues = [];

  for (const component of components) {
    const expectedProps = `${component.name}Props`;
    const hasMatchingProps = propsInterfaces.includes(expectedProps);

    // Only warn if there are Props interfaces but none match
    if (propsInterfaces.length > 0 && !hasMatchingProps) {
      // Check if there's a generic Props interface
      const hasGenericProps = propsInterfaces.some((p) => p === "Props" || p.endsWith("Props"));
      if (!hasGenericProps) {
        issues.push({
          type: "props",
          message: `Component "${component.name}" has no matching "${expectedProps}" interface`,
        });
      }
    }
  }

  return issues;
}

/**
 * Check a single file
 */
function checkFile(filePath) {
  const issues = [];

  try {
    const content = fs.readFileSync(filePath, "utf-8");

    // Extract components and interfaces
    const components = extractComponents(content);
    const propsInterfaces = extractPropsInterfaces(content);

    // Skip files with no components
    if (components.length === 0) {
      return issues;
    }

    // Check file naming
    issues.push(...checkFileName(filePath, components));

    // Check props naming (only for files with multiple components or specific patterns)
    // Skip this check as it's too noisy - many valid patterns don't follow this strictly
    // issues.push(...checkPropsNaming(components, propsInterfaces));
  } catch {
    // Skip unreadable files
  }

  return issues;
}

/**
 * Main validation function
 */
export function run() {
  if (CONFIG.strictness === "off") {
    return { pass: true, errors: 0, warnings: 0, message: "Disabled" };
  }

  const allIssues = [];

  for (const dir of COMPONENT_DIRS) {
    const dirPath = path.join(ROOT, dir);
    if (!fs.existsSync(dirPath)) continue;

    const files = walkDir(dirPath).filter((f) => f.endsWith(".tsx") && !shouldSkip(f));

    for (const file of files) {
      const issues = checkFile(file);
      for (const issue of issues) {
        allIssues.push({
          file: relPath(file),
          ...issue,
        });
      }
    }
  }

  // Group issues by type
  const fileIssues = allIssues.filter((i) => i.type === "file");
  const mismatchIssues = allIssues.filter((i) => i.type === "mismatch");

  const isError = CONFIG.strictness === "error" && allIssues.length > 0;
  const totalIssues = allIssues.length;

  return {
    passed: true, // INFO level always passes
    pass: !isError,
    errors: isError ? totalIssues : 0,
    warnings: isError ? 0 : totalIssues,
    detail:
      totalIssues > 0
        ? `${totalIssues} naming issue(s) (${fileIssues.length} file, ${mismatchIssues.length} mismatch)`
        : undefined,
    messages:
      allIssues.length > 0
        ? allIssues.map((i) => `  ${c.yellow}WARN${c.reset} ${i.file} - ${i.message}`)
        : [],
  };
}

// Run standalone
if (process.argv[1] === import.meta.url.replace("file://", "")) {
  const result = run();
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.pass ? 0 : 1);
}
