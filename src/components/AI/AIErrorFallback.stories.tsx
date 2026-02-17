import type { Meta, StoryObj } from "@storybook/react";
import { Flex } from "../ui/Flex";
import { Typography } from "../ui/Typography";
import { AIErrorFallback } from "./AIErrorFallback";

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof AIErrorFallback> = {
  title: "Components/AI/AIErrorFallback",
  component: AIErrorFallback,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Error boundary fallback component for AI features. Shows an error state with optional retry functionality and error details in development mode.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-96 h-80 border border-ui-border rounded-lg overflow-hidden">
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
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Default error fallback with standard messaging.",
      },
    },
  },
};

export const WithRetryButton: Story = {
  args: {
    onRetry: () => alert("Retrying..."),
  },
  parameters: {
    docs: {
      description: {
        story: "Error fallback with a retry button.",
      },
    },
  },
};

export const CustomMessage: Story = {
  args: {
    title: "Connection Lost",
    message: "Unable to connect to the AI service. Please check your internet connection.",
    onRetry: () => alert("Retrying..."),
  },
  parameters: {
    docs: {
      description: {
        story: "Custom error title and message.",
      },
    },
  },
};

export const WithErrorDetails: Story = {
  args: {
    error: new Error("Failed to fetch AI response: Network timeout after 30000ms"),
    onRetry: () => alert("Retrying..."),
  },
  parameters: {
    docs: {
      description: {
        story: "Shows error details in development mode (expandable).",
      },
    },
  },
};

export const WithStackTrace: Story = {
  args: {
    error: Object.assign(new Error("API rate limit exceeded"), {
      stack: `Error: API rate limit exceeded
    at fetchAIResponse (/src/lib/ai.ts:45:15)
    at AIChat.sendMessage (/src/components/AI/AIChat.tsx:123:20)
    at onClick (/src/components/AI/AIChat.tsx:156:9)`,
    }),
    onRetry: () => alert("Retrying..."),
  },
  parameters: {
    docs: {
      description: {
        story: "Shows full stack trace in development mode.",
      },
    },
  },
};

export const NoRetry: Story = {
  args: {
    title: "Service Unavailable",
    message: "The AI service is temporarily unavailable. Please try again later.",
  },
  parameters: {
    docs: {
      description: {
        story: "Error state without retry option.",
      },
    },
  },
};

export const ModelOverloaded: Story = {
  args: {
    title: "AI Model Busy",
    message: "The AI model is currently overloaded. Please wait a moment and try again.",
    onRetry: () => alert("Retrying..."),
  },
  parameters: {
    docs: {
      description: {
        story: "Example for model overload scenario.",
      },
    },
  },
};

export const AuthenticationError: Story = {
  args: {
    title: "Authentication Required",
    message: "Your session has expired. Please sign in again to use the AI assistant.",
  },
  parameters: {
    docs: {
      description: {
        story: "Error state for authentication issues.",
      },
    },
  },
};

export const InPanel: Story = {
  render: () => (
    <div className="w-80 h-96 bg-ui-bg border border-ui-border rounded-lg overflow-hidden shadow-lg">
      <Flex align="center" className="h-12 bg-ui-bg-secondary border-b border-ui-border px-4">
        <Typography variant="label">AI Assistant</Typography>
      </Flex>
      <AIErrorFallback
        title="Something went wrong"
        message="We couldn't load the AI assistant. Please try again."
        onRetry={() => alert("Retrying...")}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Error fallback as it appears within the AI panel.",
      },
    },
  },
  decorators: [],
};
