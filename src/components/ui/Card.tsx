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
        "bg-linear-to-b from-ui-bg via-ui-bg-elevated/98 to-ui-bg-secondary/50 border-ui-border-secondary/85 shadow-card",
      elevated:
        "bg-linear-to-b from-ui-bg via-ui-bg-elevated to-ui-bg-secondary/38 border-ui-border-secondary shadow-elevated",
      soft: "bg-linear-to-b from-ui-bg-soft/96 via-ui-bg-elevated/94 to-ui-bg-secondary/84 border-ui-border-secondary/80 shadow-soft",
      interactive:
        "bg-ui-bg-elevated border-ui-border-secondary/85 shadow-card hover:bg-ui-bg-hover hover:border-ui-border-secondary hover:shadow-card-hover cursor-pointer",
      outline:
        "bg-linear-to-b from-ui-bg-elevated via-ui-bg-elevated to-ui-bg-secondary/70 border-ui-border-secondary/90 shadow-card",
      ghost: "bg-transparent border-transparent",
      flat: "bg-linear-to-b from-ui-bg/98 via-ui-bg-secondary/90 to-ui-bg-secondary/78 border-ui-border-secondary/75 shadow-soft",
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

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

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

    return (
      <div
        ref={ref}
        className={cn(cardVariants({ hoverable, variant, padding, radius }), className)}
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
};
