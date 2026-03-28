/**
 * Mention Input
 *
 * Rich text input with @mention support for users.
 * Shows autocomplete dropdown when typing @ followed by text.
 * Tracks mentioned users and renders usernames with highlights.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useEffect, useRef, useState } from "react";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { Eye, Pencil } from "@/lib/icons";
import { CommentRenderer } from "./CommentRenderer";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Command } from "./ui/Command";
import { Flex } from "./ui/Flex";
import { IconButton } from "./ui/IconButton";
import { Popover } from "./ui/Popover";
import { Stack } from "./ui/Stack";
import { Textarea } from "./ui/Textarea";
import { Tooltip } from "./ui/Tooltip";
import { Typography } from "./ui/Typography";

interface MentionInputProps {
  projectId: Id<"projects">;
  value: string;
  onChange: (value: string) => void;
  onMentionsChange: (mentions: Id<"users">[]) => void;
  placeholder?: string;
  className?: string;
  /** Enable markdown preview toggle */
  enablePreview?: boolean;
}

const COMMENT_EMOJIS = ["😀", "👍", "❤️", "🔥", "🎉", "✅", "🚀", "👀"] as const;

/** Textarea with @mention autocomplete and markdown preview toggle. */
export function MentionInput({
  projectId,
  value,
  onChange,
  onMentionsChange,
  placeholder = "Add a comment...",
  className = "",
  enablePreview = true,
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const members = useAuthenticatedQuery(api.projectMembers.list, { projectId });

  // Filter members based on mention search
  const filteredMembers =
    members?.filter((member) =>
      (member.userName || "").toLowerCase().includes(mentionSearch.toLowerCase()),
    ) || [];

  // Reset selection when mention search changes (Derived State Pattern)
  const [prevMentionSearch, setPrevMentionSearch] = useState(mentionSearch);
  if (mentionSearch !== prevMentionSearch) {
    setPrevMentionSearch(mentionSearch);
    setSelectedIndex(0);
  }

  useEffect(() => {
    // Adjust textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;

    onChange(newValue);
    setCursorPosition(cursorPos);

    // Check if user is typing @ mention
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setMentionSearch(mentionMatch[1]);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }

    // Extract all mentions from the text
    extractMentions(newValue);
  };

  const extractMentions = (text: string) => {
    const mentionPattern = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentionIds: Id<"users">[] = [];
    let match: RegExpExecArray | null;

    match = mentionPattern.exec(text);
    while (match !== null) {
      mentionIds.push(match[2] as Id<"users">);
      match = mentionPattern.exec(text);
    }

    onMentionsChange(mentionIds);
  };

  const insertMention = (userName: string, userId: Id<"users">) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);

    // Find the @ symbol position
    const atIndex = textBeforeCursor.lastIndexOf("@");
    const beforeMention = textBeforeCursor.substring(0, atIndex);
    const mention = `@[${userName}](${userId})`;
    const newValue = `${beforeMention + mention} ${textAfterCursor}`;

    onChange(newValue);
    setShowSuggestions(false);
    setMentionSearch("");

    // Focus back to textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeMention.length + mention.length + 1;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);

    extractMentions(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredMembers.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredMembers.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter": {
        if (e.shiftKey) return; // Allow Shift+Enter for new line
        e.preventDefault();
        const selectedMember = filteredMembers[selectedIndex];
        if (selectedMember) {
          insertMention(selectedMember.userName || "Unknown", selectedMember.userId);
        }
        break;
      }
      case "Escape":
        e.preventDefault();
        setShowSuggestions(false);
        break;
    }
  };

  const insertEmoji = (emoji: string) => {
    const selectionStart = textareaRef.current?.selectionStart ?? value.length;
    const selectionEnd = textareaRef.current?.selectionEnd ?? selectionStart;
    const newValue = value.slice(0, selectionStart) + emoji + value.slice(selectionEnd);

    onChange(newValue);
    extractMentions(newValue);
    setIsEmojiOpen(false);

    const nextCursorPos = selectionStart + emoji.length;
    setCursorPosition(nextCursorPos);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(nextCursorPos, nextCursorPos);
      }
    }, 0);
  };

  return (
    <Stack gap="sm" className="relative">
      {/* Write/Preview Toggle */}
      {enablePreview && (
        <Flex justify="between" align="center">
          <Flex gap="xs">
            <Button
              variant={isPreviewMode ? "ghost" : "secondary"}
              size="sm"
              onClick={() => setIsPreviewMode(false)}
              leftIcon={<Pencil size={14} />}
            >
              Write
            </Button>
            <Button
              variant={isPreviewMode ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setIsPreviewMode(true)}
              disabled={!value.trim()}
              leftIcon={<Eye size={14} />}
            >
              Preview
            </Button>
          </Flex>

          <Popover
            align="end"
            className="w-auto"
            open={isEmojiOpen}
            onOpenChange={setIsEmojiOpen}
            recipe="reactionPicker"
            side="bottom"
            tooltip={{ content: "Insert emoji" }}
            trigger={
              <IconButton size="sm" aria-label="Insert emoji" disabled={isPreviewMode}>
                <Typography as="span" aria-hidden="true">
                  😊
                </Typography>
              </IconButton>
            }
          >
            {() => (
              <Flex gap="xs" wrap>
                {COMMENT_EMOJIS.map((emoji) => (
                  <Tooltip key={emoji} content={emoji}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => insertEmoji(emoji)}
                      aria-label={`Insert ${emoji}`}
                    >
                      {emoji}
                    </Button>
                  </Tooltip>
                ))}
              </Flex>
            )}
          </Popover>
        </Flex>
      )}

      {/* Preview Mode */}
      {isPreviewMode ? (
        <Card recipe="overlayInset" padding="sm" className={className}>
          {value.trim() ? (
            <CommentRenderer content={value} />
          ) : (
            <Typography color="tertiary">Nothing to preview</Typography>
          )}
        </Card>
      ) : (
        <Textarea
          ref={textareaRef}
          variant="chatComposer"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onClick={(event) => setCursorPosition(event.currentTarget.selectionStart)}
          onKeyUp={(event) => setCursorPosition(event.currentTarget.selectionStart)}
          placeholder={placeholder}
          className={className}
          rows={3}
        />
      )}

      {/* Mention Suggestions Dropdown */}
      {showSuggestions && filteredMembers.length > 0 && !isPreviewMode && (
        <Command
          recipe="suggestionMenu"
          className="absolute bottom-full left-0 z-50 mb-2 w-64"
          listClassName="max-h-48"
          sections={[
            {
              id: "mention-suggestions",
              items: filteredMembers.map((member, index) => ({
                value: member.userName || "",
                onSelect: () => insertMention(member.userName || "Unknown", member.userId),
                selected: index === selectedIndex,
                render: (
                  <>
                    <Avatar name={member.userName} size="md" />
                    <Stack gap="xs" className="min-w-0">
                      <Typography variant="label" className="truncate">
                        {member.userName}
                      </Typography>
                      <Typography variant="caption" className="capitalize">
                        User
                      </Typography>
                    </Stack>
                  </>
                ),
              })),
            },
          ]}
        />
      )}

      {/* Helper text */}
      <Typography variant="caption" className="mt-1">
        {isPreviewMode
          ? "Supports **bold**, *italic*, `code`, ~~strikethrough~~, and [links](url)"
          : "Type @ to mention team members. Supports markdown formatting."}
      </Typography>
    </Stack>
  );
}
