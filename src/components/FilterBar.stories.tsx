import { ISSUE_PRIORITIES, ISSUE_TYPES } from "@convex/validators";
import type { Meta, StoryObj } from "@storybook/react";
import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { ChevronDown, X } from "@/lib/icons";
import { ISSUE_TYPE_ICONS, type IssuePriority, type IssueType } from "@/lib/issue-utils";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/DropdownMenu";
import { Flex, FlexItem } from "./ui/Flex";
import { Icon } from "./ui/Icon";
import { Typography } from "./ui/Typography";

// =============================================================================
// Types
// =============================================================================

interface BoardFilters {
  type?: Exclude<IssueType, "subtask">[];
  priority?: IssuePriority[];
  assigneeId?: string[];
  labels?: string[];
}

// =============================================================================
// Presentational Components
// =============================================================================

interface FilterDropdownProps<T> {
  label: string;
  activeCount: number;
  items: readonly T[] | T[] | undefined;
  selectedValues: T[] | undefined;
  onToggle: (value: T) => void;
  renderItem: (item: T) => ReactNode;
  getKey: (item: T) => string;
  emptyMessage?: string;
  scrollable?: boolean;
}

function FilterDropdown<T>({
  label,
  activeCount,
  items,
  selectedValues,
  onToggle,
  renderItem,
  getKey,
  emptyMessage = "No items",
  scrollable = false,
}: FilterDropdownProps<T>) {
  const isActive = activeCount > 0;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 px-3", isActive && "bg-brand-subtle text-brand")}
        >
          {label}
          {isActive && ` (${activeCount})`}
          <ChevronDown className="ml-1 w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className={cn(scrollable && "max-h-64 overflow-y-auto")}>
        {items?.map((item) => (
          <DropdownMenuCheckboxItem
            key={getKey(item)}
            checked={selectedValues?.includes(item) ?? false}
            onCheckedChange={() => onToggle(item)}
          >
            {renderItem(item)}
          </DropdownMenuCheckboxItem>
        ))}
        {(!items || items.length === 0) && (
          <Typography variant="small" color="secondary" className="px-2 py-1.5">
            {emptyMessage}
          </Typography>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const PRIORITIES_DISPLAY_ORDER = [...ISSUE_PRIORITIES].reverse();

function countActiveFilters(filters: BoardFilters): number {
  return (
    (filters.type?.length ?? 0) +
    (filters.priority?.length ?? 0) +
    (filters.assigneeId?.length ?? 0) +
    (filters.labels?.length ?? 0)
  );
}

// =============================================================================
// Presentational FilterBar
// =============================================================================

interface FilterBarPresentationalProps {
  filters: BoardFilters;
  onFilterChange: (filters: BoardFilters) => void;
  members?: Array<{ userId: string; userName: string }>;
  labels?: Array<{ name: string; color: string }>;
  savedFilters?: Array<{ id: string; name: string; isPublic: boolean }>;
}

function FilterBarPresentational({
  filters,
  onFilterChange,
  members = [],
  labels = [],
  savedFilters = [],
}: FilterBarPresentationalProps) {
  const handleClearFilters = () => {
    onFilterChange({});
  };

  const toggleArrayFilter = useCallback(
    <K extends keyof BoardFilters>(
      key: K,
      value: BoardFilters[K] extends (infer U)[] | undefined ? U : never,
    ) => {
      const currentArray = (filters[key] ?? []) as (typeof value)[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((v) => v !== value)
        : [...currentArray, value];

      onFilterChange({
        ...filters,
        [key]: newArray.length > 0 ? newArray : undefined,
      });
    },
    [filters, onFilterChange],
  );

  const activeFilterCount = countActiveFilters(filters);
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="bg-ui-bg-soft border-b border-ui-border px-4 py-2.5">
      <Flex align="center" gap="sm" className="flex-wrap">
        {/* Type Filter */}
        <FilterDropdown
          label="Type"
          activeCount={filters.type?.length ?? 0}
          items={ISSUE_TYPES}
          selectedValues={filters.type}
          onToggle={(type) => toggleArrayFilter("type", type)}
          getKey={(type) => type}
          renderItem={(type) => (
            <Flex align="center" gap="sm">
              <Icon icon={ISSUE_TYPE_ICONS[type]} size="sm" />
              <Typography variant="small" className="capitalize">
                {type}
              </Typography>
            </Flex>
          )}
        />

        {/* Priority Filter */}
        <FilterDropdown
          label="Priority"
          activeCount={filters.priority?.length ?? 0}
          items={PRIORITIES_DISPLAY_ORDER}
          selectedValues={filters.priority}
          onToggle={(priority) => toggleArrayFilter("priority", priority)}
          getKey={(priority) => priority}
          renderItem={(priority) => (
            <Typography variant="small" className="capitalize">
              {priority}
            </Typography>
          )}
        />

        {/* Assignee Filter */}
        <FilterDropdown
          label="Assignee"
          activeCount={filters.assigneeId?.length ?? 0}
          items={members.map((m) => m.userId)}
          selectedValues={filters.assigneeId}
          onToggle={(userId) => toggleArrayFilter("assigneeId", userId)}
          getKey={(userId) => userId}
          renderItem={(userId) => members.find((m) => m.userId === userId)?.userName ?? "Unknown"}
          emptyMessage="No members"
          scrollable
        />

        {/* Labels Filter */}
        <FilterDropdown
          label="Labels"
          activeCount={filters.labels?.length ?? 0}
          items={labels.map((l) => l.name)}
          selectedValues={filters.labels}
          onToggle={(name) => toggleArrayFilter("labels", name)}
          getKey={(name) => name}
          renderItem={(name) => {
            const label = labels.find((l) => l.name === name);
            return (
              <Flex align="center" gap="sm">
                <FlexItem
                  as="span"
                  shrink={false}
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: label?.color }}
                />
                {name}
              </Flex>
            );
          }}
          emptyMessage="No labels"
          scrollable
        />

        {/* Divider */}
        {hasActiveFilters && <div className="w-px h-6 bg-ui-border" />}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-8 px-2 text-ui-text-secondary hover:text-ui-text hover:bg-ui-bg-hover transition-default"
          >
            <X className="w-4 h-4 mr-1" />
            Clear ({activeFilterCount})
          </Button>
        )}

        {/* Save Filter Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {}}
            className="h-8 px-3 text-ui-text-secondary hover:text-brand hover:bg-ui-bg-hover transition-default"
          >
            Save Filter
          </Button>
        )}

        {/* Saved Filters */}
        {savedFilters.length > 0 && (
          <>
            <div className="w-px h-6 bg-ui-border" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-3">
                  Saved Filters ({savedFilters.length})
                  <ChevronDown className="ml-1 w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto min-w-48">
                {savedFilters.map((filter) => (
                  <DropdownMenuCheckboxItem key={filter.id} checked={false}>
                    {filter.name}
                    {filter.isPublic && (
                      <Typography variant="caption" color="tertiary" as="span" className="ml-1">
                        (public)
                      </Typography>
                    )}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </Flex>
    </div>
  );
}

// =============================================================================
// Mock Data
// =============================================================================

const mockMembers = [
  { userId: "user-1", userName: "Alice Chen" },
  { userId: "user-2", userName: "Bob Smith" },
  { userId: "user-3", userName: "Carol Davis" },
  { userId: "user-4", userName: "David Wilson" },
  { userId: "user-5", userName: "Eve Martinez" },
];

const mockLabels = [
  { name: "frontend", color: "#3b82f6" },
  { name: "backend", color: "#22c55e" },
  { name: "urgent", color: "#ef4444" },
  { name: "documentation", color: "#f59e0b" },
  { name: "design", color: "#8b5cf6" },
];

const mockSavedFilters = [
  { id: "filter-1", name: "High Priority Bugs", isPublic: false },
  { id: "filter-2", name: "My Assigned Tasks", isPublic: false },
  { id: "filter-3", name: "Frontend Issues", isPublic: true },
];

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof FilterBarPresentational> = {
  title: "Components/FilterBar",
  component: FilterBarPresentational,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A filter bar for issue boards. Supports filtering by type, priority, assignee, and labels. Includes save/load filter functionality.",
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
    filters: {},
    onFilterChange: () => {},
    members: mockMembers,
    labels: mockLabels,
  },
  parameters: {
    docs: {
      description: {
        story: "Filter bar with no active filters.",
      },
    },
  },
};

export const WithTypeFilter: Story = {
  args: {
    filters: { type: ["bug", "task"] },
    onFilterChange: () => {},
    members: mockMembers,
    labels: mockLabels,
  },
  parameters: {
    docs: {
      description: {
        story: "Filter bar with type filter active (showing bugs and tasks).",
      },
    },
  },
};

export const WithPriorityFilter: Story = {
  args: {
    filters: { priority: ["highest", "high"] },
    onFilterChange: () => {},
    members: mockMembers,
    labels: mockLabels,
  },
  parameters: {
    docs: {
      description: {
        story: "Filter bar filtering for high priority issues.",
      },
    },
  },
};

export const WithAssigneeFilter: Story = {
  args: {
    filters: { assigneeId: ["user-1", "user-2"] },
    onFilterChange: () => {},
    members: mockMembers,
    labels: mockLabels,
  },
  parameters: {
    docs: {
      description: {
        story: "Filter bar filtering by specific assignees.",
      },
    },
  },
};

export const WithLabelFilter: Story = {
  args: {
    filters: { labels: ["frontend", "urgent"] },
    onFilterChange: () => {},
    members: mockMembers,
    labels: mockLabels,
  },
  parameters: {
    docs: {
      description: {
        story: "Filter bar filtering by labels.",
      },
    },
  },
};

export const MultipleFilters: Story = {
  args: {
    filters: {
      type: ["bug"],
      priority: ["highest", "high"],
      labels: ["frontend"],
    },
    onFilterChange: () => {},
    members: mockMembers,
    labels: mockLabels,
  },
  parameters: {
    docs: {
      description: {
        story: "Filter bar with multiple filter types active.",
      },
    },
  },
};

export const WithSavedFilters: Story = {
  args: {
    filters: {},
    onFilterChange: () => {},
    members: mockMembers,
    labels: mockLabels,
    savedFilters: mockSavedFilters,
  },
  parameters: {
    docs: {
      description: {
        story: "Filter bar showing saved filters dropdown.",
      },
    },
  },
};

export const NoMembers: Story = {
  args: {
    filters: {},
    onFilterChange: () => {},
    members: [],
    labels: mockLabels,
  },
  parameters: {
    docs: {
      description: {
        story: "Filter bar with no team members (assignee filter shows empty state).",
      },
    },
  },
};

export const NoLabels: Story = {
  args: {
    filters: {},
    onFilterChange: () => {},
    members: mockMembers,
    labels: [],
  },
  parameters: {
    docs: {
      description: {
        story: "Filter bar with no labels defined (labels filter shows empty state).",
      },
    },
  },
};

export const Interactive: Story = {
  render: () => {
    const [filters, setFilters] = useState<BoardFilters>({});

    return (
      <div>
        <FilterBarPresentational
          filters={filters}
          onFilterChange={setFilters}
          members={mockMembers}
          labels={mockLabels}
          savedFilters={mockSavedFilters}
        />
        <div className="mt-4 p-4 bg-ui-bg-secondary rounded-lg">
          <Typography variant="label" className="mb-2 block">
            Active Filters (JSON):
          </Typography>
          <pre className="text-sm font-mono text-ui-text-secondary">
            {JSON.stringify(filters, null, 2)}
          </pre>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive demo showing filter state changes in real-time.",
      },
    },
  },
};
