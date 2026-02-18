import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Typography } from "./Typography";

const sectionVariants = cva("", {
  variants: {
    gap: {
      none: "",
      xs: "space-y-1",
      sm: "space-y-2",
      md: "space-y-4",
      lg: "space-y-6",
      xl: "space-y-8",
    },
    padding: {
      none: "",
      xs: "p-2",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
      xl: "p-8",
    },
  },
  defaultVariants: {
    gap: "md",
    padding: "none",
  },
});

export interface SectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants> {
  title?: string;
  description?: string;
}

/**
 * Content section with optional title and description.
 * Replaces `<div className="space-y-4">` with heading pattern.
 *
 * @example
 * <Section title="Settings" description="Manage your preferences">
 *   <Input label="Name" />
 *   <Input label="Email" />
 * </Section>
 */
export const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, gap, padding, title, description, children, ...props }, ref) => (
    <section ref={ref} className={cn(sectionVariants({ gap, padding }), className)} {...props}>
      {(title || description) && (
        <div className="space-y-1">
          {title && <Typography variant="h4">{title}</Typography>}
          {description && <Typography variant="muted">{description}</Typography>}
        </div>
      )}
      {children}
    </section>
  ),
);
Section.displayName = "Section";

export { sectionVariants };
