/**
 * Check for arbitrary Tailwind values in the codebase
 *
 * Scans for patterns like `h-[50px]`, `min-w-[200px]`, `scale-[0.98]`
 * that should ideally use standard Tailwind tokens.
 *
 * Usage: node scripts/check-arbitrary-tailwind.cjs [directory]
 */

const { execSync } = require("node:child_process");
const path = require("node:path");

const targetDir = process.argv[2] || "src";

// Common arbitrary patterns to flag
const patterns = [
  // Sizing
  { regex: "w-\\[", desc: "width" },
  { regex: "h-\\[", desc: "height" },
  { regex: "min-w-\\[", desc: "min-width" },
  { regex: "max-w-\\[", desc: "max-width" },
  { regex: "min-h-\\[", desc: "min-height" },
  { regex: "max-h-\\[", desc: "max-height" },
  // Spacing
  { regex: "p-\\[", desc: "padding" },
  { regex: "m-\\[", desc: "margin" },
  { regex: "gap-\\[", desc: "gap" },
  { regex: "space-x-\\[", desc: "horizontal space" },
  { regex: "space-y-\\[", desc: "vertical space" },
  // Transforms
  { regex: "scale-\\[", desc: "scale" },
  { regex: "rotate-\\[", desc: "rotate" },
  { regex: "translate-x-\\[", desc: "translate-x" },
  { regex: "translate-y-\\[", desc: "translate-y" },
  // Typography
  { regex: "text-\\[", desc: "font-size or color" },
  { regex: "leading-\\[", desc: "line-height" },
  { regex: "tracking-\\[", desc: "letter-spacing" },
  // Borders & Radius
  { regex: "rounded-\\[", desc: "border-radius" },
  { regex: "border-\\[", desc: "border-width" },
  // Colors (often arbitrary hex)
  { regex: "bg-\\[#", desc: "background color (hex)" },
  { regex: "text-\\[#", desc: "text color (hex)" },
  { regex: "border-\\[#", desc: "border color (hex)" },
];

console.log("=== CHECKING FOR ARBITRARY TAILWIND VALUES ===\n");
console.log(`Scanning directory: ${targetDir}\n`);

let totalFound = 0;
const results = [];

for (const { regex, desc } of patterns) {
  try {
    const cmd = `git grep -n -e "${regex}" -- "${targetDir}"`;
    const output = execSync(cmd, { encoding: "utf-8", cwd: path.resolve(__dirname, "..") });
    const lines = output.trim().split("\n").filter(Boolean);

    if (lines.length > 0) {
      results.push({ desc, regex, matches: lines });
      totalFound += lines.length;
    }
  } catch {
    // No matches found (exit code 1)
  }
}

if (results.length === 0) {
  console.log("✅ No arbitrary Tailwind values found!\n");
} else {
  console.log(`⚠️  Found ${totalFound} arbitrary value(s):\n`);

  for (const { desc, regex, matches } of results) {
    console.log(`--- ${desc} (${regex}) ---`);
    for (const match of matches) {
      console.log(`  ${match}`);
    }
    console.log();
  }

  console.log("=== SUMMARY ===");
  console.log(`Total arbitrary values: ${totalFound}`);
  console.log("Consider replacing these with standard Tailwind tokens.\n");
}

process.exit(totalFound > 0 ? 1 : 0);
