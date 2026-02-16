import type { ReactNode } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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

export function PageLayout({
  children,
  maxWidth = "full",
  fullHeight = false,
  className,
}: PageLayoutProps): ReactNode {
  return (
    <ErrorBoundary>
      <div
        className={cn(
          "p-6 bg-ui-bg animate-fade-in",
          maxWidthClasses[maxWidth],
          fullHeight && "h-full overflow-y-auto",
          className,
        )}
      >
        {children}
      </div>
    </ErrorBoundary>
  );
}
