import type * as React from "react";
import { formatModifierShortcut, type ShortcutItem } from "@/lib/shortcuts";
import { Flex } from "./Flex";
import { Typography } from "./Typography";

export function KeyBadge({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-ui-border bg-ui-bg-secondary px-1.5 font-mono text-xs font-medium text-ui-text-secondary">
      {children}
    </kbd>
  );
}

export function ModifierShortcutBadge({ shortcut }: { shortcut: string }) {
  const parts = formatModifierShortcut(shortcut);
  return (
    <Flex gap="xs" align="center">
      {parts.map((part) => (
        <KeyBadge key={part}>{part}</KeyBadge>
      ))}
    </Flex>
  );
}

export function KeySequenceBadge({ sequence }: { sequence: string }) {
  const chars = sequence.split("");
  return (
    <Flex gap="xs" align="center">
      {chars.map((char, charIndex) => {
        // Use a composite key to avoid lint warning about array index
        const key = `${char}-${charIndex}`;
        return (
          <Flex key={key} gap="xs" align="center">
            <KeyBadge>{char.toUpperCase()}</KeyBadge>
            {charIndex < chars.length - 1 && (
              <Typography variant="caption" color="tertiary">
                then
              </Typography>
            )}
          </Flex>
        );
      })}
    </Flex>
  );
}

export function ShortcutBadge({ item }: { item: ShortcutItem }) {
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
