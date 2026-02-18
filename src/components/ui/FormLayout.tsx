import * as React from "react";
import { cn } from "@/lib/utils";
import { Typography } from "./Typography";

/**
 * Vertical form container with consistent gap spacing.
 *
 * @example
 * <FormLayout>
 *   <Input label="Name" />
 *   <Input label="Email" />
 *   <FormActions>
 *     <Button>Save</Button>
 *   </FormActions>
 * </FormLayout>
 */
export const FormLayout = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-4", className)} {...props} />
  ),
);
FormLayout.displayName = "FormLayout";

export interface FormRowProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 2 | 3 | 4;
}

/**
 * Horizontal row for side-by-side form fields.
 *
 * @example
 * <FormRow cols={2}>
 *   <Input label="First Name" />
 *   <Input label="Last Name" />
 * </FormRow>
 */
export const FormRow = React.forwardRef<HTMLDivElement, FormRowProps>(
  ({ className, cols = 2, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "grid gap-4",
        cols === 2 && "grid-cols-1 sm:grid-cols-2",
        cols === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        cols === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
      {...props}
    />
  ),
);
FormRow.displayName = "FormRow";

/**
 * Right-aligned container for form action buttons.
 *
 * @example
 * <FormActions>
 *   <Button variant="outline">Cancel</Button>
 *   <Button>Save</Button>
 * </FormActions>
 */
export const FormActions = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex justify-end gap-2 pt-4", className)} {...props} />
  ),
);
FormActions.displayName = "FormActions";

export interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

/**
 * Grouped section within a form with optional title/description.
 *
 * @example
 * <FormSection title="Profile" description="Update your personal info">
 *   <Input label="Name" />
 *   <Input label="Bio" />
 * </FormSection>
 */
export const FormSection = React.forwardRef<HTMLDivElement, FormSectionProps>(
  ({ className, title, description, children, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-4", className)} {...props}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <Typography variant="label" className="text-ui-text">
              {title}
            </Typography>
          )}
          {description && (
            <Typography variant="small" className="text-ui-text-tertiary">
              {description}
            </Typography>
          )}
        </div>
      )}
      {children}
    </div>
  ),
);
FormSection.displayName = "FormSection";
