import { cn } from "@/lib/utils";

/**
 * ResponsiveText - Show different text at different breakpoints.
 *
 * Replaces the span soup pattern:
 * ```tsx
 * // Before (bad)
 * <span className="sm:hidden">W</span>
 * <span className="hidden sm:inline">Week</span>
 *
 * // After (good)
 * <ResponsiveText short="W" long="Week" />
 * ```
 */

export interface ResponsiveTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Text shown on small screens (below breakpoint) */
  short: string;
  /** Text shown on larger screens (at/above breakpoint) */
  long: string;
  /** Breakpoint where long text appears. Default: "sm" */
  breakpoint?: "sm" | "md" | "lg";
}

export function ResponsiveText({
  short,
  long,
  breakpoint = "sm",
  className,
  ...props
}: ResponsiveTextProps) {
  const hideShort = {
    sm: "sm:hidden",
    md: "md:hidden",
    lg: "lg:hidden",
  }[breakpoint];

  const showLong = {
    sm: "hidden sm:inline",
    md: "hidden md:inline",
    lg: "hidden lg:inline",
  }[breakpoint];

  return (
    <span className={cn(className)} {...props}>
      <span className={hideShort}>{short}</span>
      <span className={showLong}>{long}</span>
    </span>
  );
}
