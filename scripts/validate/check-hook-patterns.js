/**
 * CHECK: React Hook Patterns
 *
 * Validates that custom hooks follow consistent patterns:
 * - Hook files should export functions starting with "use"
 * - Async hooks should include loading/error states
 * - Hooks returning multiple values should use objects (not arrays) for >3 values
 *
 * Enforced. Hook issues are reported as plain errors.
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath } from "./utils.js";

// Files to skip
const SKIP_PATTERNS = [".test.", ".spec.", "index.ts", ".d.ts"];

// Hooks where the async pattern validator exception is justified:
// - Convex hooks: errors are thrown, not returned (no error state needed)
// - Client-side hooks: async is for debounce/setup only, not data fetching
const CONVEX_PATTERN_HOOKS = [
  "useCurrentUser", // Convex query wrapper - has isLoading, errors thrown
  "useFuzzySearch", // Client-side Fuse.js search - has isDebouncing, no async data
  "useConfirmDialog", // State management - has isConfirming, action errors thrown
  "useConvexHelpers", // Auth helpers - has isAuthLoading, errors thrown
  "usePaginatedIssues", // Convex paginated - has isLoading/isLoadingMore, errors thrown
  "useSmartBoardData", // Convex smart loading - has isLoading/isLoadingMore, errors thrown
];

export function run() {
  const HOOKS_DIR = path.join(ROOT, "src/hooks");

  // Check if hooks directory exists
  if (!fs.existsSync(HOOKS_DIR)) {
    return {
      passed: true,
      errors: 0,
      detail: "No hooks directory",
      messages: [],
    };
  }

  let issueCount = 0;
  const messages = [];

  function reportIssue(filePath, line, message) {
    const rel = relPath(filePath);
    messages.push(`  ${c.red}ERROR${c.reset} ${rel}:${line} - ${message}`);
    issueCount++;
  }

  /**
   * Check a hook file for common patterns
   */
  function checkHookFile(filePath) {
    const rel = relPath(filePath);
    const fileName = path.basename(filePath, path.extname(filePath));

    // Skip test files and non-hook files
    if (SKIP_PATTERNS.some((pattern) => rel.includes(pattern))) return;

    // Skip files that don't start with "use"
    if (!fileName.startsWith("use")) {
      // This is fine - not all files in hooks/ need to be hooks (e.g., utilities)
      return;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    // Check 1: Look for exported hook function
    const exportedHookPattern = /export\s+(function|const)\s+(use\w+)/;
    let hasExportedHook = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (exportedHookPattern.test(line)) {
        hasExportedHook = true;
        break;
      }
    }

    if (!hasExportedHook && fileName.startsWith("use")) {
      reportIssue(filePath, 1, `Hook file should export a function starting with "use"`);
    }

    // Check 2: For hooks with async operations, look for loading/error states
    const hasAsyncOperation =
      content.includes("useMutation") ||
      content.includes("useQuery") ||
      content.includes("async ") ||
      content.includes("await ");

    if (hasAsyncOperation) {
      // Skip Convex pattern hooks that handle errors via thrown exceptions
      const isConvexPatternHook = CONVEX_PATTERN_HOOKS.some((name) => fileName === name);
      if (isConvexPatternHook) {
        return; // Convex queries throw errors, no error state needed
      }

      // Check if the hook returns loading state
      const hasLoadingState =
        content.includes("isLoading") ||
        content.includes("loading") ||
        content.includes("isPending") ||
        content.includes("status");

      // Check if the hook returns error state
      const hasErrorState = content.includes("error") || content.includes("Error");

      // Only warn if the hook has a return statement but missing states
      const hasReturnObject = /return\s*\{/.test(content);

      if (hasReturnObject && !hasLoadingState) {
        // Find the return statement line
        for (let i = 0; i < lines.length; i++) {
          if (/return\s*\{/.test(lines[i])) {
            reportIssue(filePath, i + 1, `Async hook should include loading state in return value`);
            break;
          }
        }
      }

      if (hasReturnObject && !hasErrorState) {
        for (let i = 0; i < lines.length; i++) {
          if (/return\s*\{/.test(lines[i])) {
            reportIssue(filePath, i + 1, `Async hook should include error state in return value`);
            break;
          }
        }
      }
    }

    // Check 3: Hooks returning arrays with >3 elements should use objects
    // Look for patterns like: return [a, b, c, d, e]
    const arrayReturnMatch = content.match(/return\s*\[([^\]]+)\]/);
    if (arrayReturnMatch) {
      const elements = arrayReturnMatch[1].split(",").filter((e) => e.trim());
      if (elements.length > 3) {
        for (let i = 0; i < lines.length; i++) {
          if (/return\s*\[/.test(lines[i])) {
            reportIssue(
              filePath,
              i + 1,
              `Hook returns ${elements.length} values as array. Consider using an object for better destructuring.`,
            );
            break;
          }
        }
      }
    }
  }

  // Get all files in hooks directory
  const files = fs.readdirSync(HOOKS_DIR);

  for (const file of files) {
    const filePath = path.join(HOOKS_DIR, file);
    const stat = fs.statSync(filePath);

    if (stat.isFile() && (file.endsWith(".ts") || file.endsWith(".tsx"))) {
      checkHookFile(filePath);
    }
  }

  return {
    passed: issueCount === 0,
    errors: issueCount,
    detail: issueCount > 0 ? `${issueCount} hook pattern issue(s)` : null,
    messages,
  };
}
