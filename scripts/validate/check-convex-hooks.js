/**
 * CHECK: Convex Hook Imports
 * Ensures useQuery/useMutation/useConvexAuth are imported from @/hooks/useConvexHelpers, not convex/react.
 *
 * @strictness STRICT - Blocks CI. All raw imports must use auth-aware wrappers.
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

export function run() {
  const SRC_DIR = path.join(ROOT, "src");

  // Files allowed to import directly from convex/react
  const ALLOWED_FILES = [
    /useConvexHelpers\.ts$/, // The wrapper itself
    /\.test\.tsx?$/, // Test files (mocking)
    /\.stories\.tsx?$/, // Storybook
    /portal\.\$token\.tsx$/, // Public client portal (no auth)
    /portal\.\$token\.projects\.\$projectId\.tsx$/, // Public client portal (no auth)
    /clients\/index\.tsx$/, // Uses anyApi for client portal mutations
  ];

  // Type-only imports are allowed (import type { useQuery })
  const TYPE_IMPORT_REGEX = /import\s+type\s+\{[^}]*\}\s+from\s+["']convex\/react["']/;

  // Runtime imports of hooks we want to block
  const RAW_IMPORT_REGEX =
    /import\s+\{[^}]*(useQuery|useMutation|useConvexAuth)[^}]*\}\s+from\s+["']convex\/react["']/;

  const errors = [];

  function checkFile(filePath) {
    const rel = relPath(filePath);
    if (ALLOWED_FILES.some((p) => p.test(rel))) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      // Skip type-only imports
      if (TYPE_IMPORT_REGEX.test(line)) return;

      const match = line.match(RAW_IMPORT_REGEX);
      if (match) {
        const hook = match[1];
        let replacement = "";
        if (hook === "useQuery") {
          replacement = "useAuthenticatedQuery or usePublicQuery";
        } else if (hook === "useMutation") {
          replacement = "useAuthenticatedMutation";
        } else if (hook === "useConvexAuth") {
          replacement = "useAuthReady";
        }

        errors.push(
          `  ${c.red}ERROR${c.reset} ${rel}:${index + 1} - Raw ${hook} import. Use ${replacement} from @/hooks/useConvexHelpers`,
        );
      }
    });
  }

  const files = walkDir(SRC_DIR, { extensions: new Set([".ts", ".tsx", ".js", ".jsx"]) });
  for (const f of files) checkFile(f);

  return {
    passed: errors.length === 0,
    errors: errors.length,
    warnings: 0,
    detail: errors.length > 0 ? `${errors.length} raw Convex hook import(s)` : null,
    messages: errors,
  };
}
