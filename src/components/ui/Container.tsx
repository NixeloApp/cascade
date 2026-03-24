import type * as React from "react";
import { cn } from "@/lib/utils";

export type ContainerSize = "sm" | "md" | "5xl" | "lg" | "xl" | "2xl" | "full";
export type ContainerPadding = "none" | "page" | "section" | "sectionCompact";

const sizeClasses: Record<ContainerSize, string> = {
  sm: "max-w-3xl",
  md: "max-w-4xl",
  "5xl": "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  "2xl": "max-w-screen-2xl",
  full: "max-w-full",
};

const paddingClasses: Record<ContainerPadding, string> = {
  none: "",
  page: "px-4 py-5 sm:px-6 sm:py-6 lg:px-8",
  section: "px-6 pt-24 pb-24",
  sectionCompact: "px-6 pt-20 pb-4",
};

export interface ContainerProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  size?: ContainerSize;
  centered?: boolean;
  padding?: ContainerPadding;
}

/** Shared width-constrained wrapper for section and shell content. */
export function Container({
  as: Component = "div",
  size = "full",
  centered = true,
  padding = "none",
  className,
  children,
  ...props
}: ContainerProps) {
  return (
    <Component
      className={cn(centered && "mx-auto", sizeClasses[size], paddingClasses[padding], className)}
      {...props}
    >
      {children}
    </Component>
  );
}
