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
    <div
      className={cn(
        "mb-5 rounded-3xl border border-ui-border-secondary/70 bg-linear-to-r from-ui-bg-elevated via-ui-bg-elevated/92 to-ui-bg-soft/72 px-4 py-4 shadow-soft sm:mb-6 sm:px-5 sm:py-5",
        className,
      )}
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
        gap="md"
        direction="column"
        className="sm:flex-row sm:items-end"
      >
        <Stack gap="xs" className="min-w-0">
          <Flex align="center" gap="sm" className="mb-0.5">
            <span className="h-2 w-2 rounded-full bg-brand shadow-brand-halo" />
            <Typography
              variant="caption"
              className="uppercase tracking-[0.22em] text-ui-text-tertiary"
            >
              Workspace view
            </Typography>
          </Flex>
          <Typography variant="h2" className="text-2xl sm:text-3xl lg:text-4xl">
            {title}
          </Typography>
          {description && (
            <Typography variant="muted" className="max-w-3xl text-sm">
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
