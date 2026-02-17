import type { Meta, StoryObj } from "@storybook/react";
import { Trophy } from "lucide-react";
import { useState } from "react";
import { formatDate } from "@/lib/dates";
import { getStatusColor } from "@/lib/issue-utils";
import { SPRINT_DURATION_PRESETS } from "@/lib/sprint-presets";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { EmptyState } from "./ui/EmptyState";
import { Flex, FlexItem } from "./ui/Flex";
import { Input } from "./ui/form/Input";
import { Textarea } from "./ui/form/Textarea";
import { Grid } from "./ui/Grid";
import { SkeletonProjectCard } from "./ui/Skeleton";
import { Typography } from "./ui/Typography";

// ============================================================================
// Types
// ============================================================================

type SprintStatus = "future" | "active" | "completed";

interface SprintData {
  _id: string;
  name: string;
  status: SprintStatus;
  goal?: string;
  startDate?: number;
  endDate?: number;
  issueCount: number;
  completedCount: number;
}

// ============================================================================
// Presentational Components (bypass Convex hooks for Storybook)
// ============================================================================

interface SprintCardPresentationalProps {
  sprint: SprintData;
  canEdit: boolean;
  onStartSprint?: () => void;
  onCompleteSprint?: () => void;
}

function SprintCardPresentational({
  sprint,
  canEdit,
  onStartSprint,
  onCompleteSprint,
}: SprintCardPresentationalProps) {
  const progress =
    sprint.status === "active" && sprint.issueCount > 0
      ? (sprint.completedCount / sprint.issueCount) * 100
      : 0;

  return (
    <div className="card-subtle p-4 animate-fade-in">
      <Flex
        direction="column"
        align="start"
        justify="between"
        gap="lg"
        className="sm:flex-row sm:items-center"
      >
        <FlexItem flex="1" className="w-full sm:w-auto">
          <Flex wrap align="center" gap="sm" className="sm:gap-3 mb-2">
            <Typography variant="h5">{sprint.name}</Typography>
            <Badge size="md" className={getStatusColor(sprint.status)}>
              {sprint.status}
            </Badge>
            <Badge variant="neutral" size="sm">
              {sprint.issueCount} issues
            </Badge>
          </Flex>
          {sprint.goal && (
            <Typography variant="muted" className="mb-2">
              {sprint.goal}
            </Typography>
          )}

          {sprint.status === "active" && (
            <div className="mt-3 mb-2">
              <Flex justify="between" className="mb-1">
                <Typography variant="caption">
                  {sprint.completedCount} of {sprint.issueCount} completed
                </Typography>
                <Typography variant="caption" className="text-brand">
                  {Math.round(progress)}%
                </Typography>
              </Flex>
              <div className="h-1.5 bg-ui-bg-tertiary rounded-pill overflow-hidden">
                <div
                  className="h-full bg-brand rounded-pill transition-default"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {sprint.startDate && sprint.endDate && (
            <Typography variant="caption">
              {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
            </Typography>
          )}
        </FlexItem>
        {canEdit && (
          <Flex direction="column" gap="sm" className="sm:flex-row w-full sm:w-auto">
            {sprint.status === "future" && (
              <Button onClick={onStartSprint} variant="success" size="sm">
                Start Sprint
              </Button>
            )}
            {sprint.status === "active" && (
              <Button onClick={onCompleteSprint} variant="secondary" size="sm">
                Complete Sprint
              </Button>
            )}
          </Flex>
        )}
      </Flex>
    </div>
  );
}

interface SprintManagerPresentationalProps {
  sprints: SprintData[] | undefined;
  canEdit: boolean;
  showCreateForm?: boolean;
}

function SprintManagerPresentational({
  sprints,
  canEdit,
  showCreateForm: initialShowForm = false,
}: SprintManagerPresentationalProps) {
  const [showCreateForm, setShowCreateForm] = useState(initialShowForm);
  const [selectedPreset, setSelectedPreset] = useState("2_WEEKS");
  const [sprintName, setSprintName] = useState("");
  const [sprintGoal, setSprintGoal] = useState("");

  const isLoading = sprints === undefined;
  const isEmpty = sprints?.length === 0;

  return (
    <div>
      {/* Header */}
      <Flex
        direction="column"
        gap="sm"
        align="start"
        justify="between"
        className="sm:flex-row sm:items-center mb-6"
      >
        <Typography variant="h4">Sprint Management</Typography>
        {canEdit && !showCreateForm && (
          <Button onClick={() => setShowCreateForm(true)}>
            <span className="hidden sm:inline">Create Sprint</span>
            <span className="sm:hidden">+ Sprint</span>
          </Button>
        )}
      </Flex>

      {/* Create Form */}
      {showCreateForm && (
        <div className="card-subtle p-4 mb-6">
          <Typography variant="h5" className="mb-4">
            Create New Sprint
          </Typography>
          <Grid cols={1} colsMd={2} gap="md" className="mb-4">
            <Input
              label="Sprint Name"
              placeholder="Sprint 1"
              value={sprintName}
              onChange={(e) => setSprintName(e.target.value)}
            />
            <div>
              <Typography variant="label" className="mb-2">
                Duration
              </Typography>
              <Flex gap="sm" wrap>
                {SPRINT_DURATION_PRESETS.map((preset) => (
                  <Button
                    key={preset.id}
                    variant={selectedPreset === preset.id ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setSelectedPreset(preset.id)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </Flex>
            </div>
          </Grid>
          <Textarea
            label="Sprint Goal (optional)"
            placeholder="What do you want to achieve in this sprint?"
            value={sprintGoal}
            onChange={(e) => setSprintGoal(e.target.value)}
            className="mb-4"
          />
          <Flex gap="sm" justify="end">
            <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Sprint</Button>
          </Flex>
        </div>
      )}

      {/* Sprint List */}
      <div className="space-y-4">
        {isLoading && (
          <>
            <SkeletonProjectCard />
            <SkeletonProjectCard />
          </>
        )}

        {isEmpty && (
          <EmptyState
            icon={Trophy}
            title="No sprints yet"
            description="Create a sprint to start planning work"
            action={
              canEdit
                ? { label: "Create Sprint", onClick: () => setShowCreateForm(true) }
                : undefined
            }
          />
        )}

        {sprints?.map((sprint) => (
          <SprintCardPresentational
            key={sprint._id}
            sprint={sprint}
            canEdit={canEdit}
            onStartSprint={() => alert(`Starting sprint: ${sprint.name}`)}
            onCompleteSprint={() => alert(`Completing sprint: ${sprint.name}`)}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Mock Data
// ============================================================================

const now = Date.now();
const oneWeek = 7 * 24 * 60 * 60 * 1000;

const mockSprints: SprintData[] = [
  {
    _id: "sprint-1",
    name: "Sprint 1",
    status: "completed",
    goal: "Complete user authentication flow",
    startDate: now - 3 * oneWeek,
    endDate: now - 1 * oneWeek,
    issueCount: 8,
    completedCount: 8,
  },
  {
    _id: "sprint-2",
    name: "Sprint 2",
    status: "active",
    goal: "Implement dashboard analytics",
    startDate: now - oneWeek,
    endDate: now + oneWeek,
    issueCount: 12,
    completedCount: 5,
  },
  {
    _id: "sprint-3",
    name: "Sprint 3",
    status: "future",
    goal: "Mobile responsiveness improvements",
    issueCount: 6,
    completedCount: 0,
  },
];

// ============================================================================
// Story Configuration
// ============================================================================

const meta: Meta<typeof SprintManagerPresentational> = {
  title: "Features/SprintManager",
  component: SprintManagerPresentational,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Sprint management component for creating, starting, and completing sprints. Shows progress for active sprints.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SprintManagerPresentational>;

// ============================================================================
// Stories
// ============================================================================

export const Default: Story = {
  render: () => <SprintManagerPresentational sprints={mockSprints} canEdit={true} />,
};

export const Loading: Story = {
  render: () => <SprintManagerPresentational sprints={undefined} canEdit={true} />,
};

export const Empty: Story = {
  render: () => <SprintManagerPresentational sprints={[]} canEdit={true} />,
};

export const EmptyReadOnly: Story = {
  render: () => <SprintManagerPresentational sprints={[]} canEdit={false} />,
};

export const WithCreateForm: Story = {
  render: () => (
    <SprintManagerPresentational sprints={mockSprints} canEdit={true} showCreateForm={true} />
  ),
};

export const ActiveSprintProgress: Story = {
  render: () => (
    <SprintManagerPresentational
      sprints={[
        {
          _id: "sprint-active",
          name: "Current Sprint",
          status: "active",
          goal: "Complete feature set for Q1 release",
          startDate: now - 5 * 24 * 60 * 60 * 1000,
          endDate: now + 9 * 24 * 60 * 60 * 1000,
          issueCount: 15,
          completedCount: 7,
        },
      ]}
      canEdit={true}
    />
  ),
};

export const FutureSprint: Story = {
  render: () => (
    <SprintManagerPresentational
      sprints={[
        {
          _id: "sprint-future",
          name: "Upcoming Sprint",
          status: "future",
          goal: "Performance optimization phase",
          issueCount: 10,
          completedCount: 0,
        },
      ]}
      canEdit={true}
    />
  ),
};

export const CompletedSprint: Story = {
  render: () => (
    <SprintManagerPresentational
      sprints={[
        {
          _id: "sprint-completed",
          name: "Completed Sprint",
          status: "completed",
          goal: "Initial MVP release",
          startDate: now - 4 * oneWeek,
          endDate: now - 2 * oneWeek,
          issueCount: 20,
          completedCount: 20,
        },
      ]}
      canEdit={true}
    />
  ),
};

export const ReadOnlyMode: Story = {
  render: () => <SprintManagerPresentational sprints={mockSprints} canEdit={false} />,
};

export const HighProgress: Story = {
  render: () => (
    <SprintManagerPresentational
      sprints={[
        {
          _id: "sprint-almost-done",
          name: "Sprint 5",
          status: "active",
          goal: "Bug fixes and polish",
          startDate: now - 10 * 24 * 60 * 60 * 1000,
          endDate: now + 4 * 24 * 60 * 60 * 1000,
          issueCount: 8,
          completedCount: 7,
        },
      ]}
      canEdit={true}
    />
  ),
};

export const LowProgress: Story = {
  render: () => (
    <SprintManagerPresentational
      sprints={[
        {
          _id: "sprint-just-started",
          name: "Sprint 6",
          status: "active",
          goal: "New feature development",
          startDate: now - 2 * 24 * 60 * 60 * 1000,
          endDate: now + 12 * 24 * 60 * 60 * 1000,
          issueCount: 15,
          completedCount: 1,
        },
      ]}
      canEdit={true}
    />
  ),
};

export const MultipleFutureSprints: Story = {
  render: () => (
    <SprintManagerPresentational
      sprints={[
        {
          _id: "sprint-f1",
          name: "Sprint 7",
          status: "future",
          goal: "API documentation",
          issueCount: 5,
          completedCount: 0,
        },
        {
          _id: "sprint-f2",
          name: "Sprint 8",
          status: "future",
          goal: "Integration tests",
          issueCount: 8,
          completedCount: 0,
        },
        {
          _id: "sprint-f3",
          name: "Sprint 9",
          status: "future",
          goal: "Performance monitoring",
          issueCount: 4,
          completedCount: 0,
        },
      ]}
      canEdit={true}
    />
  ),
};
