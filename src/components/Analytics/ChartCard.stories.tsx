import type { Meta, StoryObj } from "@storybook/react";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Typography } from "../ui/Typography";
import { BarChart } from "./BarChart";
import { ChartCard } from "./ChartCard";

const meta: Meta<typeof ChartCard> = {
  title: "Analytics/ChartCard",
  component: ChartCard,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: "text",
      description: "Title text for the chart card",
    },
    children: {
      control: false,
      description: "Chart content to render inside the card",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Basic Stories
// ============================================================================

export const Default: Story = {
  args: {
    title: "Chart Title",
    children: (
      <BarChart
        data={[
          { label: "A", value: 30 },
          { label: "B", value: 45 },
          { label: "C", value: 22 },
          { label: "D", value: 58 },
        ]}
        color="bg-status-info"
      />
    ),
  },
  parameters: {
    docs: {
      description: {
        story: "Basic chart card with a bar chart inside.",
      },
    },
  },
};

export const WithStatusChart: Story = {
  args: {
    title: "Issues by Status",
    children: (
      <BarChart
        data={[
          { label: "Backlog", value: 45 },
          { label: "Todo", value: 23 },
          { label: "In Progress", value: 18 },
          { label: "In Review", value: 8 },
          { label: "Done", value: 87 },
        ]}
        color="bg-status-info"
      />
    ),
  },
  parameters: {
    docs: {
      description: {
        story: "Chart card showing issues by status.",
      },
    },
  },
};

export const WithTypeChart: Story = {
  args: {
    title: "Issues by Type",
    children: (
      <BarChart
        data={[
          { label: "Task", value: 45 },
          { label: "Bug", value: 23 },
          { label: "Story", value: 32 },
          { label: "Epic", value: 8 },
        ]}
        color="bg-status-success"
      />
    ),
  },
  parameters: {
    docs: {
      description: {
        story: "Chart card showing issues by type.",
      },
    },
  },
};

export const WithPriorityChart: Story = {
  args: {
    title: "Issues by Priority",
    children: (
      <BarChart
        data={[
          { label: "Highest", value: 5 },
          { label: "High", value: 12 },
          { label: "Medium", value: 35 },
          { label: "Low", value: 28 },
          { label: "Lowest", value: 15 },
        ]}
        color="bg-status-warning"
      />
    ),
  },
  parameters: {
    docs: {
      description: {
        story: "Chart card showing issues by priority.",
      },
    },
  },
};

export const WithVelocityChart: Story = {
  args: {
    title: "Team Velocity (Last 10 Sprints)",
    children: (
      <BarChart
        data={[
          { label: "Sprint 1", value: 18 },
          { label: "Sprint 2", value: 24 },
          { label: "Sprint 3", value: 21 },
          { label: "Sprint 4", value: 28 },
          { label: "Sprint 5", value: 32 },
        ]}
        color="bg-accent"
      />
    ),
  },
  parameters: {
    docs: {
      description: {
        story: "Chart card showing team velocity across sprints.",
      },
    },
  },
};

export const WithAssigneeChart: Story = {
  args: {
    title: "Issues by Assignee",
    children: (
      <BarChart
        data={[
          { label: "Alice Chen", value: 12 },
          { label: "Bob Smith", value: 8 },
          { label: "Carol Davis", value: 15 },
          { label: "David Wilson", value: 6 },
          { label: "Eve Martinez", value: 11 },
        ]}
        color="bg-brand"
      />
    ),
  },
  parameters: {
    docs: {
      description: {
        story: "Chart card showing issues by assignee.",
      },
    },
  },
};

// ============================================================================
// Empty State
// ============================================================================

export const EmptyChart: Story = {
  args: {
    title: "No Data Available",
    children: (
      <Flex align="center" justify="center" className="h-full text-ui-text-secondary">
        <Typography variant="p">No data to display</Typography>
      </Flex>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: "Chart card with empty state message.",
      },
    },
  },
};

export const NoSprintsYet: Story = {
  args: {
    title: "Team Velocity (Last 10 Sprints)",
    children: (
      <Flex align="center" justify="center" className="h-full text-ui-text-secondary">
        <Typography variant="p">No completed sprints yet</Typography>
      </Flex>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: "Chart card showing message when no sprint data exists.",
      },
    },
  },
};

// ============================================================================
// Grid Layout
// ============================================================================

export const DashboardGrid: Story = {
  render: () => (
    <Grid cols={1} colsLg={2} gap="lg" className="max-w-5xl">
      <ChartCard title="Issues by Status">
        <BarChart
          data={[
            { label: "Backlog", value: 45 },
            { label: "Todo", value: 23 },
            { label: "In Progress", value: 18 },
            { label: "Done", value: 87 },
          ]}
          color="bg-status-info"
        />
      </ChartCard>
      <ChartCard title="Issues by Type">
        <BarChart
          data={[
            { label: "Task", value: 45 },
            { label: "Bug", value: 23 },
            { label: "Story", value: 32 },
            { label: "Epic", value: 8 },
          ]}
          color="bg-status-success"
        />
      </ChartCard>
      <ChartCard title="Issues by Priority">
        <BarChart
          data={[
            { label: "Highest", value: 5 },
            { label: "High", value: 12 },
            { label: "Medium", value: 35 },
            { label: "Low", value: 28 },
          ]}
          color="bg-status-warning"
        />
      </ChartCard>
      <ChartCard title="Team Velocity">
        <BarChart
          data={[
            { label: "Sprint 1", value: 18 },
            { label: "Sprint 2", value: 24 },
            { label: "Sprint 3", value: 21 },
            { label: "Sprint 4", value: 28 },
          ]}
          color="bg-accent"
        />
      </ChartCard>
    </Grid>
  ),
  parameters: {
    docs: {
      description: {
        story: "Multiple chart cards in a dashboard grid layout.",
      },
    },
  },
};
