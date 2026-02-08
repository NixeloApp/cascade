/**
 * CHECK 5: Arbitrary Tailwind
 * Arbitrary values like h-[50px] (warning only)
 */

import fs from "node:fs";
import path from "node:path";
import { ROOT, walkDir } from "./utils.js";

// Skip these files entirely (demo/test files)
const SKIP_FILES = [/\.stories\.tsx$/, /\.test\.tsx$/, /\.spec\.tsx$/];

// Allow these specific patterns (Radix runtime vars, CSS selectors, one-offs)
const ALLOWED_PATTERNS = [
  /var\(--radix-/, // Radix UI dynamic vars
  /var\(--scale-/, // Scale CSS vars from theme
  /\[&>.*?\]:/, // Tailwind child selectors [&>svg]:
  /\[&~.*?\]:/, // Tailwind sibling selectors [&~*]:
  /\[perspective:/, // 3D perspective (valid CSS-in-TW)
  /rounded-\[inherit\]/, // Inherit border-radius
  /top-\[60%\]/, // NavigationMenu indicator position
  /scale-\[0\.9[0-9]\]/, // Active/press scale states (0.95-0.99)
];

export function run() {
  const srcDir = path.join(ROOT, "src");

  const patterns = [
    { regex: /w-\[/, desc: "width" },
    { regex: /h-\[/, desc: "height" },
    { regex: /min-w-\[/, desc: "min-width" },
    { regex: /max-w-\[/, desc: "max-width" },
    { regex: /min-h-\[/, desc: "min-height" },
    { regex: /max-h-\[/, desc: "max-height" },
    { regex: /p-\[/, desc: "padding" },
    { regex: /m-\[/, desc: "margin" },
    { regex: /gap-\[/, desc: "gap" },
    { regex: /space-x-\[/, desc: "horizontal space" },
    { regex: /space-y-\[/, desc: "vertical space" },
    { regex: /scale-\[/, desc: "scale" },
    { regex: /rotate-\[/, desc: "rotate" },
    { regex: /translate-x-\[/, desc: "translate-x" },
    { regex: /translate-y-\[/, desc: "translate-y" },
    { regex: /text-\[/, desc: "font-size or color" },
    { regex: /leading-\[/, desc: "line-height" },
    { regex: /tracking-\[/, desc: "letter-spacing" },
    { regex: /rounded-\[/, desc: "border-radius" },
    { regex: /border-\[/, desc: "border-width" },
    { regex: /bg-\[#/, desc: "background color (hex)" },
    { regex: /text-\[#/, desc: "text color (hex)" },
    { regex: /border-\[#/, desc: "border color (hex)" },
  ];

  const files = walkDir(srcDir, { extensions: new Set([".ts", ".tsx", ".js", ".jsx"]) });
  let totalFound = 0;

  const violations = [];
  for (const file of files) {
    // Skip allowlisted files
    if (SKIP_FILES.some((re) => re.test(file))) continue;

    const content = fs.readFileSync(file, "utf-8");
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip lines with allowed patterns
      if (ALLOWED_PATTERNS.some((re) => re.test(line))) continue;

      for (const { regex, desc } of patterns) {
        if (regex.test(line)) {
          totalFound++;
          violations.push({ file: path.relative(ROOT, file), line: i + 1, desc });
          break; // count each line only once
        }
      }
    }
  }

  return {
    passed: true, // warnings only, never fails
    errors: 0,
    warnings: totalFound,
    detail: totalFound > 0 ? `${totalFound} arbitrary value(s), warning` : null,
    messages: violations.map((v) => ({
      type: "warning",
      file: v.file,
      line: v.line,
      message: `Arbitrary ${v.desc} value`,
    })),
  };
}
