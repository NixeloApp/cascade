import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Flex } from "./Flex";
import { Typography } from "./Typography";

const cardVariants = cva(
  "bg-ui-bg rounded-lg border border-ui-border shadow-card transition-[border-color,box-shadow] duration-[var(--duration-default)]",
  {
    variants: {
      hoverable: {
        true: "hover:border-ui-border-secondary hover:shadow-card-hover cursor-pointer",
        false: "",
      },
      variant: {
        default: "",
        soft: "bg-ui-bg-soft",
        flat: "shadow-none",
      },
    },
    defaultVariants: {
      hoverable: false,
      variant: "default",
    },
  },
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  hoverable?: boolean;
  variant?: "default" | "soft" | "flat";
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
  ({ className, hoverable = false, variant = "default", onClick, children, ...props }, ref) => {
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
        className={cn(cardVariants({ hoverable, variant }), className)}
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
  ({ className, children, ...props }, ref) => (
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
