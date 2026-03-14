/**
 * Keyboard shortcut hooks backed by TanStack Hotkeys parsing/matching.
 *
 * Keeps the existing app-facing shortcut config shape while replacing the
 * hand-rolled modifier matching with TanStack's hotkey parser.
 */

import { matchesKeyboardEvent, type ParsedHotkey, parseHotkey } from "@tanstack/hotkeys";
import { useEffect } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: (e: KeyboardEvent) => void;
  description: string;
  global?: boolean;
  preventDefault?: boolean;
}

export interface KeySequence {
  keys: string[];
  description: string;
  handler: () => void;
  preventDefault?: boolean;
}

let lastKeyPressed: string | null = null;
let lastKeyTime = 0;
const SEQUENCE_TIMEOUT = 1000;
const SEQUENCE_PREFIX_KEY = "g";

function isUserTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

function normalizeShortcutKey(key: string, shift?: boolean): string {
  if (key === "?" && shift) {
    return "/";
  }

  if (key.length === 1) {
    return key.toUpperCase();
  }

  return key;
}

function toHotkeyString(
  shortcut: Pick<KeyboardShortcut, "key" | "ctrl" | "shift" | "alt" | "meta">,
): string {
  const parts: string[] = [];

  if (shortcut.ctrl) {
    parts.push("Control");
  }
  if (shortcut.alt) {
    parts.push("Alt");
  }
  if (shortcut.shift) {
    parts.push("Shift");
  }
  if (shortcut.meta) {
    parts.push("Meta");
  }

  parts.push(normalizeShortcutKey(shortcut.key, shortcut.shift));

  return parts.join("+");
}

function parseShortcut(shortcut: KeyboardShortcut): ParsedHotkey {
  return parseHotkey(toHotkeyString(shortcut));
}

function parseSequenceKey(key: string): ParsedHotkey {
  return parseHotkey(normalizeShortcutKey(key));
}

function processShortcuts(
  event: KeyboardEvent,
  shortcuts: Array<{ definition: KeyboardShortcut; parsed: ParsedHotkey }>,
  isTyping: boolean,
): boolean {
  for (const shortcut of shortcuts) {
    if (isTyping && !shortcut.definition.global) {
      continue;
    }

    if (matchesKeyboardEvent(event, shortcut.parsed)) {
      if (shortcut.definition.preventDefault !== false) {
        event.preventDefault();
      }
      shortcut.definition.handler(event);
      return true;
    }
  }

  return false;
}

/** Hook for registering global keyboard shortcuts with modifier key support. */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const parsedShortcuts = shortcuts.map((shortcut) => ({
      definition: shortcut,
      parsed: parseShortcut(shortcut),
    }));

    const handleKeyDown = (event: KeyboardEvent) => {
      const isTyping = isUserTyping(event.target);
      processShortcuts(event, parsedShortcuts, isTyping);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, shortcuts]);
}

function findMatchingSequence(
  sequences: Array<{ definition: KeySequence; parsed: ParsedHotkey[] }>,
  previousKey: string,
  currentEvent: KeyboardEvent,
): KeySequence | undefined {
  return sequences.find(({ definition, parsed }) => {
    if (parsed.length !== 2 || definition.keys[0]?.toLowerCase() !== previousKey) {
      return false;
    }

    const second = parsed[1];
    return second ? matchesKeyboardEvent(currentEvent, second) : false;
  })?.definition;
}

function tryHandleSequenceMatch(
  event: KeyboardEvent,
  sequences: Array<{ definition: KeySequence; parsed: ParsedHotkey[] }>,
  now: number,
): boolean {
  if (!lastKeyPressed || now - lastKeyTime >= SEQUENCE_TIMEOUT) {
    return false;
  }

  const sequence = findMatchingSequence(sequences, lastKeyPressed, event);
  if (!sequence) {
    return false;
  }

  if (sequence.preventDefault !== false) {
    event.preventDefault();
  }
  sequence.handler();
  lastKeyPressed = null;
  return true;
}

function shouldStartSequence(key: string, isTyping: boolean): boolean {
  return key === SEQUENCE_PREFIX_KEY && !isTyping;
}

function startSequence(now: number): void {
  lastKeyPressed = SEQUENCE_PREFIX_KEY;
  lastKeyTime = now;
}

function clearExpiredSequence(now: number): void {
  if (lastKeyPressed && now - lastKeyTime > SEQUENCE_TIMEOUT) {
    lastKeyPressed = null;
  }
}

/**
 * Enhanced hook for keyboard shortcuts with sequence support (like g+h).
 */
export function useKeyboardShortcutsWithSequences(
  shortcuts: KeyboardShortcut[],
  sequences: KeySequence[] = [],
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const parsedShortcuts = shortcuts.map((shortcut) => ({
      definition: shortcut,
      parsed: parseShortcut(shortcut),
    }));

    const parsedSequences = sequences.map((sequence) => ({
      definition: sequence,
      parsed: sequence.keys.map((sequenceKey) => parseSequenceKey(sequenceKey)),
    }));

    const handleKeyDown = (event: KeyboardEvent) => {
      const isTyping = isUserTyping(event.target);
      const key = event.key.toLowerCase();
      const now = Date.now();

      if (tryHandleSequenceMatch(event, parsedSequences, now)) {
        return;
      }

      if (shouldStartSequence(key, isTyping)) {
        startSequence(now);
        return;
      }

      if (processShortcuts(event, parsedShortcuts, isTyping)) {
        lastKeyPressed = null;
        return;
      }

      clearExpiredSequence(now);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, shortcuts, sequences]);
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
  return sequence.keys.map((key) => key.toUpperCase()).join(" > ");
}
