/**
 * useAIChat Hook
 * Manages AI chat state and business logic
 */

import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useAction, useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";

export interface UseAIChatOptions {
  projectId?: Id<"projects">;
  initialChatId?: Id<"aiChats">;
  onChatCreated?: (chatId: Id<"aiChats">) => void;
}

export interface UseAIChatReturn {
  // State
  chatId: Id<"aiChats"> | null;
  inputMessage: string;
  isSending: boolean;
  copiedMessageId: string | null;

  // Refs
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;

  // Data
  messages: Doc<"aiMessages">[] | undefined;

  // Actions
  setInputMessage: (message: string) => void;
  handleSendMessage: () => Promise<void>;
  handleKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  copyToClipboard: (content: string, messageId: string) => Promise<void>;
}

export function useAIChat({
  projectId,
  initialChatId,
  onChatCreated,
}: UseAIChatOptions): UseAIChatReturn {
  const [chatId, setChatId] = useState<Id<"aiChats"> | null>(initialChatId || null);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const createChat = useMutation(api.ai.mutations.createChat);
  const sendMessage = useAction(api.ai.chat.chat);
  const messages = useQuery(api.ai.queries.getChatMessages, chatId ? { chatId } : "skip");

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages?.length, messages]); // Only depend on length, not entire array

  // Create chat on mount if no chatId provided
  useEffect(() => {
    if (!chatId) {
      createChat({ projectId, title: "New Chat" })
        .then(({ chatId: newChatId }) => {
          setChatId(newChatId);
          onChatCreated?.(newChatId);
        })
        .catch((_error) => {
          // Chat creation errors are handled by the mutation
        });
    }
  }, [chatId, createChat, onChatCreated, projectId]); // Empty deps - only run once on mount

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea && inputMessage !== undefined) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [inputMessage?.length, inputMessage]); // Only depend on length

  async function copyToClipboard(content: string, messageId: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch {
      // Silently fail if clipboard access is denied
    }
  }

  async function handleSendMessage() {
    if (!(inputMessage.trim() && chatId) || isSending) return;

    const message = inputMessage.trim();
    setInputMessage("");
    setIsSending(true);

    try {
      await sendMessage({
        chatId,
        message,
        projectId,
      });
    } catch (_error) {
      // Restore message on error
      setInputMessage(message);
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  return {
    // State
    chatId,
    inputMessage,
    isSending,
    copiedMessageId,

    // Refs
    messagesEndRef,
    textareaRef,

    // Data
    messages,

    // Actions
    setInputMessage,
    handleSendMessage,
    handleKeyPress,
    copyToClipboard,
  };
}
