#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const E2E_DIR = path.join(ROOT, "e2e");
const TARGET_EXTENSIONS = new Set([".ts", ".tsx"]);

function collectFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, files);
      continue;
    }

    const ext = path.extname(entry.name);
    if (!TARGET_EXTENSIONS.has(ext)) {
      continue;
    }

    const isSpec = entry.name.endsWith(".spec.ts") || entry.name.endsWith(".spec.tsx");
    if (isSpec) {
      files.push(fullPath);
    }
  }
  return files;
}

function main() {
  if (!fs.existsSync(E2E_DIR)) {
    console.error("E2E directory not found:", E2E_DIR);
    process.exit(1);
  }

  const specFiles = collectFiles(E2E_DIR);
  const violations = [];

  for (const filePath of specFiles) {
    const source = fs.readFileSync(filePath, "utf8");
    const lines = source.split("\n");
    lines.forEach((line, index) => {
      if (line.includes("waitForTimeout(")) {
        violations.push({
          file: path.relative(ROOT, filePath),
          line: index + 1,
          text: line.trim(),
        });
      }
    });
  }

  if (violations.length > 0) {
    console.error("E2E hard rule violation: waitForTimeout(...) found in spec files.");
    for (const violation of violations) {
      console.error(`- ${violation.file}:${violation.line} -> ${violation.text}`);
    }
    process.exit(1);
  }

  console.log(
    `E2E hard-rule check passed: scanned ${specFiles.length} spec files, no waitForTimeout usage.`,
  );
}

main();
