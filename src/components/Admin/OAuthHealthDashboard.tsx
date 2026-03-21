import { api } from "@convex/_generated/api";
import type { useQuery } from "convex/react";
import { useState } from "react";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { AlertTriangle, Clock, TrendingUp } from "@/lib/icons";
import { PageControlsGroup } from "../layout";
import {
  SettingsSection,
  SettingsSectionInset,
  SettingsSectionRow,
} from "../Settings/SettingsSection";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Icon } from "../ui/Icon";
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

/**
 * Displays OAuth synthetic-monitoring health stats for organization admins.
 */
export function OAuthHealthDashboard() {
  const [days, setDays] = useState<RangeDays>(7);
  const { organizationId } = useOrganization();

  const stats = useAuthenticatedQuery(
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
    <SettingsSection
      title="OAuth Health Monitoring"
      description="Review synthetic Google OAuth health checks, latency trends, and recent failures."
      icon={TrendingUp}
      action={
        <PageControlsGroup>
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
        </PageControlsGroup>
      }
    >
      <OAuthHealthContent stats={stats} />
    </SettingsSection>
  );
}

function OAuthHealthContent({ stats }: { stats: HealthStats | undefined }) {
  if (!stats) {
    return (
      <SettingsSectionInset>
        <Typography variant="small" color="secondary">
          Loading OAuth health stats...
        </Typography>
      </SettingsSectionInset>
    );
  }

  if (stats.totalChecks === 0) {
    return (
      <SettingsSectionInset>
        <EmptyState
          icon={Clock}
          title="No health checks in selected range"
          description="Synthetic OAuth monitoring has not produced data for this period."
        />
      </SettingsSectionInset>
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
      <OAuthStatTile label="Success Rate" value={`${stats.successRate}%`} />
      <OAuthStatTile label="P95 Latency" value={`${stats.p95LatencyMs ?? 0}ms`} />
      <OAuthStatTile label="Avg Latency" value={`${stats.avgLatencyMs ?? 0}ms`} />
      <OAuthStatTile label="Consecutive Failures" value={String(stats.consecutiveFailures)} />
    </Grid>
  );
}

function OAuthStatusHeader({ stats }: { stats: HealthStats }) {
  const healthVariant = stats.consecutiveFailures > 0 ? "error" : "success";
  const healthLabel = stats.consecutiveFailures > 0 ? "Degraded" : "Healthy";

  return (
    <SettingsSectionInset title="Current health">
      <SettingsSectionRow
        title="Monitoring status"
        description={`Last check: ${formatTime(stats.lastCheckAt)}`}
        action={<Badge variant={healthVariant}>{healthLabel}</Badge>}
      />
    </SettingsSectionInset>
  );
}

function OAuthIncidentSummary({ stats }: { stats: HealthStats }) {
  return (
    <SettingsSectionInset title="Incident timeline">
      <Grid cols={1} colsMd={3} gap="md">
        <IncidentField label="First Failure" value={formatTime(stats.firstFailAt)} />
        <IncidentField label="Last Failure" value={formatTime(stats.lastFailAt)} />
        <IncidentField label="Recovered At" value={formatTime(stats.recoveredAt)} />
      </Grid>
    </SettingsSectionInset>
  );
}

function RecentFailures({ failures }: { failures: FailureEntry[] }) {
  return (
    <SettingsSectionInset title="Recent Failures">
      {failures.length === 0 ? (
        <Typography variant="small" color="secondary">
          No failures in this range.
        </Typography>
      ) : (
        <Stack gap="xs">
          {failures.map((failure) => (
            <SettingsSectionInset key={`${failure.timestamp}-${failure.error}`} padding="sm">
              <Flex justify="between" align="start" gap="md">
                <Stack gap="xs">
                  <Flex gap="xs" align="center">
                    <Icon icon={AlertTriangle} size="sm" tone="error" />
                    <Typography variant="small">{failure.error}</Typography>
                  </Flex>
                  <Typography variant="caption" color="secondary">
                    {formatTime(failure.timestamp)}
                  </Typography>
                </Stack>
                <Flex gap="xs" align="center" wrap>
                  <Badge variant="neutral">{failure.latencyMs}ms</Badge>
                  {failure.errorCode ? <Badge variant="warning">{failure.errorCode}</Badge> : null}
                </Flex>
              </Flex>
            </SettingsSectionInset>
          ))}
        </Stack>
      )}
    </SettingsSectionInset>
  );
}

function OAuthStatTile({ label, value }: { label: string; value: string }) {
  return (
    <SettingsSectionInset padding="md">
      <Stack align="center" gap="xs">
        <Typography variant="h3">{value}</Typography>
        <Typography variant="caption">{label}</Typography>
      </Stack>
    </SettingsSectionInset>
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
