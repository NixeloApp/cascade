import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MaxWidth = "sm" | "md" | "lg" | "xl" | "2xl" | "full";

const maxWidthClasses: Record<MaxWidth, string> = {
  sm: "max-w-3xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  "2xl": "max-w-screen-2xl",
  full: "max-w-full",
};

interface PageLayoutProps {
  children: ReactNode;
  maxWidth?: MaxWidth;
  fullHeight?: boolean;
  className?: string;
}

/** Standard page layout container with max-width and padding. */
export function PageLayout({
  children,
  maxWidth = "full",
  fullHeight = false,
  className,
}: PageLayoutProps): ReactNode {
  return (
    <div
      className={cn(
        "mx-auto w-full animate-fade-in px-4 py-5 sm:px-6 sm:py-6 lg:px-8",
        maxWidthClasses[maxWidth],
        fullHeight && "h-full overflow-y-auto",
        className,
      )}
    >
      {children}
    </div>
  );
}
