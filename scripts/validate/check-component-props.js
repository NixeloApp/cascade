/**
 * CHECK: Component Prop Consistency
 *
 * Validates that layout components use consistent prop naming and values:
 * - All layout components should use "gap" not "spacing" for gap prop
 * - Gap scale values should be consistent across components
 * - Align/justify prop values should be consistent
 *
 * Standard Gap Scale (should be same across all layout components):
 * | Size | Tailwind Class | Description  |
 * |------|----------------|--------------|
 * | none | gap-0          | No gap       |
 * | xs   | gap-1          | 4px          |
 * | sm   | gap-2          | 8px          |
 * | md   | gap-3          | 12px         |
 * | lg   | gap-4          | 16px         |
 * | xl   | gap-6          | 24px         |
 *
 * @strictness INFO - Reports issues, does not block CI
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath } from "./utils.js";

// Configuration
const CONFIG = {
  // 'error' | 'warn' | 'off'
  strictness: "info",
};

// Layout component files to check for consistency
const LAYOUT_COMPONENTS = [
  "src/components/ui/Flex.tsx",
  "src/components/ui/Stack.tsx",
  "src/components/ui/Grid.tsx",
  "src/components/ui/Section.tsx",
];

// Expected gap scale (from Flex.tsx as the reference)
const EXPECTED_GAP_SCALE = {
  none: "gap-0",
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-3",
  lg: "gap-4",
  xl: "gap-6",
};

// Alternative scale using space-y (for Section which is not a flex container)
// This is valid - space-y works on regular flow layouts
const SPACE_Y_SCALE = {
  none: "",
  xs: "space-y-1",
  sm: "space-y-2",
  md: "space-y-4",
  lg: "space-y-6",
  xl: "space-y-8",
};

// Files that use space-y instead of gap (non-flex layouts)
const SPACE_Y_COMPONENTS = new Set(["Section.tsx"]);

// Deprecated prop names - should use standard names
const DEPRECATED_PROPS = {
  spacing: "gap", // Should use "gap" not "spacing"
  gutter: "gap", // Should use "gap" not "gutter"
  space: "gap", // Should use "gap" not "space"
};

/**
 * Extract gap scale mappings from a component file
 * Handles both object literal and CVA variants format
 */
function extractGapScale(content, _filePath) {
  const scale = {};

  // Pattern 1: Object literal (Flex, Grid)
  // const gapClasses: Record<GapSize, string> = { none: "gap-0", ... }
  const objectMatch = content.match(/gapClasses[^{]*{([^}]+)}/);
  if (objectMatch) {
    const entries = objectMatch[1].matchAll(/(\w+):\s*["']([^"']+)["']/g);
    for (const [, key, value] of entries) {
      scale[key] = value;
    }
  }

  // Pattern 2: CVA variants (Stack, Section)
  // gap: { none: "gap-0", xs: "gap-1", ... }
  const cvaMatch = content.match(/gap:\s*{([^}]+)}/);
  if (cvaMatch && Object.keys(scale).length === 0) {
    const entries = cvaMatch[1].matchAll(/(\w+):\s*["']([^"']+)["']/g);
    for (const [, key, value] of entries) {
      scale[key] = value;
    }
  }

  return scale;
}

/**
 * Extract prop definitions from a component file
 */
function extractPropNames(content) {
  const props = [];

  // Match interface properties: propName?: Type or propName: Type
  const interfaceMatch = content.match(/interface\s+\w+Props[^{]*{([^}]+)}/);
  if (interfaceMatch) {
    const propMatches = interfaceMatch[1].matchAll(/(\w+)\??\s*:/g);
    for (const [, propName] of propMatches) {
      props.push(propName);
    }
  }

  return props;
}

/**
 * Compare gap scales for consistency
 */
function compareGapScales(reference, component, componentName) {
  const issues = [];

  for (const [size, expectedClass] of Object.entries(reference)) {
    const actualClass = component[size];

    // Skip "none" checks when expected is empty (Section uses empty string for none)
    if (expectedClass === "" && (actualClass === undefined || actualClass === "")) {
      continue;
    }

    if (actualClass === undefined) {
      issues.push({
        type: "missing-size",
        message: `Missing gap size "${size}" (expected: ${expectedClass})`,
        component: componentName,
      });
    } else if (actualClass !== expectedClass) {
      issues.push({
        type: "inconsistent-mapping",
        message: `Gap "${size}" maps to "${actualClass}" but expected "${expectedClass}"`,
        component: componentName,
      });
    }
  }

  return issues;
}

/**
 * Check for deprecated prop names
 */
function checkDeprecatedProps(props, filePath) {
  const issues = [];

  for (const prop of props) {
    const lowerProp = prop.toLowerCase();
    if (DEPRECATED_PROPS[lowerProp]) {
      issues.push({
        type: "deprecated-prop",
        message: `Prop "${prop}" should use "${DEPRECATED_PROPS[lowerProp]}" instead`,
        file: relPath(filePath),
      });
    }
  }

  return issues;
}

/**
 * Check a single layout component
 */
function checkLayoutComponent(filePath) {
  const issues = [];

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const fileName = path.basename(filePath);
    const componentName = path.basename(filePath, ".tsx");

    // Extract and check gap scale
    const gapScale = extractGapScale(content, filePath);
    if (Object.keys(gapScale).length > 0) {
      // Use space-y scale for Section (non-flex layout)
      const expectedScale = SPACE_Y_COMPONENTS.has(fileName) ? SPACE_Y_SCALE : EXPECTED_GAP_SCALE;
      const scaleIssues = compareGapScales(expectedScale, gapScale, componentName);
      issues.push(...scaleIssues);
    }

    // Check for deprecated prop names
    const props = extractPropNames(content);
    const propIssues = checkDeprecatedProps(props, filePath);
    issues.push(...propIssues);
  } catch {
    // Skip unreadable files
  }

  return issues;
}

/**
 * Main validation function
 */
export function run() {
  if (CONFIG.strictness === "off") {
    return { passed: true, errors: 0, warnings: 0, detail: "Disabled", messages: [] };
  }

  const allIssues = [];

  for (const componentPath of LAYOUT_COMPONENTS) {
    const fullPath = path.join(ROOT, componentPath);
    if (!fs.existsSync(fullPath)) continue;

    const issues = checkLayoutComponent(fullPath);
    for (const issue of issues) {
      allIssues.push({
        file: relPath(fullPath),
        ...issue,
      });
    }
  }

  // Group issues by type
  const inconsistentCount = allIssues.filter((i) => i.type === "inconsistent-mapping").length;
  const missingCount = allIssues.filter((i) => i.type === "missing-size").length;
  const deprecatedCount = allIssues.filter((i) => i.type === "deprecated-prop").length;

  const isError = CONFIG.strictness === "error" && allIssues.length > 0;
  const totalIssues = allIssues.length;

  // Format messages
  const messages = allIssues.map((i) => {
    const location = i.component ? `${i.file} (${i.component})` : i.file;
    return `  ${c.yellow}INFO${c.reset} ${location} - ${i.message}`;
  });

  return {
    passed: true, // INFO level always passes
    errors: isError ? totalIssues : 0,
    warnings: isError ? 0 : totalIssues,
    detail:
      totalIssues > 0
        ? `${totalIssues} prop issue(s) (${inconsistentCount} inconsistent, ${missingCount} missing, ${deprecatedCount} deprecated)`
        : undefined,
    messages,
  };
}

// Run standalone
if (process.argv[1] === import.meta.url.replace("file://", "")) {
  const result = run();
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.passed ? 0 : 1);
}
