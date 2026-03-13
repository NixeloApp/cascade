/**
 * CHECK: Interactive Tailwind
 *
 * Flags hover:/focus:/active:/disabled: Tailwind variants outside of ui/ folder.
 * Interactive states should be encapsulated in CVA component variants for consistency.
 *
 * Allowed in:
 * - src/components/ui/ (CVA components live here)
 * - Files in ALLOWED_FILES list (gradual migration)
 */

import fs from "node:fs";
import path from "node:path";
import { collectClassNameSpan } from "./tailwind-policy.js";
import { c, ROOT, relPath, walkDir } from "./utils.js";

// Files allowed to have interactive variants (for gradual migration)
// Remove files from this list as they get migrated to proper CVA components:
// - Use IconButton for icon-only buttons
// - Use Button variants (ghost, secondary) for text buttons
// - Use Card with hoverable prop for cards
const ALLOWED_FILES = [
  // Search/filter components
  "FuzzySearch/AssigneeSearchDropdown.example.tsx",
  // Document components
  // Editor components
  "PlateEditor.tsx",
  // Navigation/layout
  "Sidebar/",
  // Modals
  "CreateProjectFromTemplate.tsx",
  "BulkOperationsBar.tsx",
  // Forms/fields
  "CustomFieldValues.tsx",
  // Calendar
  "Calendar/shadcn-calendar/",
  "Calendar/EventDetailsModal.tsx",
  // Onboarding
  "Onboarding/",
  // Landing pages
  "Landing/",
  // Auth
  "Auth/",
  // Activity/inbox
  // Error handling
  "ErrorBoundary.tsx",
];

// Interactive variant patterns to detect
const INTERACTIVE_PATTERNS = [
  /\bhover:/,
  /\bfocus:/,
  /\bactive:/,
  /\bdisabled:/,
  /\bfocus-within:/,
  /\bfocus-visible:/,
  /\bgroup-hover:/,
  /\bpeer-hover:/,
];

export function run() {
  const SRC_DIR = path.join(ROOT, "src/components");

  let errorCount = 0;
  let allowedCount = 0;
  const errors = [];

  // Get all TSX files in components (excluding ui/)
  const files = walkDir(SRC_DIR, { extensions: new Set([".tsx"]) });

  for (const filePath of files) {
    const rel = relPath(filePath);

    // Skip ui/ folder - CVA components live here
    if (rel.includes("components/ui/")) continue;

    // Skip test files
    if (rel.includes(".test.")) continue;

    // Check if file is in allowed list
    const isAllowed = ALLOWED_FILES.some((pattern) => rel.includes(pattern));

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!/\bclassName\s*=/.test(line)) continue;

      const { span, endIndex } = collectClassNameSpan(lines, i);

      for (const pattern of INTERACTIVE_PATTERNS) {
        if (pattern.test(span)) {
          if (isAllowed) {
            allowedCount++;
          } else {
            errors.push(
              `  ${c.red}ERROR${c.reset} ${rel}:${i + 1} - Interactive Tailwind variant outside ui/. Move to CVA component.`,
            );
            errorCount++;
          }
          break; // Only report once per line
        }
      }

      i = endIndex;
    }
  }

  const detail =
    errorCount > 0
      ? `${errorCount} violation(s), ${allowedCount} allowed`
      : `${allowedCount} in migration allowlist`;

  return {
    passed: errorCount === 0,
    errors: errorCount,
    detail,
    messages: errors,
  };
}
