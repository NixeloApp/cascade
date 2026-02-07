import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@/test/custom-render";
import {
  getSequenceDisplay,
  getShortcutDisplay,
  type KeyboardShortcut,
  type KeySequence,
  useKeyboardShortcuts,
  useKeyboardShortcutsWithSequences,
} from "./useKeyboardShortcuts";

describe("useKeyboardShortcuts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const dispatchKeyEvent = (key: string, options: Partial<KeyboardEvent> = {}) => {
    const event = new KeyboardEvent("keydown", {
      key,
      bubbles: true,
      ...options,
    });
    window.dispatchEvent(event);
    return event;
  };

  describe("Basic Shortcut Handling", () => {
    it("should call handler when shortcut key is pressed", () => {
      const handler = vi.fn();
      const shortcuts: KeyboardShortcut[] = [{ key: "k", handler, description: "Test shortcut" }];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      dispatchKeyEvent("k");

      expect(handler).toHaveBeenCalled();
    });

    it("should not call handler when different key is pressed", () => {
      const handler = vi.fn();
      const shortcuts: KeyboardShortcut[] = [{ key: "k", handler, description: "Test shortcut" }];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      dispatchKeyEvent("j");

      expect(handler).not.toHaveBeenCalled();
    });

    it("should be case insensitive for keys", () => {
      const handler = vi.fn();
      const shortcuts: KeyboardShortcut[] = [{ key: "K", handler, description: "Test shortcut" }];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      dispatchKeyEvent("k");

      expect(handler).toHaveBeenCalled();
    });

    it("should pass KeyboardEvent to handler", () => {
      const handler = vi.fn();
      const shortcuts: KeyboardShortcut[] = [{ key: "k", handler, description: "Test shortcut" }];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      dispatchKeyEvent("k");

      expect(handler).toHaveBeenCalledWith(expect.any(KeyboardEvent));
    });
  });

  describe("Modifier Keys", () => {
    it("should match shortcut with ctrl modifier", () => {
      const handler = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: "k", ctrl: true, handler, description: "Ctrl+K" },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      dispatchKeyEvent("k", { ctrlKey: true });

      expect(handler).toHaveBeenCalled();
    });

    it("should not match when ctrl is required but not pressed", () => {
      const handler = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: "k", ctrl: true, handler, description: "Ctrl+K" },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      dispatchKeyEvent("k", { ctrlKey: false });

      expect(handler).not.toHaveBeenCalled();
    });

    it("should match shortcut with shift modifier", () => {
      const handler = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: "k", shift: true, handler, description: "Shift+K" },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      dispatchKeyEvent("k", { shiftKey: true });

      expect(handler).toHaveBeenCalled();
    });

    it("should match shortcut with alt modifier", () => {
      const handler = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: "k", alt: true, handler, description: "Alt+K" },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      dispatchKeyEvent("k", { altKey: true });

      expect(handler).toHaveBeenCalled();
    });

    it("should match shortcut with meta modifier", () => {
      const handler = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: "k", meta: true, handler, description: "Meta+K" },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      dispatchKeyEvent("k", { metaKey: true });

      expect(handler).toHaveBeenCalled();
    });

    it("should match shortcut with multiple modifiers", () => {
      const handler = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: "k", ctrl: true, shift: true, handler, description: "Ctrl+Shift+K" },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      dispatchKeyEvent("k", { ctrlKey: true, shiftKey: true });

      expect(handler).toHaveBeenCalled();
    });

    it("should not match when extra modifier is pressed", () => {
      const handler = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: "k", ctrl: true, handler, description: "Ctrl+K" },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      // Pressing ctrl+shift+k when only ctrl+k is expected
      dispatchKeyEvent("k", { ctrlKey: true, shiftKey: true });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("Enabled State", () => {
    it("should not trigger shortcuts when disabled", () => {
      const handler = vi.fn();
      const shortcuts: KeyboardShortcut[] = [{ key: "k", handler, description: "Test shortcut" }];

      renderHook(() => useKeyboardShortcuts(shortcuts, false));

      dispatchKeyEvent("k");

      expect(handler).not.toHaveBeenCalled();
    });

    it("should trigger shortcuts when enabled", () => {
      const handler = vi.fn();
      const shortcuts: KeyboardShortcut[] = [{ key: "k", handler, description: "Test shortcut" }];

      renderHook(() => useKeyboardShortcuts(shortcuts, true));

      dispatchKeyEvent("k");

      expect(handler).toHaveBeenCalled();
    });
  });

  describe("Multiple Shortcuts", () => {
    it("should handle multiple shortcuts", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: "k", handler: handler1, description: "K" },
        { key: "j", handler: handler2, description: "J" },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      dispatchKeyEvent("k");
      expect(handler1).toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();

      dispatchKeyEvent("j");
      expect(handler2).toHaveBeenCalled();
    });
  });

  describe("Cleanup", () => {
    it("should remove event listener on unmount", () => {
      const handler = vi.fn();
      const shortcuts: KeyboardShortcut[] = [{ key: "k", handler, description: "Test shortcut" }];

      const { unmount } = renderHook(() => useKeyboardShortcuts(shortcuts));

      unmount();

      dispatchKeyEvent("k");

      expect(handler).not.toHaveBeenCalled();
    });
  });
});

describe("useKeyboardShortcutsWithSequences", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const dispatchKeyEvent = (key: string, options: Partial<KeyboardEvent> = {}) => {
    const event = new KeyboardEvent("keydown", {
      key,
      bubbles: true,
      ...options,
    });
    window.dispatchEvent(event);
    return event;
  };

  describe("Single Key Shortcuts", () => {
    it("should handle single key shortcuts like basic hook", () => {
      const handler = vi.fn();
      const shortcuts: KeyboardShortcut[] = [{ key: "k", handler, description: "K" }];

      renderHook(() => useKeyboardShortcutsWithSequences(shortcuts, []));

      dispatchKeyEvent("k");

      expect(handler).toHaveBeenCalled();
    });
  });

  describe("Key Sequences", () => {
    it("should handle g+h sequence", () => {
      const handler = vi.fn();
      const sequences: KeySequence[] = [{ keys: ["g", "h"], handler, description: "Go home" }];

      renderHook(() => useKeyboardShortcutsWithSequences([], sequences));

      // Press 'g' then 'h' quickly
      dispatchKeyEvent("g");
      vi.advanceTimersByTime(100);
      dispatchKeyEvent("h");

      expect(handler).toHaveBeenCalled();
    });

    it("should not trigger sequence when timeout exceeds", () => {
      const handler = vi.fn();
      const sequences: KeySequence[] = [{ keys: ["g", "h"], handler, description: "Go home" }];

      renderHook(() => useKeyboardShortcutsWithSequences([], sequences));

      // Press 'g' then wait too long before 'h'
      dispatchKeyEvent("g");
      vi.advanceTimersByTime(1500); // More than SEQUENCE_TIMEOUT (1000ms)
      dispatchKeyEvent("h");

      expect(handler).not.toHaveBeenCalled();
    });

    it("should not trigger sequence with wrong second key", () => {
      const handler = vi.fn();
      const sequences: KeySequence[] = [{ keys: ["g", "h"], handler, description: "Go home" }];

      renderHook(() => useKeyboardShortcutsWithSequences([], sequences));

      // Press 'g' then 'k' (wrong second key)
      dispatchKeyEvent("g");
      vi.advanceTimersByTime(100);
      dispatchKeyEvent("k");

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("Enabled State", () => {
    it("should not trigger when disabled", () => {
      const handler = vi.fn();
      const shortcuts: KeyboardShortcut[] = [{ key: "k", handler, description: "K" }];

      renderHook(() => useKeyboardShortcutsWithSequences(shortcuts, [], false));

      dispatchKeyEvent("k");

      expect(handler).not.toHaveBeenCalled();
    });
  });
});

describe("getShortcutDisplay", () => {
  it("should display single key", () => {
    const shortcut: KeyboardShortcut = {
      key: "k",
      handler: vi.fn(),
      description: "K",
    };

    expect(getShortcutDisplay(shortcut)).toBe("K");
  });

  it("should display Ctrl + key", () => {
    const shortcut: KeyboardShortcut = {
      key: "k",
      ctrl: true,
      handler: vi.fn(),
      description: "Ctrl+K",
    };

    expect(getShortcutDisplay(shortcut)).toBe("Ctrl + K");
  });

  it("should display Shift + key", () => {
    const shortcut: KeyboardShortcut = {
      key: "k",
      shift: true,
      handler: vi.fn(),
      description: "Shift+K",
    };

    expect(getShortcutDisplay(shortcut)).toBe("Shift + K");
  });

  it("should display Alt + key", () => {
    const shortcut: KeyboardShortcut = {
      key: "k",
      alt: true,
      handler: vi.fn(),
      description: "Alt+K",
    };

    expect(getShortcutDisplay(shortcut)).toBe("Alt + K");
  });

  it("should display Meta + key", () => {
    const shortcut: KeyboardShortcut = {
      key: "k",
      meta: true,
      handler: vi.fn(),
      description: "Meta+K",
    };

    expect(getShortcutDisplay(shortcut)).toBe("⌘ + K");
  });

  it("should display multiple modifiers in correct order", () => {
    const shortcut: KeyboardShortcut = {
      key: "k",
      meta: true,
      ctrl: true,
      alt: true,
      shift: true,
      handler: vi.fn(),
      description: "All modifiers",
    };

    expect(getShortcutDisplay(shortcut)).toBe("⌘ + Ctrl + Alt + Shift + K");
  });
});

describe("getSequenceDisplay", () => {
  it("should display sequence with separators", () => {
    const sequence: KeySequence = {
      keys: ["g", "h"],
      handler: vi.fn(),
      description: "Go home",
    };

    expect(getSequenceDisplay(sequence)).toBe("G > H");
  });

  it("should display single key sequence", () => {
    const sequence: KeySequence = {
      keys: ["g"],
      handler: vi.fn(),
      description: "G",
    };

    expect(getSequenceDisplay(sequence)).toBe("G");
  });

  it("should display three key sequence", () => {
    const sequence: KeySequence = {
      keys: ["g", "i", "t"],
      handler: vi.fn(),
      description: "Git",
    };

    expect(getSequenceDisplay(sequence)).toBe("G > I > T");
  });
});
