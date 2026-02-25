import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as React from "react";
import { Check } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Flex } from "./Flex";
import { Typography } from "./Typography";

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  /** Label text for the checkbox */
  label?: string;
  /** Description text below the label */
  description?: string;
}

/**
 * Checkbox component built on Radix UI for accessibility.
 *
 * @example
 * // Basic checkbox
 * <Checkbox />
 *
 * // With label
 * <Checkbox label="Accept terms" />
 *
 * // With label and description
 * <Checkbox
 *   label="Email notifications"
 *   description="Receive emails about your account"
 * />
 *
 * // Controlled
 * <Checkbox checked={isChecked} onCheckedChange={setIsChecked} />
 */
const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  ({ className, label, description, id, disabled, ...props }, ref) => {
    const generatedId = React.useId();
    const checkboxId = id || generatedId;
    const descriptionId = `${checkboxId}-description`;

    const hasLabel = !!(label || description);

    const ariaDescribedBy = [props["aria-describedby"], description ? descriptionId : undefined]
      .filter(Boolean)
      .join(" ");

    const checkboxElement = (
      <CheckboxPrimitive.Root
        ref={ref}
        id={checkboxId}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded border border-ui-border-secondary bg-ui-bg transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-brand data-[state=checked]:border-brand data-[state=checked]:text-brand-foreground",
          className,
        )}
        disabled={disabled}
        {...props}
        aria-describedby={ariaDescribedBy || undefined}
      >
        <CheckboxPrimitive.Indicator
          className={cn("flex items-center justify-center text-current")}
        >
          <Check className="h-3 w-3" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    );

    if (!hasLabel) {
      return checkboxElement;
    }

    return (
      <Flex align="start" gap="md">
        {checkboxElement}
        <div className={cn("grid gap-1 leading-none", disabled && "cursor-not-allowed opacity-70")}>
          {label && (
            <label
              htmlFor={checkboxId}
              className={cn(
                "text-sm font-medium text-ui-text cursor-pointer",
                disabled && "cursor-not-allowed",
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <Typography variant="muted" className="text-sm" id={descriptionId}>
              {description}
            </Typography>
          )}
        </div>
      </Flex>
    );
  },
);
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
