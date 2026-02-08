import type { Meta, StoryObj } from "@storybook/react";
import { Flex } from "./Flex";

const meta: Meta<typeof Flex> = {
  title: "UI/Flex",
  component: Flex,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    direction: {
      control: "select",
      options: ["row", "column"],
      description: "Direction of flex layout",
    },
    gap: {
      control: "select",
      options: ["none", "xs", "sm", "md", "lg", "xl"],
      description: "Gap between items",
    },
    align: {
      control: "select",
      options: ["start", "center", "end", "stretch", "baseline"],
      description: "Align items on cross axis",
    },
    justify: {
      control: "select",
      options: ["start", "center", "end", "between", "around", "evenly"],
      description: "Justify content on main axis",
    },
    wrap: {
      control: "boolean",
      description: "Wrap items to next line",
    },
    inline: {
      control: "boolean",
      description: "Use inline-flex instead of flex",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Helper component for visual demonstration
function Box({ children, size = "md" }: { children?: React.ReactNode; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };
  return (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center rounded bg-brand text-white text-sm font-medium`}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Direction Stories
// ============================================================================

export const DirectionRow: Story = {
  render: () => (
    <Flex direction="row" gap="md">
      <Box>1</Box>
      <Box>2</Box>
      <Box>3</Box>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Items arranged horizontally in a row (default direction).",
      },
    },
  },
};

export const DirectionColumn: Story = {
  render: () => (
    <Flex direction="column" gap="md">
      <Box>1</Box>
      <Box>2</Box>
      <Box>3</Box>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Items arranged vertically in a column.",
      },
    },
  },
};

// ============================================================================
// Alignment Stories (Cross Axis)
// ============================================================================

export const AlignStart: Story = {
  render: () => (
    <Flex align="start" gap="md" className="h-32 bg-ui-bg-secondary p-4">
      <Box size="sm">1</Box>
      <Box size="md">2</Box>
      <Box size="lg">3</Box>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Items aligned to the start of the cross axis.",
      },
    },
  },
};

export const AlignCenter: Story = {
  render: () => (
    <Flex align="center" gap="md" className="h-32 bg-ui-bg-secondary p-4">
      <Box size="sm">1</Box>
      <Box size="md">2</Box>
      <Box size="lg">3</Box>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Items aligned to the center of the cross axis.",
      },
    },
  },
};

export const AlignEnd: Story = {
  render: () => (
    <Flex align="end" gap="md" className="h-32 bg-ui-bg-secondary p-4">
      <Box size="sm">1</Box>
      <Box size="md">2</Box>
      <Box size="lg">3</Box>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Items aligned to the end of the cross axis.",
      },
    },
  },
};

export const AlignStretch: Story = {
  render: () => (
    <Flex align="stretch" gap="md" className="h-32 bg-ui-bg-secondary p-4">
      <div className="flex w-12 items-center justify-center rounded bg-brand text-white text-sm font-medium">
        1
      </div>
      <div className="flex w-12 items-center justify-center rounded bg-brand text-white text-sm font-medium">
        2
      </div>
      <div className="flex w-12 items-center justify-center rounded bg-brand text-white text-sm font-medium">
        3
      </div>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Items stretched to fill the cross axis.",
      },
    },
  },
};

export const AlignBaseline: Story = {
  render: () => (
    <Flex align="baseline" gap="md" className="bg-ui-bg-secondary p-4">
      <span className="text-sm">Small</span>
      <span className="text-xl">Medium</span>
      <span className="text-3xl">Large</span>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Items aligned along their text baseline.",
      },
    },
  },
};

// ============================================================================
// Justify Stories (Main Axis)
// ============================================================================

export const JustifyStart: Story = {
  render: () => (
    <Flex justify="start" gap="md" className="bg-ui-bg-secondary p-4">
      <Box>1</Box>
      <Box>2</Box>
      <Box>3</Box>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Items packed toward the start of the main axis.",
      },
    },
  },
};

export const JustifyCenter: Story = {
  render: () => (
    <Flex justify="center" gap="md" className="bg-ui-bg-secondary p-4">
      <Box>1</Box>
      <Box>2</Box>
      <Box>3</Box>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Items centered along the main axis.",
      },
    },
  },
};

export const JustifyEnd: Story = {
  render: () => (
    <Flex justify="end" gap="md" className="bg-ui-bg-secondary p-4">
      <Box>1</Box>
      <Box>2</Box>
      <Box>3</Box>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Items packed toward the end of the main axis.",
      },
    },
  },
};

export const JustifyBetween: Story = {
  render: () => (
    <Flex justify="between" className="bg-ui-bg-secondary p-4">
      <Box>1</Box>
      <Box>2</Box>
      <Box>3</Box>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Items evenly distributed with first item at start and last at end.",
      },
    },
  },
};

export const JustifyAround: Story = {
  render: () => (
    <Flex justify="around" className="bg-ui-bg-secondary p-4">
      <Box>1</Box>
      <Box>2</Box>
      <Box>3</Box>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Items evenly distributed with equal space around them.",
      },
    },
  },
};

export const JustifyEvenly: Story = {
  render: () => (
    <Flex justify="evenly" className="bg-ui-bg-secondary p-4">
      <Box>1</Box>
      <Box>2</Box>
      <Box>3</Box>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Items evenly distributed with equal space between them.",
      },
    },
  },
};

// ============================================================================
// Gap Stories
// ============================================================================

export const GapNone: Story = {
  render: () => (
    <Flex gap="none" className="bg-ui-bg-secondary p-4">
      <Box>1</Box>
      <Box>2</Box>
      <Box>3</Box>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "No gap between items (gap-0).",
      },
    },
  },
};

export const GapXs: Story = {
  render: () => (
    <Flex gap="xs" className="bg-ui-bg-secondary p-4">
      <Box>1</Box>
      <Box>2</Box>
      <Box>3</Box>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Extra small gap (gap-1, 0.25rem).",
      },
    },
  },
};

export const GapSm: Story = {
  render: () => (
    <Flex gap="sm" className="bg-ui-bg-secondary p-4">
      <Box>1</Box>
      <Box>2</Box>
      <Box>3</Box>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Small gap (gap-2, 0.5rem).",
      },
    },
  },
};

export const GapMd: Story = {
  render: () => (
    <Flex gap="md" className="bg-ui-bg-secondary p-4">
      <Box>1</Box>
      <Box>2</Box>
      <Box>3</Box>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Medium gap (gap-3, 0.75rem).",
      },
    },
  },
};

export const GapLg: Story = {
  render: () => (
    <Flex gap="lg" className="bg-ui-bg-secondary p-4">
      <Box>1</Box>
      <Box>2</Box>
      <Box>3</Box>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Large gap (gap-4, 1rem).",
      },
    },
  },
};

export const GapXl: Story = {
  render: () => (
    <Flex gap="xl" className="bg-ui-bg-secondary p-4">
      <Box>1</Box>
      <Box>2</Box>
      <Box>3</Box>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Extra large gap (gap-6, 1.5rem).",
      },
    },
  },
};

export const AllGaps: Story = {
  render: () => (
    <Flex direction="column" gap="lg">
      {(["none", "xs", "sm", "md", "lg", "xl"] as const).map((gapSize) => (
        <Flex key={gapSize} direction="column" gap="xs">
          <span className="text-sm text-ui-text-secondary">gap="{gapSize}"</span>
          <Flex gap={gapSize} className="bg-ui-bg-secondary p-4">
            <Box size="sm">1</Box>
            <Box size="sm">2</Box>
            <Box size="sm">3</Box>
          </Flex>
        </Flex>
      ))}
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Comparison of all gap sizes from none to xl.",
      },
    },
  },
};

// ============================================================================
// Wrap Stories
// ============================================================================

export const WrapEnabled: Story = {
  render: () => (
    <Flex wrap gap="md" className="w-64 bg-ui-bg-secondary p-4">
      <Box>1</Box>
      <Box>2</Box>
      <Box>3</Box>
      <Box>4</Box>
      <Box>5</Box>
      <Box>6</Box>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Items wrap to the next line when they exceed container width.",
      },
    },
  },
};

export const WrapDisabled: Story = {
  render: () => (
    <Flex gap="md" className="w-64 overflow-hidden bg-ui-bg-secondary p-4">
      <Box>1</Box>
      <Box>2</Box>
      <Box>3</Box>
      <Box>4</Box>
      <Box>5</Box>
      <Box>6</Box>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Items do not wrap (default). They may overflow the container.",
      },
    },
  },
};

// ============================================================================
// Inline Stories
// ============================================================================

export const InlineFlex: Story = {
  render: () => (
    <div>
      <span>Text before </span>
      <Flex inline gap="xs" align="center">
        <Box size="sm">1</Box>
        <Box size="sm">2</Box>
      </Flex>
      <span> text after</span>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Inline-flex allows the flex container to flow with inline content.",
      },
    },
  },
};

// ============================================================================
// Common Layout Patterns
// ============================================================================

export const HeaderLayout: Story = {
  render: () => (
    <Flex
      justify="between"
      align="center"
      className="bg-ui-bg-secondary p-4 rounded border border-ui-border"
    >
      <span className="font-semibold">Logo</span>
      <Flex gap="md" align="center">
        <span>Home</span>
        <span>About</span>
        <span>Contact</span>
      </Flex>
      <Flex gap="sm">
        <button type="button" className="px-3 py-1 rounded bg-ui-bg-tertiary">
          Login
        </button>
        <button type="button" className="px-3 py-1 rounded bg-brand text-white">
          Sign Up
        </button>
      </Flex>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Common header pattern with logo on left, navigation in center, and actions on right.",
      },
    },
  },
};

export const CardLayout: Story = {
  render: () => (
    <Flex
      direction="column"
      gap="md"
      className="w-72 bg-ui-bg-secondary p-4 rounded border border-ui-border"
    >
      <div className="h-32 w-full rounded bg-ui-bg-tertiary" />
      <Flex direction="column" gap="xs">
        <span className="font-semibold">Card Title</span>
        <span className="text-sm text-ui-text-secondary">
          This is a card description that spans multiple lines and demonstrates the column layout.
        </span>
      </Flex>
      <Flex justify="between" align="center">
        <span className="text-sm text-ui-text-secondary">$99.00</span>
        <button type="button" className="px-3 py-1 rounded bg-brand text-white text-sm">
          Buy Now
        </button>
      </Flex>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Card layout with image, content, and footer using nested Flex.",
      },
    },
  },
};

export const FormLayout: Story = {
  render: () => (
    <Flex direction="column" gap="lg" className="w-80">
      <Flex direction="column" gap="xs">
        <label htmlFor="name-input" className="text-sm font-medium">
          Name
        </label>
        <input
          id="name-input"
          type="text"
          className="px-3 py-2 rounded border border-ui-border bg-ui-bg"
          placeholder="Enter your name"
        />
      </Flex>
      <Flex direction="column" gap="xs">
        <label htmlFor="email-input" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email-input"
          type="email"
          className="px-3 py-2 rounded border border-ui-border bg-ui-bg"
          placeholder="Enter your email"
        />
      </Flex>
      <Flex gap="md" justify="end">
        <button type="button" className="px-4 py-2 rounded border border-ui-border">
          Cancel
        </button>
        <button type="button" className="px-4 py-2 rounded bg-brand text-white">
          Submit
        </button>
      </Flex>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Form layout with stacked inputs and action buttons.",
      },
    },
  },
};

export const SidebarLayout: Story = {
  render: () => (
    <Flex className="h-64">
      <Flex
        direction="column"
        gap="sm"
        className="w-48 bg-ui-bg-secondary p-4 border-r border-ui-border"
      >
        <span className="font-semibold mb-2">Navigation</span>
        <span className="px-2 py-1 rounded bg-brand/10 text-brand">Dashboard</span>
        <span className="px-2 py-1">Projects</span>
        <span className="px-2 py-1">Settings</span>
      </Flex>
      <Flex direction="column" gap="md" className="flex-1 p-4">
        <span className="text-xl font-semibold">Dashboard</span>
        <span className="text-ui-text-secondary">Main content area with sidebar navigation.</span>
      </Flex>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Sidebar layout with navigation on the left and main content.",
      },
    },
  },
};

export const CenteredContent: Story = {
  render: () => (
    <Flex
      align="center"
      justify="center"
      className="h-64 bg-ui-bg-secondary rounded border border-ui-border"
    >
      <Flex direction="column" gap="md" align="center" className="text-center">
        <div className="h-16 w-16 rounded-full bg-brand/20 flex items-center justify-center">
          <span className="text-2xl">!</span>
        </div>
        <span className="font-semibold">No items found</span>
        <span className="text-sm text-ui-text-secondary">
          Try adjusting your search or filters.
        </span>
      </Flex>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Centered content pattern for empty states or loading screens.",
      },
    },
  },
};

export const TagList: Story = {
  render: () => (
    <Flex wrap gap="sm" className="w-64">
      {["React", "TypeScript", "Tailwind", "Convex", "Storybook", "Vite"].map((tag) => (
        <span key={tag} className="px-2 py-1 rounded-full bg-ui-bg-tertiary text-sm">
          {tag}
        </span>
      ))}
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Wrapping tag/chip list that flows to multiple lines.",
      },
    },
  },
};

export const AvatarStack: Story = {
  render: () => (
    <Flex align="center" className="-space-x-2">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-10 w-10 rounded-full bg-brand border-2 border-ui-bg flex items-center justify-center text-white text-sm font-medium"
        >
          {i}
        </div>
      ))}
      <div className="h-10 w-10 rounded-full bg-ui-bg-tertiary border-2 border-ui-bg flex items-center justify-center text-sm font-medium ml-2">
        +3
      </div>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Overlapping avatar stack with count indicator.",
      },
    },
  },
};

export const MediaObject: Story = {
  render: () => (
    <Flex gap="md" className="p-4 bg-ui-bg-secondary rounded border border-ui-border">
      <div className="h-12 w-12 rounded-full bg-brand flex-shrink-0" />
      <Flex direction="column" gap="xs" className="flex-1 min-w-0">
        <Flex justify="between" align="start">
          <span className="font-semibold">John Doe</span>
          <span className="text-xs text-ui-text-secondary">2h ago</span>
        </Flex>
        <span className="text-sm text-ui-text-secondary truncate">
          This is a notification message that might be quite long and should truncate properly.
        </span>
      </Flex>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Media object pattern with avatar/image on left and content on right.",
      },
    },
  },
};

// ============================================================================
// Polymorphic 'as' Prop
// ============================================================================

export const AsSection: Story = {
  render: () => (
    <Flex as="section" direction="column" gap="md" className="p-4 bg-ui-bg-secondary rounded">
      <h2 className="text-lg font-semibold">Section Title</h2>
      <p className="text-ui-text-secondary">
        This Flex component renders as a semantic section element.
      </p>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Using the `as` prop to render Flex as a semantic HTML element.",
      },
    },
  },
};

export const AsNav: Story = {
  render: () => (
    <Flex as="nav" gap="lg" align="center" className="p-4 bg-ui-bg-secondary rounded">
      <a href="#home" className="hover:text-brand">
        Home
      </a>
      <a href="#about" className="hover:text-brand">
        About
      </a>
      <a href="#services" className="hover:text-brand">
        Services
      </a>
      <a href="#contact" className="hover:text-brand">
        Contact
      </a>
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story: "Using the `as` prop to render Flex as a navigation element.",
      },
    },
  },
};
