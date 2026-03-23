/**
 * Comment Reactions
 *
 * Emoji reaction picker and display for comments.
 * Shows reaction counts with user tooltips on hover.
 * Supports adding/removing reactions with optimistic updates.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { Smile } from "@/lib/icons";
import { showError } from "@/lib/toast";
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
  const { mutate: toggleReaction } = useAuthenticatedMutation(api.reactions.toggleReaction);
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
              chrome={hasReacted ? "reactionActive" : "reaction"}
              chromeSize="reactionPill"
              onClick={() => handleToggle(reaction.emoji)}
              aria-label={`${reaction.emoji} reaction, ${reaction.userIds.length} vote${reaction.userIds.length === 1 ? "" : "s"}`}
              aria-pressed={hasReacted}
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
        <PopoverContent side="top" align="start" recipe="reactionPicker">
          <Flex gap="xs">
            {COMMON_EMOJIS.map((emoji) => (
              <Tooltip key={emoji} content={emoji}>
                <Button
                  variant="ghost"
                  size="iconSm"
                  onClick={() => handleToggle(emoji)}
                  aria-label={`React with ${emoji}`}
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
