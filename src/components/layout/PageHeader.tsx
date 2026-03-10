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
        "mb-4 rounded-2xl border border-ui-border-secondary/75 bg-linear-to-r from-ui-bg via-ui-bg-elevated/96 to-ui-bg-soft/78 px-3.5 py-3.5 shadow-card sm:mb-6 sm:rounded-3xl sm:px-5 sm:py-5",
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
          <Flex align="center" gap="xs" className="mb-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand shadow-brand-halo ring-4 ring-brand/8 sm:h-2 sm:w-2" />
            <Typography
              variant="caption"
              className="uppercase tracking-[0.18em] text-ui-text-tertiary sm:tracking-[0.22em]"
            >
              Workspace view
            </Typography>
          </Flex>
          <Typography variant="h2" className="text-xl leading-tight sm:text-3xl lg:text-4xl">
            {title}
          </Typography>
          {description && (
            <Typography variant="muted" className="max-w-3xl text-xs leading-5 sm:text-sm">
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
