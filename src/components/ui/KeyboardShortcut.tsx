import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import type * as React from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Command,
  CornerDownLeft,
  Delete,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Flex } from "./Flex";
import { Icon } from "./Icon";

const keyVariants = cva("inline-flex items-center justify-center font-mono rounded", {
  variants: {
    size: {
      sm: "text-xs px-1.5 py-0.5 min-w-5",
      md: "text-sm px-2 py-1 min-w-6",
    },
    variant: {
      default: "bg-ui-bg border border-ui-border text-ui-text shadow-sm",
      subtle: "bg-ui-bg-secondary text-ui-text-secondary",
    },
  },
  defaultVariants: {
    size: "sm",
    variant: "default",
  },
});

interface KeyboardShortcutProps extends VariantProps<typeof keyVariants> {
  /**
   * The keyboard shortcut to display
   * Can be a single key or multiple keys separated by +
   * Examples: "Ctrl+K", "⌘+Shift+P", "Enter"
   */
  shortcut: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * KeyboardShortcut component for displaying keyboard shortcuts
 *
 * @example
 * // Single key
 * <KeyboardShortcut shortcut="Enter" />
 *
 * // Multiple keys
 * <KeyboardShortcut shortcut="Ctrl+K" />
 *
 * // With modifier symbols
 * <KeyboardShortcut shortcut="⌘+Shift+P" />
 */
export function KeyboardShortcut({
  shortcut,
  size = "sm",
  variant = "default",
  className,
}: KeyboardShortcutProps) {
  const keys = shortcut.split("+").map((key) => key.trim());

  // Create keys with unique identifiers for stable rendering
  const keysWithIds = keys.map((key, idx) => ({
    key,
    id: `${shortcut.replace(/\+/g, "-")}-${idx}`,
  }));

  return (
    <Flex as="span" inline align="center" gap="xs" className={className}>
      {keysWithIds.map(({ key, id }, index) => {
        const { content, label } = getKeyData(key, size ?? "sm");
        return (
          <span key={id} className="contents">
            <kbd className={cn(keyVariants({ size, variant }))} aria-label={label} title={label}>
              {content}
            </kbd>
            {index < keysWithIds.length - 1 && (
              <span aria-hidden="true" className="text-ui-text-tertiary mx-0.5">
                +
              </span>
            )}
          </span>
        );
      })}
    </Flex>
  );
}

/**
 * Format key for display (handle common abbreviations)
 * Returns content (icon or text) and label for screen readers
 */
function getKeyData(key: string, size: "sm" | "md"): { content: React.ReactNode; label: string } {
  const lowerKey = key.toLowerCase();
  const iconSize = size === "sm" ? "xs" : "sm";

  // Keys that use icons
  const iconKeys: Record<string, { icon: LucideIcon; label: string }> = {
    cmd: { icon: Command, label: "Command" },
    command: { icon: Command, label: "Command" },
    enter: { icon: CornerDownLeft, label: "Enter" },
    return: { icon: CornerDownLeft, label: "Enter" },
    backspace: { icon: Delete, label: "Backspace" },
    up: { icon: ArrowUp, label: "Up Arrow" },
    down: { icon: ArrowDown, label: "Down Arrow" },
    left: { icon: ArrowLeft, label: "Left Arrow" },
    right: { icon: ArrowRight, label: "Right Arrow" },
  };

  if (iconKeys[lowerKey]) {
    const { icon: IconComponent, label } = iconKeys[lowerKey];
    return {
      content: <Icon icon={IconComponent} size={iconSize} aria-hidden="true" />,
      label,
    };
  }

  // Keys that use text labels
  const textKeys: Record<string, { display: string; label: string }> = {
    ctrl: { display: "Ctrl", label: "Control" },
    control: { display: "Ctrl", label: "Control" },
    alt: { display: "Alt", label: "Alt" },
    option: { display: "Opt", label: "Option" },
    shift: { display: "Shift", label: "Shift" },
    esc: { display: "Esc", label: "Escape" },
    escape: { display: "Esc", label: "Escape" },
    tab: { display: "Tab", label: "Tab" },
    space: { display: "Space", label: "Space" },
    delete: { display: "Del", label: "Delete" },
  };

  if (textKeys[lowerKey]) {
    return {
      content: textKeys[lowerKey].display,
      label: textKeys[lowerKey].label,
    };
  }

  return {
    content: key,
    label: key,
  };
}

/**
 * Convenience component for displaying a list of shortcuts
 */
interface ShortcutListProps {
  shortcuts: Array<{
    keys: string;
    description: string;
  }>;
  className?: string;
}

export function ShortcutList({ shortcuts, className = "" }: ShortcutListProps) {
  return (
    <Flex direction="column" gap="sm" className={className}>
      {shortcuts.map((shortcut) => (
        <Flex key={shortcut.keys} align="center" justify="between" gap="lg" className="text-sm">
          <span className="text-ui-text-secondary">{shortcut.description}</span>
          <KeyboardShortcut shortcut={shortcut.keys} />
        </Flex>
      ))}
    </Flex>
  );
}

/**
 * ShortcutHint - Keyboard shortcut with inline description.
 *
 * Replaces the pattern:
 * ```tsx
 * // Before (bad)
 * <span>
 *   <kbd className="...">Navigate</kbd>
 * </span>
 *
 * // After (good)
 * <ShortcutHint keys="up+down">Navigate</ShortcutHint>
 * ```
 */
interface ShortcutHintProps {
  /** The keyboard keys to display */
  keys: string;
  /** Description text */
  children: React.ReactNode;
  /** Size variant */
  size?: "sm" | "md";
  /** Visual variant */
  variant?: "default" | "subtle";
  /** Additional CSS classes */
  className?: string;
}

export { keyVariants };

export function ShortcutHint({
  keys,
  children,
  size = "sm",
  variant = "subtle",
  className = "",
}: ShortcutHintProps) {
  return (
    <Flex as="span" inline align="center" gap="xs" className={className}>
      <KeyboardShortcut shortcut={keys} size={size} variant={variant} />
      <span>{children}</span>
    </Flex>
  );
}
