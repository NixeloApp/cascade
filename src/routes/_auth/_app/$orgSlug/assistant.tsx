/**
 * AI Assistant Page
 *
 * Management interface for AI assistant configuration and usage stats.
 * Shows real usage metrics from backend, active provider info, and
 * configuration controls.
 */

import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, PageLayout } from "@/components/layout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Dot } from "@/components/ui/Dot";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Icon } from "@/components/ui/Icon";
import { IconCircle } from "@/components/ui/IconCircle";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Stack } from "@/components/ui/Stack";
import { Switch } from "@/components/ui/Switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { formatDate } from "@/lib/formatting";
import { Bot, CheckCircle, DollarSign, MessageSquare, Sparkles, Zap } from "@/lib/icons";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_auth/_app/$orgSlug/assistant")({
  component: AssistantPage,
});

function formatCost(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function AssistantStats() {
  const stats = useAuthenticatedQuery(api.ai.queries.getUsageStats, {});

  if (stats === undefined) {
    return (
      <Grid cols={1} colsMd={3} gap="lg">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="min-h-content-block">
            <CardBody>
              <Flex align="center" justify="center" className="min-h-content-block">
                <LoadingSpinner size="sm" />
              </Flex>
            </CardBody>
          </Card>
        ))}
      </Grid>
    );
  }

  const statCards = [
    {
      label: "Total Spend",
      value: formatCost(stats.totalCost),
      sub: `${formatNumber(stats.totalTokens)} tokens used`,
      icon: DollarSign,
      tone: "success" as const,
    },
    {
      label: "AI Requests",
      value: formatNumber(stats.totalRequests),
      sub: `${Math.round(stats.avgResponseTime)}ms avg response`,
      icon: MessageSquare,
      tone: "brand" as const,
    },
    {
      label: "Success Rate",
      value: stats.totalRequests > 0 ? `${Math.round(stats.successRate)}%` : "N/A",
      sub:
        stats.totalRequests > 0
          ? `${formatNumber(Math.round((stats.totalRequests * stats.successRate) / 100))} successful`
          : "No requests yet",
      icon: CheckCircle,
      tone: stats.successRate >= 90 ? ("success" as const) : ("warning" as const),
    },
  ];

  return (
    <Grid cols={1} colsMd={3} gap="lg">
      {statCards.map((stat) => (
        <Card key={stat.label}>
          <CardBody>
            <Stack gap="sm">
              <Flex justify="between" align="center">
                <Typography variant="eyebrow" color="tertiary">
                  {stat.label}
                </Typography>
                <Icon icon={stat.icon} size="sm" tone="tertiary" />
              </Flex>
              <Typography variant="h2" color={stat.tone}>
                {stat.value}
              </Typography>
              <Typography variant="caption" color="tertiary">
                {stat.sub}
              </Typography>
            </Stack>
          </CardBody>
        </Card>
      ))}
    </Grid>
  );
}

function OperationBreakdown() {
  const stats = useAuthenticatedQuery(api.ai.queries.getUsageStats, {});

  if (!stats || stats.totalRequests === 0) return null;

  const operations = [
    { key: "chat", label: "Chat", count: stats.byOperation.chat },
    { key: "suggestion", label: "Suggestions", count: stats.byOperation.suggestion },
    { key: "automation", label: "Automation", count: stats.byOperation.automation },
    { key: "analysis", label: "Analysis", count: stats.byOperation.analysis },
  ].filter((op) => op.count > 0);

  const providers = [
    { key: "anthropic", label: "Anthropic", tokens: stats.byProvider.anthropic },
    { key: "openai", label: "OpenAI", tokens: stats.byProvider.openai },
  ].filter((p) => p.tokens > 0);

  return (
    <Grid cols={1} colsMd={2} gap="lg">
      <Card>
        <CardHeader>
          <CardTitle>By Operation</CardTitle>
        </CardHeader>
        <CardBody>
          <Stack gap="sm">
            {operations.map((op) => (
              <Flex key={op.key} justify="between" align="center">
                <Typography variant="label">{op.label}</Typography>
                <Badge variant="neutral" size="sm">
                  {formatNumber(op.count)}
                </Badge>
              </Flex>
            ))}
            {operations.length === 0 && (
              <Typography variant="small" color="tertiary">
                No operations recorded
              </Typography>
            )}
          </Stack>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By Provider</CardTitle>
        </CardHeader>
        <CardBody>
          <Stack gap="sm">
            {providers.map((p) => (
              <Flex key={p.key} justify="between" align="center">
                <Typography variant="label">{p.label}</Typography>
                <Badge variant="neutral" size="sm">
                  {formatNumber(p.tokens)} tokens
                </Badge>
              </Flex>
            ))}
            {providers.length === 0 && (
              <Typography variant="small" color="tertiary">
                No provider usage recorded
              </Typography>
            )}
          </Stack>
        </CardBody>
      </Card>
    </Grid>
  );
}

function AssistantStatus() {
  const [enabled, setEnabled] = useState(true);

  return (
    <Card>
      <CardBody>
        <Flex justify="between" align="center">
          <Flex gap="md" align="center">
            <IconCircle
              variant={enabled ? "success" : "muted"}
              className={cn(
                "size-10 transition-colors",
                enabled ? "text-status-success" : "text-ui-text-tertiary",
              )}
            >
              <Icon icon={Bot} size="md" />
            </IconCircle>
            <Stack gap="xs">
              <Typography variant="h5">Assistant Status</Typography>
              <Typography variant="small" color="secondary">
                {enabled
                  ? "AI features are active across the workspace."
                  : "AI features are currently disabled."}
              </Typography>
            </Stack>
          </Flex>
          <Flex align="center" gap="md">
            {enabled && (
              <Badge variant="success" shape="pill">
                <Flex align="center" gap="xs">
                  <Dot size="xs" color="success" pulse />
                  <span>Active</span>
                </Flex>
              </Badge>
            )}
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </Flex>
        </Flex>
      </CardBody>
    </Card>
  );
}

function RecentChats() {
  const chats = useAuthenticatedQuery(api.ai.queries.getUserChats, {});

  if (chats === undefined) {
    return (
      <Card>
        <CardBody>
          <Flex align="center" justify="center" className="min-h-content-block">
            <LoadingSpinner size="sm" />
          </Flex>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <Flex justify="between" align="center">
          <CardTitle>Recent Conversations</CardTitle>
          <Badge variant="neutral" size="sm">
            {chats.length}
          </Badge>
        </Flex>
      </CardHeader>
      <CardBody>
        {chats.length === 0 ? (
          <Flex
            align="center"
            justify="center"
            direction="column"
            gap="sm"
            className="min-h-content-block"
          >
            <Icon icon={MessageSquare} size="lg" tone="tertiary" />
            <Typography variant="small" color="tertiary">
              No conversations yet. Start chatting with the AI assistant in any project.
            </Typography>
          </Flex>
        ) : (
          <Stack gap="sm">
            {chats.slice(0, 10).map((chat) => (
              <Card key={chat._id} variant="section" padding="sm">
                <Flex justify="between" align="center">
                  <Stack gap="xs">
                    <Typography variant="label">{chat.title || "Untitled Chat"}</Typography>
                    <Typography variant="caption" color="tertiary">
                      {chat.projectId ? "Project chat" : "General chat"}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="tertiary">
                    {formatDate(chat.updatedAt)}
                  </Typography>
                </Flex>
              </Card>
            ))}
          </Stack>
        )}
      </CardBody>
    </Card>
  );
}

function AssistantPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <PageLayout maxWidth="xl">
      <PageHeader
        title="Assistant"
        description="AI usage metrics and configuration for your workspace."
        actions={
          <Badge variant="brand" shape="pill">
            <Flex align="center" gap="xs">
              <Icon icon={Sparkles} size="xs" />
              Powered by AI
            </Flex>
          </Badge>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Stack gap="xl">
            <AssistantStats />
            <AssistantStatus />
            <OperationBreakdown />
          </Stack>
        </TabsContent>

        <TabsContent value="conversations">
          <RecentChats />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
