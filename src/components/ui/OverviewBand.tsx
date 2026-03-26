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
  density?: "default" | "compact";
  className?: string;
}

function getOverviewBandMetricGridClassName(density: "default" | "compact", metricsCount: number) {
  if (density === "compact") {
    if (metricsCount === 2) {
      return "mt-4 grid gap-2 grid-cols-2";
    }

    if (metricsCount === 3) {
      return "mt-4 grid gap-2 grid-cols-3";
    }

    if (metricsCount > 3) {
      return "mt-4 grid gap-2 grid-cols-2 sm:grid-cols-3 xl:grid-cols-4";
    }

    return "mt-4 grid gap-2";
  }

  return cn(
    "mt-5 grid gap-3",
    metricsCount > 1 && "sm:grid-cols-2",
    metricsCount > 2 && "xl:grid-cols-3",
  );
}

function OverviewMetricCard({
  density,
  metric,
}: {
  density: "default" | "compact";
  metric: OverviewMetric;
}) {
  return (
    <article
      className={cn(
        "border border-ui-border-secondary/70 bg-ui-bg/80",
        density === "compact"
          ? "rounded-xl px-3 py-2 shadow-none"
          : "rounded-container px-4 py-3 shadow-soft",
      )}
    >
      <Stack gap="xs">
        <Typography variant="caption" className="uppercase tracking-wide text-ui-text-tertiary">
          {metric.label}
        </Typography>
        <Typography variant={density === "compact" ? "h5" : "h4"} color="brand">
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
  density = "default",
  className,
}: OverviewBandProps) {
  const isCompact = density === "compact";
  const metricsGridClassName = getOverviewBandMetricGridClassName(density, metrics.length);

  return (
    <Card
      variant={isCompact ? "subtle" : "default"}
      padding={isCompact ? "md" : "lg"}
      className={cn(
        isCompact
          ? "overflow-hidden border-ui-border-secondary/75 bg-linear-to-b from-ui-bg-elevated/98 to-ui-bg-soft/45 shadow-soft"
          : "overflow-hidden border-ui-border-secondary/80 bg-linear-to-b from-ui-bg-elevated to-ui-bg-soft/60 shadow-soft",
        className,
      )}
    >
      <div
        className={cn(
          "grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-start",
          isCompact ? "gap-4" : "gap-5",
        )}
      >
        <Stack gap={isCompact ? "xs" : "sm"} className="min-w-0">
          {eyebrow ? (
            <Badge
              variant="neutral"
              shape="pill"
              className="w-fit border-ui-border-secondary/80 bg-ui-bg-soft text-ui-text-secondary"
            >
              {eyebrow}
            </Badge>
          ) : null}
          <Typography variant={isCompact ? "h4" : "h3"} className="max-w-3xl text-balance">
            {title}
          </Typography>
          <Typography
            variant="small"
            color="secondary"
            className={cn("max-w-3xl", isCompact ? "leading-5" : "leading-6")}
          >
            {description}
          </Typography>
        </Stack>

        {aside ? (
          <div
            className={cn(
              "border border-ui-border-secondary/70 bg-ui-bg/70",
              isCompact
                ? "rounded-xl px-3 py-3 shadow-none"
                : "rounded-container px-4 py-4 shadow-soft",
            )}
          >
            {aside}
          </div>
        ) : null}
      </div>

      {metrics.length > 0 ? (
        <div className={metricsGridClassName}>
          {metrics.map((metric) => (
            <OverviewMetricCard key={metric.label} density={density} metric={metric} />
          ))}
        </div>
      ) : null}
    </Card>
  );
}
