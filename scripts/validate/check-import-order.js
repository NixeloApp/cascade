/**
 * CHECK: Import Order
 *
 * DISABLED: This validator is disabled because Biome's `organizeImports: "on"`
 * (in biome.json) automatically handles import ordering. Having both would
 * cause conflicts where Biome reverts manual changes.
 *
 * Biome enforces consistent import ordering automatically via `pnpm biome`.
 *
 * Original intent was to validate:
 * 1. Node built-ins (node:fs, path)
 * 2. External packages (react, lodash, convex)
 * 3. Internal aliases (@/, @convex/)
 * 4. Parent imports (../)
 * 5. Sibling imports (./)
 * 6. Style imports (*.css)
 *
 * @strictness OFF - Handled by Biome organizeImports
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

// Configuration - DISABLED, Biome handles import ordering
const CONFIG = {
  // 'error' | 'warn' | 'off'
  strictness: "off",
};

// Files/directories to skip
const SKIP_PATTERNS = [
  "node_modules",
  "dist",
  ".next",
  "_generated",
  "routeTree.gen.ts",
  ".test.",
  ".spec.",
  "e2e/",
  ".d.ts",
];

/**
 * Categorize an import source
 */
function getImportCategory(source) {
  // Node built-ins
  if (source.startsWith("node:") || isNodeBuiltin(source)) {
    return 1;
  }
  // Style imports
  if (source.endsWith(".css") || source.endsWith(".scss")) {
    return 6;
  }
  // Internal aliases
  if (source.startsWith("@/") || source.startsWith("@convex/")) {
    return 3;
  }
  // Parent imports
  if (source.startsWith("../")) {
    return 4;
  }
  // Sibling imports
  if (source.startsWith("./")) {
    return 5;
  }
  // External packages (everything else)
  return 2;
}

/**
 * Check if a module name is a Node.js built-in
 */
function isNodeBuiltin(name) {
  const builtins = new Set([
    "assert",
    "buffer",
    "child_process",
    "cluster",
    "console",
    "constants",
    "crypto",
    "dgram",
    "dns",
    "domain",
    "events",
    "fs",
    "http",
    "https",
    "module",
    "net",
    "os",
    "path",
    "perf_hooks",
    "process",
    "punycode",
    "querystring",
    "readline",
    "repl",
    "stream",
    "string_decoder",
    "timers",
    "tls",
    "tty",
    "url",
    "util",
    "v8",
    "vm",
    "worker_threads",
    "zlib",
  ]);
  return builtins.has(name);
}

/**
 * Extract import statements from content
 */
function extractImports(content) {
  const imports = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match: import ... from "source"
    const importMatch = line.match(/^import\s+.*\s+from\s+["']([^"']+)["']/);
    if (importMatch) {
      imports.push({
        line: i + 1,
        source: importMatch[1],
        category: getImportCategory(importMatch[1]),
        fullLine: line,
      });
      continue;
    }

    // Match: import "source" (side-effect imports like CSS)
    const sideEffectMatch = line.match(/^import\s+["']([^"']+)["']/);
    if (sideEffectMatch) {
      imports.push({
        line: i + 1,
        source: sideEffectMatch[1],
        category: getImportCategory(sideEffectMatch[1]),
        fullLine: line,
      });
    }
  }

  return imports;
}

export function run() {
  if (CONFIG.strictness === "off") {
    return {
      passed: true,
      errors: 0,
      detail: "Disabled",
      messages: [],
    };
  }

  const SRC_DIR = path.join(ROOT, "src");

  let warningCount = 0;
  const warnings = [];

  function reportWarning(filePath, line, message) {
    const rel = relPath(filePath);
    const prefix = CONFIG.strictness === "error" ? `${c.red}ERROR` : `${c.yellow}WARN`;
    warnings.push(`  ${prefix}${c.reset} ${rel}:${line} - ${message}`);
    warningCount++;
  }

  /**
   * Check import ordering in a file
   */
  function checkFile(filePath) {
    const rel = relPath(filePath);

    // Skip certain files
    if (SKIP_PATTERNS.some((pattern) => rel.includes(pattern))) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const imports = extractImports(content);

    if (imports.length < 2) return;

    // Check that imports are grouped by category and in order
    let lastCategory = 0;
    let _lastCategoryLine = 0;

    for (const imp of imports) {
      if (imp.category < lastCategory) {
        reportWarning(
          filePath,
          imp.line,
          `Import "${imp.source}" (category ${imp.category}) should come before imports of category ${lastCategory}`,
        );
      }
      lastCategory = imp.category;
      _lastCategoryLine = imp.line;
    }
  }

  // Process TypeScript/JavaScript files
  const files = walkDir(SRC_DIR, { extensions: new Set([".ts", ".tsx", ".js", ".jsx"]) });

  for (const filePath of files) {
    checkFile(filePath);
  }

  return {
    passed: CONFIG.strictness === "warn" ? true : warningCount === 0,
    errors: CONFIG.strictness === "error" ? warningCount : 0,
    warnings: CONFIG.strictness === "warn" ? warningCount : 0,
    detail: warningCount > 0 ? `${warningCount} import order issue(s)` : null,
    messages: warnings,
  };
}
