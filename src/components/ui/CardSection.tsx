/**
 * CardSection
 *
 * Lightweight inner surface for use inside a Card.
 * Use for stat cells, form groups, list items, toggle rows, and other
 * content blocks that need subtle visual separation within a Card.
 *
 * Card = outer container. CardSection = inner grouping. Never nest Cards.
 */

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const cardSectionVariants = cva(
  "rounded-lg border border-ui-border-secondary/70 bg-ui-bg-soft/90",
  {
    variants: {
      size: {
        default: "p-3",
        compact: "px-3 py-2",
        md: "p-4",
        lg: "p-6",
        xl: "p-8",
      },
      hoverable: {
        true: "cursor-pointer hover:bg-ui-bg-hover transition-default",
        false: "",
      },
    },
    defaultVariants: {
      size: "default",
      hoverable: false,
    },
  },
);

export interface CardSectionProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardSectionVariants> {}

export const CardSection = React.forwardRef<HTMLDivElement, CardSectionProps>(
  ({ className, size, hoverable, ...props }, ref) => (
    <div ref={ref} className={cn(cardSectionVariants({ size, hoverable }), className)} {...props} />
  ),
);

CardSection.displayName = "CardSection";
