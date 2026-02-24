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
import { isMacPlatform, SHORTCUT_CATEGORIES } from "@/lib/shortcuts";
import { Card } from "./ui/Card";
import { Dialog } from "./ui/Dialog";
import { Flex } from "./ui/Flex";
import { Input } from "./ui/Input";
import { ScrollArea } from "./ui/ScrollArea";
import { ShortcutBadge } from "./ui/ShortcutBadge";
import { Stack } from "./ui/Stack";
import { Typography } from "./ui/Typography";

// =============================================================================
// Types
// =============================================================================

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// =============================================================================
// Main Component
// =============================================================================

export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter shortcuts based on search query
  const filteredCategories = (() => {
    if (!searchQuery.trim()) {
      return SHORTCUT_CATEGORIES;
    }

    const query = searchQuery.toLowerCase();
    return SHORTCUT_CATEGORIES.map((category) => ({
      ...category,
      items: category.items.filter((item) => item.description.toLowerCase().includes(query)),
    })).filter((category) => category.items.length > 0);
  })();

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
      size="sm"
    >
      {/* Search Input */}
      <Stack gap="md">
        <div className="relative">
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
      </Stack>

      {/* Shortcuts List */}
      <ScrollArea className="max-h-[60vh]">
        {hasResults ? (
          <Flex direction="column" gap="md">
            {filteredCategories.map((category) => (
              <div key={category.id}>
                <Typography
                  variant="label"
                  color="secondary"
                  className="uppercase tracking-wider mb-2"
                >
                  {category.title}
                </Typography>
                <Flex direction="column" gap="xs">
                  {category.items.map((item) => (
                    <Card key={item.id} padding="xs" variant="ghost" radius="none">
                      <Flex align="center" justify="between">
                        <Typography variant="small" color="secondary">
                          {item.description}
                        </Typography>
                        <ShortcutBadge item={item} />
                      </Flex>
                    </Card>
                  ))}
                </Flex>
              </div>
            ))}
          </Flex>
        ) : (
          <Card padding="lg" variant="flat">
            <Flex direction="column" align="center" justify="center" className="text-center">
              <Typography variant="small" color="secondary">
                No shortcuts found for{" "}
                <Typography as="span" variant="label" className="italic">
                  "{searchQuery}"
                </Typography>
              </Typography>
            </Flex>
          </Card>
        )}
      </ScrollArea>

      {/* Footer Tip */}
      <Card
        padding="md"
        radius="none"
        variant="ghost"
        className="border-t border-ui-border border-x-0 border-b-0"
      >
        <Typography variant="caption" color="tertiary" className="text-center block">
          Press{" "}
          <Typography
            as="kbd"
            variant="mono"
            className="rounded border border-ui-border bg-ui-bg text-xs"
          >
            {isMacPlatform() ? "⌘" : "Ctrl"}+K
          </Typography>{" "}
          to open command palette
        </Typography>
      </Card>
    </Dialog>
  );
}
