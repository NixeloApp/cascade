/**
 * Slash Command Menu for Plate Editor
 *
 * Triggered by typing "/" in the editor.
 * Uses cmdk for fuzzy search and keyboard navigation.
 */

import {
  Code,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Image,
  List,
  ListOrdered,
  Quote,
  Table,
  Type,
} from "lucide-react";
import type { PlateEditor } from "platejs/react";
import { useEditorRef, useEditorSelection } from "platejs/react";
import { useEffect, useState } from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/Command";
import { Flex } from "@/components/ui/Flex";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/Popover";
import { Typography } from "@/components/ui/Typography";
import { NODE_TYPES } from "@/lib/plate/plugins";

interface SlashMenuItem {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: (editor: PlateEditor) => void;
}

const SLASH_MENU_ITEMS: SlashMenuItem[] = [
  {
    id: "paragraph",
    label: "Text",
    description: "Plain text paragraph",
    icon: Type,
    action: (editor) => {
      editor.tf.setNodes({ type: NODE_TYPES.paragraph });
    },
  },
  {
    id: "h1",
    label: "Heading 1",
    description: "Large section heading",
    icon: Heading1,
    action: (editor) => {
      editor.tf.setNodes({ type: NODE_TYPES.heading1 });
    },
  },
  {
    id: "h2",
    label: "Heading 2",
    description: "Medium section heading",
    icon: Heading2,
    action: (editor) => {
      editor.tf.setNodes({ type: NODE_TYPES.heading2 });
    },
  },
  {
    id: "h3",
    label: "Heading 3",
    description: "Small section heading",
    icon: Heading3,
    action: (editor) => {
      editor.tf.setNodes({ type: NODE_TYPES.heading3 });
    },
  },
  {
    id: "h4",
    label: "Heading 4",
    description: "Subsection heading",
    icon: Heading4,
    action: (editor) => {
      editor.tf.setNodes({ type: NODE_TYPES.heading4 });
    },
  },
  {
    id: "h5",
    label: "Heading 5",
    description: "Minor heading",
    icon: Heading5,
    action: (editor) => {
      editor.tf.setNodes({ type: NODE_TYPES.heading5 });
    },
  },
  {
    id: "h6",
    label: "Heading 6",
    description: "Smallest heading",
    icon: Heading6,
    action: (editor) => {
      editor.tf.setNodes({ type: NODE_TYPES.heading6 });
    },
  },
  {
    id: "bullet-list",
    label: "Bullet List",
    description: "Unordered list with bullets",
    icon: List,
    action: (editor) => {
      editor.tf.setNodes({ type: NODE_TYPES.bulletedList });
    },
  },
  {
    id: "numbered-list",
    label: "Numbered List",
    description: "Ordered list with numbers",
    icon: ListOrdered,
    action: (editor) => {
      editor.tf.setNodes({ type: NODE_TYPES.numberedList });
    },
  },
  {
    id: "blockquote",
    label: "Quote",
    description: "Block quote for citations",
    icon: Quote,
    action: (editor) => {
      editor.tf.setNodes({ type: NODE_TYPES.blockquote });
    },
  },
  {
    id: "code-block",
    label: "Code Block",
    description: "Code with syntax highlighting",
    icon: Code,
    action: (editor) => {
      editor.tf.setNodes({ type: NODE_TYPES.codeBlock });
    },
  },
  {
    id: "table",
    label: "Table",
    description: "Insert a table",
    icon: Table,
    action: (editor) => {
      // Insert a 3x3 table
      const table = {
        type: NODE_TYPES.table,
        children: [
          {
            type: NODE_TYPES.tableRow,
            children: [
              { type: NODE_TYPES.tableCellHeader, children: [{ text: "" }] },
              { type: NODE_TYPES.tableCellHeader, children: [{ text: "" }] },
              { type: NODE_TYPES.tableCellHeader, children: [{ text: "" }] },
            ],
          },
          {
            type: NODE_TYPES.tableRow,
            children: [
              { type: NODE_TYPES.tableCell, children: [{ text: "" }] },
              { type: NODE_TYPES.tableCell, children: [{ text: "" }] },
              { type: NODE_TYPES.tableCell, children: [{ text: "" }] },
            ],
          },
          {
            type: NODE_TYPES.tableRow,
            children: [
              { type: NODE_TYPES.tableCell, children: [{ text: "" }] },
              { type: NODE_TYPES.tableCell, children: [{ text: "" }] },
              { type: NODE_TYPES.tableCell, children: [{ text: "" }] },
            ],
          },
        ],
      };
      editor.tf.insertNodes(table);
    },
  },
  {
    id: "image",
    label: "Image",
    description: "Upload or embed an image",
    icon: Image,
    action: (editor) => {
      // TODO: Open image upload dialog
      const url = window.prompt("Enter image URL:");
      if (url) {
        const image = {
          type: NODE_TYPES.image,
          url,
          children: [{ text: "" }],
        };
        editor.tf.insertNodes(image);
      }
    },
  },
];

/**
 * Helper to check if selection is collapsed
 */
function isSlashSelectionCollapsed(selection: { anchor: unknown; focus: unknown } | null): boolean {
  if (!selection) return true;
  const { anchor, focus } = selection as {
    anchor: { path: number[]; offset: number };
    focus: { path: number[]; offset: number };
  };
  return (
    anchor.path.length === focus.path.length &&
    anchor.path.every((p, i) => p === focus.path[i]) &&
    anchor.offset === focus.offset
  );
}

interface SlashTriggerResult {
  isActive: boolean;
  searchText: string;
  rect: DOMRect | null;
}

/**
 * Check if slash command is triggered and get search text
 */
function detectSlashTrigger(): SlashTriggerResult {
  const inactive: SlashTriggerResult = { isActive: false, searchText: "", rect: null };

  const domSelection = window.getSelection();
  if (!domSelection || domSelection.rangeCount === 0) return inactive;

  const domRange = domSelection.getRangeAt(0);
  const node = domRange.startContainer;
  if (node.nodeType !== Node.TEXT_NODE) return inactive;

  const textContent = node.textContent?.slice(0, domRange.startOffset) || "";
  const lastSlashIndex = textContent.lastIndexOf("/");
  if (lastSlashIndex === -1) return inactive;

  // Only show menu if slash is at start of word (preceded by space or start of text)
  const charBeforeSlash = textContent[lastSlashIndex - 1];
  const isValidPosition =
    lastSlashIndex === 0 || charBeforeSlash === " " || charBeforeSlash === "\n";
  if (!isValidPosition) return inactive;

  return {
    isActive: true,
    searchText: textContent.slice(lastSlashIndex + 1),
    rect: domRange.getBoundingClientRect(),
  };
}

/**
 * Delete slash command text from current position back to the slash
 * Returns the number of characters deleted, or 0 if nothing deleted
 */
function deleteSlashCommand(editor: PlateEditor): number {
  const domSelection = window.getSelection();
  if (!domSelection || domSelection.rangeCount === 0) return 0;

  const range = domSelection.getRangeAt(0);
  const node = range.startContainer;
  if (node.nodeType !== Node.TEXT_NODE) return 0;

  const textContent = node.textContent || "";
  const cursorPos = range.startOffset;
  const lastSlashIndex = textContent.lastIndexOf("/", cursorPos - 1);
  if (lastSlashIndex === -1) return 0;

  const deleteLength = cursorPos - lastSlashIndex;
  for (let i = 0; i < deleteLength; i++) {
    editor.tf.deleteBackward("character");
  }
  return deleteLength;
}

/**
 * Slash command menu component
 * Must be rendered inside Plate context
 */
export function SlashMenu() {
  const editor = useEditorRef();
  const selection = useEditorSelection();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  // Check for slash trigger
  useEffect(() => {
    if (!selection || !isSlashSelectionCollapsed(selection)) {
      setOpen(false);
      return;
    }

    const trigger = detectSlashTrigger();
    if (trigger.isActive && trigger.rect) {
      setSearch(trigger.searchText);
      setOpen(true);
      setAnchorRect(trigger.rect);
    } else {
      setOpen(false);
      setSearch("");
    }
  }, [selection]);

  // Handle item selection
  const handleSelect = (item: SlashMenuItem) => {
    deleteSlashCommand(editor);
    item.action(editor);
    setOpen(false);
    setSearch("");
  };

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Filter items based on search
  const filteredItems = SLASH_MENU_ITEMS.filter(
    (item) =>
      item.label.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()),
  );

  if (!open || !anchorRect) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor
        style={{
          position: "fixed",
          left: anchorRect.left,
          top: anchorRect.bottom + 4,
          width: 1,
          height: 1,
        }}
      />
      <PopoverContent
        className="w-72 p-0 bg-ui-bg-elevated border border-ui-border shadow-elevated rounded-container animate-scale-in"
        align="start"
        side="bottom"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command className="bg-transparent">
          <CommandList className="max-h-80 scrollbar-subtle">
            <CommandEmpty className="py-6 text-center text-sm text-ui-text-tertiary">
              No results found
            </CommandEmpty>
            <CommandGroup
              heading="Basic blocks"
              className="px-1 py-1.5 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-ui-text-tertiary"
            >
              {filteredItems.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  onSelect={() => handleSelect(item)}
                  className="px-2 py-2 mx-1 rounded transition-default cursor-pointer aria-selected:bg-ui-bg-hover"
                >
                  <item.icon className="mr-3 h-4 w-4 text-ui-text-secondary" />
                  <Flex direction="column" className="gap-0.5">
                    <Typography variant="label" className="text-sm font-medium text-ui-text">
                      {item.label}
                    </Typography>
                    <Typography variant="muted" className="text-xs">
                      {item.description}
                    </Typography>
                  </Flex>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
