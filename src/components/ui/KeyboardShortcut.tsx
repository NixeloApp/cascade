import { cva, type VariantProps } from "class-variance-authority";
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
      {keysWithIds.map(({ key, id }, index) => (
        <span key={id} className="contents">
          <kbd className={cn(keyVariants({ size, variant }))}>{formatKey(key, size ?? "sm")}</kbd>
          {index < keysWithIds.length - 1 && (
            <span className="text-ui-text-tertiary mx-0.5">+</span>
          )}
        </span>
      ))}
    </Flex>
  );
}

/**
 * Format key for display (handle common abbreviations)
 * Returns either a string or a React element (icon)
 */
function formatKey(key: string, size: "sm" | "md"): React.ReactNode {
  const lowerKey = key.toLowerCase();
  const iconSize = size === "sm" ? "xs" : "sm";

  // Keys that use icons
  const iconKeys: Record<string, React.ReactNode> = {
    cmd: <Icon icon={Command} size={iconSize} />,
    command: <Icon icon={Command} size={iconSize} />,
    enter: <Icon icon={CornerDownLeft} size={iconSize} />,
    return: <Icon icon={CornerDownLeft} size={iconSize} />,
    backspace: <Icon icon={Delete} size={iconSize} />,
    up: <Icon icon={ArrowUp} size={iconSize} />,
    down: <Icon icon={ArrowDown} size={iconSize} />,
    left: <Icon icon={ArrowLeft} size={iconSize} />,
    right: <Icon icon={ArrowRight} size={iconSize} />,
  };

  if (iconKeys[lowerKey]) {
    return iconKeys[lowerKey];
  }

  // Keys that use text labels
  const textKeys: Record<string, string> = {
    ctrl: "Ctrl",
    control: "Ctrl",
    alt: "Alt",
    option: "Opt",
    shift: "Shift",
    esc: "Esc",
    escape: "Esc",
    tab: "Tab",
    space: "Space",
    delete: "Del",
  };

  return textKeys[lowerKey] || key;
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
