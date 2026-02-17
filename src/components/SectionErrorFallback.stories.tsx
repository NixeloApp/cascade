import type { Meta, StoryObj } from "@storybook/react";
import { SectionErrorFallback } from "./SectionErrorFallback";
import { Grid } from "./ui/Grid";
import { Typography } from "./ui/Typography";

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof SectionErrorFallback> = {
  title: "Components/SectionErrorFallback",
  component: SectionErrorFallback,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A fallback UI for sections that encounter an error. Shows an alert icon, title, message, and optional retry button.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-96 h-64 p-4 bg-ui-bg border border-ui-border rounded-lg">
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
    title: "Failed to load data",
  },
  parameters: {
    docs: {
      description: {
        story: "Default error fallback with just a title and default message.",
      },
    },
  },
};

export const WithCustomMessage: Story = {
  args: {
    title: "Connection lost",
    message:
      "We couldn't connect to the server. Please check your internet connection and try again.",
  },
  parameters: {
    docs: {
      description: {
        story: "Error fallback with a custom message providing more context.",
      },
    },
  },
};

export const WithRetryButton: Story = {
  args: {
    title: "Failed to load issues",
    message: "There was a problem loading your issues. Click below to try again.",
    onRetry: () => alert("Retry clicked!"),
  },
  parameters: {
    docs: {
      description: {
        story: "Error fallback with a retry button for recoverable errors.",
      },
    },
  },
};

export const NetworkError: Story = {
  args: {
    title: "Network Error",
    message: "Unable to reach the server. This might be a temporary issue.",
    onRetry: () => alert("Retrying..."),
  },
  parameters: {
    docs: {
      description: {
        story: "Example for network-related errors.",
      },
    },
  },
};

export const PermissionError: Story = {
  args: {
    title: "Access Denied",
    message:
      "You don't have permission to view this content. Contact your administrator if you believe this is an error.",
  },
  parameters: {
    docs: {
      description: {
        story: "Example for permission-related errors without retry option.",
      },
    },
  },
};

export const InDashboard: Story = {
  render: () => (
    <div className="w-full max-w-4xl p-6 bg-ui-bg">
      <Typography variant="h2" className="mb-4">
        Dashboard
      </Typography>
      <Grid cols={2} gap="md">
        <div className="p-4 bg-ui-bg-soft border border-ui-border rounded-lg">
          <Typography variant="label" className="mb-2">
            Stats
          </Typography>
          <Typography variant="p" color="secondary">
            Working section
          </Typography>
        </div>
        <div className="h-48 bg-ui-bg-soft border border-ui-border rounded-lg">
          <SectionErrorFallback
            title="Failed to load activity"
            message="Recent activity couldn't be loaded."
            onRetry={() => alert("Retrying activity...")}
          />
        </div>
      </Grid>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Error fallback shown in the context of a dashboard layout.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full">
        <Story />
      </div>
    ),
  ],
};

export const LongMessage: Story = {
  args: {
    title: "Synchronization Failed",
    message:
      "We encountered an unexpected error while synchronizing your data with the server. This could be due to a temporary service disruption or network instability. Please wait a few moments and try again. If the problem persists, please contact support with error code ERR-SYNC-2024.",
    onRetry: () => alert("Retry clicked!"),
  },
  parameters: {
    docs: {
      description: {
        story: "Handling of longer error messages with detailed information.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[500px] h-80 p-4 bg-ui-bg border border-ui-border rounded-lg">
        <Story />
      </div>
    ),
  ],
};
