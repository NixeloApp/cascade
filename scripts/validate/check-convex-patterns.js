/**
 * CHECK: Convex Patterns
 *
 * Validates Convex backend code follows established patterns:
 * 1. Security: addProjectMember/addTeamMember must check org membership (ENFORCED)
 * 2. Mutations that create resources must return objects (Envelope Pattern) - warnings only
 * 3. Test files must destructure API returns - disabled for gradual adoption
 *
 * NOTE: This validator focuses on SECURITY issues first.
 * Envelope Pattern and test destructuring are documented standards but not
 * strictly enforced yet to allow gradual adoption across the codebase.
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

// Configuration for gradual adoption
const CONFIG = {
  // Security checks are always enforced
  enforceSecurityChecks: true,
  // Envelope pattern: 'error' | 'warn' | 'off'
  envelopePatternLevel: "error",
  // Test destructuring: 'error' | 'warn' | 'off'
  testDestructuringLevel: "error",
};

export function run() {
  const CONVEX_DIR = path.join(ROOT, "convex");

  // Files to skip
  const SKIP_FILES = ["_generated", "node_modules", ".test-helper.ts"];

  // Known exceptions (with justification)
  const ENVELOPE_EXCEPTIONS = [
    "convex/lib/", // Helper functions, not public API
    "convex/internal/", // Internal actions
  ];

  let errorCount = 0;
  const errors = [];

  function reportError(filePath, line, message) {
    const rel = relPath(filePath);
    errors.push(`  ${c.red}ERROR${c.reset} ${rel}:${line} - ${message}`);
    errorCount++;
  }

  /**
   * Check 1: Mutations should use Envelope Pattern (return objects, not raw IDs)
   */
  function checkEnvelopePattern(filePath, _content, lines) {
    if (CONFIG.envelopePatternLevel === "off") return;

    const rel = relPath(filePath);

    // Skip exceptions
    if (ENVELOPE_EXCEPTIONS.some((exc) => rel.includes(exc))) return;
    // Skip test files
    if (rel.includes(".test.")) return;

    // Pattern: `return projectId;` or `return teamId;` at end of mutation
    // We look for `return <identifier>;` where identifier ends with "Id"
    const rawIdReturnPattern = /^\s*return\s+(\w+Id)\s*;/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(rawIdReturnPattern);

      if (match) {
        const varName = match[1];

        // Check if this is inside a mutation by looking for `export const <name> = ...Mutation` above
        let insideMutation = false;
        for (let j = i - 1; j >= Math.max(0, i - 50); j--) {
          if (/export\s+const\s+\w+\s*=\s*\w*[Mm]utation/.test(lines[j])) {
            insideMutation = true;
            break;
          }
          // Stop if we hit another function boundary
          if (/^export\s+const/.test(lines[j]) && j !== i - 1) {
            break;
          }
        }

        if (insideMutation) {
          reportError(
            filePath,
            i + 1,
            `Raw ID return 'return ${varName};'. Use Envelope Pattern: 'return { ${varName} };'`,
          );
        }
      }
    }
  }

  /**
   * Check 2: Test files should destructure API returns
   */
  function checkTestDestructuring(filePath, _content, lines) {
    if (CONFIG.testDestructuringLevel === "off") return;

    const rel = relPath(filePath);

    // Only check test files
    if (!rel.includes(".test.")) return;

    // Pattern: `const projectId = await asUser.mutation(api.projects.createProject`
    // Should be: `const { projectId } = await asUser.mutation(...`
    const rawAssignPattern = /const\s+(\w+Id)\s*=\s*await\s+\w+\.mutation\(api\.(\w+)\.create/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(rawAssignPattern);

      if (match) {
        const varName = match[1];
        reportError(
          filePath,
          i + 1,
          `Raw assignment 'const ${varName} = await ...'. Use destructuring: 'const { ${varName} } = await ...'`,
        );
      }
    }
  }

  /**
   * Check 3: addProjectMember must verify organization membership
   */
  function checkSecurityPatterns(filePath, content, _lines) {
    if (!CONFIG.enforceSecurityChecks) return;

    const rel = relPath(filePath);

    // Only check specific files
    if (!rel.includes("projects.ts") && !rel.includes("teams.ts")) return;
    // Skip test files
    if (rel.includes(".test.")) return;

    // Check addProjectMember has organization membership check
    // Accept either the helper function OR a manual query to organizationMembers
    const addMemberFunctions = [
      {
        name: "addProjectMember",
        checks: ["isOrganizationMember", "organizationMembers"],
      },
      {
        name: "addTeamMember",
        checks: ["isOrganizationMember", "organizationMembers"],
      },
    ];

    for (const { name, checks } of addMemberFunctions) {
      // Find the function
      const funcStart = content.indexOf(`export const ${name}`);
      if (funcStart === -1) continue;

      // Find the next export (end of this function)
      const nextExport = content.indexOf("export const", funcStart + 1);
      const funcEnd = nextExport === -1 ? content.length : nextExport;
      const funcBody = content.slice(funcStart, funcEnd);

      // Check if ANY of the security patterns exist
      const hasSecurityCheck = checks.some((check) => funcBody.includes(check));
      if (!hasSecurityCheck) {
        // Find line number
        const lineNum = content.slice(0, funcStart).split("\n").length;
        reportError(
          filePath,
          lineNum,
          `${name} missing organization membership security check. Users must be org members before being added to projects/teams.`,
        );
      }
    }
  }

  // Process all TypeScript files in convex/
  const files = walkDir(CONVEX_DIR, { extensions: new Set([".ts"]) });

  for (const filePath of files) {
    const rel = relPath(filePath);

    // Skip generated and helper files
    if (SKIP_FILES.some((skip) => rel.includes(skip))) continue;

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    checkEnvelopePattern(filePath, content, lines);
    checkTestDestructuring(filePath, content, lines);
    checkSecurityPatterns(filePath, content, lines);
  }

  return {
    passed: errorCount === 0,
    errors: errorCount,
    detail: errorCount > 0 ? `${errorCount} violation(s)` : null,
    messages: errors,
  };
}
