import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { PageHeader, PageLayout } from "@/components/layout";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { CardSection } from "@/components/ui/CardSection";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { Icon } from "@/components/ui/Icon";
import { IconCircle } from "@/components/ui/IconCircle";
import { Skeleton } from "@/components/ui/Skeleton";
import { Stack } from "@/components/ui/Stack";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { formatDate } from "@/lib/formatting";
import { Bot, CheckCircle, DollarSign, MessageSquare, Sparkles } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";

export const Route = createFileRoute("/_auth/_app/$orgSlug/assistant")({
  component: AssistantPage,
});

type AssistantTab = "overview" | "conversations";
type AssistantUsageStats = FunctionReturnType<typeof api.ai.queries.getUsageStats>;
type AssistantChat = FunctionReturnType<typeof api.ai.queries.getUserChats>[number];

function formatCost(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatNumber(value: number): string {
  return value.toLocaleString();
}

function AssistantLoadingPill() {
  return <Skeleton className="h-7 w-28" />;
}

function getAssistantSnapshotCopy(stats: AssistantUsageStats): {
  description: string;
  summaryBadges: string[];
  title: string;
} {
  if (stats.totalRequests === 0) {
    return {
      title: "No assistant activity yet",
      description:
        "Workspace AI is available, but this org has not recorded chats, suggestions, or automations yet.",
      summaryBadges: ["Waiting for first request"],
    };
  }

  const activeProviders = Object.values(stats.byProvider).filter((tokens) => tokens > 0).length;
  const activeOperationTypes = Object.values(stats.byOperation).filter((count) => count > 0).length;

  return {
    title: "Workspace AI is active",
    description:
      "Recent assistant usage is recorded from real chat, suggestion, automation, and analysis traffic.",
    summaryBadges: [
      `${formatNumber(stats.totalRequests)} requests`,
      `${activeProviders} provider${activeProviders === 1 ? "" : "s"}`,
      `${activeOperationTypes} workflow${activeOperationTypes === 1 ? "" : "s"}`,
    ],
  };
}

function AssistantLoadingState() {
  return (
    <PageLayout maxWidth="xl">
      <PageHeader
        title="Assistant"
        description="Workspace-level AI usage, conversation history, and provider activity."
        actions={<Skeleton className="h-8 w-28" />}
      />
      <div data-testid={TEST_IDS.ASSISTANT.LOADING_STATE}>
        <Stack gap="xl">
          <Flex gap="sm">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-36" />
          </Flex>

          <Grid cols={1} colsMd={3} gap="lg">
            {["assistant-stat-1", "assistant-stat-2", "assistant-stat-3"].map((key) => (
              <Card key={key}>
                <CardBody>
                  <Stack gap="sm">
                    <Flex justify="between" align="center">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="size-4" />
                    </Flex>
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </Stack>
                </CardBody>
              </Card>
            ))}
          </Grid>

          <Card>
            <CardBody>
              <Stack gap="md">
                <Flex gap="md" align="center">
                  <Skeleton className="size-10" />
                  <Stack gap="xs" className="flex-1">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-full max-w-lg" />
                  </Stack>
                </Flex>
                <Flex gap="sm" wrap>
                  <AssistantLoadingPill />
                  <AssistantLoadingPill />
                  <AssistantLoadingPill />
                </Flex>
              </Stack>
            </CardBody>
          </Card>

          <Grid cols={1} colsMd={2} gap="lg">
            {["assistant-breakdown-1", "assistant-breakdown-2"].map((key) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle>
                    <Skeleton className="h-5 w-28" />
                  </CardTitle>
                </CardHeader>
                <CardBody>
                  <Stack gap="sm">
                    {[0, 1, 2].map((row) => (
                      <Flex key={`${key}-${row}`} justify="between" align="center">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-6 w-20" />
                      </Flex>
                    ))}
                  </Stack>
                </CardBody>
              </Card>
            ))}
          </Grid>
        </Stack>
      </div>
    </PageLayout>
  );
}

function AssistantStats({ stats }: { stats: AssistantUsageStats }) {
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
      sub:
        stats.totalRequests > 0
          ? `${Math.round(stats.avgResponseTime)}ms avg response`
          : "Waiting for first request",
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
      tone:
        stats.totalRequests === 0
          ? ("tertiary" as const)
          : stats.successRate >= 90
            ? ("success" as const)
            : ("warning" as const),
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

function AssistantSnapshotCard({ stats }: { stats: AssistantUsageStats }) {
  const snapshotCopy = getAssistantSnapshotCopy(stats);

  return (
    <Card data-testid={TEST_IDS.ASSISTANT.SNAPSHOT_CARD}>
      <CardBody>
        <Stack gap="md">
          <Flex gap="md" align="center">
            <IconCircle variant={stats.totalRequests > 0 ? "brand" : "muted"} className="size-10">
              <Icon icon={Bot} size="md" />
            </IconCircle>
            <Stack gap="xs">
              <Typography variant="h5">{snapshotCopy.title}</Typography>
              <Typography variant="small" color="secondary">
                {snapshotCopy.description}
              </Typography>
            </Stack>
          </Flex>

          <Flex gap="sm" wrap>
            {snapshotCopy.summaryBadges.map((badge) => (
              <Badge key={badge} variant="neutral" shape="pill">
                {badge}
              </Badge>
            ))}
          </Flex>
        </Stack>
      </CardBody>
    </Card>
  );
}

function AssistantOverviewEmptyState() {
  return (
    <EmptyState
      data-testid={TEST_IDS.ASSISTANT.OVERVIEW_EMPTY_STATE}
      icon={Sparkles}
      title="No AI usage recorded yet"
      description="Once people start chatting, generating suggestions, or running automations, this workspace snapshot will fill in with real activity."
    />
  );
}

function OperationBreakdown({ stats }: { stats: AssistantUsageStats }) {
  if (stats.totalRequests === 0) {
    return <AssistantOverviewEmptyState />;
  }

  const operations = [
    { key: "chat", label: "Chat", count: stats.byOperation.chat },
    { key: "suggestion", label: "Suggestions", count: stats.byOperation.suggestion },
    { key: "automation", label: "Automation", count: stats.byOperation.automation },
    { key: "analysis", label: "Analysis", count: stats.byOperation.analysis },
  ].filter((operation) => operation.count > 0);

  const providers = [
    { key: "anthropic", label: "Anthropic", tokens: stats.byProvider.anthropic },
    { key: "openai", label: "OpenAI", tokens: stats.byProvider.openai },
  ].filter((provider) => provider.tokens > 0);

  return (
    <Grid cols={1} colsMd={2} gap="lg">
      <Card>
        <CardHeader>
          <CardTitle>By Operation</CardTitle>
        </CardHeader>
        <CardBody>
          <Stack gap="sm">
            {operations.map((operation) => (
              <Flex key={operation.key} justify="between" align="center">
                <Typography variant="label">{operation.label}</Typography>
                <Badge variant="neutral" size="sm">
                  {formatNumber(operation.count)}
                </Badge>
              </Flex>
            ))}
          </Stack>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By Provider</CardTitle>
        </CardHeader>
        <CardBody>
          <Stack gap="sm">
            {providers.map((provider) => (
              <Flex key={provider.key} justify="between" align="center">
                <Typography variant="label">{provider.label}</Typography>
                <Badge variant="neutral" size="sm">
                  {formatNumber(provider.tokens)} tokens
                </Badge>
              </Flex>
            ))}
          </Stack>
        </CardBody>
      </Card>
    </Grid>
  );
}

function RecentChats({ chats }: { chats: AssistantChat[] | undefined }) {
  if (chats === undefined) {
    return (
      <Card>
        <CardBody>
          <Stack gap="sm">
            {[0, 1, 2].map((row) => (
              <CardSection key={`assistant-chat-loading-${row}`} size="compact">
                <Flex justify="between" align="center">
                  <Stack gap="xs" className="flex-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-28" />
                  </Stack>
                  <Skeleton className="h-4 w-20" />
                </Flex>
              </CardSection>
            ))}
          </Stack>
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
      <CardBody data-testid={TEST_IDS.ASSISTANT.CONVERSATIONS_LIST}>
        {chats.length === 0 ? (
          <EmptyState
            data-testid={TEST_IDS.ASSISTANT.CONVERSATIONS_EMPTY_STATE}
            icon={MessageSquare}
            title="No conversations yet"
            description="Start chatting with the AI assistant from a project or workflow surface and the latest conversations will show up here."
            size="compact"
            surface="bare"
          />
        ) : (
          <Stack gap="sm">
            {chats.slice(0, 10).map((chat) => (
              <CardSection key={chat._id} size="compact">
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
              </CardSection>
            ))}
          </Stack>
        )}
      </CardBody>
    </Card>
  );
}

/** Workspace-level AI activity surface with reviewed overview, conversations, empty, and loading states. */
export function AssistantPage() {
  const [activeTab, setActiveTab] = useState<AssistantTab>("overview");
  const stats = useAuthenticatedQuery(api.ai.queries.getUsageStats, {});
  const chats = useAuthenticatedQuery(api.ai.queries.getUserChats, {});

  if (stats === undefined) {
    return <AssistantLoadingState />;
  }

  return (
    <PageLayout maxWidth="xl">
      <PageHeader
        title="Assistant"
        description="Workspace-level AI usage, conversation history, and provider activity."
        actions={
          <Badge variant="brand" shape="pill">
            <Flex align="center" gap="xs">
              <Icon icon={Sparkles} size="xs" />
              Powered by AI
            </Flex>
          </Badge>
        }
      />

      <div data-testid={TEST_IDS.ASSISTANT.CONTENT}>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AssistantTab)}>
          <TabsList>
            <TabsTrigger value="overview" data-testid={TEST_IDS.ASSISTANT.OVERVIEW_TAB}>
              Overview
            </TabsTrigger>
            <TabsTrigger value="conversations" data-testid={TEST_IDS.ASSISTANT.CONVERSATIONS_TAB}>
              Conversations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" data-testid={TEST_IDS.ASSISTANT.OVERVIEW_PANEL}>
            <Stack gap="xl">
              <AssistantStats stats={stats} />
              <AssistantSnapshotCard stats={stats} />
              <OperationBreakdown stats={stats} />
            </Stack>
          </TabsContent>

          <TabsContent value="conversations" data-testid={TEST_IDS.ASSISTANT.CONVERSATIONS_PANEL}>
            <RecentChats chats={chats} />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
