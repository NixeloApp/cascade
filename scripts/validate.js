/**
 * Unified validation script — runs all custom code checks in sequence.
 *
 * Checks:
 *   1. Standards (AST)      — typography, className concat, dark mode, raw TW colors, shorthands
 *   2. Color audit          — raw TW colors, hardcoded hex, rgb/hsl, style props + allowlists
 *   3. API calls            — validates api.X.Y calls match Convex exports
 *   4. Query issues         — N+1 queries, unbounded .collect(), missing indexes
 *   5. Arbitrary Tailwind   — arbitrary values like h-[50px]
 *   6. Type consistency     — ensures types imported from canonical sources, not duplicated
 *   7. Type safety          — flags unsafe type assertions and lint suppressions
 *   8. Emoji usage          — finds emoji that should be replaced with Lucide icons
 *   9. Test ID constants    — ensures data-testid uses TEST_IDS constants, not strings
 *  10. E2E quality          — catches broad selectors, networkidle, waitForSelector
 *  11. UI patterns          — DialogDescription in dialogs, AuthPageLayout for auth pages
 *  12. Convex patterns       — Envelope Pattern returns, security checks, test destructuring
 *
 * Exit code 1 if any check fails. No warning levels — everything is an error.
 *
 * Usage:
 *   node scripts/validate.js
 */

import { run as runApiCallsCheck } from "./validate/check-api-calls.js";
import { run as runArbitraryTailwindCheck } from "./validate/check-arbitrary-tw.js";
import { run as runColorAudit } from "./validate/check-colors.js";
import { run as runConvexPatternsCheck } from "./validate/check-convex-patterns.js";
import { run as runE2EQualityCheck } from "./validate/check-e2e-quality.js";
import { run as runEmojiCheck } from "./validate/check-emoji.js";
import { run as runQueryIssuesCheck } from "./validate/check-queries.js";
import { run as runRawTailwindCheck } from "./validate/check-raw-tailwind.js";
import { run as runStandardsCheck } from "./validate/check-standards.js";
import { run as runTestIdsCheck } from "./validate/check-test-ids.js";
import { run as runTypeSafetyCheck } from "./validate/check-type-safety.js";
import { run as runTypeConsistencyCheck } from "./validate/check-types.js";
import { run as runUIPatternsCheck } from "./validate/check-ui-patterns.js";
import { c } from "./validate/utils.js";

const checks = [
  { name: "Standards (AST)", fn: runStandardsCheck },
  { name: "Color audit", fn: runColorAudit },
  { name: "API calls", fn: runApiCallsCheck },
  { name: "Query issues", fn: runQueryIssuesCheck },
  { name: "Arbitrary Tailwind", fn: runArbitraryTailwindCheck },
  { name: "Raw Tailwind", fn: runRawTailwindCheck },
  { name: "Type consistency", fn: runTypeConsistencyCheck },
  { name: "Type safety", fn: runTypeSafetyCheck },
  { name: "Emoji usage", fn: runEmojiCheck },
  { name: "Test ID constants", fn: runTestIdsCheck },
  { name: "E2E quality", fn: runE2EQualityCheck },
  { name: "UI patterns", fn: runUIPatternsCheck },
  { name: "Convex patterns", fn: runConvexPatternsCheck },
];

console.log(`\n${c.bold}Running validation...${c.reset}\n`);

let totalErrors = 0;

const results = [];
for (let i = 0; i < checks.length; i++) {
  const { name, fn } = checks[i];
  const result = fn();
  result.name = name;
  result.index = i;
  results.push(result);
  totalErrors += result.errors;
}

// Print summary lines
for (let i = 0; i < results.length; i++) {
  const result = results[i];
  const idx = `[${i + 1}/${checks.length}]`;
  const dots = ".".repeat(Math.max(1, 30 - result.name.length));
  const statusColor = result.passed ? c.green : c.red;
  const statusText = result.passed ? "PASS" : "FAIL";
  const detailStr = result.detail ? `  (${result.detail})` : "";
  console.log(`${idx} ${result.name}${dots} ${statusColor}${statusText}${c.reset}${detailStr}`);
}

// Print detailed messages for failed/warned checks
const failedResults = results.filter((r) => r.messages && r.messages.length > 0);
if (failedResults.length > 0) {
  for (const result of failedResults) {
    console.log(`\n${c.bold}── ${result.name} details ──${c.reset}`);
    for (const msg of result.messages) console.log(msg);
  }
}

console.log("");

if (totalErrors > 0) {
  console.log(`${c.red}${c.bold}RESULT: FAIL${c.reset} (${totalErrors} error(s))`);
  process.exit(1);
} else {
  console.log(`${c.green}${c.bold}RESULT: PASS${c.reset} (0 errors)`);
}
