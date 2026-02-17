import type { Meta, StoryObj } from "@storybook/react";
import { Flex } from "../ui/Flex";
import { Typography } from "../ui/Typography";
import { AIAssistantButton, type AIAssistantButtonProps } from "./AIAssistantButton";

// =============================================================================
// Presentational Component (for non-fixed positioning in Storybook)
// =============================================================================

function AIAssistantButtonPresentational(props: Omit<AIAssistantButtonProps, "position">) {
  return (
    <div className="relative w-20 h-20">
      <AIAssistantButton {...props} position={{ bottom: 0, right: 0 }} />
    </div>
  );
}

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof AIAssistantButtonPresentational> = {
  title: "Components/AI/AIAssistantButton",
  component: AIAssistantButtonPresentational,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A floating action button for opening the AI assistant. Supports unread count badge, multiple sizes, and keyboard shortcut hints.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Stories
// =============================================================================

export const Default: Story = {
  args: {
    onClick: () => alert("AI Assistant opened"),
  },
  parameters: {
    docs: {
      description: {
        story: "Default AI assistant button without notifications.",
      },
    },
  },
};

export const WithUnreadCount: Story = {
  args: {
    onClick: () => alert("AI Assistant opened"),
    unreadCount: 3,
  },
  parameters: {
    docs: {
      description: {
        story: "Button showing 3 unread suggestions.",
      },
    },
  },
};

export const WithMaxUnread: Story = {
  args: {
    onClick: () => alert("AI Assistant opened"),
    unreadCount: 15,
  },
  parameters: {
    docs: {
      description: {
        story: "Shows 9+ when count exceeds maximum.",
      },
    },
  },
};

export const SmallSize: Story = {
  args: {
    onClick: () => alert("AI Assistant opened"),
    size: "sm",
  },
  parameters: {
    docs: {
      description: {
        story: "Small size variant for compact layouts.",
      },
    },
  },
};

export const LargeSize: Story = {
  args: {
    onClick: () => alert("AI Assistant opened"),
    size: "lg",
  },
  parameters: {
    docs: {
      description: {
        story: "Large size variant for prominent placement.",
      },
    },
  },
};

export const CustomShortcut: Story = {
  args: {
    onClick: () => alert("AI Assistant opened"),
    keyboardShortcut: "Alt+A",
  },
  parameters: {
    docs: {
      description: {
        story: "Button with custom keyboard shortcut displayed in tooltip.",
      },
    },
  },
};

export const AllSizes: Story = {
  render: () => (
    <Flex gap="xl" align="center">
      <Flex direction="column" align="center" gap="sm">
        <div className="relative w-16 h-16">
          <AIAssistantButton
            onClick={() => alert("Small")}
            size="sm"
            position={{ bottom: 0, right: 0 }}
          />
        </div>
        <Typography variant="caption">Small</Typography>
      </Flex>
      <Flex direction="column" align="center" gap="sm">
        <div className="relative w-20 h-20">
          <AIAssistantButton
            onClick={() => alert("Medium")}
            size="md"
            position={{ bottom: 0, right: 0 }}
          />
        </div>
        <Typography variant="caption">Medium</Typography>
      </Flex>
      <Flex direction="column" align="center" gap="sm">
        <div className="relative w-24 h-24">
          <AIAssistantButton
            onClick={() => alert("Large")}
            size="lg"
            position={{ bottom: 0, right: 0 }}
          />
        </div>
        <Typography variant="caption">Large</Typography>
      </Flex>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Comparison of all available sizes.",
      },
    },
  },
};

export const WithNotificationBadges: Story = {
  render: () => (
    <Flex gap="xl" align="center">
      <Flex direction="column" align="center" gap="sm">
        <div className="relative w-20 h-20">
          <AIAssistantButton
            onClick={() => {}}
            unreadCount={1}
            position={{ bottom: 0, right: 0 }}
          />
        </div>
        <Typography variant="caption">1 notification</Typography>
      </Flex>
      <Flex direction="column" align="center" gap="sm">
        <div className="relative w-20 h-20">
          <AIAssistantButton
            onClick={() => {}}
            unreadCount={5}
            position={{ bottom: 0, right: 0 }}
          />
        </div>
        <Typography variant="caption">5 notifications</Typography>
      </Flex>
      <Flex direction="column" align="center" gap="sm">
        <div className="relative w-20 h-20">
          <AIAssistantButton
            onClick={() => {}}
            unreadCount={9}
            position={{ bottom: 0, right: 0 }}
          />
        </div>
        <Typography variant="caption">9 notifications</Typography>
      </Flex>
      <Flex direction="column" align="center" gap="sm">
        <div className="relative w-20 h-20">
          <AIAssistantButton
            onClick={() => {}}
            unreadCount={99}
            position={{ bottom: 0, right: 0 }}
          />
        </div>
        <Typography variant="caption">9+ (capped)</Typography>
      </Flex>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Shows how notification badges appear at different counts.",
      },
    },
  },
};

export const InPageContext: Story = {
  render: () => (
    <div className="relative w-96 h-64 bg-ui-bg-secondary rounded-lg border border-ui-border p-4">
      <Typography variant="h3" className="mb-2">
        Sample Page Content
      </Typography>
      <Typography color="secondary">
        The AI assistant button typically appears in the bottom-right corner of the page.
      </Typography>
      <AIAssistantButton
        onClick={() => alert("AI Assistant opened")}
        unreadCount={2}
        position={{ bottom: 4, right: 4 }}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Button positioned in context of a sample page layout.",
      },
    },
  },
};
