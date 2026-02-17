import type { Id } from "@convex/_generated/dataModel";
import type { Meta, StoryObj } from "@storybook/react";
import { IssueCard } from "./IssueCard";
import { Flex } from "./ui/Flex";
import { Typography } from "./ui/Typography";

// ============================================================================
// Mock Issue Data
// ============================================================================

const now = Date.now();

const mockIssue = {
  _id: "issue-1" as Id<"issues">,
  key: "PROJ-123",
  title: "Implement user authentication flow",
  type: "task" as const,
  priority: "medium" as const,
  order: 1,
  labels: [],
  updatedAt: now,
};

const mockIssueWithAssignee = {
  ...mockIssue,
  _id: "issue-2" as Id<"issues">,
  key: "PROJ-124",
  assignee: {
    _id: "user-1" as Id<"users">,
    name: "Alice Chen",
    image: undefined,
  },
};

const mockIssueWithImage = {
  ...mockIssue,
  _id: "issue-3" as Id<"issues">,
  key: "PROJ-125",
  title: "Fix critical login bug affecting production users",
  type: "bug" as const,
  priority: "high" as const,
  assignee: {
    _id: "user-1" as Id<"users">,
    name: "Bob Smith",
    image: "https://i.pravatar.cc/100?img=3",
  },
};

const mockIssueWithLabels = {
  ...mockIssue,
  _id: "issue-4" as Id<"issues">,
  key: "PROJ-126",
  title: "Add dark mode support",
  type: "story" as const,
  priority: "low" as const,
  labels: [
    { name: "frontend", color: "#3B82F6" },
    { name: "ui/ux", color: "#10B981" },
    { name: "design", color: "#F59E0B" },
  ],
  storyPoints: 5,
};

const mockIssueWithManyLabels = {
  ...mockIssue,
  _id: "issue-5" as Id<"issues">,
  key: "PROJ-127",
  title: "Refactor API endpoints for better performance",
  type: "task" as const,
  priority: "medium" as const,
  labels: [
    { name: "backend", color: "#8B5CF6" },
    { name: "api", color: "#EC4899" },
    { name: "performance", color: "#EF4444" },
    { name: "refactor", color: "#06B6D4" },
    { name: "tech-debt", color: "#6B7280" },
  ],
  storyPoints: 8,
};

const mockEpicIssue = {
  ...mockIssue,
  _id: "issue-6" as Id<"issues">,
  key: "PROJ-128",
  title: "Q1 2024 User Experience Improvements Initiative",
  type: "epic" as const,
  priority: "highest" as const,
  storyPoints: 21,
};

const mockSubtaskIssue = {
  ...mockIssue,
  _id: "issue-7" as Id<"issues">,
  key: "PROJ-129",
  title: "Update unit tests for auth module",
  type: "subtask" as const,
  priority: "lowest" as const,
  storyPoints: 2,
};

// ============================================================================
// Storybook Meta
// ============================================================================

const meta: Meta<typeof IssueCard> = {
  title: "Components/IssueCard",
  component: IssueCard,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    issue: {
      control: false,
      description: "The issue data to display",
    },
    status: {
      control: "text",
      description: "Current status of the issue",
    },
    onClick: {
      action: "clicked",
      description: "Callback when card is clicked",
    },
    selectionMode: {
      control: "boolean",
      description: "Whether to show selection checkbox",
    },
    isSelected: {
      control: "boolean",
      description: "Whether the card is selected",
    },
    isFocused: {
      control: "boolean",
      description: "Whether the card is keyboard-focused",
    },
    canEdit: {
      control: "boolean",
      description: "Whether the card can be dragged",
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-xs">
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
    issue: mockIssue,
    status: "todo",
    canEdit: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Basic issue card with minimal information.",
      },
    },
  },
};

export const WithAssignee: Story = {
  args: {
    issue: mockIssueWithAssignee,
    status: "in-progress",
    canEdit: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Issue card with an assigned user (initials fallback).",
      },
    },
  },
};

export const WithAssigneeImage: Story = {
  args: {
    issue: mockIssueWithImage,
    status: "in-progress",
    canEdit: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Issue card with assignee profile image.",
      },
    },
  },
};

export const WithLabels: Story = {
  args: {
    issue: mockIssueWithLabels,
    status: "todo",
    canEdit: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Issue card with labels and story points.",
      },
    },
  },
};

export const WithManyLabels: Story = {
  args: {
    issue: mockIssueWithManyLabels,
    status: "in-review",
    canEdit: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Issue card with more than 3 labels shows overflow indicator.",
      },
    },
  },
};

// ============================================================================
// Issue Type Stories
// ============================================================================

export const TaskType: Story = {
  args: {
    issue: { ...mockIssue, type: "task" as const },
    status: "todo",
    canEdit: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Task type issue with checkmark icon.",
      },
    },
  },
};

export const BugType: Story = {
  args: {
    issue: { ...mockIssue, type: "bug" as const, title: "Fix login redirect loop" },
    status: "in-progress",
    canEdit: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Bug type issue with bug icon.",
      },
    },
  },
};

export const StoryType: Story = {
  args: {
    issue: { ...mockIssue, type: "story" as const, title: "Add OAuth2 integration" },
    status: "todo",
    canEdit: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Story type issue with book icon.",
      },
    },
  },
};

export const EpicType: Story = {
  args: {
    issue: mockEpicIssue,
    status: "in-progress",
    canEdit: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Epic type issue with lightning icon.",
      },
    },
  },
};

export const SubtaskType: Story = {
  args: {
    issue: mockSubtaskIssue,
    status: "done",
    canEdit: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Subtask type issue with subtask icon.",
      },
    },
  },
};

// ============================================================================
// Priority Stories
// ============================================================================

export const HighestPriority: Story = {
  args: {
    issue: { ...mockIssue, priority: "highest" as const },
    status: "todo",
    canEdit: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Issue with highest priority (red double arrow up).",
      },
    },
  },
};

export const HighPriority: Story = {
  args: {
    issue: { ...mockIssue, priority: "high" as const },
    status: "todo",
    canEdit: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Issue with high priority (orange arrow up).",
      },
    },
  },
};

export const MediumPriority: Story = {
  args: {
    issue: { ...mockIssue, priority: "medium" as const },
    status: "todo",
    canEdit: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Issue with medium priority (yellow equals).",
      },
    },
  },
};

export const LowPriority: Story = {
  args: {
    issue: { ...mockIssue, priority: "low" as const },
    status: "todo",
    canEdit: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Issue with low priority (blue arrow down).",
      },
    },
  },
};

export const LowestPriority: Story = {
  args: {
    issue: { ...mockIssue, priority: "lowest" as const },
    status: "todo",
    canEdit: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Issue with lowest priority (gray double arrow down).",
      },
    },
  },
};

// ============================================================================
// Selection Mode Stories
// ============================================================================

export const SelectionModeUnselected: Story = {
  args: {
    issue: mockIssue,
    status: "todo",
    selectionMode: true,
    isSelected: false,
    canEdit: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Issue card in selection mode (unselected).",
      },
    },
  },
};

export const SelectionModeSelected: Story = {
  args: {
    issue: mockIssue,
    status: "todo",
    selectionMode: true,
    isSelected: true,
    canEdit: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Issue card in selection mode (selected).",
      },
    },
  },
};

// ============================================================================
// Focus State
// ============================================================================

export const Focused: Story = {
  args: {
    issue: mockIssue,
    status: "todo",
    isFocused: true,
    canEdit: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Issue card with keyboard focus ring.",
      },
    },
  },
};

// ============================================================================
// Edit Permission
// ============================================================================

export const ReadOnly: Story = {
  args: {
    issue: mockIssue,
    status: "todo",
    canEdit: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Issue card without drag handle (read-only mode).",
      },
    },
  },
};

// ============================================================================
// Grid Layout Demo
// ============================================================================

export const KanbanColumn: Story = {
  render: () => (
    <div className="w-72 p-3 bg-ui-bg-secondary rounded-lg space-y-2">
      <Typography variant="label" className="px-1">
        In Progress (4)
      </Typography>
      <IssueCard issue={mockIssueWithAssignee} status="in-progress" canEdit={true} />
      <IssueCard issue={mockIssueWithImage} status="in-progress" canEdit={true} />
      <IssueCard issue={mockIssueWithLabels} status="in-progress" canEdit={true} />
      <IssueCard issue={mockIssueWithManyLabels} status="in-progress" canEdit={true} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Multiple issue cards displayed in a kanban column layout.",
      },
    },
  },
};

// ============================================================================
// All Priority Levels
// ============================================================================

export const AllPriorities: Story = {
  render: () => (
    <Flex direction="column" gap="sm">
      <IssueCard
        issue={{
          ...mockIssue,
          _id: "p1" as Id<"issues">,
          priority: "highest" as const,
          title: "Highest priority issue",
        }}
        status="todo"
        canEdit={true}
      />
      <IssueCard
        issue={{
          ...mockIssue,
          _id: "p2" as Id<"issues">,
          priority: "high" as const,
          title: "High priority issue",
        }}
        status="todo"
        canEdit={true}
      />
      <IssueCard
        issue={{
          ...mockIssue,
          _id: "p3" as Id<"issues">,
          priority: "medium" as const,
          title: "Medium priority issue",
        }}
        status="todo"
        canEdit={true}
      />
      <IssueCard
        issue={{
          ...mockIssue,
          _id: "p4" as Id<"issues">,
          priority: "low" as const,
          title: "Low priority issue",
        }}
        status="todo"
        canEdit={true}
      />
      <IssueCard
        issue={{
          ...mockIssue,
          _id: "p5" as Id<"issues">,
          priority: "lowest" as const,
          title: "Lowest priority issue",
        }}
        status="todo"
        canEdit={true}
      />
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Comparison of all priority levels.",
      },
    },
  },
};

// ============================================================================
// All Issue Types
// ============================================================================

export const AllTypes: Story = {
  render: () => (
    <Flex direction="column" gap="sm">
      <IssueCard
        issue={{
          ...mockIssue,
          _id: "t1" as Id<"issues">,
          type: "epic" as const,
          title: "Epic: User Management System",
        }}
        status="todo"
        canEdit={true}
      />
      <IssueCard
        issue={{
          ...mockIssue,
          _id: "t2" as Id<"issues">,
          type: "story" as const,
          title: "Story: OAuth2 Login",
        }}
        status="todo"
        canEdit={true}
      />
      <IssueCard
        issue={{
          ...mockIssue,
          _id: "t3" as Id<"issues">,
          type: "task" as const,
          title: "Task: Better error messages",
        }}
        status="todo"
        canEdit={true}
      />
      <IssueCard
        issue={{
          ...mockIssue,
          _id: "t4" as Id<"issues">,
          type: "task" as const,
          title: "Task: Update documentation",
        }}
        status="todo"
        canEdit={true}
      />
      <IssueCard
        issue={{
          ...mockIssue,
          _id: "t5" as Id<"issues">,
          type: "bug" as const,
          title: "Bug: Login redirect loop",
        }}
        status="todo"
        canEdit={true}
      />
      <IssueCard
        issue={{
          ...mockIssue,
          _id: "t6" as Id<"issues">,
          type: "subtask" as const,
          title: "Subtask: Write unit tests",
        }}
        status="todo"
        canEdit={true}
      />
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Comparison of all issue types.",
      },
    },
  },
};
