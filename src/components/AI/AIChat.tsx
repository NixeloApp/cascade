/**
 * AIChat - Refactored with useAIChat hook
 */

import type { Id } from "@convex/_generated/dataModel";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, Check, Copy, Lightbulb } from "@/lib/icons";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Flex, FlexItem } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import { IconButton } from "../ui/IconButton";
import { InlineSpinner, LoadingSpinner } from "../ui/LoadingSpinner";
import { MarkdownContent } from "../ui/MarkdownContent";
import { Metadata, MetadataItem } from "../ui/Metadata";
import { Skeleton } from "../ui/Skeleton";
import { Textarea } from "../ui/Textarea";
import { Typography } from "../ui/Typography";
import { AI_CONFIG } from "./config";
import { useAIChat } from "./hooks";

interface AIChatProps {
  projectId?: Id<"projects">;
  chatId?: Id<"aiChats">;
  onChatCreated?: (chatId: Id<"aiChats">) => void;
}

// Message Item Component
function MessageItem({
  message,
  chatId,
  copiedMessageId,
  onCopy,
}: {
  message: {
    role: "user" | "assistant" | "system";
    content: string;
    _creationTime: number;
    modelUsed?: string;
    responseTime?: number;
  };
  chatId: Id<"aiChats">;
  copiedMessageId: string | null;
  onCopy: (content: string, messageId: string) => void;
}) {
  const messageId = `${chatId}-${message._creationTime}-${message.role}-${message.content.slice(0, 32)}`;
  const isCopied = copiedMessageId === messageId;
  const messageTime = new Date(message._creationTime).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Flex className="group" justify={message.role === "user" ? "end" : "start"}>
      <Card
        recipe={message.role === "user" ? "chatBubbleUser" : "chatBubbleAssistant"}
        padding="md"
      >
        {/* Copy button for assistant messages */}
        {message.role === "assistant" && (
          <IconButton
            variant="floating"
            size="sm"
            reveal
            tooltip={isCopied ? "Copied!" : "Copy message"}
            onClick={() => onCopy(message.content, messageId)}
            className="absolute -right-2 -top-2"
            aria-label="Copy message"
          >
            <Icon
              icon={isCopied ? Check : Copy}
              size="sm"
              className={isCopied ? "text-status-success" : undefined}
            />
          </IconButton>
        )}

        {/* Message content with markdown for assistant */}
        {message.role === "assistant" ? (
          <MarkdownContent variant="chat">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </MarkdownContent>
        ) : (
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        )}

        {/* Message metadata */}
        <Metadata className="mt-2 opacity-70">
          <MetadataItem>{messageTime}</MetadataItem>
          {message.role === "assistant" && message.modelUsed && (
            <MetadataItem hideBelow="sm">
              {message.modelUsed.split("-").slice(0, 2).join("-")}
            </MetadataItem>
          )}
          {message.role === "assistant" && message.responseTime && (
            <MetadataItem hideBelow="md">{(message.responseTime / 1000).toFixed(1)}s</MetadataItem>
          )}
        </Metadata>
      </Card>
    </Flex>
  );
}

export function AIChat({ projectId, chatId: initialChatId, onChatCreated }: AIChatProps) {
  const {
    chatId,
    inputMessage,
    isSending,
    copiedMessageId,
    messagesEndRef,
    textareaRef,
    messages,
    setInputMessage,
    handleSendMessage,
    handleKeyPress,
    copyToClipboard,
  } = useAIChat({ projectId, initialChatId, onChatCreated });

  if (!chatId) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <LoadingSpinner message="Starting new chat..." />
      </Flex>
    );
  }

  return (
    <Flex direction="column" className="h-full bg-ui-bg">
      {/* Messages Area */}
      <Card variant="ghost" padding="md" radius="none" className="flex-1 overflow-y-auto">
        {!messages ? (
          <Flex direction="column" gap="lg">
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="h-16 w-2/3 ml-auto" />
            <Skeleton className="h-20 w-3/4" />
          </Flex>
        ) : messages.length === 0 ? (
          <EmptyState
            icon={Bot}
            title="AI Assistant"
            description="Ask me anything about your project, or use natural language commands."
            surface="bare"
            className="min-h-full"
          >
            <Flex direction="column" gap="xs" className="mt-4">
              <Typography variant="meta">
                <Icon icon={Lightbulb} size="sm" className="mr-1 inline" /> "What's our team
                velocity?"
              </Typography>
              <Typography variant="meta">
                <Icon icon={Lightbulb} size="sm" className="mr-1 inline" /> "Which issues are
                blocking the sprint?"
              </Typography>
              <Typography variant="meta">
                <Icon icon={Lightbulb} size="sm" className="mr-1 inline" /> "Summarize this week's
                progress"
              </Typography>
            </Flex>
          </EmptyState>
        ) : (
          <>
            {messages
              .filter((m) => m.role !== "system")
              .map((message) => (
                <MessageItem
                  key={`${message.chatId}-${message._creationTime}-${message.role}-${message.content.slice(0, 32)}`}
                  message={message}
                  chatId={message.chatId}
                  copiedMessageId={copiedMessageId}
                  onCopy={copyToClipboard}
                />
              ))}
            {isSending && (
              <Flex>
                <Card recipe="chatBubbleAssistant" padding="sm" className="w-fit">
                  <Flex align="center" gap="sm">
                    <InlineSpinner size="xs" variant="secondary" />
                    <Typography variant="caption">AI is thinking...</Typography>
                  </Flex>
                </Card>
              </Flex>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </Card>

      {/* Input Area */}
      <Card recipe="assistantComposer" radius="none" className="safe-area-inset-bottom">
        <Flex gap="sm" align="end">
          <FlexItem flex="1">
            <Textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your project..."
              disabled={isSending}
              variant="chatComposer"
              rows={1}
              style={{
                minHeight: `${AI_CONFIG.textarea.minHeight}px`,
                maxHeight: `${AI_CONFIG.textarea.maxHeight}px`,
              }}
            />
          </FlexItem>
          <Button
            variant="primary"
            size="icon"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isSending}
            isLoading={isSending}
            aria-label="Send message"
            className="shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <title>Send</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </Button>
        </Flex>
        <Typography variant="meta" className="mt-2 hidden sm:block">
          Press Enter to send, Shift+Enter for new line
        </Typography>
      </Card>
    </Flex>
  );
}
