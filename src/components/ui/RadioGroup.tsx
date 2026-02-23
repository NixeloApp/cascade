import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Flex } from "./Flex";
import { Typography } from "./Typography";

export interface RadioGroupProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> {}

/**
 * RadioGroup component built on Radix UI for accessibility.
 * Mintlify-inspired styling with subtle borders and smooth transitions.
 *
 * @example
 * <RadioGroup defaultValue="option1">
 *   <RadioGroupItem value="option1" label="Option 1" />
 *   <RadioGroupItem value="option2" label="Option 2" />
 * </RadioGroup>
 */
const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(({ className, ...props }, ref) => {
  return <RadioGroupPrimitive.Root className={cn("grid gap-2", className)} {...props} ref={ref} />;
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

export interface RadioGroupItemProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  /** Label text for the radio item */
  label?: string;
  /** Description text below the label */
  description?: string;
}

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className, label, description, id, ...props }, ref) => {
  const generatedId = React.useId();
  const radioId = id || generatedId;

  const hasLabel = !!(label || description);

  const radioElement = (
    <RadioGroupPrimitive.Item
      ref={ref}
      id={radioId}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-full border border-ui-border-secondary bg-ui-bg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-brand data-[state=checked]:bg-brand",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-foreground" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );

  if (!hasLabel) {
    return radioElement;
  }

  return (
    <Flex align="start" gap="md">
      {radioElement}
      <div className="grid gap-1 leading-none">
        {label && (
          <label
            htmlFor={radioId}
            className="text-sm font-medium text-ui-text cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        )}
        {description && (
          <Typography variant="muted" className="text-sm">
            {description}
          </Typography>
        )}
      </div>
    </Flex>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
