/**
 * Comment Reactions
 *
 * Emoji reaction picker and display for comments.
 * Shows reaction counts with user tooltips on hover.
 * Supports adding/removing reactions with optimistic updates.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Smile } from "lucide-react";
import { useState } from "react";
import { showError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { ReactionInfo } from "../../convex/lib/issueHelpers";
import { Button } from "./ui/Button";
import { Flex } from "./ui/Flex";
import { IconButton } from "./ui/IconButton";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/Popover";
import { Tooltip } from "./ui/Tooltip";

interface CommentReactionsProps {
  commentId: Id<"issueComments">;
  reactions: ReactionInfo[];
  currentUserId?: Id<"users">;
}

const COMMON_EMOJIS = ["👍", "👎", "❤️", "🔥", "🚀", "👀", "✅", "🙌"];

/** Emoji reaction buttons for issue comments with toggle functionality. */
export function CommentReactions({ commentId, reactions, currentUserId }: CommentReactionsProps) {
  const toggleReaction = useMutation(api.reactions.toggleReaction);
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = async (emoji: string) => {
    try {
      await toggleReaction({ commentId, emoji });
      setIsOpen(false);
    } catch (error) {
      showError(error, "Failed to update reaction");
    }
  };

  return (
    <Flex align="center" gap="xs" wrap className="mt-2">
      {reactions.map((reaction) => {
        const hasReacted = currentUserId && reaction.userIds.includes(currentUserId);
        return (
          <Tooltip key={reaction.emoji} content={hasReacted ? "Remove reaction" : "Add reaction"}>
            <Button
              variant="unstyled"
              onClick={() => handleToggle(reaction.emoji)}
              aria-label={`${reaction.emoji} reaction, ${reaction.userIds.length} vote${reaction.userIds.length === 1 ? "" : "s"}`}
              aria-pressed={hasReacted}
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border h-auto transition-fast",
                hasReacted
                  ? "bg-brand-subtle border-brand-border text-brand-subtle-foreground"
                  : "bg-ui-bg-soft border-ui-border text-ui-text-secondary hover:border-ui-border-secondary hover:bg-ui-bg-hover",
              )}
            >
              <span>{reaction.emoji}</span>
              <span>{reaction.userIds.length}</span>
            </Button>
          </Tooltip>
        );
      })}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip content="Add reaction">
          <PopoverTrigger asChild>
            <IconButton size="xs" aria-label="Add reaction">
              <Smile size={16} />
            </IconButton>
          </PopoverTrigger>
        </Tooltip>
        <PopoverContent side="top" align="start" className="w-auto p-1.5">
          <Flex gap="xs">
            {COMMON_EMOJIS.map((emoji) => (
              <Tooltip key={emoji} content={emoji}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggle(emoji)}
                  aria-label={`React with ${emoji}`}
                  className="w-8 h-8"
                >
                  {emoji}
                </Button>
              </Tooltip>
            ))}
          </Flex>
        </PopoverContent>
      </Popover>
    </Flex>
  );
}
