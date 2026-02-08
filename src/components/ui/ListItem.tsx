import type * as React from "react";
import { createContext, useContext } from "react";
import { cn } from "@/lib/utils";

/**
 * ListItem - Structured list item with semantic slots.
 *
 * Supports two patterns:
 *
 * 1. Props-as-slots (Stripe style, for simple cases):
 * ```tsx
 * <ListItem
 *   icon={<FileIcon />}
 *   title="Document.pdf"
 *   subtitle="Uploaded yesterday"
 *   meta="2.4 MB"
 * />
 * ```
 *
 * 2. Compound children (for complex cases):
 * ```tsx
 * <ListItem>
 *   <ListItemIcon><FileIcon /></ListItemIcon>
 *   <ListItemContent>
 *     <ListItemTitle>Document.pdf</ListItemTitle>
 *     <ListItemSubtitle>Uploaded yesterday</ListItemSubtitle>
 *   </ListItemContent>
 *   <ListItemMeta>2.4 MB</ListItemMeta>
 * </ListItem>
 * ```
 *
 * @see docs/DESIGN_PATTERNS.md
 */

// --- Context ---

interface ListItemContextValue {
  size: "sm" | "md";
  interactive: boolean;
}

const ListItemContext = createContext<ListItemContextValue>({
  size: "md",
  interactive: false,
});

function useListItemContext() {
  return useContext(ListItemContext);
}

// --- ListItem (container) ---

export interface ListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Size variant */
  size?: "sm" | "md";
  /** Show hover state */
  interactive?: boolean;
  /** Selected state */
  selected?: boolean;
  /** Disabled state */
  disabled?: boolean;

  // Props-as-slots (Stripe pattern)
  /** Icon element */
  icon?: React.ReactNode;
  /** Primary text */
  title?: React.ReactNode;
  /** Secondary text */
  subtitle?: React.ReactNode;
  /** Right-aligned metadata */
  meta?: React.ReactNode;
  /** Whether title should use mono font */
  titleMono?: boolean;
  /** Truncate title */
  truncateTitle?: boolean;
}

export function ListItem({
  size = "md",
  interactive = false,
  selected = false,
  disabled = false,
  icon,
  title,
  subtitle,
  meta,
  titleMono = false,
  truncateTitle = false,
  className,
  children,
  ...props
}: ListItemProps) {
  const hasSlotProps = icon || title || subtitle || meta;

  const paddingClass = size === "sm" ? "px-2 py-1.5" : "px-3 py-2";

  return (
    <ListItemContext.Provider value={{ size, interactive }}>
      <div
        className={cn(
          "flex items-center gap-3",
          paddingClass,
          interactive && "cursor-pointer hover:bg-ui-bg-hover transition-colors",
          selected && "bg-ui-bg-secondary",
          disabled && "opacity-50 pointer-events-none",
          className,
        )}
        {...props}
      >
        {hasSlotProps ? (
          <>
            {icon && <ListItemIcon>{icon}</ListItemIcon>}
            <ListItemContent>
              {title && (
                <ListItemTitle mono={titleMono} truncate={truncateTitle}>
                  {title}
                </ListItemTitle>
              )}
              {subtitle && <ListItemSubtitle>{subtitle}</ListItemSubtitle>}
            </ListItemContent>
            {meta && <ListItemMeta>{meta}</ListItemMeta>}
          </>
        ) : (
          children
        )}
      </div>
    </ListItemContext.Provider>
  );
}

// --- ListItemIcon ---

export interface ListItemIconProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ListItemIcon({ className, children, ...props }: ListItemIconProps) {
  const { size } = useListItemContext();
  const sizeClass = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  return (
    <div
      className={cn(
        "shrink-0 flex items-center justify-center text-ui-text-secondary",
        sizeClass,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// --- ListItemContent ---

export interface ListItemContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ListItemContent({ className, children, ...props }: ListItemContentProps) {
  return (
    <div className={cn("flex-1 min-w-0 flex flex-col", className)} {...props}>
      {children}
    </div>
  );
}

// --- ListItemTitle ---

export interface ListItemTitleProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Use monospace font */
  mono?: boolean;
  /** Truncate with ellipsis */
  truncate?: boolean;
}

export function ListItemTitle({
  mono = false,
  truncate = false,
  className,
  children,
  ...props
}: ListItemTitleProps) {
  const { size } = useListItemContext();
  const sizeClass = size === "sm" ? "text-sm" : "text-sm";

  return (
    <span
      className={cn(
        "text-ui-text",
        sizeClass,
        mono && "font-mono text-ui-text-secondary",
        truncate && "truncate",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// --- ListItemSubtitle ---

export interface ListItemSubtitleProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Truncate with ellipsis */
  truncate?: boolean;
}

export function ListItemSubtitle({
  truncate = false,
  className,
  children,
  ...props
}: ListItemSubtitleProps) {
  const { size } = useListItemContext();
  const sizeClass = size === "sm" ? "text-xs" : "text-xs";

  return (
    <span
      className={cn("text-ui-text-secondary", sizeClass, truncate && "truncate", className)}
      {...props}
    >
      {children}
    </span>
  );
}

// --- ListItemMeta ---

export interface ListItemMetaProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ListItemMeta({ className, children, ...props }: ListItemMetaProps) {
  const { size } = useListItemContext();
  const sizeClass = size === "sm" ? "text-xs" : "text-xs";

  return (
    <div className={cn("shrink-0 text-ui-text-tertiary", sizeClass, className)} {...props}>
      {children}
    </div>
  );
}

// --- ListItemActions ---

export interface ListItemActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Show only on hover (requires interactive parent) */
  showOnHover?: boolean;
}

export function ListItemActions({
  showOnHover = false,
  className,
  children,
  ...props
}: ListItemActionsProps) {
  return (
    <div
      className={cn(
        "shrink-0 flex items-center gap-1",
        showOnHover && "opacity-0 group-hover:opacity-100 transition-opacity",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
