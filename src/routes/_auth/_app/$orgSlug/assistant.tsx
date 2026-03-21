/**
 * AI Assistant Page
 *
 * Management interface for AI assistant configuration and prompts.
 * Shows usage stats, active chats, and allows customizing AI behavior.
 * Supports multiple AI modes and conversation history.
 */

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
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Textarea } from "@/components/ui/Textarea";
import { Typography } from "@/components/ui/Typography";
import { Bot, CheckCircle, MessageSquare, Sparkles, Zap } from "@/lib/icons";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_auth/_app/$orgSlug/assistant")({
  component: AssistantPage,
});

function AssistantStats() {
  const stats = [
    {
      label: "Spend",
      value: "$42.50",
      trend: "+12%",
      trendDirection: "up",
      icon: Zap,
    },
    {
      label: "Questions",
      value: "1,240",
      trend: "+5%",
      trendDirection: "up",
      icon: MessageSquare,
    },
    {
      label: "Answered",
      value: "1,180",
      trend: "95%",
      sub: "Success Rate",
      icon: CheckCircle,
    },
  ];

  return (
    <Grid cols={1} colsMd={3} gap="lg" className="mb-8">
      {stats.map((stat) => (
        <Card key={stat.label} className="card-subtle relative overflow-hidden group">
          {/* Green left border accent for active feel */}
          <div className="absolute left-0 top-0 h-full w-1 bg-status-success" />
          <CardBody className="p-5 pl-6">
            <Flex justify="between" align="start" className="mb-2">
              <Typography variant="eyebrow" color="tertiary">
                {stat.label}
              </Typography>
              <Icon icon={stat.icon} size="sm" tone="tertiary" />
            </Flex>
            <Flex align="baseline" gap="xs">
              <Typography variant="dashboardStatValueStrong">{stat.value}</Typography>
              {stat.trend && (
                <Badge variant="success" size="sm" className="ml-2">
                  {stat.trend}
                </Badge>
              )}
            </Flex>
            {stat.sub && (
              <Typography variant="meta" className="mt-1">
                {stat.sub}
              </Typography>
            )}
          </CardBody>
        </Card>
      ))}
    </Grid>
  );
}

function AssistantConfig() {
  const [activeTab, setActiveTab] = useState("general");
  const [enabled, setEnabled] = useState(true);
  const [showHelpButton, setShowHelpButton] = useState(true);
  const [model, setModel] = useState("gpt-4o");

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 animate-fade-in">
          {/* Status Section */}
          <Card className="card-subtle">
            <CardBody className="p-6">
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
                  <div>
                    <Typography variant="h5" className="mb-1">
                      Assistant Status
                    </Typography>
                    <Typography variant="small" color="secondary">
                      {enabled
                        ? "Your assistant is active and answering questions."
                        : "Assistant is currently disabled."}
                    </Typography>
                  </div>
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

          {/* Configuration Form */}
          <Card
            className={cn(
              "card-subtle transition-opacity duration-medium",
              !enabled && "opacity-60 pointer-events-none",
            )}
          >
            <CardHeader className="pb-4 border-b border-ui-border">
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardBody className="p-6 space-y-6">
              {/* System Prompt */}
              <div className="space-y-3">
                <Flex justify="between">
                  <Typography variant="label">System Prompt</Typography>
                  <Typography variant="meta" color="tertiary">
                    Max 2000 chars
                  </Typography>
                </Flex>
                <Textarea
                  variant="surfaceMono"
                  placeholder="You are a helpful assistant for..."
                  defaultValue="You are a helpful documentation assistant. Answer questions based on the provided context."
                />
                <Typography variant="meta" color="tertiary">
                  Instructions for how the assistant should behave and answer questions.
                </Typography>
              </div>

              <Grid cols={1} colsMd={2} gap="xl">
                {/* Model Selection */}
                <div className="space-y-3">
                  <Typography variant="label">Model</Typography>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger className="bg-ui-bg">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Support Email */}
                <div className="space-y-3">
                  <Typography variant="label">Support Email</Typography>
                  <Input variant="surface" type="email" placeholder="support@example.com" />
                </div>
              </Grid>

              {/* Show Help Button Toggle */}
              <Flex
                align="center"
                justify="between"
                className="pt-4 border-t border-ui-border-secondary"
              >
                <div className="space-y-1">
                  <Typography variant="label">Show Help Button</Typography>
                  <Typography variant="meta" color="tertiary">
                    Display a floating help button on your documentation pages.
                  </Typography>
                </div>
                <Switch checked={showHelpButton} onCheckedChange={setShowHelpButton} />
              </Flex>
            </CardBody>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="animate-fade-in">
          <Card className="card-subtle border-brand-subtle bg-brand-subtle/10 mb-6">
            <CardBody className="p-6">
              <Flex gap="md" align="start">
                <IconCircle size="sm" variant="brand">
                  <Icon icon={Sparkles} size="md" />
                </IconCircle>
                <div>
                  <Typography variant="h5" className="mb-1 text-brand-foreground">
                    Upgrade to Pro
                  </Typography>
                  <Typography variant="p" className="mb-4 text-ui-text-secondary max-w-lg">
                    Get access to advanced models (GPT-4o), custom system prompts, and higher usage
                    limits.
                  </Typography>
                  <Button variant="brandSolid">Upgrade Plan</Button>
                </div>
              </Flex>
            </CardBody>
          </Card>

          <Card className="card-subtle">
            <CardHeader>
              <CardTitle>Usage</CardTitle>
            </CardHeader>
            <CardBody className="p-6">
              <Flex
                align="center"
                justify="center"
                className="h-48 bg-ui-bg-tertiary border border-dashed border-ui-border-secondary"
              >
                <Typography variant="small" color="tertiary">
                  Usage chart placeholder
                </Typography>
              </Flex>
            </CardBody>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AssistantPage() {
  return (
    <PageLayout maxWidth="xl">
      <PageHeader
        title="Assistant"
        description="Manage your AI assistant settings and view usage metrics."
      />

      <AssistantStats />
      <AssistantConfig />
    </PageLayout>
  );
}
