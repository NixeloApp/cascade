import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "../ui/Badge";
import { Card, CardBody } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Typography } from "../ui/Typography";

// =============================================================================
// Types
// =============================================================================

interface FocusTask {
  _id: string;
  key: string;
  title: string;
  priority: string;
  status: string;
  projectName: string;
  projectKey: string;
}

interface FocusZonePresentationalProps {
  task: FocusTask | null | undefined;
  onClick?: () => void;
}

// =============================================================================
// Presentational Component (no router dependency)
// =============================================================================

function FocusZonePresentational({ task, onClick = () => {} }: FocusZonePresentationalProps) {
  if (!task) return null;

  return (
    <div className="mb-8">
      <Typography
        variant="small"
        color="tertiary"
        className="uppercase tracking-widest mb-2 font-bold"
      >
        Focus Item
      </Typography>
      <Card
        hoverable
        onClick={onClick}
        onKeyDown={(e) => e.key === "Enter" && onClick()}
        tabIndex={0}
        role="button"
        aria-label={`Focus task: ${task.title}`}
        className="group relative overflow-hidden hover:shadow-card-hover transition-shadow"
      >
        {/* Brand left border accent */}
        <div className="absolute left-0 top-0 h-full w-1 bg-brand" />
        <CardBody className="p-6 pl-7">
          <Flex direction="column" gap="md">
            <Flex justify="between" align="center">
              <Badge variant="primary">{task.priority.toUpperCase()}</Badge>
              <Typography variant="small" color="secondary" className="font-mono">
                {task.key}
              </Typography>
            </Flex>

            <div>
              <Typography variant="h3" className="text-xl sm:text-2xl font-bold">
                {task.title}
              </Typography>
              <Typography variant="muted" className="mt-1">
                In project: <strong>{task.projectName}</strong>
              </Typography>
            </div>

            <Flex justify="end" align="center" gap="xs">
              <Typography variant="small" className="font-medium text-brand">
                View Task
              </Typography>
            </Flex>
          </Flex>
        </CardBody>
      </Card>
    </div>
  );
}

// =============================================================================
// Mock Data
// =============================================================================

const mockTask: FocusTask = {
  _id: "task-123",
  key: "PROJ-42",
  title: "Implement user authentication flow",
  priority: "high",
  status: "in_progress",
  projectName: "Main Project",
  projectKey: "PROJ",
};

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof FocusZonePresentational> = {
  title: "Components/Dashboard/FocusZone",
  component: FocusZonePresentational,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A prominent card highlighting the user's current focus task. Features a brand accent border, priority badge, and click-to-navigate functionality.",
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
    task: mockTask,
    onClick: () => alert("Navigating to task..."),
  },
  parameters: {
    docs: {
      description: {
        story: "Default focus zone with a high priority task.",
      },
    },
  },
};

export const MediumPriority: Story = {
  args: {
    task: {
      ...mockTask,
      priority: "medium",
      title: "Review pull request #234",
    },
    onClick: () => alert("Navigating to task..."),
  },
  parameters: {
    docs: {
      description: {
        story: "Focus zone with medium priority task.",
      },
    },
  },
};

export const LowPriority: Story = {
  args: {
    task: {
      ...mockTask,
      priority: "low",
      title: "Update documentation for API endpoints",
    },
    onClick: () => alert("Navigating to task..."),
  },
  parameters: {
    docs: {
      description: {
        story: "Focus zone with low priority task.",
      },
    },
  },
};

export const UrgentPriority: Story = {
  args: {
    task: {
      ...mockTask,
      priority: "urgent",
      title: "Fix critical production bug",
      key: "PROD-99",
      projectName: "Production Fixes",
    },
    onClick: () => alert("Navigating to task..."),
  },
  parameters: {
    docs: {
      description: {
        story: "Focus zone with urgent priority task.",
      },
    },
  },
};

export const LongTitle: Story = {
  args: {
    task: {
      ...mockTask,
      title:
        "Implement comprehensive user onboarding flow with multi-step wizard and progress tracking",
    },
    onClick: () => alert("Navigating to task..."),
  },
  parameters: {
    docs: {
      description: {
        story: "Focus zone with a longer task title.",
      },
    },
  },
};

export const NoTask: Story = {
  args: {
    task: null,
  },
  parameters: {
    docs: {
      description: {
        story: "Renders nothing when no task is provided.",
      },
    },
  },
};

export const InDashboard: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <Typography variant="h1" className="text-3xl font-extrabold tracking-tight mb-1">
          Good morning, <strong className="text-brand">Alice</strong>.
        </Typography>
        <Typography color="secondary">
          <strong>12 tasks</strong> completed this week.
        </Typography>
      </div>

      <FocusZonePresentational task={mockTask} onClick={() => alert("Navigating to task...")} />

      <Grid cols={2} gap="md">
        <div className="h-32 bg-ui-bg-secondary rounded-lg border border-ui-border p-4">
          <Typography variant="label" color="tertiary" className="uppercase text-xs">
            My Issues
          </Typography>
        </div>
        <div className="h-32 bg-ui-bg-secondary rounded-lg border border-ui-border p-4">
          <Typography variant="label" color="tertiary" className="uppercase text-xs">
            Recent Activity
          </Typography>
        </div>
      </Grid>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Focus zone in the context of the full dashboard.",
      },
    },
  },
};
