/**
 * AIChat - Refactored with useAIChat hook
 */

import type { Id } from "@convex/_generated/dataModel";
import { cva } from "class-variance-authority";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, Check, Copy, Lightbulb } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";
import { Flex, FlexItem } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import { IconButton } from "../ui/IconButton";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Skeleton } from "../ui/Skeleton";
import { Textarea } from "../ui/Textarea";
import { Typography } from "../ui/Typography";
import { AI_CONFIG } from "./config";
import { useAIChat } from "./hooks";

const aiChatComposerVariants = cva("", {
  variants: {
    surface: {
      textarea:
        "resize-none overflow-hidden rounded-lg border-ui-border bg-ui-bg px-3 py-2 text-sm text-ui-text transition-all focus-visible:ring-2 focus-visible:ring-brand-ring sm:px-4 sm:py-3 sm:text-base",
    },
  },
});

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

  return (
    <div className={cn("flex group", message.role === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "relative max-w-chat-bubble md:max-w-chat-bubble-md rounded-lg px-4 py-3",
          message.role === "user"
            ? "bg-brand text-brand-foreground"
            : "bg-ui-bg-secondary text-ui-text",
        )}
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
          <div className="prose prose-sm max-w-none prose-pre:bg-ui-bg-hero prose-pre:text-ui-text-inverse prose-code:text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        ) : (
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        )}

        {/* Message metadata */}
        <Flex align="center" gap="sm" className="mt-2 text-xs opacity-70">
          <span>
            {new Date(message._creationTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {message.role === "assistant" && message.modelUsed && (
            <span className="hidden sm:inline">
              • {message.modelUsed.split("-").slice(0, 2).join("-")}
            </span>
          )}
          {message.role === "assistant" && message.responseTime && (
            <span className="hidden md:inline">• {(message.responseTime / 1000).toFixed(1)}s</span>
          )}
        </Flex>
      </div>
    </div>
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
      <Flex direction="column" gap="lg" className="flex-1 overflow-y-auto p-4">
        {!messages ? (
          <Flex direction="column" gap="lg">
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="h-16 w-2/3 ml-auto" />
            <Skeleton className="h-20 w-3/4" />
          </Flex>
        ) : messages.length === 0 ? (
          <Flex align="center" justify="center" className="h-full text-center">
            <div>
              <Icon icon={Bot} size="xl" className="mx-auto mb-4" />
              <Typography variant="h5" className="mb-2">
                AI Assistant
              </Typography>
              <Typography variant="muted" className="mb-4">
                Ask me anything about your project, or use natural language commands.
              </Typography>
              <Flex direction="column" gap="xs">
                <Typography variant="meta">
                  <Icon icon={Lightbulb} size="sm" className="inline mr-1" /> "What's our team
                  velocity?"
                </Typography>
                <Typography variant="meta">
                  <Icon icon={Lightbulb} size="sm" className="inline mr-1" /> "Which issues are
                  blocking the sprint?"
                </Typography>
                <Typography variant="meta">
                  <Icon icon={Lightbulb} size="sm" className="inline mr-1" /> "Summarize this week's
                  progress"
                </Typography>
              </Flex>
            </div>
          </Flex>
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
                <div className="bg-ui-bg-secondary rounded-lg px-4 py-3">
                  <Flex align="center" gap="sm">
                    <Flex gap="xs">
                      <div
                        className="w-2 h-2 bg-ui-text-tertiary rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-ui-text-tertiary rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-ui-text-tertiary rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </Flex>
                    <Typography variant="caption">AI is thinking...</Typography>
                  </Flex>
                </div>
              </Flex>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </Flex>

      {/* Input Area */}
      <div className="border-t border-ui-border p-3 sm:p-4 bg-ui-bg-secondary safe-area-inset-bottom">
        <Flex gap="sm" align="end">
          <FlexItem flex="1">
            <Textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your project..."
              disabled={isSending}
              className={aiChatComposerVariants({ surface: "textarea" })}
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
      </div>
    </Flex>
  );
}
