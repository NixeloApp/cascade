/**
 * CHECK: Border Radius Consistency
 * All border-radius styling must be in UI components (src/components/ui/).
 * App code should use Card, Button, Avatar, Badge etc. - not raw rounded-* classes.
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

// ============================================================================
// Configuration
// ============================================================================

// Only UI components can use raw rounded-* classes
const ALLOWED_DIRS = ["src/components/ui/", "src/index.css"];

// Match any rounded-* class (standard, custom tokens, and arbitrary values)
const ROUNDED_PATTERN = /\brounded(-\w+|-\[.+?\])\b/g;

// Files with known violations - baseline to track and fix over time
const BASELINE_FILES = new Set([
  // Progress bars, chart elements (rounded-full on thin bars)
  "src/components/Analytics/BarChart.tsx",
  "src/components/Dashboard/QuickStats.tsx",
  // Decorative blurs (rounded-full on background glow circles)
  "src/components/Auth/AppSplashScreen.tsx",
  "src/components/Dashboard.tsx",
  // Pseudo-elements and drag handles (can't use React components)
  "src/components/IssueDetail/IssueCard.tsx",
  "src/components/RoadmapView.tsx",
  "src/lib/kanban-dnd.ts",
  // Raw DOM strings (outside React rendering)
  "src/lib/serviceWorker.ts",
  // Landing page CVA definitions (component-level styles)
  "src/components/Landing/AIFeatureDemo.tsx",
  "src/components/Landing/FeaturesSection.tsx",
  "src/components/Landing/FinalCTASection.tsx",
  "src/components/Landing/Footer.tsx",
  "src/components/Landing/HeroSection.tsx",
  "src/components/Landing/ProductShowcase.tsx",
  "src/components/Landing/WhyChooseSection.tsx",
  // Small badges with rounded-lg (need Badge radius prop)
  "src/routes/invite.$token.tsx",
]);

// ============================================================================
// Main
// ============================================================================

export function run() {
  const SRC_DIR = path.join(ROOT, "src");

  let errorCount = 0;
  const errors = [];

  function reportError(filePath, lineNum, match) {
    const rel = relPath(filePath);
    errors.push(
      `  ${c.red}ERROR${c.reset} ${rel}:${lineNum} - Raw '${match}' class. Use a UI component (Card, Button, Avatar, Badge) instead.`,
    );
    errorCount++;
  }

  function isAllowedFile(rel) {
    return ALLOWED_DIRS.some((dir) => rel.startsWith(dir) || rel.includes(dir));
  }

  function checkFile(filePath) {
    const rel = relPath(filePath);

    if (isAllowedFile(rel)) return;
    if (BASELINE_FILES.has(rel)) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip comments and imports
      if (line.trim().startsWith("//") || line.trim().startsWith("*") || line.includes("import ")) {
        continue;
      }

      // Find all rounded-* matches
      const matches = line.matchAll(ROUNDED_PATTERN);
      for (const match of matches) {
        // Skip if it's just "rounded" without suffix (not a valid class anyway)
        if (match[0] === "rounded") continue;

        reportError(filePath, i + 1, match[0]);
      }
    }
  }

  const files = walkDir(SRC_DIR, { extensions: new Set([".tsx", ".ts"]) });
  for (const f of files) {
    checkFile(f);
  }

  return {
    passed: errorCount === 0,
    errors: errorCount,
    detail: errorCount > 0 ? `${errorCount} violation(s)` : null,
    messages: errors,
  };
}
