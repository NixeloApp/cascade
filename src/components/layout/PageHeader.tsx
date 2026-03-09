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
import { Flex } from "@/components/ui/Flex";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";

interface BreadcrumbData {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: BreadcrumbData[];
  className?: string;
}

/** Page header with title, breadcrumbs, and action buttons. */
export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className,
}: PageHeaderProps): ReactNode {
  return (
    <div className={cn("mb-7 sm:mb-8", className)}>
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
      <Flex justify="between" align="start" gap="md" className="flex-col sm:flex-row sm:items-end">
        <Stack gap="xs" className="min-w-0">
          <Typography variant="h2" className="text-3xl lg:text-4xl">
            {title}
          </Typography>
          {description && (
            <Typography variant="muted" className="max-w-3xl text-sm sm:text-base">
              {description}
            </Typography>
          )}
        </Stack>
        {actions && (
          <Flex gap="sm" align="center" className="w-full shrink-0 sm:w-auto">
            {actions}
          </Flex>
        )}
      </Flex>
    </div>
  );
}
