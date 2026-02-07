import { useCallback, useEffect } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: (e: KeyboardEvent) => void;
  description: string;
  global?: boolean; // Works even when input is focused
  preventDefault?: boolean; // Default true
}

export interface KeySequence {
  keys: string[];
  description: string;
  handler: () => void;
  preventDefault?: boolean;
}

// Track the last pressed key for sequences (like 'g+h')
let lastKeyPressed: string | null = null;
let lastKeyTime = 0;
const SEQUENCE_TIMEOUT = 1000; // 1 second to complete a sequence

// Helper function to check if user is typing
function isUserTyping(target: HTMLElement): boolean {
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
}

// Helper function to check if modifiers match
function modifiersMatch(e: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const ctrlMatch = shortcut.ctrl ? e.ctrlKey : !e.ctrlKey;
  const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
  const altMatch = shortcut.alt ? e.altKey : !e.altKey;
  const metaMatch = shortcut.meta ? e.metaKey : !e.metaKey;
  return ctrlMatch && shiftMatch && altMatch && metaMatch;
}

// Helper function to check if shortcut matches
function shortcutMatches(e: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  return e.key.toLowerCase() === shortcut.key.toLowerCase() && modifiersMatch(e, shortcut);
}

// Helper function to process shortcuts list
function processShortcuts(
  e: KeyboardEvent,
  shortcuts: KeyboardShortcut[],
  isTyping: boolean,
): boolean {
  for (const shortcut of shortcuts) {
    // Skip non-global shortcuts when typing
    if (isTyping && !shortcut.global) {
      continue;
    }

    if (shortcutMatches(e, shortcut)) {
      if (shortcut.preventDefault !== false) {
        e.preventDefault();
      }
      shortcut.handler(e);
      return true;
    }
  }
  return false;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = isUserTyping(target);
      processShortcuts(e, shortcuts, isTyping);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, enabled]);
}

// Helper function to find matching sequence
function findMatchingSequence(
  sequences: KeySequence[],
  lastKey: string,
  currentKey: string,
): KeySequence | undefined {
  const sequenceKey = `${lastKey}+${currentKey}`;
  return sequences.find((s) => s.keys.join("+") === sequenceKey);
}

// Helper function to handle sequence match
function handleSequenceMatch(e: KeyboardEvent, sequence: KeySequence): void {
  if (sequence.preventDefault !== false) {
    e.preventDefault();
  }
  sequence.handler();
  lastKeyPressed = null;
}

// Helper function to handle shortcut match
function _handleShortcutMatch(e: KeyboardEvent, shortcut: KeyboardShortcut): void {
  if (shortcut.preventDefault !== false) {
    e.preventDefault();
  }
  shortcut.handler(e);
  lastKeyPressed = null;
}

// Helper function to update sequence state
function updateSequenceState(key: string, isTyping: boolean): boolean {
  if (key === "g" && !isTyping) {
    lastKeyPressed = "g";
    lastKeyTime = Date.now();
    return true;
  }
  return false;
}

// Helper function to check for sequence timeout
function isSequenceActive(now: number): boolean {
  return Boolean(lastKeyPressed && now - lastKeyTime < SEQUENCE_TIMEOUT);
}

// Helper function to reset expired sequences
function resetExpiredSequence(now: number): void {
  if (lastKeyPressed && now - lastKeyTime > SEQUENCE_TIMEOUT) {
    lastKeyPressed = null;
  }
}

/**
 * Enhanced hook for keyboard shortcuts with sequence support (like g+h)
 */
export function useKeyboardShortcutsWithSequences(
  shortcuts: KeyboardShortcut[],
  sequences: KeySequence[] = [],
  enabled = true,
) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = isUserTyping(target);
      const key = e.key.toLowerCase();
      const now = Date.now();

      // Check for sequences (like g+h)
      if (isSequenceActive(now)) {
        const sequence = findMatchingSequence(sequences, lastKeyPressed as string, key);
        if (sequence) {
          handleSequenceMatch(e, sequence);
          return;
        }
      }

      // Update last key for sequences
      if (updateSequenceState(key, isTyping)) {
        return;
      }

      // Check for single key shortcuts
      const matched = processShortcuts(e, shortcuts, isTyping);
      if (matched) {
        lastKeyPressed = null;
        return;
      }

      // Reset sequence if no match
      resetExpiredSequence(now);
    },
    [shortcuts, sequences],
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}

export function getShortcutDisplay(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.meta) parts.push("⌘");
  if (shortcut.ctrl) parts.push("Ctrl");
  if (shortcut.alt) parts.push("Alt");
  if (shortcut.shift) parts.push("Shift");

  parts.push(shortcut.key.toUpperCase());

  return parts.join(" + ");
}

export function getSequenceDisplay(sequence: KeySequence): string {
  return sequence.keys.map((k) => k.toUpperCase()).join(" > ");
}
