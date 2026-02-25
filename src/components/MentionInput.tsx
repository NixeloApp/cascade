import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Eye, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { CommentRenderer } from "./CommentRenderer";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { Command, CommandItem, CommandList } from "./ui/Command";
import { Flex } from "./ui/Flex";
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const members = useQuery(api.projectMembers.list, { projectId });

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

  return (
    <div className="relative">
      {/* Write/Preview Toggle */}
      {enablePreview && (
        <Flex gap="xs" className="mb-2">
          <Button
            variant={isPreviewMode ? "ghost" : "secondary"}
            size="sm"
            onClick={() => setIsPreviewMode(false)}
          >
            <Pencil className="w-3.5 h-3.5 mr-1" />
            Write
          </Button>
          <Button
            variant={isPreviewMode ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setIsPreviewMode(true)}
            disabled={!value.trim()}
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            Preview
          </Button>
        </Flex>
      )}

      {/* Preview Mode */}
      {isPreviewMode ? (
        <div
          className={cn(
            "w-full min-h-20 px-3 py-2 border border-ui-border rounded-lg bg-ui-bg-soft",
            className,
          )}
        >
          {value.trim() ? (
            <CommentRenderer content={value} />
          ) : (
            <Typography color="tertiary">Nothing to preview</Typography>
          )}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "w-full px-3 py-2 border border-ui-border rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring bg-ui-bg text-ui-text resize-none overflow-hidden",
            className,
          )}
          rows={3}
        />
      )}

      {/* Mention Suggestions Dropdown */}
      {showSuggestions && filteredMembers.length > 0 && !isPreviewMode && (
        <Command className="absolute bottom-full left-0 mb-2 w-64 border border-ui-border rounded-lg shadow-lg z-50">
          <CommandList className="max-h-48">
            {filteredMembers.map((member, index) => (
              <CommandItem
                key={member._id}
                value={member.userName || ""}
                onSelect={() => insertMention(member.userName || "Unknown", member.userId)}
                className={cn(index === selectedIndex && "bg-ui-bg-hover")}
              >
                <Avatar name={member.userName} size="md" />
                <div className="min-w-0">
                  <Typography variant="label" className="truncate">
                    {member.userName}
                  </Typography>
                  <Typography variant="caption" className="capitalize">
                    User
                  </Typography>
                </div>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      )}

      {/* Helper text */}
      <Typography variant="caption" className="mt-1">
        {isPreviewMode
          ? "Supports **bold**, *italic*, `code`, ~~strikethrough~~, and [links](url)"
          : "Type @ to mention team members. Supports markdown formatting."}
      </Typography>
    </div>
  );
}
