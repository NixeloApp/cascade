/**
 * CHECK: Convex Hook Imports
 * Ensures useQuery/useMutation/useConvexAuth are imported from @/hooks/useConvexHelpers, not convex/react.
 *
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

  // Hooks we want to block from direct convex/react imports
  const BLOCKED_HOOKS = ["useQuery", "useMutation", "useConvexAuth"];

  const errors = [];

  function checkFile(filePath) {
    const rel = relPath(filePath);
    if (ALLOWED_FILES.some((p) => p.test(rel))) return;

    const content = fs.readFileSync(filePath, "utf-8");

    // Use regex with dotAll flag to match multiline imports
    // Match: import { ... } from "convex/react" or 'convex/react'
    const importRegex = /import\s+(type\s+)?\{([^}]*)\}\s+from\s+["']convex\/react["']/gs;

    let match = importRegex.exec(content);
    while (match !== null) {
      const isTypeImport = !!match[1]; // "type " prefix
      const importedItems = match[2];

      if (!isTypeImport) {
        // Check if any blocked hook is imported
        for (const hook of BLOCKED_HOOKS) {
          // Match whole word (not useQueryClient, useMutationState, etc.)
          const hookPattern = new RegExp(`\\b${hook}\\b`);
          if (hookPattern.test(importedItems)) {
            // Find line number for error reporting
            const beforeMatch = content.slice(0, match.index);
            const lineNumber = (beforeMatch.match(/\n/g) || []).length + 1;

            let replacement = "";
            if (hook === "useQuery") {
              replacement = "useAuthenticatedQuery or usePublicQuery";
            } else if (hook === "useMutation") {
              replacement = "useAuthenticatedMutation or usePublicMutation";
            } else if (hook === "useConvexAuth") {
              replacement = "useAuthReady";
            }

            errors.push(
              `  ${c.red}ERROR${c.reset} ${rel}:${lineNumber} - Raw ${hook} import. Use ${replacement} from @/hooks/useConvexHelpers`,
            );
          }
        }
      }
      match = importRegex.exec(content);
    }
  }

  const files = walkDir(SRC_DIR, { extensions: new Set([".ts", ".tsx", ".js", ".jsx"]) });
  for (const f of files) checkFile(f);

  return {
    passed: errors.length === 0,
    errors: errors.length,
    detail: errors.length > 0 ? `${errors.length} raw Convex hook import(s)` : null,
    messages: errors,
  };
}
