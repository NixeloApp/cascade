import type { Meta, StoryObj } from "@storybook/react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Flex, FlexItem } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";
import type { SwimlanConfig } from "@/lib/swimlane-utils";
import { cn } from "@/lib/utils";

// ============================================================================
// Types for Stories (simplified versions that don't depend on Convex types)
// ============================================================================

interface StoryWorkflowState {
  id: string;
  name: string;
  color?: string;
}

interface StoryIssue {
  _id: string;
  key: string;
  title: string;
  priority: string;
}

// ============================================================================
// Mock Data
// ============================================================================

// Using CSS variable references for semantic colors
const STATUS_COLORS = {
  todo: "var(--color-ui-text-tertiary)",
  inprogress: "var(--color-status-info)",
  done: "var(--color-status-success)",
};

const mockWorkflowStates: StoryWorkflowState[] = [
  { id: "todo", name: "To Do", color: STATUS_COLORS.todo },
  { id: "inprogress", name: "In Progress", color: STATUS_COLORS.inprogress },
  { id: "done", name: "Done", color: STATUS_COLORS.done },
];

const createMockIssue = (overrides: Partial<StoryIssue> = {}): StoryIssue => ({
  _id: `issue-${Math.random().toString(36).slice(2, 9)}`,
  key: `PROJ-${Math.floor(Math.random() * 1000)}`,
  title: "Sample Issue",
  priority: "medium",
  ...overrides,
});

const mockIssuesByStatus: Record<string, StoryIssue[]> = {
  todo: [
    createMockIssue({ key: "PROJ-101", title: "Set up authentication", priority: "high" }),
    createMockIssue({ key: "PROJ-102", title: "Design landing page", priority: "medium" }),
  ],
  inprogress: [
    createMockIssue({ key: "PROJ-103", title: "Implement API endpoints", priority: "high" }),
  ],
  done: [createMockIssue({ key: "PROJ-100", title: "Project setup", priority: "low" })],
};

const PRIORITY_COLORS = {
  highest: "text-status-error",
  high: "text-status-warning",
  medium: "text-ui-text",
  low: "text-status-info",
  lowest: "text-ui-text-tertiary",
};

// ============================================================================
// Presentational Component (for Storybook - bypasses Convex)
// ============================================================================

interface SwimlanRowPresentationalProps {
  config: SwimlanConfig;
  issuesByStatus: Record<string, StoryIssue[]>;
  workflowStates: StoryWorkflowState[];
  isCollapsed: boolean;
  onToggleCollapse: (swimlanId: string) => void;
}

function getSwimlanIssueCount(issuesByStatus: Record<string, StoryIssue[]>): number {
  return Object.values(issuesByStatus).reduce((total, issues) => total + issues.length, 0);
}

// Simple column component for story purposes
function SimpleKanbanColumn({
  state,
  issues,
}: {
  state: StoryWorkflowState;
  issues: StoryIssue[];
}) {
  return (
    <FlexItem flex="1" className="min-w-[280px] max-w-[350px]">
      <Flex align="center" gap="sm" className="mb-2 px-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: state.color || STATUS_COLORS.todo }}
        />
        <Typography variant="label" className="text-ui-text-secondary">
          {state.name}
        </Typography>
        <Badge variant="neutral" shape="pill" className="text-xs">
          {issues.length}
        </Badge>
      </Flex>
      <Flex direction="column" gap="sm" className="p-2 bg-ui-bg-secondary rounded-lg min-h-[100px]">
        {issues.map((issue) => (
          <div
            key={issue._id}
            className="p-3 bg-ui-bg rounded-lg border border-ui-border hover:border-ui-border-secondary transition-colors cursor-pointer"
          >
            <Typography variant="small" className="text-ui-text-secondary font-mono mb-1">
              {issue.key}
            </Typography>
            <Typography variant="p" className="text-sm m-0 line-clamp-2">
              {issue.title}
            </Typography>
          </div>
        ))}
        {issues.length === 0 && (
          <Typography variant="muted" className="text-center py-4">
            No issues
          </Typography>
        )}
      </Flex>
    </FlexItem>
  );
}

function SwimlanRowPresentational({
  config,
  issuesByStatus,
  workflowStates,
  isCollapsed,
  onToggleCollapse,
}: SwimlanRowPresentationalProps) {
  const totalIssues = getSwimlanIssueCount(issuesByStatus);

  const handleToggle = useCallback(() => {
    onToggleCollapse(config.id);
  }, [config.id, onToggleCollapse]);

  return (
    <div className="mb-4">
      {/* Swimlane Header */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-ui-bg-hover rounded-secondary transition-fast group"
        aria-expanded={!isCollapsed}
        aria-controls={`swimlane-${config.id}`}
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-ui-text-tertiary" />
        ) : (
          <ChevronDown className="w-4 h-4 text-ui-text-tertiary" />
        )}
        <Typography
          variant="label"
          className={cn("font-medium", config.color || "text-ui-text-secondary")}
        >
          {config.name}
        </Typography>
        <Badge variant="neutral" shape="pill" className="text-xs">
          {totalIssues}
        </Badge>
      </button>

      {/* Swimlane Content */}
      {!isCollapsed && (
        <div id={`swimlane-${config.id}`} className="mt-2">
          <Flex gap="lg" className="px-4 overflow-x-auto">
            {workflowStates.map((state) => (
              <SimpleKanbanColumn
                key={state.id}
                state={state}
                issues={issuesByStatus[state.id] || []}
              />
            ))}
          </Flex>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Interactive Wrapper for Stories
// ============================================================================

function SwimlanRowInteractive({
  config,
  issuesByStatus,
  workflowStates,
  initialCollapsed = false,
}: Omit<SwimlanRowPresentationalProps, "isCollapsed" | "onToggleCollapse"> & {
  initialCollapsed?: boolean;
}) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  const handleToggle = useCallback((_id: string) => {
    setIsCollapsed((prev) => !prev);
  }, []);

  return (
    <SwimlanRowPresentational
      config={config}
      issuesByStatus={issuesByStatus}
      workflowStates={workflowStates}
      isCollapsed={isCollapsed}
      onToggleCollapse={handleToggle}
    />
  );
}

// ============================================================================
// Storybook Meta
// ============================================================================

const meta: Meta<typeof SwimlanRowInteractive> = {
  title: "Components/Kanban/SwimlanRow",
  component: SwimlanRowInteractive,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-5xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Stories
// ============================================================================

export const Default: Story = {
  args: {
    config: { id: "high", name: "High Priority", order: 1, color: PRIORITY_COLORS.high },
    issuesByStatus: mockIssuesByStatus,
    workflowStates: mockWorkflowStates,
    initialCollapsed: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Default expanded swimlane row showing issues grouped by workflow state.",
      },
    },
  },
};

export const Collapsed: Story = {
  args: {
    config: { id: "medium", name: "Medium Priority", order: 2, color: PRIORITY_COLORS.medium },
    issuesByStatus: mockIssuesByStatus,
    workflowStates: mockWorkflowStates,
    initialCollapsed: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Collapsed swimlane row - click header to expand.",
      },
    },
  },
};

export const HighestPriority: Story = {
  args: {
    config: { id: "highest", name: "Highest Priority", order: 0, color: PRIORITY_COLORS.highest },
    issuesByStatus: {
      todo: [
        createMockIssue({ key: "PROJ-001", title: "Critical security fix", priority: "highest" }),
      ],
      inprogress: [
        createMockIssue({
          key: "PROJ-002",
          title: "Server crash investigation",
          priority: "highest",
        }),
      ],
      done: [],
    },
    workflowStates: mockWorkflowStates,
    initialCollapsed: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Swimlane for highest priority items with red accent color.",
      },
    },
  },
};

export const LowPriority: Story = {
  args: {
    config: { id: "low", name: "Low Priority", order: 3, color: PRIORITY_COLORS.low },
    issuesByStatus: {
      todo: [
        createMockIssue({ key: "PROJ-201", title: "Update docs", priority: "low" }),
        createMockIssue({ key: "PROJ-202", title: "Refactor utility functions", priority: "low" }),
        createMockIssue({ key: "PROJ-203", title: "Add unit tests", priority: "low" }),
      ],
      inprogress: [],
      done: [
        createMockIssue({ key: "PROJ-200", title: "Clean up unused imports", priority: "low" }),
      ],
    },
    workflowStates: mockWorkflowStates,
    initialCollapsed: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Swimlane for low priority items with blue accent color.",
      },
    },
  },
};

export const EmptyColumns: Story = {
  args: {
    config: { id: "medium", name: "Medium Priority", order: 2 },
    issuesByStatus: {
      todo: [],
      inprogress: [],
      done: [],
    },
    workflowStates: mockWorkflowStates,
    initialCollapsed: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Swimlane with empty columns showing placeholder state.",
      },
    },
  },
};

export const Unassigned: Story = {
  args: {
    config: { id: "unassigned", name: "Unassigned", order: 99 },
    issuesByStatus: {
      todo: [
        createMockIssue({ key: "PROJ-301", title: "Needs triage" }),
        createMockIssue({ key: "PROJ-302", title: "Backlog item" }),
      ],
      inprogress: [],
      done: [],
    },
    workflowStates: mockWorkflowStates,
    initialCollapsed: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Swimlane for unassigned issues (used when grouping by assignee).",
      },
    },
  },
};

export const MultipleSwimlanes: Story = {
  render: () => (
    <Flex direction="column" gap="none">
      <SwimlanRowInteractive
        config={{ id: "highest", name: "Highest", order: 0, color: PRIORITY_COLORS.highest }}
        issuesByStatus={{
          todo: [createMockIssue({ key: "PROJ-001", title: "Critical bug" })],
          inprogress: [],
          done: [],
        }}
        workflowStates={mockWorkflowStates}
      />
      <SwimlanRowInteractive
        config={{ id: "high", name: "High", order: 1, color: PRIORITY_COLORS.high }}
        issuesByStatus={{
          todo: [createMockIssue({ key: "PROJ-010", title: "Feature request" })],
          inprogress: [createMockIssue({ key: "PROJ-011", title: "API work" })],
          done: [],
        }}
        workflowStates={mockWorkflowStates}
      />
      <SwimlanRowInteractive
        config={{ id: "medium", name: "Medium", order: 2, color: PRIORITY_COLORS.medium }}
        issuesByStatus={{
          todo: [],
          inprogress: [createMockIssue({ key: "PROJ-020", title: "Documentation" })],
          done: [createMockIssue({ key: "PROJ-021", title: "Completed task" })],
        }}
        workflowStates={mockWorkflowStates}
      />
      <SwimlanRowInteractive
        config={{ id: "low", name: "Low", order: 3, color: PRIORITY_COLORS.low }}
        issuesByStatus={{
          todo: [
            createMockIssue({ key: "PROJ-030", title: "Nice to have" }),
            createMockIssue({ key: "PROJ-031", title: "Tech debt" }),
          ],
          inprogress: [],
          done: [],
        }}
        workflowStates={mockWorkflowStates}
        initialCollapsed
      />
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Multiple swimlanes stacked together, simulating a full priority-grouped board.",
      },
    },
  },
};
