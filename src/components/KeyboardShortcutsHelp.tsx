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
import { useState } from "react";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Dialog } from "./ui/Dialog";
import { EmptyState } from "./ui/EmptyState";
import { Flex } from "./ui/Flex";
import { KeyBadge, ShortcutHint } from "./ui/KeyboardShortcut";
import { SearchField } from "./ui/SearchField";
import { Stack } from "./ui/Stack";
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
      { id: "cmd-palette", description: "Open search and commands", modifierShortcut: "cmd+k" },
      { id: "shortcuts-help", description: "Show keyboard shortcuts", singleKey: "?" },
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

function ModifierShortcutBadge({ shortcut }: { shortcut: string }) {
  const parts = formatModifierShortcut(shortcut);
  return (
    <Flex gap="xs" align="center">
      {parts.map((part) => (
        <KeyBadge key={part} variant="default">
          {part}
        </KeyBadge>
      ))}
    </Flex>
  );
}

function KeySequenceBadge({ sequence }: { sequence: string }) {
  const charCounts = new Map<string, number>();
  const chars = sequence.split("").map((char) => {
    const nextCount = (charCounts.get(char) ?? 0) + 1;
    charCounts.set(char, nextCount);
    return { char, key: `${char}-${nextCount}` };
  });

  return (
    <Flex gap="xs" align="center">
      {chars.map(({ char, key }, charIndex) => (
        <Flex key={`${sequence}-${key}`} gap="xs" align="center">
          <KeyBadge variant="default">{char.toUpperCase()}</KeyBadge>
          {charIndex < chars.length - 1 && (
            <Typography variant="caption" color="tertiary">
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
    return <KeyBadge variant="default">{item.singleKey}</KeyBadge>;
  }
  return null;
}

// =============================================================================
// Main Component
// =============================================================================

/** Filter shortcut categories by search query */
function filterShortcutCategories(searchQuery: string) {
  if (!searchQuery.trim()) {
    return SHORTCUT_CATEGORIES;
  }

  const query = searchQuery.toLowerCase();
  return SHORTCUT_CATEGORIES.map((category) => ({
    ...category,
    items: category.items.filter((item) => item.description.toLowerCase().includes(query)),
  })).filter((category) => category.items.length > 0);
}

/** Dialog displaying available keyboard shortcuts grouped by category. */
export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter shortcuts based on search query
  const filteredCategories = filterShortcutCategories(searchQuery);

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
      size="lg"
      footerClassName="sm:justify-between"
      footer={
        <>
          <Button onClick={() => handleOpenChange(false)} chrome="framed" chromeSize="compactPill">
            Close
          </Button>
          <div className="hidden sm:block">
            <Flex align="center" gap="lg">
              <ShortcutHint keys="up+down">Navigate</ShortcutHint>
              <ShortcutHint keys="Esc">Close</ShortcutHint>
            </Flex>
          </div>
        </>
      }
    >
      <Stack gap="md">
        <Card recipe="overlayInset" padding="md">
          <SearchField
            placeholder="Search shortcuts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </Card>

        {hasResults ? (
          <Flex direction="column" gap="md">
            {filteredCategories.map((category) => (
              <Card key={category.id} recipe="commandSection">
                <Card recipe="shortcutCategoryHeader" padding="md" radius="none">
                  <Typography variant="eyebrow">{category.title}</Typography>
                </Card>
                <Stack gap="xs">
                  {category.items.map((item) => (
                    <Card key={item.id} recipe="shortcutItemRow" padding="md">
                      <Flex align="center" justify="between" gap="md">
                        <Typography variant="small" color="secondary">
                          {item.description}
                        </Typography>
                        <ShortcutBadge item={item} />
                      </Flex>
                    </Card>
                  ))}
                </Stack>
              </Card>
            ))}
          </Flex>
        ) : (
          <EmptyState
            icon={Search}
            title="No shortcuts found"
            description={`Try a different search than "${searchQuery}".`}
            size="compact"
          />
        )}
      </Stack>
    </Dialog>
  );
}
