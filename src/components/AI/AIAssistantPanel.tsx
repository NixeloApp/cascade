/**
 * AIAssistantPanel - Main panel with tabs for chat and suggestions
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { useState } from "react";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { Bot, Lightbulb, MessageSquare } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "../ErrorBoundary";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { Flex, FlexItem } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import { Sheet } from "../ui/Sheet";
import { Tabs, TabsList, TabsTrigger } from "../ui/Tabs";
import { LargeText, Typography } from "../ui/Typography";
import { AIChat } from "./AIChat";
import { AIErrorFallback } from "./AIErrorFallback";
import { AISuggestionsPanel } from "./AISuggestionsPanel";
import { AI_CONFIG } from "./config";

interface AIAssistantPanelProps {
  projectId?: Id<"projects">;
  isOpen: boolean;
  onClose: () => void;
}

export function AIAssistantPanel({ projectId, isOpen, onClose }: AIAssistantPanelProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "suggestions">("chat");
  const [currentChatId, setCurrentChatId] = useState<Id<"aiChats"> | undefined>();
  const [isAnimating, setIsAnimating] = useState(false);

  const chats = useAuthenticatedQuery(api.ai.queries.getUserChats, projectId ? { projectId } : {});
  const suggestions = useAuthenticatedQuery(
    api.ai.queries.getProjectSuggestions,
    projectId ? { projectId } : "skip",
  );

  const unreadSuggestions = suggestions?.length || 0;

  const handleTabChange = (tab: "chat" | "suggestions") => {
    if (tab === activeTab) return;
    setIsAnimating(true);
    setTimeout(() => {
      setActiveTab(tab);
      setIsAnimating(false);
    }, AI_CONFIG.animations.tabTransition);
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="AI Assistant"
      description={projectId ? "Project-specific context" : "General chat"}
      side="right"
      layout="panel"
      className={cn(
        AI_CONFIG.panel.width.mobile,
        AI_CONFIG.panel.width.tablet,
        AI_CONFIG.panel.width.desktop,
        "bg-ui-bg",
      )}
      showCloseButton={true}
      header={
        <>
          {/* Custom gradient header */}
          <Card recipe="assistantPanelHeader" padding="md" radius="none">
            <Flex direction="column" gap="sm" className="text-left">
              <Flex align="center" gap="md">
                <Icon icon={Bot} size="lg" />
                <div>
                  <SheetPrimitive.Title asChild>
                    <LargeText as="h2" color="default" className="text-brand-foreground">
                      AI Assistant
                    </LargeText>
                  </SheetPrimitive.Title>
                  <SheetPrimitive.Description asChild>
                    <Typography variant="meta" as="p" className="text-brand-subtle">
                      {projectId ? "Project-specific context" : "General chat"}
                    </Typography>
                  </SheetPrimitive.Description>
                </div>
              </Flex>
            </Flex>
          </Card>

          {/* Tabs */}
          <Card
            variant="ghost"
            padding="sm"
            radius="none"
            className="border-x-0 border-t-0 border-b border-ui-border bg-ui-bg-secondary"
          >
            <Tabs
              value={activeTab}
              onValueChange={(value) => handleTabChange(value as "chat" | "suggestions")}
            >
              <TabsList className="w-full">
                <TabsTrigger value="chat" width="fill">
                  <Icon icon={MessageSquare} size="sm" inline /> Chat
                  {chats && chats.length > 0 && (
                    <Badge variant="secondary" size="sm" className="ml-2">
                      {chats.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="suggestions" width="fill">
                  <Icon icon={Lightbulb} size="sm" inline /> Suggestions
                  {unreadSuggestions > 0 && (
                    <Badge variant="error" size="sm" className="ml-2">
                      {unreadSuggestions}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </Card>
        </>
      }
    >
      {/* Content */}
      <FlexItem flex="1" className="overflow-hidden">
        <div
          className={cn(
            "h-full transition-opacity",
            `duration-${AI_CONFIG.animations.tabTransition}`,
            isAnimating ? "opacity-0" : "opacity-100",
          )}
        >
          <ErrorBoundary
            fallback={
              <AIErrorFallback
                title="Chat Error"
                message="Failed to load AI chat. Please try refreshing."
                onRetry={() => window.location.reload()}
              />
            }
          >
            {activeTab === "chat" ? (
              <AIChat
                projectId={projectId}
                chatId={currentChatId}
                onChatCreated={setCurrentChatId}
              />
            ) : (
              <AISuggestionsPanel projectId={projectId} />
            )}
          </ErrorBoundary>
        </div>
      </FlexItem>
    </Sheet>
  );
}
