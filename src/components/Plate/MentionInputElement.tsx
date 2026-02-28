/**
 * Mention Input Element for Plate Editor
 *
 * Renders the combobox dropdown when user types "@" to search for users.
 */

import { api } from "@convex/_generated/api";
import { useComboboxInput } from "@platejs/combobox/react";
import { getMentionOnSelectItem, type TMentionItemBase } from "@platejs/mention";
import { useQuery } from "convex/react";
import type { PlateElementProps } from "platejs/react";
import { useEditorRef } from "platejs/react";
import { useCallback, useMemo, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";

interface MentionUser extends TMentionItemBase {
  id: string;
  text: string;
  email?: string;
  image?: string;
}

interface MentionInputElementData {
  type: "mention_input";
  trigger: string;
  children: Array<{ text: string }>;
}

/**
 * Renders the mention input combobox when user types "@"
 */
export function MentionInputElement({
  children,
  className,
  element,
  attributes,
}: PlateElementProps & { className?: string }) {
  const editor = useEditorRef();
  const mentionElement = element as unknown as MentionInputElementData;
  const inputRef = useRef<HTMLSpanElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Extract search text from children
  const search = useMemo(() => {
    const childNode = mentionElement.children?.[0];
    const text = childNode && "text" in childNode ? childNode.text : "";
    return text.toLowerCase();
  }, [mentionElement.children]);

  // Search for users - query organization members
  const searchResults = useQuery(api.users.searchUsers, {
    query: search,
    limit: 5,
  });

  // Track previous search results to detect changes
  const prevSearchResultsRef = useRef(searchResults);

  // Convert search results to mention items
  const items: MentionUser[] = useMemo(() => {
    // Reset selection when search results change
    if (prevSearchResultsRef.current !== searchResults) {
      prevSearchResultsRef.current = searchResults;
      setSelectedIndex(0);
    }
    if (!searchResults) return [];
    return searchResults.map((user) => ({
      id: user._id,
      key: user._id,
      text: user.name || user.email || "Unknown",
      email: user.email,
      image: user.image,
    }));
  }, [searchResults]);

  // Combobox input handling
  const { props: inputProps, removeInput } = useComboboxInput({
    ref: inputRef,
    cancelInputOnBlur: true,
    cancelInputOnEscape: true,
    cancelInputOnBackspace: true,
  });

  // Handle selection
  const onSelectItem = useCallback(
    (item: MentionUser) => {
      getMentionOnSelectItem()(editor, item, search);
      removeInput(true);
    },
    [editor, search, removeInput],
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLSpanElement>) => {
      if (!items.length) {
        inputProps.onKeyDown(e as React.KeyboardEvent<HTMLElement>);
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % items.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (items[selectedIndex]) {
          onSelectItem(items[selectedIndex]);
        }
      } else {
        // Forward to combobox input handler
        inputProps.onKeyDown(e as React.KeyboardEvent<HTMLElement>);
      }
    },
    [items, selectedIndex, onSelectItem, inputProps],
  );

  return (
    <span
      {...attributes}
      ref={inputRef}
      role="combobox"
      tabIndex={0}
      aria-expanded="true"
      aria-haspopup="listbox"
      className={cn("inline-block rounded-sm bg-ui-bg-secondary px-1 relative", className)}
      onKeyDown={handleKeyDown}
      onBlur={inputProps.onBlur}
    >
      @{children}
      {/* Combobox dropdown */}
      <Card
        padding="none"
        variant="elevated"
        className="absolute left-0 top-full z-50 mt-1 min-w-52 max-w-xs overflow-hidden shadow-lg"
      >
        {items.length === 0 ? (
          <div className="px-3 py-2">
            <Typography variant="small" color="secondary">
              {search ? "No users found" : "Type to search users..."}
            </Typography>
          </div>
        ) : (
          <Stack gap="none">
            {items.map((item, index) => (
              <Button
                key={item.id}
                variant="unstyled"
                className={cn(
                  "w-full h-auto px-3 py-2 text-left transition-colors justify-start rounded-none",
                  "hover:bg-ui-bg-hover focus:bg-ui-bg-hover",
                  index === selectedIndex && "bg-ui-bg-hover",
                )}
                onClick={() => onSelectItem(item)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <Flex align="center" gap="sm">
                  <Avatar name={item.text} src={item.image} size="sm" />
                  <Stack gap="none">
                    <Typography variant="small" className="font-medium">
                      {item.text}
                    </Typography>
                    {item.email && (
                      <Typography variant="caption" color="secondary">
                        {item.email}
                      </Typography>
                    )}
                  </Stack>
                </Flex>
              </Button>
            ))}
          </Stack>
        )}
      </Card>
    </span>
  );
}
