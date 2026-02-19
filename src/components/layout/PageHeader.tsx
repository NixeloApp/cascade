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

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className,
}: PageHeaderProps): ReactNode {
  return (
    <div className={cn("mb-6", className)}>
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
      <Flex justify="between" align="start" gap="md">
        <Stack gap="xs">
          <Typography variant="h3">{title}</Typography>
          {description && <Typography variant="muted">{description}</Typography>}
        </Stack>
        {actions && (
          <Flex gap="sm" align="center" className="shrink-0">
            {actions}
          </Flex>
        )}
      </Flex>
    </div>
  );
}
