import type { Meta, StoryObj } from "@storybook/react";
import { Grid } from "../ui/Grid";
import { Greeting } from "./Greeting";

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof Greeting> = {
  title: "Components/Dashboard/Greeting",
  component: Greeting,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Dashboard greeting component that displays a time-based greeting (morning/afternoon/evening), the user's first name, and their completed task count for the week.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl bg-ui-bg p-6 rounded-lg border border-ui-border">
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
    userName: "Alice Chen",
    completedCount: 12,
  },
  parameters: {
    docs: {
      description: {
        story: "Default greeting with user name and completed tasks.",
      },
    },
  },
};

export const NoCompletedTasks: Story = {
  args: {
    userName: "Bob Wilson",
    completedCount: 0,
  },
  parameters: {
    docs: {
      description: {
        story: "Greeting when no tasks have been completed this week.",
      },
    },
  },
};

export const SingleTask: Story = {
  args: {
    userName: "Charlie Brown",
    completedCount: 1,
  },
  parameters: {
    docs: {
      description: {
        story: "Singular 'task' text when only one task completed.",
      },
    },
  },
};

export const ManyTasks: Story = {
  args: {
    userName: "Diana Ross",
    completedCount: 47,
  },
  parameters: {
    docs: {
      description: {
        story: "User with high productivity this week.",
      },
    },
  },
};

export const NoUserName: Story = {
  args: {
    completedCount: 5,
  },
  parameters: {
    docs: {
      description: {
        story: "Falls back to 'there' when no user name provided.",
      },
    },
  },
};

export const LongName: Story = {
  args: {
    userName: "Alexander Bartholomew Christopher",
    completedCount: 8,
  },
  parameters: {
    docs: {
      description: {
        story: "Only the first name is displayed for long names.",
      },
    },
  },
};

export const SingleWordName: Story = {
  args: {
    userName: "Madonna",
    completedCount: 15,
  },
  parameters: {
    docs: {
      description: {
        story: "Single word names work correctly.",
      },
    },
  },
};

export const InDashboardContext: Story = {
  render: () => (
    <div className="space-y-6">
      <Greeting userName="Alice Chen" completedCount={12} />
      <Grid cols={2} gap="md">
        <div className="h-32 bg-ui-bg-secondary rounded-lg border border-ui-border" />
        <div className="h-32 bg-ui-bg-secondary rounded-lg border border-ui-border" />
      </Grid>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Greeting as it appears at the top of the dashboard.",
      },
    },
  },
};
