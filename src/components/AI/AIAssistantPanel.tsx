/**
 * AIAssistantPanel - Main panel with tabs for chat and suggestions
 */

import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useState } from "react";
import { Bot, Lightbulb, MessageSquare } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "../ErrorBoundary";
import { Badge } from "../ui/Badge";
import { Flex } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/Sheet";
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
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className={cn(
          AI_CONFIG.panel.width.mobile,
          AI_CONFIG.panel.width.tablet,
          AI_CONFIG.panel.width.desktop,
          "p-0 flex flex-col bg-ui-bg",
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-ui-border bg-linear-to-r from-brand to-accent">
          <SheetHeader className="text-left">
            <Flex align="center" gap="md">
              <Icon icon={Bot} size="lg" />
              <div>
                <SheetTitle className="text-lg font-semibold text-brand-foreground">
                  AI Assistant
                </SheetTitle>
                <SheetDescription className="text-xs text-brand-subtle">
                  {projectId ? "Project-specific context" : "General chat"}
                </SheetDescription>
              </div>
            </Flex>
          </SheetHeader>
        </div>

        {/* Tabs */}
        <Flex className="border-b border-ui-border bg-ui-bg-secondary">
          <button
            type="button"
            onClick={() => handleTabChange("chat")}
            className={cn(
              "flex-1 px-4 py-3 font-medium text-sm transition-colors",
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
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("suggestions")}
            className={cn(
              "flex-1 px-4 py-3 font-medium text-sm transition-colors relative",
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
          </button>
        </Flex>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
