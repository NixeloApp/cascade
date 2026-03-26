import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./Badge";
import { Card } from "./Card";
import { Stack } from "./Stack";
import { Typography } from "./Typography";

interface OverviewMetric {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
}

interface OverviewBandProps {
  title: string;
  description: ReactNode;
  eyebrow?: string;
  metrics?: OverviewMetric[];
  aside?: ReactNode;
  className?: string;
}

function OverviewMetricCard({ metric }: { metric: OverviewMetric }) {
  return (
    <article className="rounded-container border border-ui-border-secondary/70 bg-ui-bg/80 px-4 py-3 shadow-soft">
      <Stack gap="xs">
        <Typography variant="caption" className="uppercase tracking-wide text-ui-text-tertiary">
          {metric.label}
        </Typography>
        <Typography variant="h4" color="brand">
          {metric.value}
        </Typography>
        {metric.detail ? (
          <Typography variant="caption" color="secondary">
            {metric.detail}
          </Typography>
        ) : null}
      </Stack>
    </article>
  );
}

export function OverviewBand({
  title,
  description,
  eyebrow,
  metrics = [],
  aside,
  className,
}: OverviewBandProps) {
  return (
    <Card
      variant="default"
      padding="lg"
      className={cn(
        "overflow-hidden border-ui-border-secondary/80 bg-linear-to-b from-ui-bg-elevated to-ui-bg-soft/60 shadow-soft",
        className,
      )}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-start">
        <Stack gap="sm" className="min-w-0">
          {eyebrow ? (
            <Badge
              variant="neutral"
              shape="pill"
              className="w-fit border-ui-border-secondary/80 bg-ui-bg-soft text-ui-text-secondary"
            >
              {eyebrow}
            </Badge>
          ) : null}
          <Typography variant="h3" className="max-w-3xl text-balance">
            {title}
          </Typography>
          <Typography variant="small" color="secondary" className="max-w-3xl leading-6">
            {description}
          </Typography>
        </Stack>

        {aside ? (
          <div className="rounded-container border border-ui-border-secondary/70 bg-ui-bg/70 px-4 py-4 shadow-soft">
            {aside}
          </div>
        ) : null}
      </div>

      {metrics.length > 0 ? (
        <div
          className={cn(
            "mt-5 grid gap-3",
            metrics.length > 1 && "sm:grid-cols-2",
            metrics.length > 2 && "xl:grid-cols-3",
          )}
        >
          {metrics.map((metric) => (
            <OverviewMetricCard key={metric.label} metric={metric} />
          ))}
        </div>
      ) : null}
    </Card>
  );
}
