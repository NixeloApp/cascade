import type { Meta, StoryObj } from "@storybook/react";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Flex, FlexItem } from "./ui/Flex";
import { Typography } from "./ui/Typography";

// =============================================================================
// Types
// =============================================================================

interface CommentRendererPresentationalProps {
  content: string;
}

// =============================================================================
// Presentational Component
// =============================================================================

function MentionBadge({ userName }: { userName: string }) {
  return (
    <Badge
      variant="brand"
      size="sm"
      className="transition-colors duration-default hover:bg-brand-border cursor-default"
      title={`@${userName}`}
    >
      @{userName}
    </Badge>
  );
}

function CommentRendererPresentational({ content }: CommentRendererPresentationalProps) {
  const renderContent = () => {
    const mentionPattern = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;

    match = mentionPattern.exec(content);
    while (match !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={`text-${key++}`}>{content.substring(lastIndex, match.index)}</span>);
      }

      const userName = match[1];
      parts.push(<MentionBadge key={`mention-${key++}`} userName={userName} />);

      lastIndex = match.index + match[0].length;
      match = mentionPattern.exec(content);
    }

    if (lastIndex < content.length) {
      parts.push(<span key={`text-${key++}`}>{content.substring(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : content;
  };

  return (
    <div className="text-ui-text-secondary whitespace-pre-wrap break-words leading-relaxed">
      {renderContent()}
    </div>
  );
}

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof CommentRendererPresentational> = {
  title: "Components/CommentRenderer",
  component: CommentRendererPresentational,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Renders comment content with @mentions highlighted as badges. Parses the mention format @[username](userId) and displays them as interactive badges.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-96 p-4 bg-ui-bg border border-ui-border rounded-lg">
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
    content: "This is a simple comment without any mentions.",
  },
  parameters: {
    docs: {
      description: {
        story: "Plain text comment without any mentions.",
      },
    },
  },
};

export const WithSingleMention: Story = {
  args: {
    content: "Hey @[Alice Chen](user-123), can you review this?",
  },
  parameters: {
    docs: {
      description: {
        story: "Comment with a single @mention.",
      },
    },
  },
};

export const WithMultipleMentions: Story = {
  args: {
    content:
      "Great work @[Alice Chen](user-123) and @[Bob Wilson](user-456)! Let's sync with @[Charlie Brown](user-789) tomorrow.",
  },
  parameters: {
    docs: {
      description: {
        story: "Comment with multiple @mentions.",
      },
    },
  },
};

export const MentionAtStart: Story = {
  args: {
    content: "@[Alice Chen](user-123) please take a look at this issue.",
  },
  parameters: {
    docs: {
      description: {
        story: "Mention at the beginning of the comment.",
      },
    },
  },
};

export const MentionAtEnd: Story = {
  args: {
    content: "Assigned this to @[Bob Wilson](user-456)",
  },
  parameters: {
    docs: {
      description: {
        story: "Mention at the end of the comment.",
      },
    },
  },
};

export const OnlyMention: Story = {
  args: {
    content: "@[Alice Chen](user-123)",
  },
  parameters: {
    docs: {
      description: {
        story: "Comment that is just a mention.",
      },
    },
  },
};

export const MultilineComment: Story = {
  args: {
    content: `Hey team,

I've reviewed the PR and it looks good. @[Alice Chen](user-123) made some great improvements to the API.

A few things to note:
- Performance improved by 20%
- No breaking changes

@[Bob Wilson](user-456) can you deploy this when ready?

Thanks!`,
  },
  parameters: {
    docs: {
      description: {
        story: "Multi-line comment with mentions preserving whitespace.",
      },
    },
  },
};

export const LongComment: Story = {
  args: {
    content:
      "This is a longer comment that demonstrates how the component handles text wrapping. @[Alice Chen](user-123) mentioned that we need to handle edge cases where the comment might be quite long and span multiple lines. The mention badges should integrate seamlessly with the surrounding text without breaking the flow.",
  },
  parameters: {
    docs: {
      description: {
        story: "Long comment showing text wrapping behavior.",
      },
    },
  },
};

export const InCommentThread: Story = {
  render: () => (
    <Card className="w-full max-w-md">
      <CardHeader title="Discussion" description="3 comments" />
      <CardBody className="space-y-4">
        <Flex gap="sm" align="start">
          <Avatar name="Alice Chen" size="sm" />
          <FlexItem flex="1">
            <Flex align="center" gap="sm" className="mb-1">
              <Typography variant="small" className="font-medium">
                Alice Chen
              </Typography>
              <Typography variant="caption" color="tertiary">
                2h ago
              </Typography>
            </Flex>
            <CommentRendererPresentational content="I think we should prioritize this for the next sprint." />
          </FlexItem>
        </Flex>

        <Flex gap="sm" align="start">
          <Avatar name="Bob Wilson" size="sm" />
          <FlexItem flex="1">
            <Flex align="center" gap="sm" className="mb-1">
              <Typography variant="small" className="font-medium">
                Bob Wilson
              </Typography>
              <Typography variant="caption" color="tertiary">
                1h ago
              </Typography>
            </Flex>
            <CommentRendererPresentational content="Agreed @[Alice Chen](user-123). I'll add it to the backlog." />
          </FlexItem>
        </Flex>

        <Flex gap="sm" align="start">
          <Avatar name="Charlie Brown" size="sm" />
          <FlexItem flex="1">
            <Flex align="center" gap="sm" className="mb-1">
              <Typography variant="small" className="font-medium">
                Charlie Brown
              </Typography>
              <Typography variant="caption" color="tertiary">
                30m ago
              </Typography>
            </Flex>
            <CommentRendererPresentational content="@[Alice Chen](user-123) @[Bob Wilson](user-456) let's discuss in standup." />
          </FlexItem>
        </Flex>
      </CardBody>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: "Multiple comments in a thread context.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-md">
        <Story />
      </div>
    ),
  ],
};

export const SpecialCharacters: Story = {
  args: {
    content:
      "Testing with special chars: @[O'Brien, John](user-123) mentioned <script> and & symbols.",
  },
  parameters: {
    docs: {
      description: {
        story: "Comment with special characters in text and mentions.",
      },
    },
  },
};
