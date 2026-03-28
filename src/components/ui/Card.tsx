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
import { type CardRecipe, getCardRecipeClassName } from "./cardSurfaceClassNames";
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
      /** Lightweight surface with no gradient or shadow. */
      subtle: "bg-ui-bg-secondary/50 border-ui-border-secondary/80",
      /** Low-emphasis flat surface. Use as a standalone Card, not nested inside another Card. */
      section:
        "bg-linear-to-b from-ui-bg-elevated/98 via-ui-bg-secondary/88 to-ui-bg-soft/78 border-ui-border-secondary/80 shadow-soft",
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

type CardVariantOptions = VariantProps<typeof cardVariants>;

function getCardVariantClassName(options: CardVariantOptions) {
  return cardVariants(options);
}

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  recipe?: CardRecipe;
}

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
          recipe ? getCardRecipeClassName(recipe) : undefined,
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
  title?: string;
  description?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, description, badge, action, children, ...props }, ref) => {
    // Support both structured props and children
    if (children) {
      if (action) {
        return (
          <Flex
            ref={ref}
            align="start"
            justify="between"
            gap="md"
            className={cn("p-6", className)}
            {...props}
          >
            <div className="min-w-0 flex-1">{children}</div>
            <Flex className="shrink-0">{action}</Flex>
          </Flex>
        );
      }

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
        <Flex direction="column" gap="xs" className="min-w-0 flex-1">
          {title || badge ? (
            <Flex align="center" gap="sm" wrap className="min-w-0">
              {title ? (
                <Typography variant="h4" as="h3" className="text-lg font-semibold">
                  {title}
                </Typography>
              ) : null}
              {badge}
            </Flex>
          ) : null}
          {description && (
            <Typography variant="muted" className="text-sm">
              {description}
            </Typography>
          )}
        </Flex>
        {action && <Flex className="shrink-0">{action}</Flex>}
      </Flex>
    );
  },
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  Omit<React.HTMLAttributes<HTMLHeadingElement>, "color">
>(({ className, children, ...props }, ref) => (
  <Typography
    ref={ref}
    as="h3"
    variant="h4"
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  >
    {children}
  </Typography>
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  Omit<React.HTMLAttributes<HTMLParagraphElement>, "color">
>(({ className, children, ...props }, ref) => (
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

export type { CardRecipe };
export {
  Card,
  CardBody,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cardVariants,
  getCardRecipeClassName,
  getCardVariantClassName,
};
