import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, type CardProps } from "../ui/Card";
import { Flex, type FlexProps } from "../ui/Flex";
import { Stack } from "../ui/Stack";

type PageControlsGap = ComponentProps<typeof Stack>["gap"];

interface PageControlsProps extends Omit<CardProps, "recipe"> {
  children: ReactNode;
  gap?: PageControlsGap;
}

interface SectionControlsProps extends CardProps {
  children: ReactNode;
  gap?: PageControlsGap;
}

/**
 * Shared shell for page-level tabs, filters, search, and secondary actions that
 * sit directly below a PageHeader.
 */
export function PageControls({
  children,
  className,
  gap = "md",
  padding = "md",
  ...props
}: PageControlsProps) {
  return (
    <Card recipe="filterBar" padding={padding} className={cn("mb-6", className)} {...props}>
      <Stack gap={gap}>{children}</Stack>
    </Card>
  );
}

/**
 * Shared non-page controls shell for section-local tabs, filters, and actions
 * inside heavier product panels where nesting a full PageControls card would be
 * visually too heavy.
 */
export function SectionControls({
  children,
  className,
  gap = "md",
  padding = "md",
  variant = "section",
  ...props
}: SectionControlsProps) {
  return (
    <Card variant={variant} padding={padding} className={className} {...props}>
      <Stack gap={gap}>{children}</Stack>
    </Card>
  );
}

interface PageControlsRowProps extends FlexProps {}

/**
 * Standard row layout inside a PageControls shell.
 * Stacks on small screens and aligns into a split row at md+.
 */
export function PageControlsRow({
  children,
  className,
  direction,
  directionMd,
  align,
  alignMd,
  gap = "md",
  ...props
}: PageControlsRowProps) {
  return (
    <Flex
      direction={direction ?? "column"}
      directionMd={directionMd ?? "row"}
      align={align ?? "stretch"}
      alignMd={alignMd ?? "center"}
      gap={gap}
      className={cn("md:justify-between", className)}
      {...props}
    >
      {children}
    </Flex>
  );
}

interface PageControlsGroupProps extends FlexProps {}

/**
 * Small cluster of related controls within a PageControls row.
 */
export function PageControlsGroup({
  children,
  className,
  gap = "sm",
  align = "center",
  wrap = true,
  ...props
}: PageControlsGroupProps) {
  return (
    <Flex gap={gap} align={align} wrap={wrap} className={className} {...props}>
      {children}
    </Flex>
  );
}
