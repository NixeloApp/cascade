import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Archive } from "@/lib/icons";
import { Button } from "./ui/Button";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Flex } from "./ui/Flex";
import { Grid } from "./ui/Grid";
import { Icon } from "./ui/Icon";
import { Input } from "./ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select";
import { Typography } from "./ui/Typography";

// =============================================================================
// Presentational Components (bypass Convex hooks for Storybook)
// =============================================================================

interface BulkOperationsBarPresentationalProps {
  selectedCount: number;
  workflowStates: Array<{ id: string; name: string }>;
  members: Array<{ userId: string; userName: string }>;
  sprints: Array<{ id: string; name: string }>;
  showExpanded?: boolean;
  onClearSelection?: () => void;
  onUpdateStatus?: (statusId: string) => void;
  onUpdatePriority?: (priority: string) => void;
  onAssign?: (assigneeId: string) => void;
  onMoveToSprint?: (sprintId: string) => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

function BulkOperationsBarPresentational({
  selectedCount,
  workflowStates,
  members,
  sprints,
  showExpanded = false,
  onClearSelection = () => {},
  onUpdateStatus = () => {},
  onUpdatePriority = () => {},
  onAssign = () => {},
  onMoveToSprint = () => {},
  onArchive = () => {},
  onDelete = () => {},
}: BulkOperationsBarPresentationalProps) {
  const [showActions, setShowActions] = useState(showExpanded);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-ui-bg-elevated border-t border-ui-border shadow-elevated z-30 animate-slide-up">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Flex align="center" justify="between" gap="lg">
            {/* Selection Info */}
            <Flex align="center" gap="md">
              <Typography variant="p" className="font-medium text-ui-text">
                {selectedCount} issue{selectedCount !== 1 ? "s" : ""} selected
              </Typography>
              <Button
                variant="link"
                size="sm"
                onClick={onClearSelection}
                className="text-ui-text-secondary hover:text-ui-text"
              >
                Clear
              </Button>
            </Flex>

            {/* Actions */}
            <Flex align="center" gap="sm" className="flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setShowActions(!showActions)}>
                {showActions ? "Hide" : "Actions"}
              </Button>

              <Button variant="secondary" size="sm" onClick={() => setArchiveConfirm(true)}>
                <Icon icon={Archive} size="sm" className="mr-1" />
                Archive
              </Button>

              <Button variant="danger" size="sm" onClick={() => setDeleteConfirm(true)}>
                Delete
              </Button>
            </Flex>
          </Flex>

          {/* Expanded Actions */}
          {showActions && (
            <div className="mt-3 pt-3 border-t border-ui-border">
              <Grid cols={1} colsSm={2} colsMd={3} colsLg={6} gap="md">
                {/* Status */}
                <div>
                  <Typography
                    variant="small"
                    className="block font-medium text-ui-text-secondary mb-1.5"
                  >
                    Status
                  </Typography>
                  <Select onValueChange={onUpdateStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status..." />
                    </SelectTrigger>
                    <SelectContent>
                      {workflowStates.map((state) => (
                        <SelectItem key={state.id} value={state.id}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div>
                  <Typography
                    variant="small"
                    className="block font-medium text-ui-text-secondary mb-1.5"
                  >
                    Priority
                  </Typography>
                  <Select onValueChange={onUpdatePriority}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select priority..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="highest">Highest</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="lowest">Lowest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Assignee */}
                <div>
                  <Typography
                    variant="small"
                    className="block font-medium text-ui-text-secondary mb-1.5"
                  >
                    Assignee
                  </Typography>
                  <Select onValueChange={onAssign}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select assignee..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {members.map((member) => (
                        <SelectItem key={member.userId} value={member.userId}>
                          {member.userName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sprint */}
                <div>
                  <Typography
                    variant="small"
                    className="block font-medium text-ui-text-secondary mb-1.5"
                  >
                    Sprint
                  </Typography>
                  <Select onValueChange={onMoveToSprint}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select sprint..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="backlog">Backlog</SelectItem>
                      {sprints.map((sprint) => (
                        <SelectItem key={sprint.id} value={sprint.id}>
                          {sprint.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Start Date */}
                <div>
                  <Typography
                    variant="small"
                    className="block font-medium text-ui-text-secondary mb-1.5"
                  >
                    Start Date
                  </Typography>
                  <Flex gap="sm">
                    <Input type="date" className="flex-1" onChange={() => {}} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {}}
                      className="text-ui-text-secondary hover:text-ui-text"
                    >
                      Clear
                    </Button>
                  </Flex>
                </div>

                {/* Due Date */}
                <div>
                  <Typography
                    variant="small"
                    className="block font-medium text-ui-text-secondary mb-1.5"
                  >
                    Due Date
                  </Typography>
                  <Flex gap="sm">
                    <Input type="date" className="flex-1" onChange={() => {}} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {}}
                      className="text-ui-text-secondary hover:text-ui-text"
                    >
                      Clear
                    </Button>
                  </Flex>
                </div>
              </Grid>
            </div>
          )}
        </div>
      </div>

      {/* Archive Confirmation */}
      <ConfirmDialog
        isOpen={archiveConfirm}
        onClose={() => setArchiveConfirm(false)}
        onConfirm={() => {
          onArchive();
          setArchiveConfirm(false);
        }}
        title="Archive Issues"
        message={`Archive ${selectedCount} issue${selectedCount !== 1 ? "s" : ""}? Only completed issues will be archived. Archived issues can be restored later.`}
        variant="info"
        confirmLabel="Archive"
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={() => {
          onDelete();
          setDeleteConfirm(false);
        }}
        title="Delete Issues"
        message={`Are you sure you want to delete ${selectedCount} issue${selectedCount !== 1 ? "s" : ""}? This action cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
      />
    </>
  );
}

// =============================================================================
// Mock Data
// =============================================================================

const mockWorkflowStates = [
  { id: "backlog", name: "Backlog" },
  { id: "todo", name: "To Do" },
  { id: "in-progress", name: "In Progress" },
  { id: "in-review", name: "In Review" },
  { id: "done", name: "Done" },
];

const mockMembers = [
  { userId: "user-1", userName: "Alice Chen" },
  { userId: "user-2", userName: "Bob Smith" },
  { userId: "user-3", userName: "Carol Davis" },
  { userId: "user-4", userName: "David Wilson" },
];

const mockSprints = [
  { id: "sprint-1", name: "Sprint 1 (Current)" },
  { id: "sprint-2", name: "Sprint 2" },
  { id: "sprint-3", name: "Sprint 3" },
];

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof BulkOperationsBarPresentational> = {
  title: "Components/BulkOperationsBar",
  component: BulkOperationsBarPresentational,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A bottom-anchored bar that appears when issues are selected for bulk operations. Provides actions like status change, priority change, assignment, sprint move, and delete.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="min-h-[400px] bg-ui-bg p-4">
        <div className="mb-32">
          <Typography variant="h3" className="mb-4">
            Select issues to see the bulk operations bar
          </Typography>
          <Typography variant="p" color="secondary">
            The bar appears fixed at the bottom of the screen when issues are selected.
          </Typography>
        </div>
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

export const SingleSelected: Story = {
  args: {
    selectedCount: 1,
    workflowStates: mockWorkflowStates,
    members: mockMembers,
    sprints: mockSprints,
  },
  parameters: {
    docs: {
      description: {
        story: "Bar with a single issue selected. Note the singular 'issue' text.",
      },
    },
  },
};

export const MultipleSelected: Story = {
  args: {
    selectedCount: 5,
    workflowStates: mockWorkflowStates,
    members: mockMembers,
    sprints: mockSprints,
  },
  parameters: {
    docs: {
      description: {
        story: "Bar with multiple issues selected. Shows plural 'issues' text.",
      },
    },
  },
};

export const ManySelected: Story = {
  args: {
    selectedCount: 42,
    workflowStates: mockWorkflowStates,
    members: mockMembers,
    sprints: mockSprints,
  },
  parameters: {
    docs: {
      description: {
        story: "Bar with many issues selected for bulk operations.",
      },
    },
  },
};

export const ExpandedActions: Story = {
  args: {
    selectedCount: 3,
    workflowStates: mockWorkflowStates,
    members: mockMembers,
    sprints: mockSprints,
    showExpanded: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Bar with expanded action panel showing all bulk operation options: status, priority, assignee, sprint, and dates.",
      },
    },
  },
};

export const NoSelection: Story = {
  args: {
    selectedCount: 0,
    workflowStates: mockWorkflowStates,
    members: mockMembers,
    sprints: mockSprints,
  },
  parameters: {
    docs: {
      description: {
        story: "When no issues are selected, the bar is hidden.",
      },
    },
  },
};

export const MinimalWorkflow: Story = {
  args: {
    selectedCount: 2,
    workflowStates: [
      { id: "todo", name: "To Do" },
      { id: "done", name: "Done" },
    ],
    members: [],
    sprints: [],
    showExpanded: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Bar with minimal workflow (only 2 states) and no team members or sprints.",
      },
    },
  },
};

export const InteractiveDemo: Story = {
  render: () => {
    const [selectedCount, setSelectedCount] = useState(3);

    return (
      <div className="min-h-[500px]">
        <div className="mb-8 p-4 bg-ui-bg-elevated rounded-lg border border-ui-border">
          <Typography variant="h4" className="mb-4">
            Interactive Demo
          </Typography>
          <Flex gap="md" align="center">
            <Button variant="outline" onClick={() => setSelectedCount((c) => Math.max(0, c - 1))}>
              - Remove
            </Button>
            <Typography variant="p" className="min-w-20 text-center">
              {selectedCount} selected
            </Typography>
            <Button variant="outline" onClick={() => setSelectedCount((c) => c + 1)}>
              + Add
            </Button>
            <Button variant="secondary" onClick={() => setSelectedCount(10)}>
              Select 10
            </Button>
          </Flex>
        </div>

        <BulkOperationsBarPresentational
          selectedCount={selectedCount}
          workflowStates={mockWorkflowStates}
          members={mockMembers}
          sprints={mockSprints}
          onClearSelection={() => setSelectedCount(0)}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive demo where you can add/remove selections to see the bar behavior.",
      },
    },
  },
};
