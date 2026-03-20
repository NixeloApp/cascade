import type * as React from "react";
import { cn } from "@/lib/utils";

type ContainerSize = "md" | "lg" | "xl" | "full";

const sizeClasses: Record<ContainerSize, string> = {
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-full",
};

interface ContainerProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  size?: ContainerSize;
  centered?: boolean;
}

/** Shared width-constrained wrapper for section and shell content. */
export function Container({
  as: Component = "div",
  size = "full",
  centered = true,
  className,
  children,
  ...props
}: ContainerProps) {
  return (
    <Component className={cn(centered && "mx-auto", sizeClasses[size], className)} {...props}>
      {children}
    </Component>
  );
}
