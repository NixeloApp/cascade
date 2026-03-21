import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, type CardProps, getCardRecipeClassName, getCardVariantClassName } from "../ui/Card";
import { Flex, FlexItem } from "../ui/Flex";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

type DashboardPanelSurface = "default" | "inset";
type DashboardPanelPadding = Exclude<CardProps["padding"], undefined | "none">;

interface DashboardPanelProps extends Omit<CardProps, "children" | "padding" | "recipe"> {
  children: ReactNode;
  surface?: DashboardPanelSurface;
}

interface DashboardPanelHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  controls?: ReactNode;
  padding?: DashboardPanelPadding;
}

interface DashboardPanelBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: DashboardPanelPadding;
  grow?: boolean;
}

interface DashboardPanelFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: DashboardPanelPadding;
}

function getDashboardSlotClassName(
  recipe: "dashboardPanelHeader" | "dashboardPanelBody" | "dashboardPanelFooter",
  padding: DashboardPanelPadding,
) {
  return cn(
    getCardRecipeClassName(recipe),
    getCardVariantClassName({
      variant: "ghost",
      padding,
      radius: "none",
    }),
  );
}

/**
 * Shared dashboard panel shell used across feed, stats, and sidebar widgets.
 * Keeps section headers, controls, and state content on one contract instead of
 * each dashboard block hand-rolling its own card anatomy.
 */
export function DashboardPanel({
  children,
  className,
  surface = "default",
  ...props
}: DashboardPanelProps) {
  return (
    <Card
      recipe={surface === "inset" ? "dashboardPanelInset" : "dashboardPanel"}
      padding="none"
      className={className}
      {...props}
    >
      <Flex direction="column">{children}</Flex>
    </Card>
  );
}

/**
 * Shared dashboard panel header with optional badge/actions and an optional
 * controls row for tabs or lightweight filters.
 */
export function DashboardPanelHeader({
  title,
  description,
  badge,
  actions,
  controls,
  className,
  padding = "lg",
  ...props
}: DashboardPanelHeaderProps) {
  return (
    <div
      className={cn(getDashboardSlotClassName("dashboardPanelHeader", padding), className)}
      {...props}
    >
      <Stack gap="md">
        <Flex justify="between" align="start" gap="md" wrap>
          <FlexItem flex="1">
            <Stack gap="xs">
              {typeof title === "string" ? <Typography variant="h3">{title}</Typography> : title}
              {description ? (
                typeof description === "string" ? (
                  <Typography variant="small" color="secondary">
                    {description}
                  </Typography>
                ) : (
                  description
                )
              ) : null}
            </Stack>
          </FlexItem>

          {badge || actions ? (
            <Flex gap="sm" align="center" justify="end" wrap>
              {badge}
              {actions}
            </Flex>
          ) : null}
        </Flex>

        {controls ? <div>{controls}</div> : null}
      </Stack>
    </div>
  );
}

/**
 * Shared dashboard panel body with optional flex growth so scrollable stateful
 * content can fill the remaining panel height.
 */
export function DashboardPanelBody({
  children,
  className,
  padding = "lg",
  grow = false,
  ...props
}: DashboardPanelBodyProps) {
  const body = (
    <div
      className={cn(getDashboardSlotClassName("dashboardPanelBody", padding), className)}
      {...props}
    >
      {children}
    </div>
  );

  return grow ? <FlexItem flex="1">{body}</FlexItem> : body;
}

/**
 * Shared dashboard panel footer for lightweight action rows like "load more".
 */
export function DashboardPanelFooter({
  children,
  className,
  padding = "md",
  ...props
}: DashboardPanelFooterProps) {
  return (
    <div
      className={cn(getDashboardSlotClassName("dashboardPanelFooter", padding), className)}
      {...props}
    >
      {children}
    </div>
  );
}
