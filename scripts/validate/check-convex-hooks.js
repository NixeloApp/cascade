/**
 * CHECK: Convex Hook Imports
 * Ensures useQuery/useMutation are imported from @/hooks/useConvexHelpers, not convex/react.
 *
 * @strictness WARNING - Does not block CI during migration. Will become STRICT after migration.
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

export function run() {
  const SRC_DIR = path.join(ROOT, "src");

  // Files that are allowed to import directly from convex/react
  const ALLOWED_FILES = [
    /useConvexHelpers\.ts$/, // The wrapper itself
    /\.test\.tsx?$/, // Test files (mocking)
    /\.stories\.tsx?$/, // Storybook
  ];

  // Pattern to detect raw imports from convex/react
  const RAW_IMPORT_REGEX =
    /import\s+\{[^}]*(useQuery|useMutation|useConvexAuth)[^}]*\}\s+from\s+["']convex\/react["']/;

  let warningCount = 0;
  const warnings = [];

  function checkFile(filePath) {
    const rel = relPath(filePath);
    if (ALLOWED_FILES.some((p) => p.test(rel))) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      const match = line.match(RAW_IMPORT_REGEX);
      if (match) {
        const hook = match[1];
        let suggestion = "";
        if (hook === "useQuery") {
          suggestion = "Use useAuthenticatedQuery or usePublicQuery from @/hooks/useConvexHelpers";
        } else if (hook === "useMutation") {
          suggestion = "Use useAuthenticatedMutation from @/hooks/useConvexHelpers";
        } else if (hook === "useConvexAuth") {
          suggestion = "Use useAuthReady from @/hooks/useConvexHelpers";
        }

        warnings.push(
          `  ${c.yellow}WARN${c.reset} ${rel}:${index + 1} - Raw ${hook} import. ${suggestion}`,
        );
        warningCount++;
      }
    });
  }

  const files = walkDir(SRC_DIR, { extensions: new Set([".ts", ".tsx", ".js", ".jsx"]) });
  for (const f of files) checkFile(f);

  let detail = null;
  if (warningCount > 0) {
    detail = `${warningCount} raw Convex hook import(s)`;
  }

  return {
    passed: true, // Warning only during migration
    errors: 0,
    warnings: warningCount,
    detail,
    messages: warnings,
  };
}
