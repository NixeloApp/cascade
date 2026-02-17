import type { Meta, StoryObj } from "@storybook/react";
import { Smile } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Flex, FlexItem } from "./ui/Flex";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/Popover";
import { Tooltip } from "./ui/Tooltip";
import { Typography } from "./ui/Typography";

// =============================================================================
// Types
// =============================================================================

interface ReactionInfo {
  emoji: string;
  userIds: string[];
}

interface CommentReactionsPresentationalProps {
  reactions?: ReactionInfo[];
  currentUserId?: string;
  onToggleReaction?: (emoji: string) => void;
}

// =============================================================================
// Constants
// =============================================================================

const COMMON_EMOJIS = ["👍", "👎", "❤️", "🔥", "🚀", "👀", "✅", "🙌"];

// =============================================================================
// Presentational Component
// =============================================================================

function CommentReactionsPresentational({
  reactions = [],
  currentUserId,
  onToggleReaction = () => {},
}: CommentReactionsPresentationalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (emoji: string) => {
    onToggleReaction(emoji);
    setIsOpen(false);
  };

  return (
    <Flex align="center" gap="xs" wrap className="mt-2">
      {reactions.map((reaction) => {
        const hasReacted = Boolean(currentUserId && reaction.userIds.includes(currentUserId));
        return (
          <Tooltip key={reaction.emoji} content={hasReacted ? "Remove reaction" : "Add reaction"}>
            <button
              type="button"
              onClick={() => handleToggle(reaction.emoji)}
              aria-label={`${reaction.emoji} reaction, ${reaction.userIds.length} vote${reaction.userIds.length === 1 ? "" : "s"}`}
              aria-pressed={hasReacted}
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium transition-colors duration-default border",
                hasReacted
                  ? "bg-brand-subtle border-brand-border text-brand-subtle-foreground"
                  : "bg-ui-bg-soft border-ui-border text-ui-text-secondary hover:border-ui-border-secondary hover:bg-ui-bg-hover",
              )}
            >
              <span>{reaction.emoji}</span>
              <span>{reaction.userIds.length}</span>
            </button>
          </Tooltip>
        );
      })}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip content="Add reaction">
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Add reaction"
              className="inline-flex items-center justify-center w-6 h-6 rounded-full text-ui-text-tertiary hover:text-ui-text-secondary hover:bg-ui-bg-hover transition-colors duration-default"
            >
              <Smile size={16} />
            </button>
          </PopoverTrigger>
        </Tooltip>
        <PopoverContent side="top" align="start" className="w-auto p-1">
          <Flex gap="xs">
            {COMMON_EMOJIS.map((emoji) => (
              <Tooltip key={emoji} content={emoji}>
                <button
                  type="button"
                  onClick={() => handleToggle(emoji)}
                  aria-label={`React with ${emoji}`}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-ui-bg-hover transition-colors duration-default text-lg"
                >
                  {emoji}
                </button>
              </Tooltip>
            ))}
          </Flex>
        </PopoverContent>
      </Popover>
    </Flex>
  );
}

// =============================================================================
// Mock Data
// =============================================================================

const currentUserId = "user-1";

const mockReactionsBasic: ReactionInfo[] = [
  { emoji: "👍", userIds: ["user-1", "user-2", "user-3"] },
  { emoji: "❤️", userIds: ["user-2"] },
];

const mockReactionsMany: ReactionInfo[] = [
  { emoji: "👍", userIds: ["user-1", "user-2", "user-3", "user-4", "user-5"] },
  { emoji: "❤️", userIds: ["user-2", "user-3"] },
  { emoji: "🔥", userIds: ["user-1"] },
  { emoji: "🚀", userIds: ["user-4", "user-5", "user-6"] },
  { emoji: "✅", userIds: ["user-1", "user-2"] },
];

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof CommentReactionsPresentational> = {
  title: "Components/CommentReactions",
  component: CommentReactionsPresentational,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Reaction buttons for comments. Users can add emoji reactions to comments, with counts showing how many people have reacted.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="p-4 bg-ui-bg border border-ui-border rounded-lg min-w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Stories
// =============================================================================

export const Default: Story = {
  args: {
    reactions: mockReactionsBasic,
    currentUserId,
  },
  parameters: {
    docs: {
      description: {
        story: "Basic comment reactions with the current user having reacted to thumbs up.",
      },
    },
  },
};

export const NoReactions: Story = {
  args: {
    reactions: [],
    currentUserId,
  },
  parameters: {
    docs: {
      description: {
        story: "No reactions yet - only shows the add reaction button.",
      },
    },
  },
};

export const ManyReactions: Story = {
  args: {
    reactions: mockReactionsMany,
    currentUserId,
  },
  parameters: {
    docs: {
      description: {
        story: "Multiple emoji reactions from many users.",
      },
    },
  },
};

export const NotReacted: Story = {
  args: {
    reactions: [
      { emoji: "👍", userIds: ["user-2", "user-3"] },
      { emoji: "❤️", userIds: ["user-2"] },
    ],
    currentUserId,
  },
  parameters: {
    docs: {
      description: {
        story: "Current user has not reacted to any emoji.",
      },
    },
  },
};

export const SingleReaction: Story = {
  args: {
    reactions: [{ emoji: "👍", userIds: ["user-1"] }],
    currentUserId,
  },
  parameters: {
    docs: {
      description: {
        story: "Single reaction from the current user.",
      },
    },
  },
};

export const HighCounts: Story = {
  args: {
    reactions: [
      { emoji: "👍", userIds: Array.from({ length: 42 }, (_, i) => `user-${i}`) },
      { emoji: "❤️", userIds: Array.from({ length: 18 }, (_, i) => `user-${i}`) },
      { emoji: "🔥", userIds: Array.from({ length: 7 }, (_, i) => `user-${i}`) },
    ],
    currentUserId: "user-0",
  },
  parameters: {
    docs: {
      description: {
        story: "Reactions with high vote counts.",
      },
    },
  },
};

export const InCommentContext: Story = {
  render: () => (
    <div className="space-y-3">
      <Flex align="start" gap="sm">
        <FlexItem shrink={false} className="w-8 h-8 rounded-full bg-ui-bg-tertiary" />
        <FlexItem flex="1">
          <Flex align="center" gap="sm">
            <Typography variant="small" className="font-medium">
              Alice Chen
            </Typography>
            <Typography variant="caption" color="tertiary">
              2 hours ago
            </Typography>
          </Flex>
          <Typography variant="p" className="mt-1">
            I think we should prioritize this issue for the next sprint. It affects a lot of users.
          </Typography>
          <CommentReactionsPresentational
            reactions={mockReactionsBasic}
            currentUserId={currentUserId}
          />
        </FlexItem>
      </Flex>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Reactions shown in the context of a comment.",
      },
    },
  },
};

export const Interactive: Story = {
  render: () => {
    const [reactions, setReactions] = useState<ReactionInfo[]>([
      { emoji: "👍", userIds: ["user-2"] },
    ]);

    const handleToggle = (emoji: string) => {
      setReactions((prev) => {
        const existing = prev.find((r) => r.emoji === emoji);
        if (existing) {
          const hasUser = existing.userIds.includes("user-1");
          if (hasUser) {
            // Remove user from reaction
            const newUserIds = existing.userIds.filter((id) => id !== "user-1");
            if (newUserIds.length === 0) {
              return prev.filter((r) => r.emoji !== emoji);
            }
            return prev.map((r) => (r.emoji === emoji ? { ...r, userIds: newUserIds } : r));
          }
          // Add user to reaction
          return prev.map((r) =>
            r.emoji === emoji ? { ...r, userIds: [...r.userIds, "user-1"] } : r,
          );
        }
        // New reaction
        return [...prev, { emoji, userIds: ["user-1"] }];
      });
    };

    return (
      <div className="p-4">
        <Typography variant="p" className="mb-4">
          Click reactions to toggle, or click the smile icon to add new reactions.
        </Typography>
        <CommentReactionsPresentational
          reactions={reactions}
          currentUserId="user-1"
          onToggleReaction={handleToggle}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive demo where you can toggle reactions.",
      },
    },
  },
};

export const EmojiPicker: Story = {
  render: () => (
    <div className="p-4">
      <Typography variant="label" className="mb-3 block">
        Available Emoji Reactions
      </Typography>
      <Flex gap="sm" wrap>
        {COMMON_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-ui-bg-hover transition-colors text-xl border border-ui-border"
          >
            {emoji}
          </button>
        ))}
      </Flex>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "All available emoji options for reactions.",
      },
    },
  },
};
