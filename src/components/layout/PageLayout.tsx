import { cva } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MaxWidth = "sm" | "md" | "lg" | "xl" | "2xl" | "full";

const pageLayoutVariants = cva("mx-auto w-full animate-fade-in px-4 py-5 sm:px-6 sm:py-6 lg:px-8", {
  variants: {
    maxWidth: {
      sm: "max-w-3xl",
      md: "max-w-4xl",
      lg: "max-w-6xl",
      xl: "max-w-7xl",
      "2xl": "max-w-screen-2xl",
      full: "max-w-full",
    },
    fullHeight: {
      true: "h-full overflow-y-auto",
      false: "",
    },
  },
  defaultVariants: {
    maxWidth: "full",
    fullHeight: false,
  },
});

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
  maxWidth?: MaxWidth;
  fullHeight?: boolean;
}

/** Standard page layout container with max-width and padding. */
export function PageLayout({
  children,
  className,
  maxWidth = "full",
  fullHeight = false,
}: PageLayoutProps): ReactNode {
  return (
    <div className={cn(pageLayoutVariants({ maxWidth, fullHeight }), className)}>{children}</div>
  );
}
