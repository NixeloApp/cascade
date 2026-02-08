import * as React from "react";
import { createContext, useContext } from "react";
import { cn } from "@/lib/utils";

/**
 * Metadata - Display inline metadata with automatic separators.
 *
 * Replaces the span soup pattern:
 * ```tsx
 * // Before (bad)
 * <Flex gap="sm">
 *   <Typography variant="meta" as="span">by {name}</Typography>
 *   <Typography variant="meta" as="span">•</Typography>
 *   <Typography variant="meta" as="span">3h ago</Typography>
 * </Flex>
 *
 * // After (good)
 * <Metadata>
 *   <MetadataItem>by {name}</MetadataItem>
 *   <MetadataTimestamp date={createdAt} />
 * </Metadata>
 * ```
 *
 * @see docs/DESIGN_PATTERNS.md
 */

// --- Context ---

interface MetadataContextValue {
  size: "xs" | "sm";
  separator: string;
}

const MetadataContext = createContext<MetadataContextValue>({
  size: "xs",
  separator: "•",
});

function useMetadataContext() {
  return useContext(MetadataContext);
}

// --- Metadata (container) ---

export interface MetadataProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Text size: "xs" (default) or "sm" */
  size?: "xs" | "sm";
  /** Separator between items: "•" (default), "|", or custom string */
  separator?: string;
  /** Gap between items */
  gap?: "xs" | "sm" | "md";
}

export function Metadata({
  size = "xs",
  separator = "•",
  gap = "sm",
  className,
  children,
  ...props
}: MetadataProps) {
  const gapClass = {
    xs: "gap-1",
    sm: "gap-1.5",
    md: "gap-2",
  }[gap];

  // Filter out null/undefined children and interleave separators
  const validChildren = React.Children.toArray(children).filter(Boolean);
  const childrenWithSeparators = validChildren.flatMap((child, index) => {
    if (index === 0) return [child];
    // biome-ignore lint/suspicious/noArrayIndexKey: index is stable relative to children
    return [<MetadataSeparator key={`sep-${index}`}>{separator}</MetadataSeparator>, child];
  });

  return (
    <MetadataContext.Provider value={{ size, separator }}>
      <div className={cn("flex items-center flex-wrap", gapClass, className)} {...props}>
        {childrenWithSeparators}
      </div>
    </MetadataContext.Provider>
  );
}

// --- MetadataItem ---

export interface MetadataItemProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Hide below this breakpoint */
  hideBelow?: "sm" | "md" | "lg";
  /** Icon to show before text */
  icon?: React.ReactNode;
}

export function MetadataItem({
  hideBelow,
  icon,
  className,
  children,
  ...props
}: MetadataItemProps) {
  const { size } = useMetadataContext();

  const sizeClass = size === "xs" ? "text-xs" : "text-sm";
  const hideClass = hideBelow
    ? {
        sm: "hidden sm:inline-flex",
        md: "hidden md:inline-flex",
        lg: "hidden lg:inline-flex",
      }[hideBelow]
    : "";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-ui-text-tertiary",
        sizeClass,
        hideClass,
        className,
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

// --- MetadataTimestamp ---

export interface MetadataTimestampProps
  extends Omit<React.TimeHTMLAttributes<HTMLTimeElement>, "dateTime"> {
  /** Date to display (Date object, timestamp, or ISO string) */
  date: Date | number | string;
  /** Format: "relative" (default) or "absolute" */
  format?: "relative" | "absolute";
  /** Hide below this breakpoint */
  hideBelow?: "sm" | "md" | "lg";
}

export function MetadataTimestamp({
  date,
  format = "relative",
  hideBelow,
  className,
  ...props
}: MetadataTimestampProps) {
  const { size } = useMetadataContext();

  let dateObj: Date;
  try {
    dateObj = date instanceof Date ? date : new Date(date);
    // Check if date is valid
    if (Number.isNaN(dateObj.getTime())) {
      throw new Error("Invalid date");
    }
  } catch (_e) {
    // Render fallback for invalid dates
    return (
      <span className={cn("text-ui-text-tertiary", size === "xs" ? "text-xs" : "text-sm")}>
        Invalid date
      </span>
    );
  }

  const isoString = dateObj.toISOString();
  const displayText =
    format === "relative" ? formatRelativeTime(dateObj) : formatAbsoluteTime(dateObj);

  const sizeClass = size === "xs" ? "text-xs" : "text-sm";
  const hideClass = hideBelow
    ? {
        sm: "hidden sm:inline",
        md: "hidden md:inline",
        lg: "hidden lg:inline",
      }[hideBelow]
    : "";

  return (
    <time
      dateTime={isoString}
      className={cn("text-ui-text-tertiary", sizeClass, hideClass, className)}
      title={dateObj.toLocaleString()}
      {...props}
    >
      {displayText}
    </time>
  );
}

// --- MetadataSeparator (internal) ---

function MetadataSeparator({ children }: { children: React.ReactNode }) {
  const { size } = useMetadataContext();
  const sizeClass = size === "xs" ? "text-xs" : "text-sm";

  return (
    <span className={cn("text-ui-text-quaternary select-none", sizeClass)} aria-hidden="true">
      {children}
    </span>
  );
}

// --- Helpers ---

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return formatAbsoluteTime(date);
}

function formatAbsoluteTime(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}
