/**
 * Card Component
 *
 * Container with elevation and padding variants.
 * Includes CardHeader, CardContent, and CardFooter slots.
 * Use for grouping related content in a visual container.
 */

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Flex } from "./Flex";
import { Typography } from "./Typography";

const cardVariants = cva("border transition-default", {
  variants: {
    variant: {
      default:
        "bg-linear-to-br from-ui-bg-elevated via-ui-bg-elevated/98 to-ui-bg-soft/76 border-ui-border-secondary/90 shadow-card",
      elevated:
        "bg-linear-to-br from-ui-bg-elevated via-ui-bg-elevated/98 to-ui-bg-soft/70 border-ui-border-secondary shadow-elevated",
      soft: "bg-linear-to-b from-ui-bg-soft/94 via-ui-bg-elevated/96 to-ui-bg-secondary/78 border-ui-border-secondary/85 shadow-card",
      interactive:
        "bg-ui-bg-elevated border-ui-border-secondary/90 shadow-card hover:bg-ui-bg-hover hover:border-ui-border-secondary hover:shadow-card-hover cursor-pointer",
      outline:
        "bg-linear-to-b from-ui-bg-elevated via-ui-bg-elevated/98 to-ui-bg-soft/72 border-ui-border-secondary/90 shadow-soft",
      ghost: "bg-transparent border-transparent",
      flat: "bg-linear-to-b from-ui-bg-elevated/98 via-ui-bg-secondary/88 to-ui-bg-soft/78 border-ui-border-secondary/80 shadow-soft",
    },
    padding: {
      none: "",
      xs: "p-2",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
      xl: "p-8",
    },
    radius: {
      none: "rounded-none",
      sm: "rounded",
      md: "rounded-lg",
      lg: "rounded-container",
      full: "rounded-2xl",
    },
    hoverable: {
      true: "hover:bg-ui-bg-hover hover:border-ui-border-secondary hover:shadow-card-hover cursor-pointer",
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    padding: "none",
    radius: "lg",
    hoverable: false,
  },
});

const cardRecipeVariants = cva("", {
  variants: {
    recipe: {
      // Modal/overlay surfaces
      overlayInset:
        "rounded-2xl border-ui-border-secondary/70 bg-linear-to-b from-ui-bg-soft/80 via-ui-bg-elevated/96 to-ui-bg-secondary/84 shadow-soft",
      commandSection:
        "rounded-2xl border-ui-border-secondary/60 bg-linear-to-b from-ui-bg-soft/70 to-ui-bg-elevated/94 shadow-soft",
      commandIntro:
        "rounded-2xl border-ui-border/70 bg-linear-to-br from-brand-subtle/70 via-ui-bg-soft to-ui-bg-secondary/85 shadow-soft",

      // Page layout surfaces
      pageHeader:
        "rounded-2xl border-ui-border-secondary/82 bg-linear-to-r from-ui-bg-elevated/98 via-ui-bg-elevated/96 to-ui-bg-soft/82 shadow-card sm:rounded-3xl",
      filterBar:
        "rounded-md border-ui-border-secondary/75 bg-linear-to-r from-ui-bg-elevated/98 via-ui-bg-elevated/94 to-ui-bg-soft/92 shadow-card sm:rounded-2xl",
      timelineItem:
        "rounded-lg border-transparent bg-transparent shadow-none hover:border-transparent hover:bg-ui-bg-secondary/30 hover:shadow-none",
      timeSummary:
        "rounded-xl border-brand-border bg-linear-to-r from-brand-subtle/85 via-brand-subtle/70 to-ui-bg-elevated/96 shadow-none",
      optionTile:
        "rounded-2xl border-ui-border-secondary/80 bg-linear-to-b from-ui-bg-elevated via-ui-bg-elevated/96 to-ui-bg-soft/84 shadow-soft",
      optionTileSelected:
        "rounded-2xl border-brand-border bg-linear-to-b from-brand-subtle/85 via-ui-bg-elevated/98 to-ui-bg-soft/86 shadow-card",

      // Landing/showcase surfaces
      showcaseShell:
        "relative overflow-hidden rounded-3xl border-ui-border-secondary/80 bg-linear-to-b from-ui-bg-elevated via-ui-bg-elevated/98 to-ui-bg-soft/80 shadow-elevated",
      showcasePanel:
        "rounded-2xl border-ui-border-secondary/75 bg-linear-to-b from-ui-bg-elevated via-ui-bg-elevated/96 to-ui-bg-soft/82 shadow-card",
      showcasePanelQuiet:
        "rounded-2xl border-ui-border-secondary/65 bg-linear-to-b from-ui-bg-elevated/94 via-ui-bg-soft/90 to-ui-bg-secondary/76 shadow-soft",
      metricTile:
        "rounded-2xl border-ui-border-secondary/75 bg-linear-to-b from-ui-bg-elevated via-ui-bg-elevated/94 to-ui-bg-soft/78 shadow-card",

      // Header control surfaces
      controlRail:
        "rounded-full border-ui-border-secondary/70 bg-linear-to-r from-ui-bg-elevated/96 via-ui-bg-elevated/94 to-ui-bg-soft/90 shadow-card backdrop-blur-xl",
      controlStrip:
        "rounded-full border-ui-border-secondary/70 bg-ui-bg-elevated/94 shadow-soft backdrop-blur-sm",
    },
  },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants>,
    VariantProps<typeof cardRecipeVariants> {}

/**
 * Card container component for grouping related content.
 *
 * @example
 * // Basic card
 * <Card>Content here</Card>
 *
 * // Hoverable clickable card
 * <Card hoverable onClick={() => {}}>Clickable</Card>
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      hoverable = false,
      variant = "default",
      recipe,
      padding,
      radius,
      onClick,
      children,
      ...props
    },
    ref,
  ) => {
    const interactiveProps = onClick
      ? {
          role: "button" as const,
          tabIndex: 0,
          onClick,
          onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
            }
          },
        }
      : {};

    const resolvedVariant = recipe ? "ghost" : variant;

    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ hoverable, variant: resolvedVariant, padding, radius }),
          cardRecipeVariants({ recipe }),
          className,
        )}
        {...interactiveProps}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Card.displayName = "Card";

export interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, description, action, children, ...props }, ref) => {
    // Support both structured props and children
    if (children) {
      return (
        <Flex ref={ref} direction="column" gap="xs" className={cn("p-6", className)} {...props}>
          {children}
        </Flex>
      );
    }

    return (
      <Flex
        ref={ref}
        align="center"
        justify="between"
        className={cn("p-4 border-b border-ui-border", className)}
        {...props}
      >
        <Flex direction="column" gap="xs">
          {title && (
            <Typography variant="h4" as="h3" className="text-lg font-semibold">
              {title}
            </Typography>
          )}
          {description && (
            <Typography variant="muted" className="text-sm">
              {description}
            </Typography>
          )}
        </Flex>
        {action && <Flex>{action}</Flex>}
      </Flex>
    );
  },
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, color: _color, ...props }, ref) => (
    <Typography
      ref={ref}
      as="h3"
      variant="h4"
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    >
      {children}
    </Typography>
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, color: _color, ...props }, ref) => (
  <Typography ref={ref} variant="muted" className={cn("text-sm", className)} {...props}>
    {children}
  </Typography>
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

// Alias for backward compatibility
const CardBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-4", className)} {...props} />,
);
CardBody.displayName = "CardBody";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <Flex ref={ref} align="center" className={cn("p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardBody,
  CardFooter,
  cardVariants,
  cardRecipeVariants,
};
