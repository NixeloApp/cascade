import type { Meta, StoryObj } from "@storybook/react";
import { WifiOff } from "lucide-react";
import { Flex } from "./ui/Flex";
import { Typography } from "./ui/Typography";

// =============================================================================
// Presentational Component
// =============================================================================

interface OfflineBannerPresentationalProps {
  isOffline?: boolean;
}

function OfflineBannerPresentational({ isOffline = true }: OfflineBannerPresentationalProps) {
  if (!isOffline) {
    return null;
  }

  return (
    <Flex
      align="center"
      justify="center"
      gap="sm"
      className="bg-status-warning-bg text-status-warning-text px-4 py-2 animate-slide-up"
    >
      <WifiOff className="h-4 w-4" />
      <Typography variant="small" className="font-medium">
        You're offline. Changes will sync when you reconnect.
      </Typography>
    </Flex>
  );
}

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof OfflineBannerPresentational> = {
  title: "Components/OfflineBanner",
  component: OfflineBannerPresentational,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Banner displayed at the top of the app when the user is offline. Informs users that changes will sync when they reconnect.",
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
    isOffline: true,
  },
  parameters: {
    docs: {
      description: {
        story: "The offline banner shown when the user loses internet connection.",
      },
    },
  },
};

export const Online: Story = {
  args: {
    isOffline: false,
  },
  parameters: {
    docs: {
      description: {
        story: "When online, the banner is not rendered (returns null).",
      },
    },
  },
};

export const InAppContext: Story = {
  render: () => (
    <div className="min-h-screen bg-ui-bg">
      <OfflineBannerPresentational isOffline />
      <div className="p-8">
        <Typography variant="h1" className="mb-4">
          Dashboard
        </Typography>
        <Typography variant="p" color="secondary">
          The offline banner appears at the top of the app, above the main content.
        </Typography>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "The banner shown in context at the top of the application.",
      },
    },
  },
};

export const MultipleStates: Story = {
  render: () => (
    <div className="space-y-8 p-4">
      <div>
        <Typography variant="label" className="mb-2 block">
          Offline State
        </Typography>
        <div className="border border-ui-border rounded-lg overflow-hidden">
          <OfflineBannerPresentational isOffline />
        </div>
      </div>
      <div>
        <Typography variant="label" className="mb-2 block">
          Online State (hidden)
        </Typography>
        <div className="border border-ui-border rounded-lg p-4 bg-ui-bg-secondary">
          <Typography variant="small" color="secondary" className="text-center">
            Banner is hidden when online
          </Typography>
          <OfflineBannerPresentational isOffline={false} />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: "padded",
    docs: {
      description: {
        story: "Comparison of offline and online states side by side.",
      },
    },
  },
};
