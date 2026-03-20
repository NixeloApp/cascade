/**
 * Avatar Component
 *
 * User profile image with fallback initials.
 * Wraps Radix UI Avatar with size variants.
 * Includes AvatarGroup for stacked displays.
 */

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Flex } from "./Flex";
import { Tooltip } from "./Tooltip";

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full transition-shadow duration-fast",
  {
    variants: {
      size: {
        xs: "w-5 h-5",
        sm: "w-6 h-6",
        stackedSm: "w-7 h-7",
        md: "w-8 h-8",
        lg: "w-10 h-10",
        xl: "w-12 h-12",
        xxl: "w-32 h-32",
        profile: "h-20 w-20 sm:h-24 sm:w-24",
      },
      treatment: {
        default: "ring-1 ring-ui-border/50",
        collaborator: "border-2 border-ui-bg",
      },
    },
    defaultVariants: {
      size: "md",
      treatment: "default",
    },
  },
);

const fallbackVariants = cva(
  "flex h-full w-full items-center justify-center rounded-full font-medium transition-colors duration-fast",
  {
    variants: {
      size: {
        xs: "text-xs",
        sm: "text-xs",
        stackedSm: "text-xs",
        md: "text-sm",
        lg: "text-base",
        xl: "text-lg",
        xxl: "text-2xl",
        profile: "text-xl sm:text-2xl",
      },
      variant: {
        brand: "bg-brand/10 text-brand",
        accent: "bg-accent/10 text-accent",
        neutral: "bg-ui-bg-tertiary text-ui-text-secondary",
        success: "bg-status-success/10 text-status-success",
        warning: "bg-status-warning/10 text-status-warning",
        error: "bg-status-error/10 text-status-error",
        soft: "bg-ui-bg-soft text-ui-text-secondary",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "soft",
    },
  },
);

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  /** User's name - used to generate initials */
  name?: string | null;
  /** User's email - fallback for initials if name is missing */
  email?: string | null;
  /** Image URL for the avatar */
  src?: string | null;
  /** Color variant for the background */
  variant?: "brand" | "accent" | "neutral" | "success" | "warning" | "error" | "soft";
  /** Additional CSS classes */
  className?: string;
  /** Alt text for image (defaults to name) */
  alt?: string;
  /** Show brand ring that intensifies on parent hover (use inside group containers) */
  hoverRing?: boolean;
  /** Inline styles for the avatar root */
  style?: React.CSSProperties;
  /** Optional presence indicator shown in the lower-right corner */
  indicator?: boolean;
  /** Background color for the presence indicator */
  indicatorColor?: string;
}

/**
 * Avatar component for displaying user profile images or initials.
 * Built on Radix UI Avatar for accessibility.
 *
 * @example
 * // With initials
 * <Avatar name="John Doe" size="md" />
 *
 * // With image
 * <Avatar name="John Doe" src="/avatar.jpg" size="lg" />
 *
 * // With email fallback
 * <Avatar email="john@example.com" />
 */
export function Avatar({
  name,
  email,
  src,
  size = "md",
  variant = "soft",
  className,
  alt,
  hoverRing = false,
  treatment = "default",
  style,
  indicator = false,
  indicatorColor,
}: AvatarProps) {
  const initials = getInitials(name, email);
  const altText = alt || name || email || "User avatar";

  return (
    <AvatarPrimitive.Root
      className={cn(
        avatarVariants({ size, treatment }),
        hoverRing && "ring-1 ring-brand/20 group-hover:ring-brand/40 transition-all",
        className,
      )}
      style={style}
    >
      {src && (
        <AvatarPrimitive.Image
          src={src}
          alt={altText}
          className="aspect-square h-full w-full object-cover"
        />
      )}
      <AvatarPrimitive.Fallback
        className={cn(fallbackVariants({ size, variant }))}
        delayMs={src ? 600 : 0}
      >
        {initials}
      </AvatarPrimitive.Fallback>
      {indicator && (
        <span
          className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-ui-bg"
          style={indicatorColor ? { backgroundColor: indicatorColor } : undefined}
        />
      )}
    </AvatarPrimitive.Root>
  );
}

/**
 * Get initials from name or email
 */
function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  }

  if (email) {
    return email[0].toUpperCase();
  }

  return "?";
}

/**
 * Avatar group for displaying multiple avatars with overlap
 */
interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  size?: AvatarProps["size"];
  className?: string;
  stackStyle?: "default" | "clean";
  overflowVariant?: "default" | "collaborator";
  overflowTooltipContent?: React.ReactNode;
}

export function AvatarGroup({
  children,
  max,
  size = "md",
  className,
  stackStyle = "default",
  overflowVariant = "default",
  overflowTooltipContent,
}: AvatarGroupProps) {
  const childArray = React.Children.toArray(children);
  const visibleChildren = max ? childArray.slice(0, max) : childArray;
  const overflow = max ? Math.max(0, childArray.length - max) : 0;

  const overlapClasses = {
    xs: "-ml-1.5",
    sm: "-ml-2",
    stackedSm: "-ml-2",
    md: "-ml-2.5",
    lg: "-ml-3",
    xl: "-ml-3.5",
    xxl: "-ml-4",
    profile: "-ml-3.5",
  };

  const overflowNode = (
    <Flex
      align="center"
      justify="center"
      className={cn(
        "rounded-full font-medium ring-2 ring-ui-bg",
        overflowVariant === "default" && "bg-ui-bg-tertiary text-ui-text-secondary",
        overflowVariant === "collaborator" &&
          "border-2 border-ui-bg bg-ui-bg-subtle text-ui-text-secondary",
        overlapClasses[(size as keyof typeof overlapClasses) || "md"],
        size === "xs" && "w-5 h-5 text-xs",
        size === "sm" && "w-6 h-6 text-xs",
        size === "stackedSm" && "w-7 h-7 text-xs",
        size === "md" && "w-8 h-8 text-xs",
        size === "lg" && "w-10 h-10 text-sm",
        size === "xl" && "w-12 h-12 text-sm",
        size === "xxl" && "w-32 h-32 text-base",
        size === "profile" && "h-20 w-20 text-base sm:h-24 sm:w-24 sm:text-lg",
      )}
    >
      +{overflow}
    </Flex>
  );

  return (
    <Flex align="center" className={className}>
      {visibleChildren.map((child, index) => {
        const key = React.isValidElement(child) && child.key ? child.key : `avatar-${index}`;
        return (
          <div
            key={key}
            className={cn(
              "rounded-full",
              stackStyle === "default" && "ring-2 ring-ui-bg",
              index > 0 && overlapClasses[size as keyof typeof overlapClasses],
            )}
          >
            {child}
          </div>
        );
      })}
      {overflow > 0 &&
        (overflowTooltipContent ? (
          <Tooltip content={overflowTooltipContent}>{overflowNode}</Tooltip>
        ) : (
          overflowNode
        ))}
    </Flex>
  );
}
