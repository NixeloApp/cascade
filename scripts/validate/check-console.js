/**
 * CHECK: Console Usage
 * Bans console.log/warn/error in production code.
 * - console.warn/error should use showError/showSuccess toasts
 * - console.log should be removed or use console.info/debug for dev logging
 *
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

export function run() {
  const SRC_DIR = path.join(ROOT, "src");

  // Skip these paths
  const IGNORE_PATTERNS = [
    /\.test\.tsx?$/, // Test files
    /\.spec\.tsx?$/, // Spec files
    /\.stories\.tsx?$/, // Storybook files
    /routeTree\.gen\.ts$/, // Generated route tree
  ];

  // Baseline: files with legitimate console usage that need refactoring
  // TODO: Burn down this list by replacing with proper error handling
  const BASELINE_FILES = new Set([
    "src/components/ErrorBoundary.tsx", // Error boundary logging
    "src/components/LazyPostHog.tsx", // Analytics init warning
    "src/components/Onboarding/WelcomeTour.tsx", // Tour warning
    "src/components/Settings/TwoFactorSettings.tsx", // 2FA error
    "src/components/TimeTracker/BillingReport.tsx", // Export warning
    "src/hooks/useDraftAutoSave.ts", // Auto-save warning
    "src/hooks/useOffline.ts", // Offline warning
    "src/lib/offline.ts", // Offline handling
    "src/lib/webPush.tsx", // Push notification errors
    "src/routes/__root.tsx", // Root route warning
  ]);

  let errorCount = 0;
  const errors = [];

  function checkFile(filePath) {
    const rel = relPath(filePath);
    if (IGNORE_PATTERNS.some((p) => p.test(rel))) return;
    if (BASELINE_FILES.has(rel)) return; // Skip baselined files

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      // Ban console.log, console.warn, console.error
      // - warn/error should use showError/showSuccess toasts
      // - log should use console.info/debug for dev logging or be removed
      const match = line.match(/\bconsole\.(log|warn|error)\s*\(/);
      if (match) {
        const method = match[1];
        const suggestion =
          method === "log"
            ? "Use console.info/debug for dev logging or remove."
            : "Use showError/showSuccess from @/lib/toast instead.";
        errors.push({
          file: rel,
          line: index + 1,
          method,
          suggestion,
        });
        errorCount++;
      }
    });
  }

  const files = walkDir(SRC_DIR, { extensions: new Set([".ts", ".tsx", ".js", ".jsx"]) });
  for (const f of files) checkFile(f);

  return {
    passed: errorCount === 0,
    errors: errorCount,
    detail: errorCount > 0 ? `${errorCount} banned console statement(s)` : null,
    messages: errors.map(
      (e) =>
        `  ${c.red}ERROR${c.reset} ${e.file}:${e.line} - console.${e.method}() is banned. ${e.suggestion}`,
    ),
  };
}
