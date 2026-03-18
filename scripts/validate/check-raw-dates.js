/**
 * CHECK: Raw Date Formatting
 * Flags direct use of new Date().toLocaleDateString(), .toLocaleString(),
 * .toLocaleTimeString(), and .toISOString() in component and route files.
 *
 * Use the shared date utilities from @/lib/dates instead:
 * - formatDate(timestamp) — locale date
 * - formatDateTime(timestamp) — locale date + time
 * - formatRelativeTime(timestamp) — "2h ago", "3d ago"
 * - formatDateForInput(date) — YYYY-MM-DD for inputs
 * - formatDateCustom(timestamp, options) — custom Intl options
 *
 * The date library centralizes timezone handling and formatting consistency.
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

// Only scan app code — lib/dates.ts itself is allowed to use raw Date methods
const SCAN_DIRS = [path.join(ROOT, "src/routes"), path.join(ROOT, "src/components")];

// Files that are allowed to use raw Date formatting (date library internals, etc.)
const ALLOWLIST = new Set([
  "src/lib/dates.ts",
  "src/lib/formatting.ts",
  "src/lib/dates.test.ts",
  "src/lib/formatting.test.ts",
]);

// Pre-existing violations — tracked for gradual cleanup
const BASELINE_FILES = new Set([
  "src/components/AI/AIChat.tsx",
  "src/components/Admin/HourComplianceDashboard.tsx",
  "src/components/Admin/IpRestrictionsSettings.tsx",
  "src/components/Admin/OAuthHealthDashboard.tsx",
  "src/components/Admin/UserManagement.tsx",
  "src/components/Admin/UserTypeManager.tsx",
  "src/components/CustomFieldValues.tsx",
  "src/components/ImportExport/ExportPanel.tsx",
  "src/components/InboxList.tsx",
  "src/components/Invoices/InvoicePdfTemplate.tsx",
  "src/components/IssueDetail/CreateIssueModal.tsx",
  "src/components/Settings/GoogleCalendarIntegration.tsx",
  "src/components/Settings/OfflineTab.tsx",
  "src/components/Settings/PumbleIntegration.tsx",
  "src/components/TimeTracking/TimeEntriesList.tsx",
  "src/components/Webhooks/WebhookCard.tsx",
  "src/routes/portal.$token.projects.$projectId.tsx",
  "src/routes/portal.$token.tsx",
]);

// Patterns to detect
const PATTERNS = [
  {
    regex: /new Date\([^)]*\)\.toLocaleDateString\(/,
    message: "use formatDate() or formatDateCustom() from @/lib/dates",
  },
  {
    regex: /new Date\([^)]*\)\.toLocaleString\(/,
    message: "use formatDateTime() from @/lib/dates",
  },
  {
    regex: /new Date\([^)]*\)\.toLocaleTimeString\(/,
    message: "use formatTime() from @/lib/formatting",
  },
  {
    regex: /new Date\([^)]*\)\.toISOString\(\)/,
    message:
      "use formatDateForInput() from @/lib/dates for YYYY-MM-DD, or formatDate() for display",
  },
  {
    regex: /\.toLocaleDateString\(\)/,
    message: "use formatDate() from @/lib/dates (handles locale consistently)",
  },
];

export function run() {
  let issueCount = 0;
  const messages = [];
  const byFile = {};

  for (const dir of SCAN_DIRS) {
    if (!fs.existsSync(dir)) continue;
    const files = walkDir(dir, { extensions: new Set([".tsx", ".ts"]) });

    for (const filePath of files) {
      const rel = relPath(filePath);
      if (filePath.endsWith(".test.ts") || filePath.endsWith(".test.tsx")) continue;
      if (filePath.endsWith(".stories.tsx")) continue;
      if (ALLOWLIST.has(rel)) continue;
      if (BASELINE_FILES.has(rel)) continue;

      const lines = fs.readFileSync(filePath, "utf-8").split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const { regex, message } of PATTERNS) {
          if (regex.test(line)) {
            issueCount++;
            const bucket = byFile[rel] ?? [];
            bucket.push({ line: i + 1, message });
            byFile[rel] = bucket;
            break; // One violation per line
          }
        }
      }
    }
  }

  if (issueCount > 0) {
    messages.push(`${c.red}Raw Date formatting (use @/lib/dates helpers instead):${c.reset}`);
    for (const [file, items] of Object.entries(byFile).sort()) {
      messages.push(`  ${c.bold}${file}${c.reset} (${items.length})`);
      for (const item of items.slice(0, 3)) {
        messages.push(`    ${c.dim}L${item.line}${c.reset} → ${item.message}`);
      }
      if (items.length > 3) {
        messages.push(`    ${c.dim}... and ${items.length - 3} more${c.reset}`);
      }
    }
  }

  return {
    passed: issueCount === 0,
    errors: issueCount,
    detail: issueCount > 0 ? `${issueCount} raw Date formatting violations` : null,
    messages,
  };
}
