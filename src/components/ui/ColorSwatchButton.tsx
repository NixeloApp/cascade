import { Check } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { Typography } from "./Typography";

interface ColorSwatchButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  color?: string;
  selected?: boolean;
  empty?: boolean;
  checkColor?: string;
}

export function ColorSwatchButton({
  color,
  selected = false,
  empty = false,
  checkColor,
  children,
  className,
  style,
  ...props
}: ColorSwatchButtonProps) {
  return (
    <Button
      type="button"
      variant="unstyled"
      chrome="colorSwatch"
      chromeSize="colorSwatch"
      className={cn(className)}
      style={{
        backgroundColor: color || "transparent",
        borderColor: color || undefined,
        borderStyle: empty ? "dashed" : undefined,
        boxShadow: selected
          ? "0 0 0 2px var(--color-brand), 0 0 0 3px var(--color-ui-bg)"
          : undefined,
        ...style,
      }}
      {...props}
    >
      {selected ? (
        <Icon icon={Check} size="xs" style={{ color: checkColor }} />
      ) : empty ? (
        children || (
          <Typography variant="caption" color="tertiary">
            ×
          </Typography>
        )
      ) : null}
    </Button>
  );
}
