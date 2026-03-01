/**
 * CHECK: Time Constants
 * Enforces use of time constants from @convex/lib/timeUtils instead of magic numbers.
 *
 * @strictness MEDIUM - Reports warnings. Existing violations in allowlist.
 *
 * Detects patterns like:
 * - Date.now() - 3600000 (should use HOUR)
 * - Date.now() + 86400000 (should use DAY)
 * - 1000 * 60 * 60 (should use HOUR)
 * - setTimeout(..., 60000) (should use MINUTE)
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

// Known time constants in milliseconds
const TIME_CONSTANTS = {
  1000: "SECOND",
  60000: "MINUTE",
  3600000: "HOUR",
  86400000: "DAY",
  604800000: "WEEK",
};

// Patterns that represent time calculations
const TIME_MULTIPLICATIONS = [
  { pattern: /1000\s*\*\s*60\s*\*\s*60\s*\*\s*24\s*\*\s*7/g, suggestion: "WEEK" },
  { pattern: /1000\s*\*\s*60\s*\*\s*60\s*\*\s*24/g, suggestion: "DAY" },
  { pattern: /1000\s*\*\s*60\s*\*\s*60/g, suggestion: "HOUR" },
  { pattern: /1000\s*\*\s*60/g, suggestion: "MINUTE" },
  { pattern: /60\s*\*\s*60\s*\*\s*24\s*\*\s*1000/g, suggestion: "DAY" },
  { pattern: /60\s*\*\s*60\s*\*\s*1000/g, suggestion: "HOUR" },
  { pattern: /60\s*\*\s*1000/g, suggestion: "MINUTE" },
];

// Files allowed to have magic time numbers (existing violations to fix incrementally)
const ALLOWLIST = [
  // Test files with existing violations - to be fixed incrementally
  "src/components/Calendar/RoadmapView.test.tsx",
  "src/components/Notifications/NotificationCenter.test.tsx",
  "src/components/TimeTracking/TimerWidget.test.tsx",
  "src/components/AnalyticsDashboard.test.tsx",
  "src/components/InboxList.test.tsx",
  "src/lib/formatting.test.ts",
  "convex/issuesLoadMore.test.ts",
  "convex/meetingBotSSRF.jules.test.ts",
  "convex/meetingBot.jules.test.ts",
  "convex/issues/roadmap.test.ts",
  "convex/issues/roadmapPagination.test.ts",
  "convex/lib/softDeleteHelpers.test.ts",
  "convex/meetingBotList.jules.test.ts",
  "convex/userProfilesSecurity.jules.test.ts",
  "convex/notificationsPerf.test.ts",
  "convex/dashboard.jules.test.ts",
  // Source files that define time constants or have legitimate uses
  "convex/lib/timeUtils.ts", // Defines the constants
  "convex/twoFactor.ts", // Uses named constant LOCKOUT_DURATION_MS
  "convex/e2e.ts", // Uses named constant TEST_USER_EXPIRATION_MS
  "convex/meetingBot.ts", // Uses named constant BOT_SERVICE_TIMEOUT_MS
  "convex/lib/dns.ts", // Uses named constant DOH_TIMEOUT_MS
  "convex/lib/webhookHelpers.ts", // Uses named constant WEBHOOK_TIMEOUT_MS
  "src/hooks/useDraftAutoSave.ts", // Uses named constant DRAFT_EXPIRY_MS
  "e2e/screenshot-pages.ts", // Uses named constant SETTLE_MS
];

export function run() {
  const DIRS = [path.join(ROOT, "src"), path.join(ROOT, "convex")];

  let warningCount = 0;
  const warnings = [];

  function checkFile(filePath) {
    const rel = relPath(filePath);

    // Skip allowlisted files
    if (ALLOWLIST.some((allowed) => rel.endsWith(allowed))) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Skip comments
      if (line.trim().startsWith("//") || line.trim().startsWith("*")) return;

      // Skip lines that import from timeUtils (they're using constants correctly)
      if (line.includes("@convex/lib/timeUtils") || line.includes("convex/lib/timeUtils")) return;

      // Check for magic time numbers in Date.now() expressions
      const dateNowPattern = /Date\.now\(\)\s*[-+]\s*(\d{4,})/g;
      const dateNowMatches = line.matchAll(dateNowPattern);
      for (const match of dateNowMatches) {
        const num = parseInt(match[1], 10);
        const constant = TIME_CONSTANTS[num];
        if (constant) {
          warnings.push(
            `  ${c.yellow}WARN${c.reset} ${rel}:${lineNum} - Use ${constant} from @convex/lib/timeUtils instead of ${num}`,
          );
          warningCount++;
        } else if (num >= 60000) {
          // Any number >= 1 minute is suspicious
          warnings.push(
            `  ${c.yellow}WARN${c.reset} ${rel}:${lineNum} - Consider using time constants from @convex/lib/timeUtils instead of ${num}`,
          );
          warningCount++;
        }
      }

      // Check for time multiplication patterns
      for (const { pattern, suggestion } of TIME_MULTIPLICATIONS) {
        // Reset regex state
        pattern.lastIndex = 0;
        if (pattern.test(line)) {
          warnings.push(
            `  ${c.yellow}WARN${c.reset} ${rel}:${lineNum} - Use ${suggestion} from @convex/lib/timeUtils instead of multiplication`,
          );
          warningCount++;
        }
      }

      // Check for standalone magic numbers that look like time values
      // Only in contexts that suggest time usage (setTimeout, setInterval, delay, timeout, etc.)
      const timeContextPattern =
        /(setTimeout|setInterval|delay|timeout|Timeout|expir|duration|Duration)\s*[:(,]\s*(\d{4,})/gi;
      const timeContextMatches = line.matchAll(timeContextPattern);
      for (const match of timeContextMatches) {
        const num = parseInt(match[2], 10);
        const constant = TIME_CONSTANTS[num];
        if (constant) {
          warnings.push(
            `  ${c.yellow}WARN${c.reset} ${rel}:${lineNum} - Use ${constant} from @convex/lib/timeUtils instead of ${num}`,
          );
          warningCount++;
        }
      }
    });
  }

  for (const dir of DIRS) {
    if (!fs.existsSync(dir)) continue;
    const files = walkDir(dir, { extensions: new Set([".ts", ".tsx", ".js", ".jsx"]) });
    for (const f of files) checkFile(f);
  }

  let detail = null;
  if (warningCount > 0) {
    detail = `${warningCount} magic time number(s)`;
  }

  return {
    passed: true, // MEDIUM strictness - warnings don't fail CI
    errors: 0,
    warnings: warningCount,
    detail,
    messages: warnings.slice(0, 20), // Limit output
  };
}
