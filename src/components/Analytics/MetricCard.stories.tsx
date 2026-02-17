import type { Meta, StoryObj } from "@storybook/react";
import {
  AlertTriangle,
  Bug,
  CheckCircle,
  Clock,
  MapPin,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Flex } from "../ui/Flex";
import { MetricCard } from "./MetricCard";

const meta: Meta<typeof MetricCard> = {
  title: "Analytics/MetricCard",
  component: MetricCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: "text",
      description: "Title text for the metric",
    },
    value: {
      control: "number",
      description: "Numeric value to display",
    },
    subtitle: {
      control: "text",
      description: "Optional subtitle below the value",
    },
    icon: {
      control: false,
      description: "Lucide icon or emoji string",
    },
    highlight: {
      control: "boolean",
      description: "Whether to highlight the card with a warning ring",
    },
    testId: {
      control: "text",
      description: "Test ID for automated testing",
    },
  },
  decorators: [
    (Story) => (
      <div className="w-64">
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
    title: "Total Issues",
    value: 42,
    icon: TrendingUp,
  },
  parameters: {
    docs: {
      description: {
        story: "Basic metric card with title, value, and icon.",
      },
    },
  },
};

export const WithSubtitle: Story = {
  args: {
    title: "Avg Velocity",
    value: 23,
    subtitle: "points/sprint",
    icon: Zap,
  },
  parameters: {
    docs: {
      description: {
        story: "Metric card with an additional subtitle below the value.",
      },
    },
  },
};

export const Highlighted: Story = {
  args: {
    title: "Unassigned",
    value: 8,
    icon: MapPin,
    highlight: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Highlighted metric card with a warning ring to draw attention.",
      },
    },
  },
};

export const WithEmojiIcon: Story = {
  args: {
    title: "Tasks Done",
    value: 156,
    icon: "✅",
  },
  parameters: {
    docs: {
      description: {
        story: "Metric card using an emoji string instead of a Lucide icon.",
      },
    },
  },
};

// ============================================================================
// Use Case Stories
// ============================================================================

export const TotalIssues: Story = {
  args: {
    title: "Total Issues",
    value: 127,
    icon: TrendingUp,
  },
  parameters: {
    docs: {
      description: {
        story: "Typical metric showing total issue count.",
      },
    },
  },
};

export const UnassignedIssues: Story = {
  args: {
    title: "Unassigned",
    value: 5,
    icon: MapPin,
    highlight: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Unassigned issues metric with highlight indicating attention needed.",
      },
    },
  },
};

export const AverageVelocity: Story = {
  args: {
    title: "Avg Velocity",
    value: 32,
    subtitle: "points/sprint",
    icon: Zap,
  },
  parameters: {
    docs: {
      description: {
        story: "Team velocity metric with points per sprint subtitle.",
      },
    },
  },
};

export const CompletedSprints: Story = {
  args: {
    title: "Completed Sprints",
    value: 12,
    icon: CheckCircle,
  },
  parameters: {
    docs: {
      description: {
        story: "Completed sprints count.",
      },
    },
  },
};

export const OverdueItems: Story = {
  args: {
    title: "Overdue",
    value: 3,
    icon: AlertTriangle,
    highlight: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Overdue items metric with warning highlight.",
      },
    },
  },
};

export const ActiveUsers: Story = {
  args: {
    title: "Active Users",
    value: 24,
    icon: Users,
  },
  parameters: {
    docs: {
      description: {
        story: "Active users count metric.",
      },
    },
  },
};

export const OpenBugs: Story = {
  args: {
    title: "Open Bugs",
    value: 7,
    icon: Bug,
    highlight: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Open bugs metric with highlight.",
      },
    },
  },
};

export const TimeSpent: Story = {
  args: {
    title: "Time Spent",
    value: 156,
    subtitle: "hours this week",
    icon: Clock,
  },
  parameters: {
    docs: {
      description: {
        story: "Time tracking metric with hours subtitle.",
      },
    },
  },
};

// ============================================================================
// Value Variations
// ============================================================================

export const ZeroValue: Story = {
  args: {
    title: "Unassigned",
    value: 0,
    icon: MapPin,
    highlight: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Metric card showing zero value (no highlight needed).",
      },
    },
  },
};

export const LargeValue: Story = {
  args: {
    title: "Total Tasks",
    value: 9999,
    icon: TrendingUp,
  },
  parameters: {
    docs: {
      description: {
        story: "Metric card with a large 4-digit value.",
      },
    },
  },
};

// ============================================================================
// Grid Layout
// ============================================================================

export const DashboardGrid: Story = {
  render: () => (
    <Flex gap="md" wrap className="max-w-3xl">
      <div className="w-56">
        <MetricCard title="Total Issues" value={127} icon={TrendingUp} />
      </div>
      <div className="w-56">
        <MetricCard title="Unassigned" value={8} icon={MapPin} highlight={true} />
      </div>
      <div className="w-56">
        <MetricCard title="Avg Velocity" value={32} subtitle="points/sprint" icon={Zap} />
      </div>
      <div className="w-56">
        <MetricCard title="Completed Sprints" value={12} icon={CheckCircle} />
      </div>
    </Flex>
  ),
  parameters: {
    layout: "padded",
    docs: {
      description: {
        story: "Multiple metric cards in a dashboard grid layout.",
      },
    },
  },
};

export const AllHighlighted: Story = {
  render: () => (
    <Flex gap="md" wrap className="max-w-3xl">
      <div className="w-56">
        <MetricCard title="Unassigned" value={5} icon={MapPin} highlight={true} />
      </div>
      <div className="w-56">
        <MetricCard title="Overdue" value={3} icon={AlertTriangle} highlight={true} />
      </div>
      <div className="w-56">
        <MetricCard title="Open Bugs" value={7} icon={Bug} highlight={true} />
      </div>
    </Flex>
  ),
  parameters: {
    layout: "padded",
    docs: {
      description: {
        story: "Multiple highlighted metric cards showing items needing attention.",
      },
    },
  },
};
