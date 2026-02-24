/**
 * Shared shortcut definitions and helpers
 */

// =============================================================================
// Types
// =============================================================================

export interface ShortcutItem {
  /** Unique identifier - should match command ID where possible */
  id: string;
  /** Human-readable description */
  description: string;
  /** For modifier shortcuts: "cmd+k", "ctrl+shift+a" */
  modifierShortcut?: string;
  /** For key sequences: "gh" (will display as "G then H") */
  keySequence?: string;
  /** Single key: "c", "?" */
  singleKey?: string;
}

export interface ShortcutCategory {
  id: string;
  title: string;
  priority: number;
  items: ShortcutItem[];
}

// =============================================================================
// Platform Detection
// =============================================================================

export function isMacPlatform(): boolean {
  if (typeof window === "undefined") return false;
  return navigator.platform.toUpperCase().indexOf("MAC") >= 0;
}

// =============================================================================
// Shortcut Formatting
// =============================================================================

export function formatModifierShortcut(shortcut: string): string[] {
  const isMac = isMacPlatform();
  return shortcut.split("+").map((part) => {
    const lower = part.toLowerCase().trim();
    switch (lower) {
      case "cmd":
      case "meta":
        return isMac ? "Cmd" : "Ctrl";
      case "ctrl":
        return isMac ? "Ctrl" : "Ctrl";
      case "alt":
      case "option":
        return isMac ? "Opt" : "Alt";
      case "shift":
        return "Shift";
      case "delete":
      case "backspace":
        return "⌫";
      case "enter":
      case "return":
        return "Enter";
      case "escape":
      case "esc":
        return "Esc";
      case "space":
        return "Space";
      case "tab":
        return "Tab";
      case "up":
        return "↑";
      case "down":
        return "↓";
      case "left":
        return "←";
      case "right":
        return "→";
      default:
        return part.toUpperCase();
    }
  });
}

// =============================================================================
// Shortcut Data
// =============================================================================

export const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    id: "general",
    title: "General",
    priority: 1,
    items: [
      { id: "cmd-palette", description: "Open command palette", modifierShortcut: "cmd+k" },
      { id: "shortcuts-help", description: "Show keyboard shortcuts", singleKey: "?" },
      { id: "focus-search", description: "Focus search", singleKey: "/" },
      { id: "close-modal", description: "Close modal or cancel", singleKey: "Esc" },
      { id: "ai-assistant", description: "Toggle AI assistant", modifierShortcut: "cmd+shift+a" },
    ],
  },
  {
    id: "navigation",
    title: "Navigation",
    priority: 2,
    items: [
      { id: "nav-dashboard", description: "Go to dashboard", keySequence: "gh" },
      { id: "nav-projects", description: "Go to workspaces", keySequence: "gw" },
      { id: "nav-documents", description: "Go to documents", keySequence: "gd" },
      { id: "go-projects", description: "Go to projects", keySequence: "gp" }, // Kept for future use or alternative
      { id: "go-issues", description: "Go to issues", keySequence: "gi" },
      { id: "nav-1", description: "Go to dashboard", modifierShortcut: "cmd+1" },
      { id: "nav-2", description: "Go to documents", modifierShortcut: "cmd+2" },
      { id: "nav-3", description: "Go to workspaces", modifierShortcut: "cmd+3" },
    ],
  },
  {
    id: "create",
    title: "Create",
    priority: 3,
    items: [
      { id: "create-issue", description: "Create new issue", singleKey: "C" },
      { id: "create-document", description: "Create new document", singleKey: "D" },
      { id: "create-project", description: "Create new project", singleKey: "P" },
    ],
  },
  {
    id: "issue-actions",
    title: "Issue Actions",
    priority: 4,
    items: [
      { id: "edit-issue", description: "Edit issue", singleKey: "E" },
      { id: "assign-me", description: "Assign to me", singleKey: "A" },
      { id: "add-label", description: "Add label", singleKey: "L" },
      { id: "set-priority", description: "Set priority", modifierShortcut: "shift+p" },
      { id: "change-status", description: "Change status", modifierShortcut: "shift+s" },
      { id: "start-timer", description: "Start time tracking", singleKey: "T" },
    ],
  },
  {
    id: "editor",
    title: "Editor",
    priority: 5,
    items: [
      { id: "bold", description: "Bold", modifierShortcut: "cmd+b" },
      { id: "italic", description: "Italic", modifierShortcut: "cmd+i" },
      { id: "underline", description: "Underline", modifierShortcut: "cmd+u" },
      { id: "undo", description: "Undo", modifierShortcut: "cmd+z" },
      { id: "redo", description: "Redo", modifierShortcut: "cmd+shift+z" },
    ],
  },
];
