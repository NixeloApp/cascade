/**
 * CHECK: Raw Tailwind
 * Flags raw Tailwind classes outside allowed directories.
 * Part of Phase 7: Zero Raw Tailwind enforcement.
 */

import fs from "node:fs";
import path from "node:path";
import { c, ROOT, relPath, walkDir } from "./utils.js";

export function run() {
  const SRC = path.join(ROOT, "src/components");

  // Directories/patterns where raw Tailwind is allowed
  // These contain internal UI components or are complex enough to warrant raw TW
  const ALLOWED_DIRS = [
    "src/components/ui/",
    "src/components/Landing/",
    "src/components/Kanban/",
    "src/components/Calendar/",
    "src/components/Auth/",
    "src/components/Editor/",
    "src/components/AI/",
    "src/components/Sidebar/",
    "src/components/Plate/",
    "src/components/Onboarding/",
    "src/components/Admin/", // Tables with semantic HTML (td/th padding)
    "src/components/Settings/", // Form-heavy with input styling
    "src/components/TimeTracking/", // Complex forms and tables
    "src/components/TimeTracker/", // Time entry components
    "src/components/IssueDetailView/", // Issue detail with form inputs
    "src/components/ProjectSettings/", // Settings forms
    "src/components/FuzzySearch/", // Search dropdowns with custom styling
    "src/components/ImportExport/", // Import/export UI
    "src/components/Fields/", // Custom field forms
    "src/components/Templates/", // Template forms
    "src/components/AdvancedSearchModal/", // Search results
    "src/components/Analytics/", // Dashboard components
    "src/components/Automation/", // Automation forms
    "src/components/Dashboard/", // Dashboard widgets
    "src/components/GanttView/", // Gantt chart with precise positioning and calculations
    "src/components/SpreadsheetView/", // Spreadsheet with HTML table elements (td/th)
  ];

  // Individual files with edge case patterns (responsive, semantic HTML, etc.)
  const ALLOWED_FILES = [
    "/AppSidebar.tsx", // Contains NavItem, CollapsibleSection internal components
    "/AppHeader.tsx", // Navigation header with internal components
    "/BulkOperationsBar.tsx", // Responsive layout patterns
    "/CommandPalette.tsx", // Keyboard shortcut styling
    "/CommentReactions.tsx", // Popover overrides
    "/CreateProjectFromTemplate.tsx", // Responsive button layout
    "/DocumentHeader.tsx", // Header with breadcrumbs
    "/DocumentTemplatesManager.tsx", // Template cards with gradients
    "/FilterBar.tsx", // Filter dropdowns
    "/GlobalSearch.tsx", // Search modal
    "/ImportExportModal.tsx", // flex-1 on Button components
    "/InboxList.tsx", // TabsContent styling
    "/IssueCard.tsx", // Responsive card layout
    "/IssueDependencies.tsx", // min-w-0 truncation pattern
    "/IssuesCalendarView.tsx", // Calendar grid styling
    "/KanbanBoard.tsx", // Board columns with specific widths
    "/KeyboardShortcutsHelp.tsx", // kbd element styling
    "/DocumentTree.tsx", // Tree expand/collapse button (p-0.5 h-5 w-5)
    "/LabelsManager.tsx", // Inline link button styling (p-0 h-auto)
    "/MentionInput.tsx", // Dropdown positioning
    "/NotificationCenter.tsx", // Popover with badge positioning
    "/NotificationItem.tsx", // Link with flex styling
    "/ProjectsList.tsx", // Project avatar styling
    "/RoadmapView.tsx", // Timeline/roadmap styling
    "/SprintManager.tsx", // Progress bars, responsive layout
    "/TimeTracker.tsx", // Time element styling
    "/UserMenu.tsx", // Dropdown menu styling
    "/UserProfile.tsx", // Dialog overrides
    "/VersionHistory.tsx", // Dialog with flex layout
    "/ModuleManager.tsx", // Module cards with progress bars and layout
  ];

  // File extensions to always allow
  const ALLOWED_EXTENSIONS = [".stories.tsx", ".test.tsx", ".example.tsx"];

  // Patterns that should use CVA components instead
  const RAW_PATTERNS = [
    { pattern: /className=.*\bflex\b/, replacement: "<Flex>" },
    { pattern: /className=.*\binline-flex\b/, replacement: "<Flex inline>" },
    { pattern: /\bgrid\b/, replacement: "<Grid>" },
    { pattern: /\bgap-\d+/, replacement: "<Flex gap='...'>" },
    { pattern: /\bp-\d+/, replacement: "<Card padding='...'>" },
    { pattern: /\bpx-\d+/, replacement: "<Card padding='...'>" },
    { pattern: /\bpy-\d+/, replacement: "<Card padding='...'>" },
    { pattern: /\bspace-y-\d+/, replacement: "<Stack gap='...'>" },
    { pattern: /\bspace-x-\d+/, replacement: "<Flex gap='...'>" },
    { pattern: /\brounded-(?!none|full)/, replacement: "<Card>" },
    { pattern: /\btext-(?:xs|sm|base|lg|xl|\d)/, replacement: "<Typography>" },
    {
      pattern: /\bfont-(?:thin|light|normal|medium|semibold|bold)/,
      replacement: "<Typography>",
    },
  ];

  const violations = [];

  function isAllowed(filePath) {
    const rel = relPath(filePath);
    // Check allowed directories
    if (ALLOWED_DIRS.some((dir) => rel.includes(dir))) return true;
    // Check allowed individual files
    if (ALLOWED_FILES.some((file) => rel.endsWith(file))) return true;
    // Check allowed extensions
    if (ALLOWED_EXTENSIONS.some((ext) => rel.endsWith(ext))) return true;
    return false;
  }

  function checkFile(filePath) {
    if (isAllowed(filePath)) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const rel = relPath(filePath);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.includes("className")) continue;

      for (const { pattern, replacement } of RAW_PATTERNS) {
        if (pattern.test(line)) {
          violations.push({
            file: rel,
            line: i + 1,
            pattern: pattern.toString(),
            replacement,
            snippet: line.trim().slice(0, 80),
          });
          break; // One violation per line is enough
        }
      }
    }
  }

  const files = walkDir(SRC, { extensions: new Set([".tsx"]) });
  for (const f of files) checkFile(f);

  const messages = [];
  if (violations.length > 0) {
    // Group by file
    const byFile = {};
    for (const v of violations) {
      if (!byFile[v.file]) byFile[v.file] = [];
      byFile[v.file].push(v);
    }

    for (const [file, items] of Object.entries(byFile).sort()) {
      messages.push(`  ${c.bold}${file}${c.reset} (${items.length})`);
      for (const item of items.slice(0, 3)) {
        // Show max 3 per file
        messages.push(`    ${c.dim}L${item.line}${c.reset} → use ${item.replacement}`);
      }
      if (items.length > 3) {
        messages.push(`    ${c.dim}... and ${items.length - 3} more${c.reset}`);
      }
    }
  }

  // Phase 7 migration complete - this is now a hard check
  // All edge cases are in ALLOWED_DIRS/ALLOWED_FILES, new violations should fail CI
  return {
    passed: violations.length === 0,
    errors: violations.length,
    warnings: 0,
    detail: violations.length > 0 ? `${violations.length} raw Tailwind violations` : null,
    messages,
  };
}
