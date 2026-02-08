import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, PageLayout } from "@/components/layout";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Switch } from "@/components/ui/Switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/Select";
import { Bot, Sparkles, MessageSquare, Zap, CheckCircle, HelpCircle } from "@/lib/icons";
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {stats.map((stat) => (
        <Card key={stat.label} className="card-subtle relative overflow-hidden group">
          {/* Green left border accent for active feel */}
          <div className="absolute left-0 top-0 h-full w-1 bg-status-success" />
          <CardBody className="p-5 pl-6">
            <Flex justify="between" align="start" className="mb-2">
              <Typography
                variant="small"
                color="tertiary"
                className="text-caption uppercase tracking-wider font-bold"
              >
                {stat.label}
              </Typography>
              <stat.icon className="w-4 h-4 text-ui-text-tertiary" />
            </Flex>
            <Flex align="baseline" gap="xs">
              <Typography variant="h2" className="text-3xl font-extrabold text-ui-text">
                {stat.value}
              </Typography>
              {stat.trend && (
                <Badge variant="success" size="sm" className="ml-2">
                  {stat.trend}
                </Badge>
              )}
            </Flex>
            {stat.sub && (
              <Typography variant="small" color="secondary" className="text-xs mt-1">
                {stat.sub}
              </Typography>
            )}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

function AssistantConfig() {
  const [activeTab, setActiveTab] = useState("general");
  const [enabled, setEnabled] = useState(true);
  const [showHelpButton, setShowHelpButton] = useState(true);
  const [model, setModel] = useState("gpt-4o");

  return (
    <div className="max-w-4xl">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 bg-ui-bg-secondary p-1 rounded-lg inline-flex">
          <TabsTrigger value="general" className="px-4 py-1.5 text-sm">General</TabsTrigger>
          <TabsTrigger value="billing" className="px-4 py-1.5 text-sm">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 animate-fade-in">
          {/* Status Section */}
          <Card className="card-subtle">
            <CardBody className="p-6">
              <Flex justify="between" align="center">
                <Flex gap="md" align="center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    enabled ? "bg-status-success-bg text-status-success" : "bg-ui-bg-tertiary text-ui-text-tertiary"
                  )}>
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <Typography variant="h6" className="mb-1">Assistant Status</Typography>
                    <Typography variant="small" color="secondary">
                      {enabled ? "Your assistant is active and answering questions." : "Assistant is currently disabled."}
                    </Typography>
                  </div>
                </Flex>
                <div className="flex items-center gap-4">
                  {enabled && (
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-status-success-bg border border-status-success/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
                      <span className="text-xs font-medium text-status-success">Active</span>
                    </div>
                  )}
                  <Switch checked={enabled} onCheckedChange={setEnabled} />
                </div>
              </Flex>
            </CardBody>
          </Card>

          {/* Configuration Form */}
          <Card className={cn("card-subtle transition-opacity duration-300", !enabled && "opacity-60 pointer-events-none")}>
             <CardHeader className="pb-4 border-b border-ui-border">
                <CardTitle>Configuration</CardTitle>
             </CardHeader>
             <CardBody className="p-6 space-y-6">
                
                {/* System Prompt */}
                <div className="space-y-3">
                   <div className="flex justify-between">
                      <Typography variant="small" className="font-medium">System Prompt</Typography>
                      <Typography variant="small" color="tertiary" className="text-xs">Max 2000 chars</Typography>
                   </div>
                   <Textarea 
                      placeholder="You are a helpful assistant for..." 
                      className="min-h-[120px] font-mono text-sm bg-ui-bg"
                      defaultValue="You are a helpful documentation assistant. Answer questions based on the provided context."
                   />
                   <Typography variant="small" color="tertiary" className="text-xs">
                      Instructions for how the assistant should behave and answer questions.
                   </Typography>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* Model Selection */}
                   <div className="space-y-3">
                      <Typography variant="small" className="font-medium">Model</Typography>
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
                      <Typography variant="small" className="font-medium">Support Email</Typography>
                      <Input 
                         type="email" 
                         placeholder="support@example.com" 
                         className="bg-ui-bg"
                      />
                   </div>
                </div>

                {/* Show Help Button Toggle */}
                <div className="flex items-center justify-between pt-4 border-t border-ui-border-secondary">
                   <div className="space-y-1">
                      <Typography variant="small" className="font-medium">Show Help Button</Typography>
                      <Typography variant="small" color="tertiary" className="text-xs">
                         Display a floating help button on your documentation pages.
                      </Typography>
                   </div>
                   <Switch checked={showHelpButton} onCheckedChange={setShowHelpButton} />
                </div>

             </CardBody>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="animate-fade-in">
          <Card className="card-subtle border-brand-subtle bg-brand-subtle/10 mb-6">
            <CardBody className="p-6">
              <Flex gap="md" align="start">
                 <div className="p-2 bg-brand-subtle rounded-md text-brand">
                    <Sparkles className="w-5 h-5" />
                 </div>
                 <div>
                    <Typography variant="h6" className="mb-1 text-brand-foreground">Upgrade to Pro</Typography>
                    <Typography variant="p" className="mb-4 text-ui-text-secondary max-w-lg">
                       Get access to advanced models (GPT-4o), custom system prompts, and higher usage limits.
                    </Typography>
                    <Button variant="primary" className="bg-brand hover:bg-brand-hover text-white border-none shadow-lg shadow-brand/20">
                       Upgrade Plan
                    </Button>
                 </div>
              </Flex>
            </CardBody>
          </Card>
          
          <Card className="card-subtle">
             <CardHeader>
                <CardTitle>Usage</CardTitle>
             </CardHeader>
             <CardBody className="p-6">
                <div className="h-48 flex items-center justify-center bg-ui-bg-tertiary rounded-md border border-dashed border-ui-border-secondary">
                   <Typography variant="small" color="tertiary">Usage chart placeholder</Typography>
                </div>
             </CardBody>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AssistantPage() {
  return (
    <PageLayout>
      <PageHeader 
        title="Assistant" 
        description="Manage your AI assistant settings and view usage metrics."
      />
      
      <div className="p-6 max-w-7xl mx-auto w-full">
        <AssistantStats />
        <AssistantConfig />
      </div>
    </PageLayout>
  );
}
