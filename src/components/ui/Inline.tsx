import * as React from "react";
import { cn } from "@/lib/utils";

export interface InlineProps extends React.HTMLAttributes<HTMLSpanElement> {}

export const Inline = React.forwardRef<HTMLSpanElement, InlineProps>(
  ({ className, ...props }, ref) => <span ref={ref} className={cn(className)} {...props} />,
);

Inline.displayName = "Inline";
