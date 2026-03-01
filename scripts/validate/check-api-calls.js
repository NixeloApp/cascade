/**
 * CHECK 3: API calls
 * Validates api.X.Y calls match Convex exports
 *
 * @strictness STRICT - Blocks CI. All API calls must reference existing Convex functions.
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

export function run() {
  const srcDir = path.join(ROOT, "src");
  const convexDir = path.join(ROOT, "convex");

  // Get all API calls from src
  const srcFiles = walkDir(srcDir, { extensions: new Set([".ts", ".tsx"]) });
  const apiCalls = new Map();

  for (const file of srcFiles) {
    try {
      const content = fs.readFileSync(file, "utf8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().startsWith("//") || line.trim().startsWith("*")) continue;
        const matches = line.matchAll(/api\.(\w+)\.(\w+)/g);
        for (const match of matches) {
          const call = `${match[1]}.${match[2]}`;
          if (!apiCalls.has(call)) apiCalls.set(call, []);
          apiCalls.get(call).push(`${relPath(file)}:${i + 1}`);
        }
      }
    } catch {
      // skip
    }
  }

  // Get exported functions from convex
  function resolveSubPath(basePath, relativePath) {
    const subPath = path.join(path.dirname(basePath), relativePath);
    if (!subPath.endsWith(".ts")) {
      if (fs.existsSync(`${subPath}.ts`)) return `${subPath}.ts`;
      if (fs.existsSync(path.join(subPath, "index.ts"))) return path.join(subPath, "index.ts");
    }
    return subPath;
  }

  function getExportsFromFile(file) {
    const funcs = new Set();
    try {
      const content = fs.readFileSync(file, "utf8");
      const directMatches = content.matchAll(/export const (\w+)\s*=/g);
      for (const match of directMatches) funcs.add(match[1]);

      const reExportMatches = content.matchAll(/export \* from\s+["'](\.\/[^"']+)["']/g);
      for (const match of reExportMatches) {
        const subPath = resolveSubPath(file, match[1]);
        if (fs.existsSync(subPath)) {
          for (const f of getExportsFromFile(subPath)) funcs.add(f);
        }
      }
    } catch {
      // skip
    }
    return funcs;
  }

  const exportedFuncs = new Map();

  // Top-level convex files
  const convexTopLevel = walkDir(convexDir, { extensions: new Set([".ts"]) }).filter((f) => {
    const rel = path.relative(convexDir, f);
    return !(
      rel.includes(path.sep) ||
      rel.includes(".test.") ||
      rel.includes("schema") ||
      rel.includes("config")
    );
  });

  for (const file of convexTopLevel) {
    const moduleName = path.basename(file, ".ts");
    exportedFuncs.set(moduleName, getExportsFromFile(file));
  }

  // Subdirectories
  const subdirs = ["ai", "email", "api", "http", "lib", "internal"];
  for (const subdir of subdirs) {
    const subPath = path.join(convexDir, subdir);
    if (!fs.existsSync(subPath)) continue;
    const subFiles = walkDir(subPath, { extensions: new Set([".ts"]) });
    for (const file of subFiles) {
      const submodule = path.basename(file, ".ts");
      exportedFuncs.set(`${subdir}.${submodule}`, getExportsFromFile(file));
    }
  }

  // Find mismatches
  let found = 0;
  const errors = [];
  for (const [call, files] of [...apiCalls.entries()].sort()) {
    const [moduleName, func] = call.split(".");
    if (moduleName === "convex") continue;
    if (call === "pumble.com") continue;
    if (exportedFuncs.has(call)) continue;
    if (
      ["ai.actions", "ai.mutations", "ai.queries", "email.notifications", "email.helpers"].includes(
        call,
      )
    )
      continue;

    const moduleFuncs = exportedFuncs.get(moduleName);
    if (!moduleFuncs) {
      errors.push(`  ${c.red}MISSING MODULE${c.reset}: convex/${moduleName}.ts  (api.${call})`);
      found++;
    } else if (!moduleFuncs.has(func)) {
      errors.push(
        `  ${c.red}MISSING FUNCTION${c.reset}: api.${call}  in: ${files.slice(0, 3).join(", ")}`,
      );
      found++;
    }
  }

  return {
    passed: found === 0,
    errors: found,
    warnings: 0,
    detail: found > 0 ? `${found} invalid call(s)` : `${apiCalls.size} calls validated`,
    messages: errors,
  };
}
