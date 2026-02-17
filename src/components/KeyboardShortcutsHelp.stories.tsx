import type { Meta, StoryObj } from "@storybook/react";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "./ui/Button";
import { Dialog } from "./ui/Dialog";
import { Flex } from "./ui/Flex";
import { Input } from "./ui/Input";
import { ScrollArea } from "./ui/ScrollArea";
import { Typography } from "./ui/Typography";

// =============================================================================
// Types
// =============================================================================

interface ShortcutItem {
  id: string;
  description: string;
  modifierShortcut?: string;
  keySequence?: string;
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
  categories?: ShortcutCategory[];
  initialSearch?: string;
}

// =============================================================================
// Shortcut Data
// =============================================================================

const defaultCategories: ShortcutCategory[] = [
  {
    id: "general",
    title: "General",
    priority: 1,
    items: [
      { id: "cmd-palette", description: "Open command palette", modifierShortcut: "cmd+k" },
      { id: "shortcuts-help", description: "Show keyboard shortcuts", singleKey: "?" },
      { id: "focus-search", description: "Focus search", singleKey: "/" },
      { id: "close-modal", description: "Close modal or cancel", singleKey: "Esc" },
    ],
  },
  {
    id: "navigation",
    title: "Navigation",
    priority: 2,
    items: [
      { id: "go-home", description: "Go to dashboard", keySequence: "gh" },
      { id: "go-documents", description: "Go to documents", keySequence: "gd" },
      { id: "go-projects", description: "Go to projects", keySequence: "gp" },
      { id: "go-issues", description: "Go to issues", keySequence: "gi" },
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
    id: "editor",
    title: "Editor",
    priority: 4,
    items: [
      { id: "bold", description: "Bold", modifierShortcut: "cmd+b" },
      { id: "italic", description: "Italic", modifierShortcut: "cmd+i" },
      { id: "undo", description: "Undo", modifierShortcut: "cmd+z" },
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
  const parts = shortcut.split("+").map((part) => {
    const lower = part.toLowerCase().trim();
    switch (lower) {
      case "cmd":
      case "meta":
        return "Cmd";
      case "ctrl":
        return "Ctrl";
      case "alt":
      case "option":
        return "Opt";
      case "shift":
        return "Shift";
      default:
        return part.toUpperCase();
    }
  });
  return (
    <Flex gap="xs" align="center">
      {parts.map((part) => (
        <KeyBadge key={part}>{part}</KeyBadge>
      ))}
    </Flex>
  );
}

function KeySequenceBadge({ sequence }: { sequence: string }) {
  const items = sequence.split("").map((char, idx) => ({
    key: `${sequence}-${idx}`,
    char,
    isLast: idx === sequence.length - 1,
  }));
  return (
    <Flex gap="xs" align="center">
      {items.map((item) => (
        <Flex key={item.key} gap="xs" align="center">
          <KeyBadge>{item.char.toUpperCase()}</KeyBadge>
          {!item.isLast && (
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
// Main Presentational Component
// =============================================================================

function KeyboardShortcutsHelpPresentational({
  open,
  onOpenChange,
  categories = defaultCategories,
  initialSearch = "",
}: KeyboardShortcutsHelpProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return categories;
    }

    const query = searchQuery.toLowerCase();
    return categories
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => item.description.toLowerCase().includes(query)),
      }))
      .filter((category) => category.items.length > 0);
  }, [searchQuery, categories]);

  const hasResults = filteredCategories.length > 0;

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
            Cmd+K
          </kbd>{" "}
          to open command palette
        </Typography>
      </div>
    </Dialog>
  );
}

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof KeyboardShortcutsHelpPresentational> = {
  title: "Components/KeyboardShortcutsHelp",
  component: KeyboardShortcutsHelpPresentational,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A modal dialog showing available keyboard shortcuts. Supports real-time search, platform-aware key symbols, and key sequence display.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Stories
// =============================================================================

export const Default: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: "The keyboard shortcuts help modal with all categories.",
      },
    },
  },
};

export const WithSearch: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    initialSearch: "go",
  },
  parameters: {
    docs: {
      description: {
        story: "The modal with a search query filtering the shortcuts.",
      },
    },
  },
};

export const NoResults: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    initialSearch: "xyz123nonexistent",
  },
  parameters: {
    docs: {
      description: {
        story: "Empty state when no shortcuts match the search query.",
      },
    },
  },
};

export const SingleCategory: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    categories: [
      {
        id: "editor",
        title: "Editor",
        priority: 1,
        items: [
          { id: "bold", description: "Bold", modifierShortcut: "cmd+b" },
          { id: "italic", description: "Italic", modifierShortcut: "cmd+i" },
          { id: "underline", description: "Underline", modifierShortcut: "cmd+u" },
          { id: "undo", description: "Undo", modifierShortcut: "cmd+z" },
          { id: "redo", description: "Redo", modifierShortcut: "cmd+shift+z" },
        ],
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: "Modal showing only editor shortcuts.",
      },
    },
  },
};

export const KeySequences: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    categories: [
      {
        id: "navigation",
        title: "Navigation",
        priority: 1,
        items: [
          { id: "go-home", description: "Go to dashboard", keySequence: "gh" },
          { id: "go-documents", description: "Go to documents", keySequence: "gd" },
          { id: "go-projects", description: "Go to projects", keySequence: "gp" },
          { id: "go-issues", description: "Go to issues", keySequence: "gi" },
          { id: "go-analytics", description: "Go to analytics", keySequence: "ga" },
          { id: "go-settings", description: "Go to settings", keySequence: "gs" },
        ],
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Navigation shortcuts using key sequences (e.g., "G then H").',
      },
    },
  },
};

export const Interactive: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-8 text-center">
        <Typography variant="p" className="mb-4">
          Press{" "}
          <kbd className="px-2 py-1 bg-ui-bg-secondary rounded border border-ui-border">?</kbd> or
          click the button to open
        </Typography>
        <Button onClick={() => setIsOpen(true)}>Show Keyboard Shortcuts</Button>
        <KeyboardShortcutsHelpPresentational open={isOpen} onOpenChange={setIsOpen} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive demo where you can open and explore the shortcuts modal.",
      },
    },
  },
};

export const KeyBadgeShowcase: Story = {
  render: () => (
    <div className="p-8 space-y-6">
      <div>
        <Typography variant="label" className="mb-3 block">
          Modifier Shortcuts
        </Typography>
        <Flex gap="lg" wrap>
          <ModifierShortcutBadge shortcut="cmd+k" />
          <ModifierShortcutBadge shortcut="cmd+shift+a" />
          <ModifierShortcutBadge shortcut="ctrl+alt+delete" />
        </Flex>
      </div>
      <div>
        <Typography variant="label" className="mb-3 block">
          Key Sequences
        </Typography>
        <Flex gap="lg" wrap>
          <KeySequenceBadge sequence="gh" />
          <KeySequenceBadge sequence="gp" />
          <KeySequenceBadge sequence="gi" />
        </Flex>
      </div>
      <div>
        <Typography variant="label" className="mb-3 block">
          Single Keys
        </Typography>
        <Flex gap="md" wrap>
          <KeyBadge>?</KeyBadge>
          <KeyBadge>/</KeyBadge>
          <KeyBadge>C</KeyBadge>
          <KeyBadge>D</KeyBadge>
          <KeyBadge>Esc</KeyBadge>
        </Flex>
      </div>
    </div>
  ),
  parameters: {
    layout: "padded",
    docs: {
      description: {
        story: "Showcase of the different keyboard badge styles used in the modal.",
      },
    },
  },
};
