import type { Meta, StoryObj } from "@storybook/react";
import { Flex } from "../ui/Flex";
import { Typography } from "../ui/Typography";
import { BarChart } from "./BarChart";

const meta: Meta<typeof BarChart> = {
  title: "Analytics/BarChart",
  component: BarChart,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    data: {
      control: false,
      description: "Array of data points with label and value",
    },
    color: {
      control: "select",
      options: [
        "bg-status-info",
        "bg-status-success",
        "bg-status-warning",
        "bg-status-error",
        "bg-brand",
        "bg-accent",
      ],
      description: "Background color class for the bars",
    },
  },
  decorators: [
    (Story) => (
      <div className="h-64 w-full max-w-xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Basic Stories
// ============================================================================

export const Default: Story = {
  args: {
    data: [
      { label: "Category A", value: 30 },
      { label: "Category B", value: 45 },
      { label: "Category C", value: 22 },
      { label: "Category D", value: 58 },
    ],
    color: "bg-status-info",
  },
  parameters: {
    docs: {
      description: {
        story: "Basic horizontal bar chart with default info color.",
      },
    },
  },
};

export const SuccessColor: Story = {
  args: {
    data: [
      { label: "Jan", value: 12 },
      { label: "Feb", value: 19 },
      { label: "Mar", value: 25 },
      { label: "Apr", value: 31 },
    ],
    color: "bg-status-success",
  },
  parameters: {
    docs: {
      description: {
        story: "Bar chart with success (green) color theme.",
      },
    },
  },
};

export const WarningColor: Story = {
  args: {
    data: [
      { label: "Highest", value: 8 },
      { label: "High", value: 15 },
      { label: "Medium", value: 42 },
      { label: "Low", value: 23 },
      { label: "Lowest", value: 12 },
    ],
    color: "bg-status-warning",
  },
  parameters: {
    docs: {
      description: {
        story: "Bar chart with warning (yellow/orange) color theme.",
      },
    },
  },
};

export const BrandColor: Story = {
  args: {
    data: [
      { label: "Alice", value: 24 },
      { label: "Bob", value: 18 },
      { label: "Carol", value: 31 },
      { label: "David", value: 15 },
    ],
    color: "bg-brand",
  },
  parameters: {
    docs: {
      description: {
        story: "Bar chart with brand color theme.",
      },
    },
  },
};

export const AccentColor: Story = {
  args: {
    data: [
      { label: "Sprint 1", value: 21 },
      { label: "Sprint 2", value: 28 },
      { label: "Sprint 3", value: 25 },
      { label: "Sprint 4", value: 32 },
    ],
    color: "bg-accent",
  },
  parameters: {
    docs: {
      description: {
        story: "Bar chart with accent color theme.",
      },
    },
  },
};

// ============================================================================
// Use Case Stories
// ============================================================================

export const IssuesByStatus: Story = {
  args: {
    data: [
      { label: "Backlog", value: 45 },
      { label: "Todo", value: 23 },
      { label: "In Progress", value: 18 },
      { label: "In Review", value: 8 },
      { label: "Done", value: 87 },
    ],
    color: "bg-status-info",
  },
  parameters: {
    docs: {
      description: {
        story: "Bar chart showing issues grouped by status.",
      },
    },
  },
};

export const IssuesByType: Story = {
  args: {
    data: [
      { label: "Task", value: 45 },
      { label: "Bug", value: 23 },
      { label: "Story", value: 32 },
      { label: "Epic", value: 8 },
    ],
    color: "bg-status-success",
  },
  parameters: {
    docs: {
      description: {
        story: "Bar chart showing issues grouped by type.",
      },
    },
  },
};

export const IssuesByPriority: Story = {
  args: {
    data: [
      { label: "Highest", value: 5 },
      { label: "High", value: 12 },
      { label: "Medium", value: 35 },
      { label: "Low", value: 28 },
      { label: "Lowest", value: 15 },
    ],
    color: "bg-status-warning",
  },
  parameters: {
    docs: {
      description: {
        story: "Bar chart showing issues grouped by priority.",
      },
    },
  },
};

export const IssuesByAssignee: Story = {
  args: {
    data: [
      { label: "Alice Chen", value: 12 },
      { label: "Bob Smith", value: 8 },
      { label: "Carol Davis", value: 15 },
      { label: "David Wilson", value: 6 },
      { label: "Eve Martinez", value: 11 },
    ],
    color: "bg-brand",
  },
  parameters: {
    docs: {
      description: {
        story: "Bar chart showing issues grouped by assignee.",
      },
    },
  },
};

export const TeamVelocity: Story = {
  args: {
    data: [
      { label: "Sprint 1", value: 18 },
      { label: "Sprint 2", value: 24 },
      { label: "Sprint 3", value: 21 },
      { label: "Sprint 4", value: 28 },
      { label: "Sprint 5", value: 32 },
    ],
    color: "bg-accent",
  },
  parameters: {
    docs: {
      description: {
        story: "Bar chart showing team velocity across sprints.",
      },
    },
  },
};

// ============================================================================
// Edge Cases
// ============================================================================

export const SingleItem: Story = {
  args: {
    data: [{ label: "Only Item", value: 42 }],
    color: "bg-status-info",
  },
  parameters: {
    docs: {
      description: {
        story: "Bar chart with only a single data point.",
      },
    },
  },
};

export const ZeroValues: Story = {
  args: {
    data: [
      { label: "Empty A", value: 0 },
      { label: "Has Data", value: 25 },
      { label: "Empty B", value: 0 },
      { label: "Has More", value: 40 },
    ],
    color: "bg-status-success",
  },
  parameters: {
    docs: {
      description: {
        story: "Bar chart with some zero values (bars don't render for zero).",
      },
    },
  },
};

export const LongLabels: Story = {
  args: {
    data: [
      { label: "Very Long Label Name", value: 30 },
      { label: "Another Long One", value: 45 },
      { label: "Short", value: 22 },
      { label: "Extremely Long Label Text", value: 58 },
    ],
    color: "bg-status-info",
  },
  parameters: {
    docs: {
      description: {
        story: "Bar chart with long labels (truncated with ellipsis).",
      },
    },
  },
};

export const LargeValues: Story = {
  args: {
    data: [
      { label: "Team A", value: 1234 },
      { label: "Team B", value: 2567 },
      { label: "Team C", value: 891 },
      { label: "Team D", value: 3456 },
    ],
    color: "bg-brand",
  },
  parameters: {
    docs: {
      description: {
        story: "Bar chart with large numeric values.",
      },
    },
  },
};

export const ManyItems: Story = {
  args: {
    data: [
      { label: "Item 1", value: 15 },
      { label: "Item 2", value: 23 },
      { label: "Item 3", value: 8 },
      { label: "Item 4", value: 31 },
      { label: "Item 5", value: 19 },
      { label: "Item 6", value: 27 },
      { label: "Item 7", value: 12 },
      { label: "Item 8", value: 35 },
    ],
    color: "bg-accent",
  },
  decorators: [
    (Story) => (
      <div className="h-96 w-full max-w-xl">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: "Bar chart with many data items (taller container).",
      },
    },
  },
};

// ============================================================================
// Color Comparison
// ============================================================================

export const AllColors: Story = {
  render: () => (
    <Flex direction="column" gap="lg" className="max-w-3xl">
      <div>
        <Typography variant="label" className="mb-2 block">
          Info (bg-status-info)
        </Typography>
        <div className="h-32">
          <BarChart
            data={[
              { label: "A", value: 30 },
              { label: "B", value: 50 },
            ]}
            color="bg-status-info"
          />
        </div>
      </div>
      <div>
        <Typography variant="label" className="mb-2 block">
          Success (bg-status-success)
        </Typography>
        <div className="h-32">
          <BarChart
            data={[
              { label: "A", value: 30 },
              { label: "B", value: 50 },
            ]}
            color="bg-status-success"
          />
        </div>
      </div>
      <div>
        <Typography variant="label" className="mb-2 block">
          Warning (bg-status-warning)
        </Typography>
        <div className="h-32">
          <BarChart
            data={[
              { label: "A", value: 30 },
              { label: "B", value: 50 },
            ]}
            color="bg-status-warning"
          />
        </div>
      </div>
      <div>
        <Typography variant="label" className="mb-2 block">
          Brand (bg-brand)
        </Typography>
        <div className="h-32">
          <BarChart
            data={[
              { label: "A", value: 30 },
              { label: "B", value: 50 },
            ]}
            color="bg-brand"
          />
        </div>
      </div>
      <div>
        <Typography variant="label" className="mb-2 block">
          Accent (bg-accent)
        </Typography>
        <div className="h-32">
          <BarChart
            data={[
              { label: "A", value: 30 },
              { label: "B", value: 50 },
            ]}
            color="bg-accent"
          />
        </div>
      </div>
    </Flex>
  ),
  decorators: [],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        story: "Comparison of all available color themes.",
      },
    },
  },
};
