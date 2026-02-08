import type * as React from "react";
import { cn } from "@/lib/utils";
import { Avatar, type AvatarProps } from "./Avatar";

/**
 * UserDisplay - Display user with avatar, name, and optional metadata.
 *
 * Replaces the repeated pattern:
 * ```tsx
 * // Before (bad)
 * <Flex align="center" gap="md">
 *   <Avatar src={user.image} name={user.name} />
 *   <div>
 *     <Typography variant="label" as="span">{user.name}</Typography>
 *     <Typography variant="meta" as="span">{user.role}</Typography>
 *   </div>
 * </Flex>
 *
 * // After (good)
 * <UserDisplay
 *   name={user.name}
 *   image={user.image}
 *   subtitle={user.role}
 * />
 * ```
 *
 * @see docs/DESIGN_PATTERNS.md
 */

// --- Types ---

export interface UserDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  /** User's name (required) */
  name: string;
  /** User's avatar image URL */
  image?: string | null;
  /** User's email (used for avatar fallback) */
  email?: string | null;
  /** Secondary text below name (role, title, etc.) */
  subtitle?: React.ReactNode;
  /** Right-aligned metadata or timestamp */
  meta?: React.ReactNode;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Avatar size override */
  avatarSize?: AvatarProps["size"];
  /** Interactive hover state */
  interactive?: boolean;
  /** Hide avatar */
  hideAvatar?: boolean;
  /** Layout direction */
  direction?: "horizontal" | "vertical";
}

const sizeConfig = {
  sm: {
    gap: "gap-2",
    nameClass: "text-sm",
    subtitleClass: "text-xs",
    defaultAvatarSize: "sm" as const,
  },
  md: {
    gap: "gap-3",
    nameClass: "text-sm font-medium",
    subtitleClass: "text-xs",
    defaultAvatarSize: "md" as const,
  },
  lg: {
    gap: "gap-3",
    nameClass: "text-base font-medium",
    subtitleClass: "text-sm",
    defaultAvatarSize: "lg" as const,
  },
};

export function UserDisplay({
  name,
  image,
  email,
  subtitle,
  meta,
  size = "md",
  avatarSize,
  interactive = false,
  hideAvatar = false,
  direction = "horizontal",
  className,
  ...props
}: UserDisplayProps) {
  const config = sizeConfig[size];
  const resolvedAvatarSize = avatarSize || config.defaultAvatarSize;

  return (
    <div
      className={cn(
        "flex items-center",
        config.gap,
        direction === "vertical" && "flex-col items-start",
        interactive && "cursor-pointer hover:bg-ui-bg-hover rounded-md transition-colors",
        className,
      )}
      {...props}
    >
      {!hideAvatar && <Avatar name={name} email={email} src={image} size={resolvedAvatarSize} />}

      <div
        className={cn(
          "flex flex-col min-w-0",
          direction === "vertical" && "items-center text-center",
        )}
      >
        <span className={cn("text-ui-text truncate", config.nameClass)}>{name}</span>
        {subtitle && (
          <span className={cn("text-ui-text-secondary truncate", config.subtitleClass)}>
            {subtitle}
          </span>
        )}
      </div>

      {meta && <div className="shrink-0 ml-auto text-ui-text-tertiary text-xs">{meta}</div>}
    </div>
  );
}

// --- Compact variant for inline mentions ---

export interface UserMentionProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** User's name */
  name: string;
  /** Show avatar inline */
  showAvatar?: boolean;
  /** User's avatar image URL */
  image?: string | null;
}

export function UserMention({
  name,
  showAvatar = false,
  image,
  className,
  ...props
}: UserMentionProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 font-medium text-ui-text", className)}
      {...props}
    >
      {showAvatar && <Avatar name={name} src={image} size="xs" className="inline-block" />}
      {name}
    </span>
  );
}
