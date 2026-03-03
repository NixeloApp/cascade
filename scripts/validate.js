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
 *  10. E2E hard rules       — waitForTimeout, Promise sleep, force:true, XPath, page.$
 *  11. E2E quality          — catches broad selectors, networkidle, waitForSelector
 *  12. UI patterns          — DialogDescription in dialogs, AuthPageLayout for auth pages
 *  13. Route constants      — use ROUTES from @/config/routes instead of hardcoded paths
 *  14. Convex patterns      — Envelope Pattern returns, security checks, test destructuring
 *  15. Convex naming        — function naming conventions (get/list/create/update/delete)
 *  16. Component naming     — PascalCase components, {Component}Props interfaces
 *  17. Component props      — consistent prop naming across components
 *  18. Duplicate components — detect components with same name in different directories
 *  19. Interactive Tailwind — hover:/focus: should be in CVA components, not scattered
 *  20. Tailwind consistency — duration tokens, focus rings, disabled states, z-index, group-hover
 *  21. JSDoc coverage       — exported functions/components should have JSDoc documentation
 *  22. File headers         — non-trivial files (>50 lines) should have documentation headers
 *  23. Import order         — imports should follow standard grouping order
 *  24. Import paths         — validates import path conventions
 *  25. Hook patterns        — custom hooks should follow consistent patterns
 *  26. Async patterns       — consistent error handling in async operations
 *  27. Test coverage        — critical files should have corresponding tests
 *  28. Time constants       — enforces use of timeUtils constants instead of magic numbers
 *  29. Unused parameters    — flags underscore-prefixed unused params (remove or use them)
 *  30. Weak assertions      — toBeDefined(), toBeTruthy(), {} as Type in tests
 *
 * Exit code 1 if any check reports errors. Some checks are warn-only and do not affect exit code.
 *
 * Usage:
 *   node scripts/validate.js
 */

import { run as runApiCallsCheck } from "./validate/check-api-calls.js";
import { run as runArbitraryTailwindCheck } from "./validate/check-arbitrary-tw.js";
import { run as runAsyncPatternsCheck } from "./validate/check-async-patterns.js";
import { run as runColorAudit } from "./validate/check-colors.js";
import { run as runComponentNamingCheck } from "./validate/check-component-naming.js";
import { run as runComponentPropsCheck } from "./validate/check-component-props.js";
import { run as runConvexNamingCheck } from "./validate/check-convex-naming.js";
import { run as runConvexPatternsCheck } from "./validate/check-convex-patterns.js";
import { run as runDuplicateComponentsCheck } from "./validate/check-duplicate-components.js";
import { run as runE2EHardRulesCheck } from "./validate/check-e2e-hard-rules.js";
import { run as runE2EQualityCheck } from "./validate/check-e2e-quality.js";
import { run as runEmojiCheck } from "./validate/check-emoji.js";
import { run as runFileHeadersCheck } from "./validate/check-file-headers.js";
import { run as runHookPatternsCheck } from "./validate/check-hook-patterns.js";
import { run as runImportOrderCheck } from "./validate/check-import-order.js";
import { run as runImportPathsCheck } from "./validate/check-import-paths.js";
import { run as runInteractiveTwCheck } from "./validate/check-interactive-tw.js";
import { run as runJSDocCheck } from "./validate/check-jsdoc.js";
import { run as runQueryIssuesCheck } from "./validate/check-queries.js";
import { run as runRawTailwindCheck } from "./validate/check-raw-tailwind.js";
import { run as runRouteConstantsCheck } from "./validate/check-route-constants.js";
import { run as runStandardsCheck } from "./validate/check-standards.js";
import { run as runTailwindConsistencyCheck } from "./validate/check-tailwind-consistency.js";
import { run as runTestCoverageCheck } from "./validate/check-test-coverage.js";
import { run as runTestIdsCheck } from "./validate/check-test-ids.js";
import { run as runTimeConstantsCheck } from "./validate/check-time-constants.js";
import { run as runTypeSafetyCheck } from "./validate/check-type-safety.js";
import { run as runTypeConsistencyCheck } from "./validate/check-types.js";
import { run as runUIPatternsCheck } from "./validate/check-ui-patterns.js";
import { run as runUnusedParamsCheck } from "./validate/check-unused-params.js";
import { run as runWeakAssertionsCheck } from "./validate/check-weak-assertions.js";
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
  { name: "E2E hard rules", fn: runE2EHardRulesCheck },
  { name: "E2E quality", fn: runE2EQualityCheck },
  { name: "UI patterns", fn: runUIPatternsCheck },
  { name: "Route constants", fn: runRouteConstantsCheck },
  { name: "Convex patterns", fn: runConvexPatternsCheck },
  { name: "Convex naming", fn: runConvexNamingCheck },
  { name: "Component naming", fn: runComponentNamingCheck },
  { name: "Component props", fn: runComponentPropsCheck },
  { name: "Duplicate components", fn: runDuplicateComponentsCheck },
  { name: "Interactive Tailwind", fn: runInteractiveTwCheck },
  { name: "Tailwind consistency", fn: runTailwindConsistencyCheck },
  { name: "JSDoc coverage", fn: runJSDocCheck },
  { name: "File headers", fn: runFileHeadersCheck },
  { name: "Import order", fn: runImportOrderCheck },
  { name: "Import paths", fn: runImportPathsCheck },
  { name: "Hook patterns", fn: runHookPatternsCheck },
  { name: "Async patterns", fn: runAsyncPatternsCheck },
  { name: "Test coverage", fn: runTestCoverageCheck },
  { name: "Time constants", fn: runTimeConstantsCheck },
  { name: "Unused parameters", fn: runUnusedParamsCheck },
  { name: "Weak assertions", fn: runWeakAssertionsCheck },
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
