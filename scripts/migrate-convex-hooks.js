#!/usr/bin/env node
/**
 * Migration script: Convert raw useQuery/useMutation to auth-aware hooks
 *
 * Run: node scripts/migrate-convex-hooks.js
 */

import fs from "node:fs";
import path from "node:path";

const SRC_DIR = path.join(process.cwd(), "src");

// Files to skip
const SKIP_PATTERNS = [/useConvexHelpers\.ts$/, /\.test\.tsx?$/, /\.stories\.tsx?$/];

function walkDir(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, files);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function migrateFile(filePath) {
  const relPath = path.relative(process.cwd(), filePath);
  if (SKIP_PATTERNS.some((p) => p.test(relPath))) return null;

  let content = fs.readFileSync(filePath, "utf-8");
  const original = content;

  // Check if file has convex/react imports we care about
  const hasUseQuery = /import\s+\{[^}]*useQuery[^}]*\}\s+from\s+["']convex\/react["']/.test(
    content,
  );
  const hasUseMutation = /import\s+\{[^}]*useMutation[^}]*\}\s+from\s+["']convex\/react["']/.test(
    content,
  );
  const hasUseConvexAuth =
    /import\s+\{[^}]*useConvexAuth[^}]*\}\s+from\s+["']convex\/react["']/.test(content);

  if (!hasUseQuery && !hasUseMutation) return null;

  // Track what we need to import from useConvexHelpers
  const helperImports = new Set();

  // Check usage patterns to determine what hooks we need
  if (hasUseQuery) {
    // Check if queries use isAuthenticated pattern
    if (/useQuery\([^,]+,\s*isAuthenticated\s*\?/.test(content)) {
      helperImports.add("useAuthenticatedQuery");
    } else if (/useQuery\([^,]+,\s*canAct\s*\?/.test(content)) {
      helperImports.add("useAuthenticatedQuery");
    } else {
      // Assume authenticated queries
      helperImports.add("useAuthenticatedQuery");
    }
  }

  if (hasUseMutation) {
    helperImports.add("useAuthenticatedMutation");
  }

  // If using usePaginatedQuery, we need useAuthReady for the auth check
  if (/usePaginatedQuery/.test(content) && hasUseConvexAuth) {
    helperImports.add("useAuthReady");
  }

  // Step 1: Transform imports
  // Remove useQuery and useMutation from convex/react import
  content = content.replace(
    /import\s+\{([^}]*)\}\s+from\s+["']convex\/react["']/g,
    (_match, imports) => {
      const importList = imports
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean);
      const remaining = importList.filter(
        (i) =>
          !i.startsWith("useQuery") &&
          !i.startsWith("useMutation") &&
          !(i.startsWith("useConvexAuth") && !content.includes("usePaginatedQuery")),
      );

      if (remaining.length === 0) {
        return ""; // Remove the entire import
      }
      return `import { ${remaining.join(", ")} } from "convex/react"`;
    },
  );

  // Clean up empty imports and double newlines
  content = content.replace(/import\s+\{\s*\}\s+from\s+["']convex\/react["'];?\n?/g, "");

  // Step 2: Add useConvexHelpers import if not already present
  if (helperImports.size > 0 && !content.includes("@/hooks/useConvexHelpers")) {
    const helperImportLine = `import { ${Array.from(helperImports).sort().join(", ")} } from "@/hooks/useConvexHelpers";`;

    // Find a good place to insert - after the last import
    const lastImportMatch = content.match(/^import .+ from ["'][^"']+["'];?\s*$/gm);
    if (lastImportMatch) {
      const lastImport = lastImportMatch[lastImportMatch.length - 1];
      const insertPos = content.lastIndexOf(lastImport) + lastImport.length;
      content = `${content.slice(0, insertPos)}\n${helperImportLine}${content.slice(insertPos)}`;
    }
  }

  // Step 3: Transform useQuery calls
  // Pattern: useQuery(api.X, isAuthenticated ? args : "skip")
  content = content.replace(
    /useQuery\(([^,]+),\s*isAuthenticated\s*\?\s*(\{[^}]*\}|undefined)\s*:\s*["']skip["']\)/g,
    (_match, query, args) => {
      const cleanArgs = args === "undefined" ? "{}" : args;
      return `useAuthenticatedQuery(${query}, ${cleanArgs})`;
    },
  );

  // Pattern: useQuery(api.X, isAuthenticated ? { key: value } : "skip") - multiline
  content = content.replace(
    /useQuery\(\s*([^,]+),\s*isAuthenticated\s*\?\s*(\{[\s\S]*?\})\s*:\s*["']skip["'],?\s*\)/g,
    (_match, query, args) => {
      return `useAuthenticatedQuery(${query.trim()}, ${args.trim()})`;
    },
  );

  // Step 4: Replace isAuthenticated with canAct for usePaginatedQuery
  if (content.includes("usePaginatedQuery") && content.includes("isAuthenticated")) {
    content = content.replace(
      /usePaginatedQuery\(([^,]+),\s*isAuthenticated\s*\?/g,
      "usePaginatedQuery($1, canAct ?",
    );

    // Add canAct destructure if we're using useAuthReady
    if (helperImports.has("useAuthReady") && !content.includes("canAct")) {
      // Find where to add const { canAct } = useAuthReady();
      // After the function declaration, before the first const/let
      content = content.replace(
        /(const\s+\{\s*isAuthenticated\s*\}\s*=\s*useConvexAuth\(\);)/g,
        "const { canAct } = useAuthReady();",
      );
    }
  }

  // Step 5: Remove useConvexAuth if no longer needed
  if (!content.includes("isAuthenticated") && !content.includes("isLoading")) {
    content = content.replace(/const\s+\{[^}]*\}\s*=\s*useConvexAuth\(\);?\s*\n?/g, "");
  }

  // Clean up multiple blank lines
  content = content.replace(/\n{3,}/g, "\n\n");

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    return relPath;
  }
  return null;
}

// Main
console.log("Migrating files to use auth-aware Convex hooks...\n");

const files = walkDir(SRC_DIR);
let migrated = 0;

for (const file of files) {
  const result = migrateFile(file);
  if (result) {
    console.log(`  ✓ ${result}`);
    migrated++;
  }
}

console.log(`\nMigrated ${migrated} files.`);
console.log("Run 'pnpm biome' to fix formatting, then 'pnpm typecheck' to verify.");
