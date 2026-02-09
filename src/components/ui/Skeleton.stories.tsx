import type { Meta, StoryObj } from "@storybook/react";
import { Flex } from "./Flex";
import {
  Skeleton,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonKanbanCard,
  SkeletonList,
  SkeletonProjectCard,
  SkeletonStatCard,
  SkeletonTable,
  SkeletonText,
} from "./Skeleton";

const meta: Meta<typeof Skeleton> = {
  title: "UI/Skeleton",
  component: Skeleton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    className: {
      control: "text",
      description: "Additional CSS classes for sizing and styling",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

// ============================================================================
// Base Skeleton Stories
// ============================================================================

export const Default: Story = {
  args: {
    className: "h-4 w-48",
  },
};

export const Rectangle: Story = {
  args: {
    className: "h-24 w-48",
  },
  parameters: {
    docs: {
      description: {
        story: "Basic rectangular skeleton for general content placeholders.",
      },
    },
  },
};

export const Circle: Story = {
  args: {
    className: "h-12 w-12 rounded-full",
  },
  parameters: {
    docs: {
      description: {
        story: "Circular skeleton useful for avatar or icon placeholders.",
      },
    },
  },
};

export const TextLine: Story = {
  args: {
    className: "h-4 w-64",
  },
  parameters: {
    docs: {
      description: {
        story: "Single text line skeleton for loading text content.",
      },
    },
  },
};

// ============================================================================
// Shape Variations
// ============================================================================

export const AllShapes: Story = {
  render: () => (
    <Flex direction="column" gap="lg">
      <div>
        <h3 className="mb-3 text-sm font-medium text-ui-text-secondary">Shapes</h3>
        <Flex align="end" gap="lg">
          <Flex direction="column" align="center" gap="sm">
            <Skeleton className="h-16 w-32 rounded-md" />
            <span className="text-xs text-ui-text-tertiary">Rectangle</span>
          </Flex>
          <Flex direction="column" align="center" gap="sm">
            <Skeleton className="h-16 w-16 rounded-lg" />
            <span className="text-xs text-ui-text-tertiary">Square</span>
          </Flex>
          <Flex direction="column" align="center" gap="sm">
            <Skeleton className="h-16 w-16 rounded-full" />
            <span className="text-xs text-ui-text-tertiary">Circle</span>
          </Flex>
          <Flex direction="column" align="center" gap="sm">
            <Skeleton className="h-4 w-32" />
            <span className="text-xs text-ui-text-tertiary">Line</span>
          </Flex>
        </Flex>
      </div>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Different shapes available with the base Skeleton component.",
      },
    },
  },
};

// ============================================================================
// SkeletonAvatar Stories
// ============================================================================

export const AvatarSmall: Story = {
  render: () => <SkeletonAvatar size="sm" />,
};

export const AvatarMedium: Story = {
  render: () => <SkeletonAvatar size="md" />,
};

export const AvatarLarge: Story = {
  render: () => <SkeletonAvatar size="lg" />,
};

export const AllAvatarSizes: Story = {
  render: () => (
    <Flex align="end" gap="lg">
      <Flex direction="column" align="center" gap="sm">
        <SkeletonAvatar size="sm" />
        <span className="text-xs text-ui-text-tertiary">sm (32px)</span>
      </Flex>
      <Flex direction="column" align="center" gap="sm">
        <SkeletonAvatar size="md" />
        <span className="text-xs text-ui-text-tertiary">md (40px)</span>
      </Flex>
      <Flex direction="column" align="center" gap="sm">
        <SkeletonAvatar size="lg" />
        <span className="text-xs text-ui-text-tertiary">lg (48px)</span>
      </Flex>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "SkeletonAvatar component in all available sizes.",
      },
    },
  },
};

// ============================================================================
// SkeletonText Stories
// ============================================================================

export const TextTwoLines: Story = {
  render: () => <SkeletonText lines={2} />,
};

export const TextThreeLines: Story = {
  render: () => <SkeletonText lines={3} />,
};

export const TextFiveLines: Story = {
  render: () => <SkeletonText lines={5} />,
};

export const AllTextVariants: Story = {
  render: () => (
    <Flex gap="xl">
      <Flex direction="column" gap="sm">
        <span className="text-xs font-medium text-ui-text-secondary">2 lines</span>
        <div className="w-64">
          <SkeletonText lines={2} />
        </div>
      </Flex>
      <Flex direction="column" gap="sm">
        <span className="text-xs font-medium text-ui-text-secondary">3 lines</span>
        <div className="w-64">
          <SkeletonText lines={3} />
        </div>
      </Flex>
      <Flex direction="column" gap="sm">
        <span className="text-xs font-medium text-ui-text-secondary">5 lines</span>
        <div className="w-64">
          <SkeletonText lines={5} />
        </div>
      </Flex>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "SkeletonText with varying line counts. Lines have alternating widths for a natural look.",
      },
    },
  },
};

// ============================================================================
// SkeletonCard Stories
// ============================================================================

export const Card: Story = {
  render: () => <SkeletonCard className="w-80" />,
  parameters: {
    docs: {
      description: {
        story: "Card skeleton with border and padding, containing text lines.",
      },
    },
  },
};

// ============================================================================
// SkeletonList Stories
// ============================================================================

export const ListThreeItems: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonList items={3} />
    </div>
  ),
};

export const ListFiveItems: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonList items={5} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "SkeletonList mimics a list of items with avatars and text. Great for issue lists, document lists, etc.",
      },
    },
  },
};

// ============================================================================
// SkeletonTable Stories
// ============================================================================

export const TableThreeRows: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <SkeletonTable rows={3} />
    </div>
  ),
};

export const TableFiveRows: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <SkeletonTable rows={5} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "SkeletonTable for tabular data loading states with multiple columns.",
      },
    },
  },
};

// ============================================================================
// SkeletonStatCard Stories
// ============================================================================

export const StatCard: Story = {
  render: () => (
    <div className="w-48">
      <SkeletonStatCard />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Stat card skeleton for dashboard statistics with label, value, and trend.",
      },
    },
  },
};

export const StatCardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-4">
      <SkeletonStatCard />
      <SkeletonStatCard />
      <SkeletonStatCard />
      <SkeletonStatCard />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Grid of stat card skeletons as seen in dashboard views.",
      },
    },
  },
};

// ============================================================================
// SkeletonKanbanCard Stories
// ============================================================================

export const KanbanCard: Story = {
  render: () => (
    <div className="w-72">
      <SkeletonKanbanCard />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Kanban card skeleton with issue key, title, description, and assignee.",
      },
    },
  },
};

export const KanbanColumn: Story = {
  render: () => (
    <Flex direction="column" gap="sm" className="w-72">
      <SkeletonKanbanCard />
      <SkeletonKanbanCard />
      <SkeletonKanbanCard />
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Multiple kanban cards stacked as seen in a board column.",
      },
    },
  },
};

// ============================================================================
// SkeletonProjectCard Stories
// ============================================================================

export const ProjectCard: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonProjectCard />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Project card skeleton with name, key, and description.",
      },
    },
  },
};

export const ProjectCardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
      <SkeletonProjectCard />
      <SkeletonProjectCard />
      <SkeletonProjectCard />
      <SkeletonProjectCard />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Grid of project card skeletons as seen in projects list.",
      },
    },
  },
};

// ============================================================================
// Common Loading Patterns
// ============================================================================

export const ProfileLoading: Story = {
  render: () => (
    <Flex align="center" gap="lg" className="p-4 bg-ui-bg border border-ui-border rounded-lg w-80">
      <SkeletonAvatar size="lg" />
      <Flex direction="column" gap="sm" className="flex-1">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-24" />
      </Flex>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Profile loading pattern with avatar and user details.",
      },
    },
  },
};

export const CommentLoading: Story = {
  render: () => (
    <Flex direction="column" gap="md" className="w-96">
      {[1, 2, 3].map((i) => (
        <Flex key={i} align="start" gap="md" className="p-3 bg-ui-bg-secondary rounded-lg">
          <SkeletonAvatar size="sm" />
          <Flex direction="column" gap="sm" className="flex-1">
            <Flex align="center" gap="sm">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </Flex>
            <SkeletonText lines={2} />
          </Flex>
        </Flex>
      ))}
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Comment thread loading pattern with avatars, names, timestamps, and content.",
      },
    },
  },
};

export const ArticleLoading: Story = {
  render: () => (
    <Flex
      direction="column"
      gap="lg"
      className="w-full max-w-xl p-6 bg-ui-bg border border-ui-border rounded-lg"
    >
      <Skeleton className="h-8 w-3/4" />
      <Flex align="center" gap="md">
        <SkeletonAvatar size="sm" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </Flex>
      <Skeleton className="h-48 w-full rounded-lg" />
      <SkeletonText lines={4} />
      <SkeletonText lines={3} />
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Article or document loading pattern with title, meta, hero image, and paragraphs.",
      },
    },
  },
};

export const SidebarLoading: Story = {
  render: () => (
    <Flex
      direction="column"
      gap="lg"
      className="w-64 p-4 bg-ui-bg border border-ui-border rounded-lg"
    >
      <Flex align="center" gap="sm">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-5 w-24" />
      </Flex>
      <Flex direction="column" gap="md">
        <Skeleton className="h-3 w-20" />
        <Flex direction="column" gap="sm">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </Flex>
      </Flex>
      <Flex direction="column" gap="md">
        <Skeleton className="h-3 w-16" />
        <Flex direction="column" gap="sm">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </Flex>
      </Flex>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Navigation sidebar loading pattern with logo, sections, and menu items.",
      },
    },
  },
};

export const DashboardLoading: Story = {
  render: () => (
    <Flex direction="column" gap="lg" className="w-full max-w-4xl">
      <Flex align="center" justify="between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </Flex>
      <div className="grid grid-cols-4 gap-4">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <Flex
          direction="column"
          gap="md"
          className="p-4 bg-ui-bg border border-ui-border rounded-lg"
        >
          <Skeleton className="h-5 w-32" />
          <SkeletonTable rows={4} />
        </Flex>
        <Flex
          direction="column"
          gap="md"
          className="p-4 bg-ui-bg border border-ui-border rounded-lg"
        >
          <Skeleton className="h-5 w-40" />
          <SkeletonList items={4} />
        </Flex>
      </div>
    </Flex>
  ),
  parameters: {
    layout: "padded",
    docs: {
      description: {
        story: "Full dashboard loading pattern with header, stats, table, and activity list.",
      },
    },
  },
};

export const BoardLoading: Story = {
  render: () => (
    <Flex gap="lg">
      {[1, 2, 3, 4].map((col) => (
        <Flex key={col} direction="column" gap="md" className="w-72">
          <Flex align="center" justify="between" className="px-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-8" />
          </Flex>
          <Flex direction="column" gap="sm" className="p-2 bg-ui-bg-secondary rounded-lg min-h-96">
            <SkeletonKanbanCard />
            {col !== 4 && <SkeletonKanbanCard />}
            {col === 1 && <SkeletonKanbanCard />}
          </Flex>
        </Flex>
      ))}
    </Flex>
  ),
  parameters: {
    layout: "padded",
    docs: {
      description: {
        story: "Kanban board loading pattern with multiple columns and cards.",
      },
    },
  },
};

// ============================================================================
// Complete Component Matrix
// ============================================================================

export const AllComponents: Story = {
  render: () => (
    <Flex direction="column" gap="xl" className="w-full max-w-4xl">
      <div>
        <h3 className="mb-4 text-sm font-semibold text-ui-text">Base Skeleton</h3>
        <Flex gap="lg" align="end">
          <Flex direction="column" align="center" gap="sm">
            <Skeleton className="h-4 w-32" />
            <span className="text-xs text-ui-text-tertiary">Line</span>
          </Flex>
          <Flex direction="column" align="center" gap="sm">
            <Skeleton className="h-16 w-24 rounded-md" />
            <span className="text-xs text-ui-text-tertiary">Rectangle</span>
          </Flex>
          <Flex direction="column" align="center" gap="sm">
            <Skeleton className="h-12 w-12 rounded-full" />
            <span className="text-xs text-ui-text-tertiary">Circle</span>
          </Flex>
        </Flex>
      </div>

      <div>
        <h3 className="mb-4 text-sm font-semibold text-ui-text">SkeletonAvatar</h3>
        <Flex gap="lg" align="end">
          <Flex direction="column" align="center" gap="sm">
            <SkeletonAvatar size="sm" />
            <span className="text-xs text-ui-text-tertiary">sm</span>
          </Flex>
          <Flex direction="column" align="center" gap="sm">
            <SkeletonAvatar size="md" />
            <span className="text-xs text-ui-text-tertiary">md</span>
          </Flex>
          <Flex direction="column" align="center" gap="sm">
            <SkeletonAvatar size="lg" />
            <span className="text-xs text-ui-text-tertiary">lg</span>
          </Flex>
        </Flex>
      </div>

      <div>
        <h3 className="mb-4 text-sm font-semibold text-ui-text">SkeletonText</h3>
        <Flex gap="xl">
          <div className="w-48">
            <SkeletonText lines={2} />
          </div>
          <div className="w-48">
            <SkeletonText lines={3} />
          </div>
          <div className="w-48">
            <SkeletonText lines={4} />
          </div>
        </Flex>
      </div>

      <div>
        <h3 className="mb-4 text-sm font-semibold text-ui-text">Composite Skeletons</h3>
        <div className="grid grid-cols-2 gap-6">
          <Flex direction="column" gap="sm">
            <span className="text-xs font-medium text-ui-text-secondary">SkeletonCard</span>
            <SkeletonCard />
          </Flex>
          <Flex direction="column" gap="sm">
            <span className="text-xs font-medium text-ui-text-secondary">SkeletonStatCard</span>
            <SkeletonStatCard />
          </Flex>
          <Flex direction="column" gap="sm">
            <span className="text-xs font-medium text-ui-text-secondary">SkeletonKanbanCard</span>
            <SkeletonKanbanCard />
          </Flex>
          <Flex direction="column" gap="sm">
            <span className="text-xs font-medium text-ui-text-secondary">SkeletonProjectCard</span>
            <SkeletonProjectCard />
          </Flex>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-sm font-semibold text-ui-text">SkeletonList (3 items)</h3>
        <div className="w-80">
          <SkeletonList items={3} />
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-sm font-semibold text-ui-text">SkeletonTable (3 rows)</h3>
        <SkeletonTable rows={3} />
      </div>
    </Flex>
  ),
  parameters: {
    layout: "padded",
    docs: {
      description: {
        story: "Complete overview of all skeleton components and variants.",
      },
    },
  },
};
