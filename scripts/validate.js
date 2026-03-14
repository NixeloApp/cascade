/**
 * Unified validation script — runs all custom code checks in sequence.
 *
 * Checks:
 *   1. Standards (AST)      — typography, className concat, dark mode, raw TW colors, shorthands
 *   2. Color audit          — raw TW colors, hardcoded hex, rgb/hsl, style props outside owned color boundaries
 *   3. API calls            — validates api.X.Y calls match Convex exports
 *   4. Query issues         — N+1 queries, unbounded .collect(), missing indexes
 *   5. Arbitrary Tailwind      — arbitrary values like h-[50px]
 *   6. Raw Tailwind            — generic raw utility misuse outside approved areas
 *   7. Surface shells         — reusable rounded/bg/border/shadow shells must use owned recipes
 *   8. Design-system ownership — recipe/chrome APIs required in high-drift surfaces
 *   9. Layout prop usage       — JSX should use Flex/Stack props instead of className hacks
 *  10. Type consistency        — ensures types imported from canonical sources, not duplicated
 *  11. Type safety             — flags unsafe type assertions and lint suppressions
 *  12. Emoji usage             — finds emoji that should be replaced with Lucide icons
 *  13. Test ID constants       — ensures data-testid uses TEST_IDS constants, not strings
 *  14. E2E hard rules          — waitForTimeout, Promise sleep, force:true, XPath, page.$
 *  15. E2E quality             — catches broad selectors, networkidle, waitForSelector
 *  16. UI patterns             — DialogDescription in dialogs, AuthPageLayout for auth pages
 *  17. Route constants         — use ROUTES from @/config/routes instead of hardcoded paths
 *  18. Convex patterns         — Envelope Pattern returns, security checks, test destructuring
 *  19. Convex naming           — function naming conventions (get/list/create/update/delete)
 *  20. Component naming        — PascalCase components, {Component}Props interfaces
 *  21. Component props         — consistent prop naming across component definitions
 *  22. Duplicate components    — detect components with same name in different directories
 *  23. CVA boundaries          — ban importing exported CVA recipes outside shared ui primitives
 *  24. Control ownership       — block low-level ToggleGroup in app code; use semantic primitives
 *  25. Interactive Tailwind    — hover:/focus: should be in CVA components, not scattered
 *  26. Tailwind consistency    — duration tokens, focus rings, disabled states, z-index, group-hover
 *  27. Recipe drift            — repeated visual shell patterns must move behind owned recipes
 *  28. JSDoc coverage          — exported functions/components should have JSDoc documentation
 *  29. Import paths            — validates import path conventions
 *  30. Hook patterns           — custom hooks should follow consistent patterns
 *  31. Async patterns          — consistent error handling in async operations
 *  32. Time constants          — enforces use of timeUtils constants instead of magic numbers
 *  33. Unused parameters       — flags underscore-prefixed unused params (remove or use them)
 *  34. Test coverage           — critical files should have corresponding tests
 *  35. Weak assertions         — toBeDefined(), toBeTruthy(), {} as Type in tests
 *  36. Native confirm()        — ensure custom dialogs used instead of native confirm()
 *  37. Convex hooks            — validates Convex hook usage patterns
 *  38. Console logs            — bans console.log in production code
 *  39. Tech debt               — tracks TODO/FIXME/HACK/XXX comments
 *
 * Exit code 1 if any check reports blocking issues.
 *
 * Usage:
 *   node scripts/validate.js
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { c, ROOT } from "./validate/utils.js";

function runIsolatedCheck(modulePath) {
  const runnerPath = new URL("./validate/run-check.mjs", import.meta.url);
  const child = spawnSync(process.execPath, [fileURLToPath(runnerPath), modulePath], {
    cwd: ROOT,
    encoding: "utf8",
  });

  if (child.error) {
    return {
      passed: false,
      errors: 1,
      detail: "isolated check execution failed",
      messages: [`  ${c.red}ERROR${c.reset} Failed to run isolated check: ${child.error.message}`],
    };
  }

  const stdoutLines = child.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const lastJsonLine = [...stdoutLines].reverse().find((line) => line.startsWith("{"));

  if (!lastJsonLine) {
    return {
      passed: false,
      errors: 1,
      detail: "isolated check returned no structured result",
      messages: [
        `  ${c.red}ERROR${c.reset} Isolated check produced no JSON result`,
        ...(child.stderr ? [child.stderr.trim()] : []),
      ],
    };
  }

  const result = JSON.parse(lastJsonLine);
  const passed = child.status === 0 && result.passed !== false && (result.errors ?? 0) === 0;
  // Normalize errors: if check failed (passed=false), ensure at least 1 error is reported
  const errors = passed ? 0 : Math.max(1, result.errors ?? 0);
  return {
    ...result,
    passed,
    errors,
  };
}

function formatResultLine(index, totalChecks, result) {
  const idx = `[${index + 1}/${totalChecks}]`;
  const dots = ".".repeat(Math.max(1, 30 - result.name.length));
  const statusColor = result.passed ? c.green : c.red;
  const statusText = result.passed ? "PASS" : "FAIL";
  const detailStr = !result.passed && result.detail ? `  (${result.detail})` : "";
  return `${idx} ${result.name}${dots} ${statusColor}${statusText}${c.reset}${detailStr}`;
}

const checks = [
  {
    name: "Standards (AST)",
    modulePath: new URL("./validate/check-standards.js", import.meta.url).href,
  },
  { name: "Color audit", modulePath: new URL("./validate/check-colors.js", import.meta.url).href },
  { name: "API calls", modulePath: new URL("./validate/check-api-calls.js", import.meta.url).href },
  {
    name: "Query issues",
    modulePath: new URL("./validate/check-queries.js", import.meta.url).href,
  },
  {
    name: "Arbitrary Tailwind",
    modulePath: new URL("./validate/check-arbitrary-tw.js", import.meta.url).href,
  },
  {
    name: "Raw Tailwind",
    modulePath: new URL("./validate/check-raw-tailwind.js", import.meta.url).href,
  },
  {
    name: "Surface shells",
    modulePath: new URL("./validate/check-surface-shells.js", import.meta.url).href,
  },
  {
    name: "Design-system ownership",
    modulePath: new URL("./validate/check-design-system-ownership.js", import.meta.url).href,
  },
  {
    name: "Layout prop usage",
    modulePath: new URL("./validate/check-layout-prop-usage.js", import.meta.url).href,
  },
  {
    name: "Type consistency",
    modulePath: new URL("./validate/check-types.js", import.meta.url).href,
  },
  {
    name: "Type safety",
    modulePath: new URL("./validate/check-type-safety.js", import.meta.url).href,
  },
  { name: "Emoji usage", modulePath: new URL("./validate/check-emoji.js", import.meta.url).href },
  {
    name: "Test ID constants",
    modulePath: new URL("./validate/check-test-ids.js", import.meta.url).href,
  },
  {
    name: "E2E hard rules",
    modulePath: new URL("./validate/check-e2e-hard-rules.js", import.meta.url).href,
  },
  {
    name: "E2E quality",
    modulePath: new URL("./validate/check-e2e-quality.js", import.meta.url).href,
  },
  {
    name: "UI patterns",
    modulePath: new URL("./validate/check-ui-patterns.js", import.meta.url).href,
  },
  {
    name: "Route constants",
    modulePath: new URL("./validate/check-route-constants.js", import.meta.url).href,
  },
  {
    name: "Convex patterns",
    modulePath: new URL("./validate/check-convex-patterns.js", import.meta.url).href,
  },
  {
    name: "Convex naming",
    modulePath: new URL("./validate/check-convex-naming.js", import.meta.url).href,
  },
  {
    name: "Component naming",
    modulePath: new URL("./validate/check-component-naming.js", import.meta.url).href,
  },
  {
    name: "Component props",
    modulePath: new URL("./validate/check-component-props.js", import.meta.url).href,
  },
  {
    name: "Duplicate components",
    modulePath: new URL("./validate/check-duplicate-components.js", import.meta.url).href,
  },
  {
    name: "CVA boundaries",
    modulePath: new URL("./validate/check-cva-boundaries.js", import.meta.url).href,
  },
  {
    name: "Control ownership",
    modulePath: new URL("./validate/check-control-ownership.js", import.meta.url).href,
  },
  {
    name: "Interactive Tailwind",
    modulePath: new URL("./validate/check-interactive-tw.js", import.meta.url).href,
  },
  {
    name: "Tailwind consistency",
    modulePath: new URL("./validate/check-tailwind-consistency.js", import.meta.url).href,
  },
  {
    name: "Recipe drift",
    modulePath: new URL("./validate/check-recipe-drift.js", import.meta.url).href,
  },
  {
    name: "JSDoc coverage",
    modulePath: new URL("./validate/check-jsdoc.js", import.meta.url).href,
  },
  {
    name: "Import paths",
    modulePath: new URL("./validate/check-import-paths.js", import.meta.url).href,
  },
  {
    name: "Hook patterns",
    modulePath: new URL("./validate/check-hook-patterns.js", import.meta.url).href,
  },
  {
    name: "Async patterns",
    modulePath: new URL("./validate/check-async-patterns.js", import.meta.url).href,
  },
  {
    name: "Time constants",
    modulePath: new URL("./validate/check-time-constants.js", import.meta.url).href,
  },
  {
    name: "Unused parameters",
    modulePath: new URL("./validate/check-unused-params.js", import.meta.url).href,
  },
  {
    name: "Test coverage",
    modulePath: new URL("./validate/check-test-coverage.js", import.meta.url).href,
  },
  {
    name: "Weak assertions",
    modulePath: new URL("./validate/check-weak-assertions.js", import.meta.url).href,
  },
  {
    name: "Native confirm()",
    modulePath: new URL("./validate/check-native-confirm.js", import.meta.url).href,
  },
  {
    name: "Convex hooks",
    modulePath: new URL("./validate/check-convex-hooks.js", import.meta.url).href,
  },
  {
    name: "Console logs",
    modulePath: new URL("./validate/check-console-logs.js", import.meta.url).href,
  },
  {
    name: "Tech debt",
    modulePath: new URL("./validate/check-tech-debt.js", import.meta.url).href,
  },
];

console.log(`\n${c.bold}Running validation...${c.reset}\n`);

let totalErrors = 0;
const results = [];
for (let i = 0; i < checks.length; i++) {
  const { name, modulePath } = checks[i];
  const result = runIsolatedCheck(modulePath);
  result.name = name;
  result.index = i;
  results.push(result);
  totalErrors += result.errors;
}

// Print summary lines
for (let i = 0; i < results.length; i++) {
  console.log(formatResultLine(i, checks.length, results[i]));
}

// Print detailed messages for failed checks.
const failedResults = results.filter((r) => !r.passed && r.messages && r.messages.length > 0);

if (failedResults.length > 0) {
  console.log(`\n${c.bold}Failed checks:${c.reset}`);
  for (const result of failedResults) {
    const detail = result.detail ? ` (${result.detail})` : "";
    console.log(`  ${c.red}-${c.reset} ${result.name}${detail}`);
  }

  for (const result of failedResults) {
    console.log(`\n${c.bold}── ${result.name} details ──${c.reset}`);
    for (const msg of result.messages) console.log(msg);
  }
}

console.log("");

if (totalErrors > 0) {
  console.log(`${c.red}${c.bold}RESULT: FAIL${c.reset}`);
  process.exit(1);
} else {
  console.log(`${c.green}${c.bold}RESULT: PASS${c.reset}`);
}
