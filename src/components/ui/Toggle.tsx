/**
 * Toggle Component
 *
 * Boolean switch control with size variants.
 * Supports keyboard navigation and accessibility labels.
 * Includes ToggleField variant with built-in label.
 */

import { cn } from "@/lib/utils";
import { Flex } from "./Flex";

interface ToggleProps {
  /**
   * Whether the toggle is checked/on
   */
  checked: boolean;

  /**
   * Called when the toggle state changes
   */
  onChange: (checked: boolean) => void;

  /**
   * Whether the toggle is disabled
   */
  disabled?: boolean;

  /**
   * Size variant
   */
  size?: "sm" | "md" | "lg";

  /**
   * Label for accessibility
   */
  "aria-label"?: string;

  /**
   * ID for the input (useful for label association)
   */
  id?: string;

  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * Toggle/Switch component for boolean settings
 *
 * @example
 * // Basic usage
 * <Toggle checked={enabled} onChange={setEnabled} />
 *
 * // With label
 * <label className="flex items-center gap-3">
 *   <Toggle checked={enabled} onChange={setEnabled} />
 *   <span>Enable notifications</span>
 * </label>
 *
 * // Disabled state
 * <Toggle checked={enabled} onChange={setEnabled} disabled />
 */
export function Toggle({
  checked,
  onChange,
  disabled = false,
  size = "md",
  "aria-label": ariaLabel,
  id,
  className = "",
}: ToggleProps) {
  const sizeClasses = {
    sm: {
      track: "w-8 h-4",
      thumb: "h-3 w-3",
      translate: "translate-x-4",
      offset: "top-0.5 start-0.5",
    },
    md: {
      track: "w-11 h-6",
      thumb: "h-5 w-5",
      translate: "translate-x-5",
      offset: "top-0.5 start-0.5",
    },
    lg: {
      track: "w-14 h-7",
      thumb: "h-6 w-6",
      translate: "translate-x-7",
      offset: "top-0.5 start-0.5",
    },
  };

  const sizes = sizeClasses[size];

  return (
    <label
      className={cn(
        "relative inline-flex items-center cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
        aria-label={ariaLabel}
      />
      <div
        className={cn(
          // Base styles
          "rounded-full peer transition-default",
          // Ultra-subtle border
          "border border-ui-border-subtle",
          // Focus ring
          "peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-ring/20",
          // Track background - transparent default, brand on checked
          checked ? "bg-brand" : "bg-ui-bg-soft",
          // Hover state
          !checked && !disabled && "hover:bg-ui-bg-hover",
          // Thumb pseudo-element with smooth transition
          "after:content-[''] after:absolute after:rounded-full after:transition-default",
          "after:bg-ui-bg",
          "after:shadow-sm",
          // Size-specific
          sizes.track,
          sizes.offset,
          `after:${sizes.thumb}`,
          // Checked state thumb position
          checked ? `after:${sizes.translate}` : "after:translate-x-0",
          // RTL support
          "rtl:peer-checked:after:-translate-x-full",
        )}
      />
    </label>
  );
}

/**
 * Toggle with built-in label layout
 */
interface ToggleFieldProps extends ToggleProps {
  /**
   * Label text
   */
  label: string;

  /**
   * Description text below the label
   */
  description?: string;

  /**
   * Label position relative to toggle
   */
  labelPosition?: "left" | "right";
}

export function ToggleField({
  label,
  description,
  labelPosition = "left",
  className = "",
  ...toggleProps
}: ToggleFieldProps) {
  const labelContent = (
    <div className={cn("flex-1", labelPosition === "right" && "order-2")}>
      <div className="font-medium text-ui-text">{label}</div>
      {description && <div className="text-sm text-ui-text-secondary mt-1">{description}</div>}
    </div>
  );

  return (
    <Flex align="start" justify="between" gap="lg" className={className}>
      {labelPosition === "left" && labelContent}
      <Toggle {...toggleProps} className={labelPosition === "right" ? "order-1" : ""} />
      {labelPosition === "right" && labelContent}
    </Flex>
  );
}
