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
const typographyVariants = cva("", {
  variants: {
    variant: {
      // Headings
      h1: "scroll-m-20 text-4xl font-extrabold tracking-tight text-ui-text lg:text-5xl",
      h2: "scroll-m-20 text-3xl font-semibold tracking-tight text-ui-text first:mt-0",
      h3: "scroll-m-20 text-2xl font-semibold tracking-tight text-ui-text",
      h4: "scroll-m-20 text-xl font-semibold tracking-tight text-ui-text",
      h5: "scroll-m-20 text-base font-semibold tracking-tight text-ui-text",

      // Body text
      p: "text-base leading-7 text-ui-text [&:not(:first-child)]:mt-4",
      lead: "text-xl text-ui-text-secondary",
      large: "text-lg font-semibold text-ui-text",
      small: "text-sm text-ui-text",
      muted: "text-sm text-ui-text-tertiary",

      // Semantic variants for common patterns
      meta: "text-xs text-ui-text-tertiary", // timestamps, counts, metadata
      caption: "text-xs text-ui-text-secondary", // descriptions, helper text
      label: "text-sm font-medium text-ui-text", // form labels
      strong: "font-semibold", // inline emphasis, inherits parent size
      listTitle: "text-sm font-medium tracking-tight text-ui-text",
      cardTitle: "text-base font-semibold tracking-tight text-ui-text",
      sidebarOrgInitial: "text-sm font-semibold text-current",
      eyebrow: "text-xs font-semibold uppercase tracking-wider text-ui-text-secondary", // section labels, overlines
      eyebrowWide: "text-xs font-semibold uppercase tracking-widest text-ui-text-tertiary",
      pageHeaderEyebrow:
        "text-xs font-semibold uppercase tracking-[0.18em] text-ui-text-tertiary sm:tracking-[0.22em]",
      authTitle: "text-xl font-semibold tracking-tight text-ui-text",
      authBody: "text-sm text-ui-text-secondary",
      dashboardHeroTitle: "text-4xl font-extrabold tracking-tight text-ui-text md:text-5xl",
      dashboardStatValue: "text-display-sm font-semibold tracking-tight text-ui-text",
      dashboardStatValueStrong: "text-3xl font-extrabold tracking-tight text-ui-text",
      errorCodeDisplay: "text-8xl font-bold tracking-tightest text-ui-text",
      authStatusTitle: "text-xl font-medium text-ui-text",
      landingSectionTitle: "text-4xl font-semibold tracking-tight text-ui-text md:text-5xl",
      landingShowcaseTitle: "text-2xl font-semibold tracking-tight text-ui-text sm:text-3xl",
      landingMetricValue: "text-3xl font-bold tracking-tight text-ui-text sm:text-4xl",
      landingPriceValue: "text-3xl font-bold tracking-tight text-ui-text",
      boardSurfaceTitle: "text-xs font-semibold tracking-tight text-ui-text sm:text-lg",
      boardColumnTitle: "text-sm font-medium tracking-tight text-ui-text-secondary",
      boardColumnTitleCompact:
        "truncate text-xs font-medium tracking-tight text-ui-text-secondary sm:text-sm",
      fieldSectionLabel: "text-sm font-medium uppercase tracking-wide text-ui-text",
      searchTriggerLabel: "hidden truncate text-xs text-ui-text-secondary sm:block sm:text-sm",
      issueKeyMono: "text-sm font-mono tracking-tight text-ui-text-secondary",
      metricLabelWide: "text-xs uppercase tracking-widest text-ui-text-secondary",
      mono: "text-xs font-mono text-ui-text-secondary tracking-tight", // issue keys, codes
      calendarHeaderDate: "text-xs font-medium text-ui-text sm:text-base",
      calendarHeaderTitle: "text-sm font-semibold tracking-tight text-ui-text sm:text-lg",
      calendarHeaderMonth: "text-center text-xs font-semibold text-brand-foreground uppercase",
      calendarHeaderDay: "text-sm font-bold text-ui-text sm:text-lg",
      calendarTimeLabel: "text-xs text-ui-text-secondary",
      calendarEventTitle: "truncate font-bold",
      calendarEventTitleMonth: "w-full truncate text-xs leading-tight font-bold",
      calendarEventTime: "text-sm",
      documentTitle: "-ml-2 px-2 py-1 text-2xl leading-tight sm:text-3xl lg:text-4xl",
      documentTitleInteractive:
        "-ml-2 cursor-pointer rounded px-2 py-1 text-2xl leading-tight transition-default hover:bg-ui-bg-hover sm:text-3xl lg:text-4xl",
      pageHeaderTitle: "text-xl leading-tight text-ui-text sm:text-2xl lg:text-3xl",
      pageHeaderDescription: "max-w-3xl text-xs leading-5 text-ui-text-tertiary sm:text-sm",
      projectHeaderTitle: "truncate text-sm font-semibold tracking-tight text-ui-text sm:text-2xl",
      placeholderTitle: "mb-2 text-lg font-semibold tracking-tight text-ui-text",
      wikiCardTitle: "line-clamp-1 text-2xl font-semibold tracking-tight text-ui-text",
      metricLabel: "text-xs font-medium uppercase tracking-wide text-ui-text-secondary",

      // Special
      blockquote: "mt-6 border-l-2 border-ui-border-secondary pl-6 italic text-ui-text",
      list: "my-6 ml-6 list-disc text-ui-text [&>li]:mt-2",
      inlineCode:
        "relative rounded bg-ui-bg-tertiary px-1.5 py-0.5 font-mono text-sm font-semibold text-ui-text",
    },
    color: {
      auto: "", // Use variant's default color
      default: "text-ui-text",
      secondary: "text-ui-text-secondary",
      tertiary: "text-ui-text-tertiary",
      brand: "text-brand",
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

function mapVariantToTag(variant: TypographyProps["variant"]): React.ElementType {
  switch (variant) {
    case "h1":
    case "dashboardHeroTitle":
    case "errorCodeDisplay":
      return "h1";
    case "h2":
    case "authTitle":
    case "boardSurfaceTitle":
    case "landingSectionTitle":
      return "h2";
    case "h3":
    case "wikiCardTitle":
    case "landingShowcaseTitle":
      return "h3";
    case "h4":
      return "h4";
    case "h5":
      return "h5";
    case "p":
    case "lead":
    case "large":
    case "small":
    case "muted":
    case "meta":
    case "caption":
    case "label":
    case "listTitle":
    case "cardTitle":
    case "eyebrow":
    case "eyebrowWide":
    case "pageHeaderEyebrow":
    case "authBody":
    case "authStatusTitle":
    case "dashboardStatValue":
    case "dashboardStatValueStrong":
    case "landingMetricValue":
    case "landingPriceValue":
    case "boardColumnTitle":
    case "boardColumnTitleCompact":
    case "projectHeaderTitle":
    case "placeholderTitle":
    case "metricLabel":
    case "fieldSectionLabel":
    case "searchTriggerLabel":
    case "issueKeyMono":
    case "metricLabelWide":
      return "p";
    case "mono":
    case "calendarHeaderDate":
    case "calendarHeaderTitle":
    case "calendarHeaderMonth":
    case "calendarHeaderDay":
    case "calendarTimeLabel":
    case "calendarEventTitle":
    case "calendarEventTitleMonth":
    case "calendarEventTime":
    case "sidebarOrgInitial":
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
