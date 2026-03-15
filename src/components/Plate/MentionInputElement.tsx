/**
 * Mention Input Element for Plate Editor
 *
 * Renders the combobox dropdown when user types "@" to search for users.
 */

import { api } from "@convex/_generated/api";
import { useComboboxInput } from "@platejs/combobox/react";
import { getMentionOnSelectItem, type TMentionItemBase } from "@platejs/mention";
import type { PlateElementProps } from "platejs/react";
import { useEditorRef } from "platejs/react";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";

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
 * Type guard to verify element has MentionInputElementData shape
 */
function isMentionInputElement(element: unknown): element is MentionInputElementData {
  return (
    typeof element === "object" &&
    element !== null &&
    "type" in element &&
    element.type === "mention_input" &&
    "children" in element &&
    Array.isArray(element.children)
  );
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
  const inputRef = useRef<HTMLSpanElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Extract search text from children using type guard
  let search = "";
  if (isMentionInputElement(element)) {
    const childNode = element.children?.[0];
    const text = childNode && "text" in childNode ? childNode.text : "";
    search = text.toLowerCase();
  }

  // Search for users - query organization members
  const searchResults = useAuthenticatedQuery(api.users.searchUsers, {
    query: search,
    limit: 5,
  });

  // Convert search results to mention items
  const items: MentionUser[] = !searchResults
    ? []
    : searchResults.map((user) => ({
        id: user._id,
        key: user._id,
        text: user.name || user.email || "Unknown",
        email: user.email,
        image: user.image,
      }));

  const selectionResetKey = `${search}:${items.map((item) => item.id).join("|")}`;

  useEffect(() => {
    if (selectionResetKey) {
      setSelectedIndex(0);
    }
  }, [selectionResetKey]);

  // Combobox input handling
  const { props: inputProps, removeInput } = useComboboxInput({
    ref: inputRef,
    cancelInputOnBlur: true,
    cancelInputOnEscape: true,
    cancelInputOnBackspace: true,
  });

  // Handle selection
  const onSelectItem = (item: MentionUser) => {
    getMentionOnSelectItem()(editor, item, search);
    removeInput(true);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
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
  };

  return (
    <Badge
      {...attributes}
      ref={inputRef}
      variant="mentionInput"
      size="mentionInput"
      role="combobox"
      tabIndex={0}
      aria-expanded="true"
      aria-haspopup="listbox"
      className={className}
      onKeyDown={handleKeyDown}
      onBlur={inputProps.onBlur}
    >
      @{children}
      {/* Combobox dropdown */}
      <Card recipe="mentionInputMenu" padding="none">
        {items.length === 0 ? (
          <Typography variant="small" color="secondary" className="px-3 py-2">
            {search ? "No users found" : "Type to search users..."}
          </Typography>
        ) : (
          <Stack gap="none">
            {items.map((item, index) => (
              <Button
                key={item.id}
                variant="unstyled"
                chrome={index === selectedIndex ? "listRowActive" : "listRow"}
                chromeSize="listRow"
                onClick={() => onSelectItem(item)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <Flex align="center" gap="sm">
                  <Avatar name={item.text} src={item.image} size="sm" />
                  <Stack gap="none">
                    <Typography variant="label">{item.text}</Typography>
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
    </Badge>
  );
}
