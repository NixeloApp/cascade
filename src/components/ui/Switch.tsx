import * as SwitchPrimitives from "@radix-ui/react-switch";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Flex } from "./Flex";
import { Label } from "./Label";

export interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  /** Label text for the switch */
  label?: React.ReactNode;
  /** Description text */
  description?: React.ReactNode;
  /** Side where the label should appear. Defaults to "right" */
  labelSide?: "left" | "right";
}

const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, SwitchProps>(
  ({ className, label, description, labelSide = "right", id, disabled, ...props }, ref) => {
    const generatedId = React.useId();
    const switchId = id || generatedId;
    const descriptionId = `${switchId}-description`;
    const hasLabel = !!(label || description);

    // Combine aria-describedby from props with our generated descriptionId
    const ariaDescribedBy = [props["aria-describedby"], description ? descriptionId : undefined]
      .filter(Boolean)
      .join(" ");

    const switchElement = (
      <SwitchPrimitives.Root
        className={cn(
          "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-ui-border transition-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ui-bg disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-transparent data-[state=checked]:bg-brand data-[state=unchecked]:bg-ui-bg-tertiary",
          !hasLabel && className,
        )}
        id={switchId}
        disabled={disabled}
        {...props}
        aria-describedby={ariaDescribedBy || undefined}
        ref={ref}
      >
        <SwitchPrimitives.Thumb
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-brand-foreground shadow-lg ring-0 transition-default data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
          )}
        />
      </SwitchPrimitives.Root>
    );

    if (!hasLabel) {
      return switchElement;
    }

    const labelElement = (
      <div
        className={cn(
          "grid gap-1 leading-none",
          labelSide === "left" && "text-left",
          disabled && "opacity-70 cursor-not-allowed",
        )}
      >
        {label && (
          <Label
            htmlFor={switchId}
            className={cn("cursor-pointer", disabled && "cursor-not-allowed")}
          >
            {label}
          </Label>
        )}
        {description && (
          <div id={descriptionId} className="text-sm text-ui-text-secondary">
            {description}
          </div>
        )}
      </div>
    );

    return (
      <Flex
        className={className}
        align="center"
        justify={labelSide === "left" ? "between" : "start"}
        gap={labelSide === "right" ? "md" : undefined}
      >
        {labelSide === "left" && labelElement}
        {switchElement}
        {labelSide === "right" && labelElement}
      </Flex>
    );
  },
);
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
