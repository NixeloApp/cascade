/**
 * KeyboardShortcutsHelp - Plane-quality shortcuts modal
 *
 * Features:
 * - Real-time search/filter
 * - Platform-aware key symbols (⌘ on Mac, Ctrl on Windows)
 * - Key sequence display ("G then H")
 * - Priority-based category grouping
 * - Empty search state
 */

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Dialog } from "./ui/Dialog";
import { Flex } from "./ui/Flex";
import { Input } from "./ui/Input";
import { ScrollArea } from "./ui/ScrollArea";
import { Typography } from "./ui/Typography";

// =============================================================================
// Types
// =============================================================================

interface ShortcutItem {
  /** Unique identifier */
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

interface ShortcutCategory {
  id: string;
  title: string;
  priority: number;
  items: ShortcutItem[];
}

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// =============================================================================
// Platform Detection
// =============================================================================

function isMacPlatform(): boolean {
  if (typeof window === "undefined") return false;
  return navigator.platform.toUpperCase().indexOf("MAC") >= 0;
}

// =============================================================================
// Shortcut Formatting
// =============================================================================

function formatModifierShortcut(shortcut: string): string[] {
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

const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
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
      { id: "go-home", description: "Go to dashboard", keySequence: "gh" },
      { id: "go-workspaces", description: "Go to workspaces", keySequence: "gw" },
      { id: "go-documents", description: "Go to documents", keySequence: "gd" },
      { id: "go-projects", description: "Go to projects", keySequence: "gp" },
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

// =============================================================================
// Components
// =============================================================================

function KeyBadge({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-ui-border bg-ui-bg-secondary px-1.5 font-mono text-xs font-medium text-ui-text-secondary">
      {children}
    </kbd>
  );
}

function ModifierShortcutBadge({ shortcut }: { shortcut: string }) {
  const parts = formatModifierShortcut(shortcut);
  return (
    <Flex gap="xs" align="center">
      {parts.map((part) => (
        <KeyBadge key={part}>{part}</KeyBadge>
      ))}
    </Flex>
  );
}

function KeySequenceBadge({ sequence }: { sequence: string }) {
  const chars = sequence.split("");
  return (
    <Flex gap="xs" align="center">
      {chars.map((char, charIndex) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static key sequence chars, index needed for separator
        <Flex key={charIndex} gap="xs" align="center">
          <KeyBadge>{char.toUpperCase()}</KeyBadge>
          {charIndex < chars.length - 1 && (
            <Typography variant="muted" className="text-xs">
              then
            </Typography>
          )}
        </Flex>
      ))}
    </Flex>
  );
}

function ShortcutBadge({ item }: { item: ShortcutItem }) {
  if (item.modifierShortcut) {
    return <ModifierShortcutBadge shortcut={item.modifierShortcut} />;
  }
  if (item.keySequence) {
    return <KeySequenceBadge sequence={item.keySequence} />;
  }
  if (item.singleKey) {
    return <KeyBadge>{item.singleKey}</KeyBadge>;
  }
  return null;
}

// =============================================================================
// Main Component
// =============================================================================

export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter shortcuts based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return SHORTCUT_CATEGORIES;
    }

    const query = searchQuery.toLowerCase();
    return SHORTCUT_CATEGORIES.map((category) => ({
      ...category,
      items: category.items.filter((item) => item.description.toLowerCase().includes(query)),
    })).filter((category) => category.items.length > 0);
  }, [searchQuery]);

  const hasResults = filteredCategories.length > 0;

  // Reset search when modal closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSearchQuery("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Keyboard Shortcuts"
      description="Available keyboard shortcuts for navigation and actions"
      className="sm:max-w-md"
    >
      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ui-text-tertiary" />
        <Input
          type="text"
          placeholder="Search shortcuts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 pl-8 text-sm"
          autoFocus
        />
      </div>

      {/* Shortcuts List */}
      <ScrollArea className="max-h-panel-md">
        {hasResults ? (
          <Flex direction="column" gap="md">
            {filteredCategories.map((category) => (
              <div key={category.id}>
                <Typography
                  variant="label"
                  className="text-xs font-medium text-ui-text-secondary uppercase tracking-wider mb-2"
                >
                  {category.title}
                </Typography>
                <Flex direction="column" gap="xs">
                  {category.items.map((item) => (
                    <Flex key={item.id} align="center" justify="between" className="py-1.5">
                      <Typography variant="small" className="text-ui-text-secondary">
                        {item.description}
                      </Typography>
                      <ShortcutBadge item={item} />
                    </Flex>
                  ))}
                </Flex>
              </div>
            ))}
          </Flex>
        ) : (
          <Flex direction="column" align="center" justify="center" className="py-8 text-center">
            <Typography variant="small" className="text-ui-text-secondary">
              No shortcuts found for{" "}
              <Typography as="span" variant="small" className="font-medium italic">
                "{searchQuery}"
              </Typography>
            </Typography>
          </Flex>
        )}
      </ScrollArea>

      {/* Footer Tip */}
      <div className="mt-4 pt-4 border-t border-ui-border">
        <Typography variant="muted" className="text-xs text-center">
          Press{" "}
          <kbd className="px-1 py-0.5 rounded border border-ui-border bg-ui-bg text-xs font-mono">
            {isMacPlatform() ? "⌘" : "Ctrl"}+K
          </kbd>{" "}
          to open command palette
        </Typography>
      </div>
    </Dialog>
  );
}
