/**
 * AIAssistantPanel - Main panel with tabs for chat and suggestions
 */

import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { useQuery } from "convex/react";
import { useState } from "react";
import { Bot, Lightbulb, MessageSquare } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "../ErrorBoundary";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Flex, FlexItem } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import { Sheet } from "../ui/Sheet";
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

  const chats = useQuery(api.ai.queries.getUserChats, projectId ? { projectId } : {});
  const suggestions = useQuery(
    api.ai.queries.getProjectSuggestions,
    projectId ? { projectId } : "skip",
  );

  const unreadSuggestions =
    suggestions?.filter((s: Doc<"aiSuggestions">) => !(s.accepted || s.dismissed)).length || 0;

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
      className={cn(
        AI_CONFIG.panel.width.mobile,
        AI_CONFIG.panel.width.tablet,
        AI_CONFIG.panel.width.desktop,
        "p-0 flex flex-col bg-ui-bg",
      )}
      showCloseButton={true}
      header={
        <>
          {/* Custom gradient header */}
          <div className="p-4 border-b border-ui-border bg-linear-to-r from-brand to-accent">
            <Flex direction="column" gap="sm" className="text-left">
              <Flex align="center" gap="md">
                <Icon icon={Bot} size="lg" />
                <div>
                  <SheetPrimitive.Title className="text-lg font-semibold text-brand-foreground">
                    AI Assistant
                  </SheetPrimitive.Title>
                  <SheetPrimitive.Description className="text-xs text-brand-subtle">
                    {projectId ? "Project-specific context" : "General chat"}
                  </SheetPrimitive.Description>
                </div>
              </Flex>
            </Flex>
          </div>

          {/* Tabs */}
          <Flex className="border-b border-ui-border bg-ui-bg-secondary">
            <Button
              variant="unstyled"
              onClick={() => handleTabChange("chat")}
              className={cn(
                "flex-1 px-4 py-3 font-medium text-sm transition-colors rounded-none",
                activeTab === "chat"
                  ? "text-brand border-b-2 border-brand bg-ui-bg"
                  : "text-ui-text-tertiary hover:text-ui-text",
              )}
            >
              <Icon icon={MessageSquare} size="sm" className="inline mr-1" /> Chat
              {chats && chats.length > 0 && (
                <Badge variant="secondary" size="sm" className="ml-2">
                  {chats.length}
                </Badge>
              )}
            </Button>
            <Button
              variant="unstyled"
              onClick={() => handleTabChange("suggestions")}
              className={cn(
                "flex-1 px-4 py-3 font-medium text-sm transition-colors relative rounded-none",
                activeTab === "suggestions"
                  ? "text-brand border-b-2 border-brand bg-ui-bg"
                  : "text-ui-text-tertiary hover:text-ui-text",
              )}
            >
              <Icon icon={Lightbulb} size="sm" className="inline mr-1" /> Suggestions
              {unreadSuggestions > 0 && (
                <Badge variant="error" size="sm" className="ml-2">
                  {unreadSuggestions}
                </Badge>
              )}
            </Button>
          </Flex>
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
