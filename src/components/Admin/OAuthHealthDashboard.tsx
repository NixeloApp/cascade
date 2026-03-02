import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { useState } from "react";
import { useOrganization } from "@/hooks/useOrgContext";
import { AlertTriangle, Clock } from "@/lib/icons";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

const ranges = [7, 30] as const;
type RangeDays = (typeof ranges)[number];

type HealthStats = NonNullable<
  ReturnType<typeof useQuery<typeof api.oauthHealthCheck.getOAuthHealthStats>>
>;
type FailureEntry = HealthStats["recentFailures"][number];

function formatTime(timestamp: number | null) {
  if (!timestamp) return "N/A";
  return new Date(timestamp).toLocaleString();
}

export function OAuthHealthDashboard() {
  const [days, setDays] = useState<RangeDays>(7);
  const { organizationId } = useOrganization();

  const stats = useQuery(
    api.oauthHealthCheck.getOAuthHealthStats,
    organizationId
      ? {
          organizationId,
          days,
        }
      : "skip",
  );

  if (!organizationId) {
    return null;
  }

  return (
    <Card>
      <CardHeader
        title="OAuth Health Monitoring"
        description="Synthetic Google OAuth health checks and failure trends"
        action={
          <Flex gap="xs">
            {ranges.map((range) => (
              <Button
                key={range}
                size="sm"
                variant={days === range ? "primary" : "secondary"}
                onClick={() => setDays(range)}
              >
                {range}d
              </Button>
            ))}
          </Flex>
        }
      />
      <CardBody>
        <OAuthHealthContent stats={stats} />
      </CardBody>
    </Card>
  );
}

function OAuthHealthContent({ stats }: { stats: HealthStats | undefined }) {
  if (!stats) {
    return (
      <Typography variant="small" color="secondary">
        Loading OAuth health stats...
      </Typography>
    );
  }

  if (stats.totalChecks === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No health checks in selected range"
        description="Synthetic OAuth monitoring has not produced data for this period."
      />
    );
  }

  return (
    <Stack gap="lg">
      <OAuthStatsGrid stats={stats} />
      <OAuthStatusHeader stats={stats} />
      <OAuthIncidentSummary stats={stats} />
      <RecentFailures failures={stats.recentFailures} />
    </Stack>
  );
}

function OAuthStatsGrid({ stats }: { stats: HealthStats }) {
  return (
    <Grid cols={2} colsMd={4} gap="md">
      <StatCard label="Success Rate" value={`${stats.successRate}%`} />
      <StatCard label="P95 Latency" value={`${stats.p95LatencyMs ?? 0}ms`} />
      <StatCard label="Avg Latency" value={`${stats.avgLatencyMs ?? 0}ms`} />
      <StatCard label="Consecutive Failures" value={String(stats.consecutiveFailures)} />
    </Grid>
  );
}

function OAuthStatusHeader({ stats }: { stats: HealthStats }) {
  const healthVariant = stats.consecutiveFailures > 0 ? "error" : "success";
  const healthLabel = stats.consecutiveFailures > 0 ? "Degraded" : "Healthy";

  return (
    <Flex gap="sm" align="center" wrap>
      <Badge variant={healthVariant}>{healthLabel}</Badge>
      <Typography variant="small" color="secondary">
        Last check: {formatTime(stats.lastCheckAt)}
      </Typography>
    </Flex>
  );
}

function OAuthIncidentSummary({ stats }: { stats: HealthStats }) {
  return (
    <Grid cols={1} colsMd={3} gap="md">
      <IncidentField label="First Failure" value={formatTime(stats.firstFailAt)} />
      <IncidentField label="Last Failure" value={formatTime(stats.lastFailAt)} />
      <IncidentField label="Recovered At" value={formatTime(stats.recoveredAt)} />
    </Grid>
  );
}

function RecentFailures({ failures }: { failures: FailureEntry[] }) {
  return (
    <Stack gap="sm">
      <Typography variant="label">Recent Failures</Typography>
      {failures.length === 0 ? (
        <Typography variant="small" color="secondary">
          No failures in this range.
        </Typography>
      ) : (
        <Stack gap="xs">
          {failures.map((failure) => (
            <Flex
              key={`${failure.timestamp}-${failure.error}`}
              justify="between"
              align="start"
              className="rounded-md border border-ui-border-primary p-3"
            >
              <Stack gap="xs">
                <Flex gap="xs" align="center">
                  <AlertTriangle className="text-status-error size-4" />
                  <Typography variant="small">{failure.error}</Typography>
                </Flex>
                <Typography variant="caption" color="secondary">
                  {formatTime(failure.timestamp)}
                </Typography>
              </Stack>
              <Flex gap="xs" align="center">
                <Badge variant="neutral">{failure.latencyMs}ms</Badge>
                {failure.errorCode ? <Badge variant="warning">{failure.errorCode}</Badge> : null}
              </Flex>
            </Flex>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardBody>
        <Stack align="center" gap="xs">
          <Typography variant="h3">{value}</Typography>
          <Typography variant="caption">{label}</Typography>
        </Stack>
      </CardBody>
    </Card>
  );
}

function IncidentField({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap="xs">
      <Typography variant="meta">{label}</Typography>
      <Typography variant="small">{value}</Typography>
    </Stack>
  );
}
