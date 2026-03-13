/**
 * Flex Component
 *
 * Horizontal flex container with gap and alignment props.
 * Semantic alternative to raw flex divs with responsive support.
 * Includes FlexItem for controlling individual child sizing.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

type Direction = "row" | "column";
type GapSize = "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
type Align = "start" | "center" | "end" | "stretch" | "baseline";
type Justify = "start" | "center" | "end" | "between" | "around" | "evenly";
type FlexValue = "1" | "auto" | "initial" | "none";
type SelfAlign = "auto" | "start" | "center" | "end" | "stretch" | "baseline";

const directionClasses: Record<Direction, string> = {
  row: "flex-row",
  column: "flex-col",
};

const gapClasses: Record<GapSize, string> = {
  none: "gap-0",
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-3",
  lg: "gap-4",
  xl: "gap-6",
  "2xl": "gap-8",
};

const alignClasses: Record<Align, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
};

const justifyClasses: Record<Justify, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
};

const flexClasses: Record<FlexValue, string> = {
  "1": "flex-1",
  auto: "flex-auto",
  initial: "flex-initial",
  none: "flex-none",
};

const selfAlignClasses: Record<SelfAlign, string> = {
  auto: "self-auto",
  start: "self-start",
  center: "self-center",
  end: "self-end",
  stretch: "self-stretch",
  baseline: "self-baseline",
};

export interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Direction of flex layout */
  direction?: Direction;
  /** Direction from the sm breakpoint upward */
  directionSm?: Direction;
  /** Direction from the md breakpoint upward */
  directionMd?: Direction;
  /** Gap between items */
  gap?: GapSize;
  /** Gap from the sm breakpoint upward */
  gapSm?: GapSize;
  /** Align items on cross axis */
  align?: Align;
  /** Align items from the sm breakpoint upward */
  alignSm?: Align;
  /** Align items from the md breakpoint upward */
  alignMd?: Align;
  /** Justify content on main axis */
  justify?: Justify;
  /** Justify content from the sm breakpoint upward */
  justifySm?: Justify;
  /** Wrap items */
  wrap?: boolean;
  /** Use inline-flex instead of flex */
  inline?: boolean;
  /** Flex shorthand for the container itself */
  flex?: FlexValue;
  /** Render as a different element */
  as?: React.ElementType;
}

/**
 * Flex layout component for one-dimensional layouts.
 *
 * @example
 * // Horizontal row (default)
 * <Flex gap="sm" align="center">
 *   <Icon />
 *   <span>Label</span>
 * </Flex>
 *
 * @example
 * // Vertical column
 * <Flex direction="column" gap="md">
 *   <Input label="Name" />
 *   <Input label="Email" />
 *   <Button>Submit</Button>
 * </Flex>
 *
 * @example
 * // Space between
 * <Flex justify="between" align="center">
 *   <h1>Title</h1>
 *   <Button>Action</Button>
 * </Flex>
 */
export const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  (
    {
      direction = "row",
      directionSm,
      directionMd,
      gap = "none",
      gapSm,
      align,
      alignSm,
      alignMd,
      justify,
      justifySm,
      wrap = false,
      inline = false,
      flex,
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
          inline ? "inline-flex" : "flex",
          directionClasses[direction],
          directionSm && `sm:${directionClasses[directionSm]}`,
          directionMd && `md:${directionClasses[directionMd]}`,
          gapClasses[gap],
          gapSm && `sm:${gapClasses[gapSm]}`,
          align && alignClasses[align],
          alignSm && `sm:${alignClasses[alignSm]}`,
          alignMd && `md:${alignClasses[alignMd]}`,
          justify && justifyClasses[justify],
          justifySm && `sm:${justifyClasses[justifySm]}`,
          flex && flexClasses[flex],
          wrap && "flex-wrap",
          className,
        )}
        {...props}
      >
        {children}
      </Component>
    );
  },
);
Flex.displayName = "Flex";

// =============================================================================
// FlexItem
// =============================================================================

export interface FlexItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Flex shorthand: "1" (grow), "auto", "initial", "none" */
  flex?: FlexValue;
  /** Flex shorthand from the sm breakpoint upward */
  flexSm?: FlexValue;
  /** Flex shorthand from the md breakpoint upward */
  flexMd?: FlexValue;
  /** Allow item to grow */
  grow?: boolean;
  /** Allow item to shrink */
  shrink?: boolean;
  /** Align self on cross axis */
  align?: SelfAlign;
  /** Render as a different element */
  as?: React.ElementType;
}

/**
 * Flex item component for controlling flex child behavior.
 *
 * @example
 * <Flex gap="md">
 *   <FlexItem flex="1">Takes remaining space</FlexItem>
 *   <FlexItem shrink={false}>Fixed width</FlexItem>
 * </Flex>
 *
 * @example
 * <Flex align="stretch">
 *   <FlexItem align="center">Vertically centered</FlexItem>
 *   <FlexItem flex="1">Grows to fill</FlexItem>
 * </Flex>
 */
export const FlexItem = React.forwardRef<HTMLDivElement, FlexItemProps>(
  (
    {
      flex,
      flexSm,
      flexMd,
      grow,
      shrink,
      align,
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
          flex && flexClasses[flex],
          flexSm && `sm:${flexClasses[flexSm]}`,
          flexMd && `md:${flexClasses[flexMd]}`,
          grow === true && "grow",
          grow === false && "grow-0",
          shrink === true && "shrink",
          shrink === false && "shrink-0",
          align && selfAlignClasses[align],
          className,
        )}
        {...props}
      >
        {children}
      </Component>
    );
  },
);
FlexItem.displayName = "FlexItem";
