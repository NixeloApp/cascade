import { Link } from "@tanstack/react-router";
import React, { type ReactNode } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/Breadcrumb";
import { Card } from "@/components/ui/Card";
import { Dot } from "@/components/ui/Dot";
import { Flex } from "@/components/ui/Flex";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { TEST_IDS } from "@/lib/test-ids";
import { cn } from "@/lib/utils";

interface BreadcrumbData {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: BreadcrumbData[];
  className?: string;
  spacing?: "standalone" | "stack";
}

/** Page header with title, breadcrumbs, and action buttons. */
export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className,
  spacing = "standalone",
}: PageHeaderProps): ReactNode {
  return (
    <Card
      recipe="pageHeader"
      padding="md"
      className={cn(spacing === "standalone" && "mb-4 sm:mb-5", className)}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb className="mb-2">
          <BreadcrumbList>
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={crumb.label}>
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {crumb.to ? (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.to}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}
      <Flex
        justify="between"
        align="start"
        alignSm="end"
        gap="md"
        direction="column"
        directionSm="row"
      >
        <Stack gap="xs" className="min-w-0">
          <Flex align="center" gap="xs" className="mb-0.5">
            <Dot size="md" halo />
            <Typography variant="pageHeaderEyebrow">Workspace view</Typography>
          </Flex>
          <Typography variant="pageHeaderTitle" as="h2" data-testid={TEST_IDS.PAGE.HEADER_TITLE}>
            {title}
          </Typography>
          {description && <Typography variant="pageHeaderDescription">{description}</Typography>}
        </Stack>
        {actions && (
          <Flex gap="sm" align="center" className="w-full shrink-0 sm:w-auto">
            {actions}
          </Flex>
        )}
      </Flex>
    </Card>
  );
}
