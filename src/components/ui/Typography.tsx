/**
 * Typography Component
 *
 * Semantic text rendering with variant-based styling.
 * Supports headings, body text, captions, and labels.
 * Use as prop to override the underlying HTML element.
 */

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Typography component with semantic variants.
 *
 * NOTE: This component is being phased out for inline text. Use:
 * - `<Metadata>` for timestamps, counts, author info
 * - `<ListItem>` for list item content
 * - `<UserDisplay>` for avatar + name patterns
 *
 * See docs/DESIGN_PATTERNS.md for migration guide.
 *
 * **Keep using Typography for:**
 * - h1-h5: Headings with proper hierarchy
 * - p: Body text with paragraph spacing
 * - blockquote: Quoted text with left border
 *
 * Use `as` prop to override the HTML element when needed.
 * Use `color` prop to override the variant's default color.
 */
export const TYPOGRAPHY_VARIANTS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "p",
  "small",
  "muted",
  "meta",
  "caption",
  "label",
  "strong",
  "eyebrow",
  "eyebrowWide",
  "mono",
  "blockquote",
  "list",
  "inlineCode",
] as const;

type TypographyVariant = (typeof TYPOGRAPHY_VARIANTS)[number];

const typographyVariantClasses = {
  h1: "scroll-m-20 text-4xl font-extrabold tracking-tight text-ui-text lg:text-5xl",
  h2: "scroll-m-20 text-3xl font-semibold tracking-tight text-ui-text first:mt-0",
  h3: "scroll-m-20 text-2xl font-semibold tracking-tight text-ui-text",
  h4: "scroll-m-20 text-xl font-semibold tracking-tight text-ui-text",
  h5: "scroll-m-20 text-base font-semibold tracking-tight text-ui-text",
  p: "text-base leading-7 text-ui-text [&:not(:first-child)]:mt-4",
  small: "text-sm text-ui-text",
  muted: "text-sm text-ui-text-tertiary",
  meta: "text-xs text-ui-text-tertiary",
  caption: "text-xs text-ui-text-secondary",
  label: "text-sm font-medium text-ui-text",
  strong: "font-semibold",
  eyebrow: "text-xs font-semibold uppercase tracking-wider text-ui-text-secondary",
  eyebrowWide: "text-xs font-semibold uppercase tracking-widest text-ui-text-tertiary",
  mono: "text-xs font-mono tracking-tight text-ui-text-secondary",
  blockquote: "mt-6 border-l-2 border-ui-border-secondary pl-6 italic text-ui-text",
  list: "my-6 ml-6 list-disc text-ui-text [&>li]:mt-2",
  inlineCode:
    "relative rounded bg-ui-bg-tertiary px-1.5 py-0.5 font-mono text-sm font-semibold text-ui-text",
} satisfies Record<TypographyVariant, string>;

const typographyVariants = cva("", {
  variants: {
    variant: typographyVariantClasses,
    color: {
      auto: "", // Use variant's default color
      default: "text-ui-text",
      secondary: "text-ui-text-secondary",
      tertiary: "text-ui-text-tertiary",
      brand: "text-brand",
      brandActive: "text-brand-active",
      error: "text-status-error",
      success: "text-status-success",
      warning: "text-status-warning",
      info: "text-status-info",
      accent: "text-accent",
    },
  },
  defaultVariants: {
    variant: "p",
    color: "auto",
  },
});

export interface TypographyProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "color">,
    VariantProps<typeof typographyVariants> {
  /** Override the default HTML element */
  as?: React.ElementType;
  /** For label elements */
  htmlFor?: string;
  /** For time elements */
  dateTime?: string;
}

type TextWrapperProps = Omit<TypographyProps, "variant">;

export const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant, color, as, ...props }, ref) => {
    const Component = as || mapVariantToTag(variant);

    return (
      <Component
        ref={ref}
        className={cn(typographyVariants({ variant, color }), className)}
        {...props}
      />
    );
  },
);
Typography.displayName = "Typography";

export const LeadText = React.forwardRef<HTMLElement, TextWrapperProps>(
  ({ className, color = "secondary", ...props }, ref) => (
    <Typography
      ref={ref}
      variant="p"
      color={color}
      className={cn("text-xl", className)}
      {...props}
    />
  ),
);
LeadText.displayName = "LeadText";

export const LargeText = React.forwardRef<HTMLElement, TextWrapperProps>(
  ({ className, ...props }, ref) => (
    <Typography
      ref={ref}
      variant="label"
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  ),
);
LargeText.displayName = "LargeText";

export const PageTitleText = React.forwardRef<HTMLElement, TextWrapperProps>(
  ({ className, ...props }, ref) => (
    <Typography
      ref={ref}
      variant="h2"
      className={cn("text-xl leading-tight sm:text-2xl lg:text-3xl", className)}
      {...props}
    />
  ),
);
PageTitleText.displayName = "PageTitleText";

export const SectionTitleText = React.forwardRef<HTMLElement, TextWrapperProps>(
  ({ className, ...props }, ref) => (
    <Typography
      ref={ref}
      variant="h3"
      className={cn("text-2xl sm:text-3xl", className)}
      {...props}
    />
  ),
);
SectionTitleText.displayName = "SectionTitleText";

export const DocumentTitleText = React.forwardRef<HTMLElement, TextWrapperProps>(
  ({ className, ...props }, ref) => (
    <Typography
      ref={ref}
      variant="h2"
      className={cn("text-2xl leading-tight sm:text-3xl lg:text-4xl", className)}
      {...props}
    />
  ),
);
DocumentTitleText.displayName = "DocumentTitleText";

export const MetricText = React.forwardRef<
  HTMLElement,
  TextWrapperProps & { responsive?: boolean; heavy?: "bold" | "extrabold" }
>(({ className, responsive = false, heavy = "extrabold", ...props }, ref) => (
  <Typography
    ref={ref}
    variant="p"
    className={cn(
      "tracking-tight text-ui-text",
      heavy === "bold" ? "font-bold" : "font-extrabold",
      responsive ? "text-3xl sm:text-4xl" : "text-3xl",
      className,
    )}
    {...props}
  />
));
MetricText.displayName = "MetricText";

export const ErrorCodeText = React.forwardRef<HTMLElement, TextWrapperProps>(
  ({ className, ...props }, ref) => (
    <Typography
      ref={ref}
      variant="h1"
      className={cn("text-8xl font-bold tracking-tightest", className)}
      {...props}
    />
  ),
);
ErrorCodeText.displayName = "ErrorCodeText";

export const MonoText = React.forwardRef<HTMLElement, TextWrapperProps & { size?: "xs" | "sm" }>(
  ({ className, size = "xs", ...props }, ref) => (
    <Typography
      ref={ref}
      variant="mono"
      className={cn(size === "sm" && "text-sm", className)}
      {...props}
    />
  ),
);
MonoText.displayName = "MonoText";

function mapVariantToTag(variant: TypographyProps["variant"]): React.ElementType {
  switch (variant) {
    case "h1":
      return "h1";
    case "h2":
      return "h2";
    case "h3":
      return "h3";
    case "h4":
      return "h4";
    case "h5":
      return "h5";
    case "small":
    case "muted":
    case "meta":
    case "caption":
    case "label":
    case "eyebrow":
    case "eyebrowWide":
    case "p":
      return "p";
    case "mono":
    case "strong":
      return "span";
    case "blockquote":
      return "blockquote";
    case "list":
      return "ul";
    case "inlineCode":
      return "code";
    default:
      return "p";
  }
}
