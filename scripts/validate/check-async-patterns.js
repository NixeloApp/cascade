/**
 * CHECK: Async Error Handling Patterns
 *
 * Validates consistent error handling in async operations:
 * - Prefer showError() over toast.error() for error handling
 * - Avoid console.log/console.error in catch blocks (use showError)
 * - Mutations should use try/catch with showError
 *
 * @strictness MEDIUM - Reports warnings, does not block CI
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

// Configuration
const CONFIG = {
  // 'error' | 'warn' | 'off'
  strictness: "warn",
};

// Files/directories to skip
const SKIP_PATTERNS = [
  "node_modules",
  "dist",
  ".next",
  "_generated",
  ".test.",
  ".spec.",
  "e2e/",
  // Allow console in these specific files
  "lib/logger.ts",
  "lib/webPush.tsx", // Service worker integration - console errors appropriate
  "scripts/",
];

// Patterns that indicate improper error handling
const BAD_PATTERNS = [
  {
    pattern: /catch\s*\([^)]*\)\s*\{[^}]*console\.(log|error|warn)/,
    message: "Use showError() instead of console.log/error in catch blocks",
  },
  {
    pattern: /catch\s*\([^)]*\)\s*\{[^}]*toast\.error\s*\(/,
    message: "Use showError() instead of toast.error() for better error context",
  },
];

// Files where toast.error is allowed (static messages, not dynamic errors)
const ALLOWED_TOAST_ERROR_FILES = new Set([
  "src/routes/forgot-password.tsx", // Static validation messages
  "src/routes/signin.tsx", // Static validation messages
  "src/routes/signup.tsx", // Static validation messages
  "src/components/Auth/SignInForm.tsx",
  "src/components/Auth/SignUpForm.tsx",
  "src/components/Auth/EmailVerificationForm.tsx", // Static auth error messages
  "src/components/Auth/EmailVerificationRequired.tsx", // Static auth error messages
  "src/components/Auth/ForgotPasswordForm.tsx", // Static auth error messages
  "src/components/Auth/ResetPasswordForm.tsx", // Static auth error messages
]);

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
   * Check a file for async error handling patterns
   */
  function checkFile(filePath) {
    const rel = relPath(filePath);

    // Skip certain files
    if (SKIP_PATTERNS.some((pattern) => rel.includes(pattern))) return;

    // Skip allowed files
    if (ALLOWED_TOAST_ERROR_FILES.has(rel)) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    // Check each line for bad patterns
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Look for catch blocks with bad patterns
      // We need to check multi-line catch blocks
      for (const { pattern, message } of BAD_PATTERNS) {
        // Build context from surrounding lines for multi-line patterns
        const contextStart = Math.max(0, i - 2);
        const contextEnd = Math.min(lines.length, i + 8);
        const context = lines.slice(contextStart, contextEnd).join("\n");

        // Skip if showError is also being used (console for logging is OK alongside showError)
        const hasShowError = context.includes("showError");

        if (pattern.test(context) && line.includes("catch") && !hasShowError) {
          reportWarning(filePath, i + 1, message);
          break;
        }
      }

      // Direct check for console in catch-adjacent lines
      // Skip if showError is also being used (console for logging is OK alongside showError)
      if (line.includes("catch") && lines[i + 1]?.includes("console.")) {
        // Check if showError is used in the next few lines
        const catchBlockEnd = Math.min(lines.length, i + 8);
        const catchBlock = lines.slice(i, catchBlockEnd).join("\n");
        const hasShowError = catchBlock.includes("showError");

        if (!hasShowError) {
          reportWarning(
            filePath,
            i + 2,
            "Use showError() instead of console.log/error in catch blocks",
          );
        }
      }

      // Check for bare toast.error (not from showError pattern)
      if (line.includes("toast.error(") && !line.includes("// allowed")) {
        // Check if this is inside a catch block by looking at recent lines
        const recentLines = lines.slice(Math.max(0, i - 5), i).join("\n");
        if (recentLines.includes("catch")) {
          reportWarning(
            filePath,
            i + 1,
            "Use showError() instead of toast.error() in catch blocks",
          );
        }
      }
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
    detail: warningCount > 0 ? `${warningCount} async pattern issue(s)` : null,
    messages: warnings,
  };
}
