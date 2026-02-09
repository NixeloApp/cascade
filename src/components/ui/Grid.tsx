import * as React from "react";
import { cn } from "@/lib/utils";

type Cols = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
type GapSize = "none" | "xs" | "sm" | "md" | "lg" | "xl";

const colsClasses: Record<Cols, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  7: "grid-cols-7",
  8: "grid-cols-8",
  9: "grid-cols-9",
  10: "grid-cols-10",
  11: "grid-cols-11",
  12: "grid-cols-12",
};

const colsSmClasses: Record<Cols, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
  5: "sm:grid-cols-5",
  6: "sm:grid-cols-6",
  7: "sm:grid-cols-7",
  8: "sm:grid-cols-8",
  9: "sm:grid-cols-9",
  10: "sm:grid-cols-10",
  11: "sm:grid-cols-11",
  12: "sm:grid-cols-12",
};

const colsMdClasses: Record<Cols, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
  7: "md:grid-cols-7",
  8: "md:grid-cols-8",
  9: "md:grid-cols-9",
  10: "md:grid-cols-10",
  11: "md:grid-cols-11",
  12: "md:grid-cols-12",
};

const colsLgClasses: Record<Cols, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
  7: "lg:grid-cols-7",
  8: "lg:grid-cols-8",
  9: "lg:grid-cols-9",
  10: "lg:grid-cols-10",
  11: "lg:grid-cols-11",
  12: "lg:grid-cols-12",
};

const colsXlClasses: Record<Cols, string> = {
  1: "xl:grid-cols-1",
  2: "xl:grid-cols-2",
  3: "xl:grid-cols-3",
  4: "xl:grid-cols-4",
  5: "xl:grid-cols-5",
  6: "xl:grid-cols-6",
  7: "xl:grid-cols-7",
  8: "xl:grid-cols-8",
  9: "xl:grid-cols-9",
  10: "xl:grid-cols-10",
  11: "xl:grid-cols-11",
  12: "xl:grid-cols-12",
};

const gapClasses: Record<GapSize, string> = {
  none: "gap-0",
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-3",
  lg: "gap-4",
  xl: "gap-6",
};

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of columns (base/mobile) */
  cols?: Cols;
  /** Number of columns at sm breakpoint (640px) */
  colsSm?: Cols;
  /** Number of columns at md breakpoint (768px) */
  colsMd?: Cols;
  /** Number of columns at lg breakpoint (1024px) */
  colsLg?: Cols;
  /** Number of columns at xl breakpoint (1280px) */
  colsXl?: Cols;
  /** Gap between items */
  gap?: GapSize;
  /** Render as a different element */
  as?: React.ElementType;
}

/**
 * Grid layout component for two-dimensional layouts.
 *
 * @example
 * // Simple 2-column grid
 * <Grid cols={2} gap="md">
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 * </Grid>
 *
 * @example
 * // Responsive grid
 * <Grid cols={1} colsMd={2} colsLg={3} gap="lg">
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 *   <Card>Item 3</Card>
 * </Grid>
 *
 * @example
 * // Full responsive with all breakpoints
 * <Grid cols={1} colsSm={2} colsMd={3} colsLg={4} colsXl={5} gap="md">
 *   {items.map(item => <Card key={item.id}>{item.name}</Card>)}
 * </Grid>
 */
export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  (
    {
      cols = 1,
      colsSm,
      colsMd,
      colsLg,
      colsXl,
      gap = "none",
      as: Component = "div",
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <Component
        ref={ref}
        className={cn(
          "grid",
          colsClasses[cols],
          colsSm && colsSmClasses[colsSm],
          colsMd && colsMdClasses[colsMd],
          colsLg && colsLgClasses[colsLg],
          colsXl && colsXlClasses[colsXl],
          gapClasses[gap],
          className,
        )}
        {...props}
      >
        {children}
      </Component>
    );
  },
);
Grid.displayName = "Grid";
