import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./Badge";
import { Card } from "./Card";
import { Grid } from "./Grid";
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
        "overflow-hidden border-ui-border-secondary/90 bg-linear-to-br from-ui-bg-elevated via-ui-bg-elevated to-ui-bg-secondary shadow-card",
        className,
      )}
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-container border border-ui-border-secondary/70 bg-ui-bg/95 p-5 shadow-soft lg:col-span-5">
          <Stack gap="sm">
            {eyebrow ? (
              <Badge
                variant="neutral"
                shape="pill"
                className="w-fit border-brand-border/60 bg-brand-subtle/80 text-brand-subtle-foreground"
              >
                {eyebrow}
              </Badge>
            ) : null}
            <Typography variant="h3" className="max-w-xl text-balance">
              {title}
            </Typography>
            <Typography variant="small" color="secondary" className="max-w-xl leading-6">
              {description}
            </Typography>
          </Stack>
        </div>

        <Stack gap="md" className="lg:col-span-7">
          {metrics.length > 0 ? (
            <Grid
              cols={1}
              colsSm={metrics.length > 1 ? 2 : 1}
              colsLg={metrics.length > 2 ? 3 : 2}
              gap="md"
            >
              {metrics.map((metric) => (
                <Card
                  key={metric.label}
                  variant="default"
                  padding="md"
                  className="h-full border-ui-border-secondary/80 bg-ui-bg-elevated/95 shadow-soft"
                >
                  <Stack gap="xs">
                    <Typography
                      variant="caption"
                      className="uppercase tracking-wide text-ui-text-tertiary"
                    >
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
                </Card>
              ))}
            </Grid>
          ) : null}

          {aside ? (
            <div className="rounded-container border border-ui-border-secondary/70 bg-linear-to-br from-brand-subtle/50 to-ui-bg-elevated p-4 shadow-soft">
              {aside}
            </div>
          ) : null}
        </Stack>
      </div>
    </Card>
  );
}
