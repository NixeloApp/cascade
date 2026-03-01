/**
 * CHECK: Duplicate Component Names
 *
 * Flags React components with the same name in different directories.
 * This helps identify potential import confusion and naming conflicts.
 *
 * Examples of issues detected:
 * - src/components/ui/Input.tsx vs src/components/ui/form/Input.tsx
 * - src/components/RoadmapView.tsx vs src/components/Calendar/RoadmapView.tsx
 *
 * Known Exceptions:
 * - ui/form/* duplicates are intentional (form-specific wrappers)
 * - Test files (*.test.tsx)
 * - Index files (index.tsx)
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
const COMPONENT_DIRS = ["src/components"];

// Files/directories to skip
const SKIP_PATTERNS = [
  /\.test\.tsx?$/,
  /\.stories\.tsx?$/,
  /index\.tsx?$/,
  /\.d\.ts$/,
  /__tests__/,
];

// Known intentional duplicates (pairs that are expected)
// Format: ["dir1/file", "dir2/file"] - relative to src/components
const ALLOWED_DUPLICATES = new Set([
  // ui/form/* wraps ui/* with form-specific behavior
  "ui/Checkbox.tsx:ui/form/Checkbox.tsx",
  "ui/Input.tsx:ui/form/Input.tsx",
  "ui/Select.tsx:ui/form/Select.tsx",
  "ui/Textarea.tsx:ui/form/Textarea.tsx",
]);

/**
 * Check if a file should be skipped
 */
function shouldSkip(filePath) {
  return SKIP_PATTERNS.some((pattern) => pattern.test(filePath));
}

/**
 * Check if a duplicate pair is allowed
 */
function isAllowedDuplicate(path1, path2) {
  // Normalize paths for comparison
  const rel1 = path1.replace("src/components/", "");
  const rel2 = path2.replace("src/components/", "");

  // Check both orderings
  const key1 = `${rel1}:${rel2}`;
  const key2 = `${rel2}:${rel1}`;

  return ALLOWED_DUPLICATES.has(key1) || ALLOWED_DUPLICATES.has(key2);
}

/**
 * Main validation function
 */
export function run() {
  if (CONFIG.strictness === "off") {
    return { passed: true, errors: 0, warnings: 0, detail: "Disabled", messages: [] };
  }

  const componentsByName = new Map();

  // Collect all component files by base name
  for (const dir of COMPONENT_DIRS) {
    const dirPath = path.join(ROOT, dir);
    if (!fs.existsSync(dirPath)) continue;

    const files = walkDir(dirPath).filter((f) => f.endsWith(".tsx") && !shouldSkip(f));

    for (const file of files) {
      const fileName = path.basename(file, ".tsx");
      const rel = relPath(file);

      if (!componentsByName.has(fileName)) {
        componentsByName.set(fileName, []);
      }
      componentsByName.get(fileName).push(rel);
    }
  }

  // Find duplicates
  const duplicates = [];
  for (const [name, paths] of componentsByName) {
    if (paths.length > 1) {
      // Filter out allowed duplicates
      const unallowedPairs = [];
      for (let i = 0; i < paths.length; i++) {
        for (let j = i + 1; j < paths.length; j++) {
          if (!isAllowedDuplicate(paths[i], paths[j])) {
            unallowedPairs.push([paths[i], paths[j]]);
          }
        }
      }

      if (unallowedPairs.length > 0) {
        duplicates.push({
          name,
          paths,
          unallowedPairs,
        });
      }
    }
  }

  const isError = CONFIG.strictness === "error" && duplicates.length > 0;
  const totalIssues = duplicates.length;

  // Format messages
  const messages = [];
  for (const dup of duplicates) {
    messages.push(`  ${c.yellow}WARN${c.reset} "${dup.name}" found in multiple locations:`);
    for (const p of dup.paths) {
      messages.push(`    ${c.dim}- ${p}${c.reset}`);
    }
  }

  return {
    passed: true, // INFO level always passes
    errors: isError ? totalIssues : 0,
    warnings: isError ? 0 : totalIssues,
    detail: totalIssues > 0 ? `${totalIssues} duplicate name(s)` : undefined,
    messages,
  };
}

// Run standalone
if (process.argv[1] === import.meta.url.replace("file://", "")) {
  const result = run();
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.passed ? 0 : 1);
}
