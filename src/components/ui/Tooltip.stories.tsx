import type { Meta, StoryObj } from "@storybook/react";
import { CircleHelp, Info, Settings, Trash2 } from "@/lib/icons";
import { Button } from "./Button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger } from "./Tooltip";

const meta: Meta<typeof Tooltip> = {
  title: "UI/Tooltip",
  component: Tooltip,
  decorators: [
    (Story) => (
      <TooltipProvider>
        <div className="flex items-center justify-center p-16">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    content: {
      control: "text",
      description: "Content to show in the tooltip",
    },
    side: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
      description: "Side of the trigger to show tooltip",
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
      description: "Alignment of the tooltip",
    },
    delayDuration: {
      control: "number",
      description: "Delay in ms before tooltip shows",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Basic Tooltip Stories
// ============================================================================

export const Default: Story = {
  args: {
    content: "This is a helpful tooltip",
    children: <Button>Hover me</Button>,
  },
};

export const WithDelayDuration: Story = {
  args: {
    content: "Tooltip with delay",
    delayDuration: 500,
    children: <Button variant="secondary">Hover (500ms delay)</Button>,
  },
  parameters: {
    docs: {
      description: {
        story: "Tooltip with a custom delay before appearing.",
      },
    },
  },
};

// ============================================================================
// Position Stories
// ============================================================================

export const Top: Story = {
  args: {
    content: "Tooltip on top",
    side: "top",
    children: <Button variant="outline">Top</Button>,
  },
  parameters: {
    docs: {
      description: {
        story: "Tooltip positioned above the trigger element.",
      },
    },
  },
};

export const Bottom: Story = {
  args: {
    content: "Tooltip on bottom",
    side: "bottom",
    children: <Button variant="outline">Bottom</Button>,
  },
  parameters: {
    docs: {
      description: {
        story: "Tooltip positioned below the trigger element.",
      },
    },
  },
};

export const Left: Story = {
  args: {
    content: "Tooltip on left",
    side: "left",
    children: <Button variant="outline">Left</Button>,
  },
  parameters: {
    docs: {
      description: {
        story: "Tooltip positioned to the left of the trigger element.",
      },
    },
  },
};

export const Right: Story = {
  args: {
    content: "Tooltip on right",
    side: "right",
    children: <Button variant="outline">Right</Button>,
  },
  parameters: {
    docs: {
      description: {
        story: "Tooltip positioned to the right of the trigger element.",
      },
    },
  },
};

// ============================================================================
// All Positions Story
// ============================================================================

export const AllPositions: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-8">
      <div />
      <Tooltip content="Top tooltip" side="top">
        <Button variant="outline">Top</Button>
      </Tooltip>
      <div />
      <Tooltip content="Left tooltip" side="left">
        <Button variant="outline">Left</Button>
      </Tooltip>
      <div />
      <Tooltip content="Right tooltip" side="right">
        <Button variant="outline">Right</Button>
      </Tooltip>
      <div />
      <Tooltip content="Bottom tooltip" side="bottom">
        <Button variant="outline">Bottom</Button>
      </Tooltip>
      <div />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "All four tooltip positions demonstrated in a grid layout.",
      },
    },
  },
};

// ============================================================================
// Alignment Stories
// ============================================================================

export const AlignStart: Story = {
  args: {
    content: "Aligned to start",
    side: "bottom",
    align: "start",
    children: <Button>Align Start</Button>,
  },
};

export const AlignCenter: Story = {
  args: {
    content: "Aligned to center",
    side: "bottom",
    align: "center",
    children: <Button>Align Center</Button>,
  },
};

export const AlignEnd: Story = {
  args: {
    content: "Aligned to end",
    side: "bottom",
    align: "end",
    children: <Button>Align End</Button>,
  },
};

// ============================================================================
// Icon Trigger Stories
// ============================================================================

export const OnIconButton: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Tooltip content="Settings">
        <Button size="icon" variant="ghost" aria-label="Settings">
          <Settings className="h-4 w-4" />
        </Button>
      </Tooltip>
      <Tooltip content="Delete item">
        <Button size="icon" variant="ghost" aria-label="Delete">
          <Trash2 className="h-4 w-4" />
        </Button>
      </Tooltip>
      <Tooltip content="More information">
        <Button size="icon" variant="ghost" aria-label="Info">
          <Info className="h-4 w-4" />
        </Button>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Tooltips on icon buttons to provide accessible labels.",
      },
    },
  },
};

export const OnInlineIcon: Story = {
  render: () => (
    <div className="flex items-center gap-2 text-sm text-ui-text">
      <span>Required field</span>
      <Tooltip content="This field is required for form submission">
        <span className="cursor-help">
          <CircleHelp className="h-4 w-4 text-ui-text-secondary" />
        </span>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Tooltip on an inline help icon for additional context.",
      },
    },
  },
};

// ============================================================================
// Button Variant Stories
// ============================================================================

export const OnDifferentButtons: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Tooltip content="Primary action">
        <Button variant="primary">Primary</Button>
      </Tooltip>
      <Tooltip content="Secondary action">
        <Button variant="secondary">Secondary</Button>
      </Tooltip>
      <Tooltip content="Danger action - this will delete the item">
        <Button variant="danger">Danger</Button>
      </Tooltip>
      <Tooltip content="Ghost action">
        <Button variant="ghost">Ghost</Button>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Tooltips on different button variants.",
      },
    },
  },
};

// ============================================================================
// Long Content Stories
// ============================================================================

export const LongContent: Story = {
  args: {
    content:
      "This is a longer tooltip message that provides more detailed information about the action or element.",
    children: <Button variant="outline">Hover for details</Button>,
  },
  parameters: {
    docs: {
      description: {
        story: "Tooltip with longer descriptive content.",
      },
    },
  },
};

export const MultilineContent: Story = {
  render: () => (
    <Tooltip
      content={
        <div className="max-w-xs text-center">
          <p className="font-medium">Keyboard Shortcut</p>
          <p className="text-ui-text-secondary">Press Ctrl+S to save</p>
        </div>
      }
    >
      <Button variant="outline">Rich Content</Button>
    </Tooltip>
  ),
  parameters: {
    docs: {
      description: {
        story: "Tooltip with rich, multi-line content using JSX.",
      },
    },
  },
};

// ============================================================================
// Primitive Components Stories
// ============================================================================

export const UsingPrimitives: Story = {
  render: () => (
    <TooltipRoot>
      <TooltipTrigger asChild>
        <Button variant="secondary">Using Primitives</Button>
      </TooltipTrigger>
      <TooltipContent>Built with TooltipRoot, TooltipTrigger, and TooltipContent</TooltipContent>
    </TooltipRoot>
  ),
  parameters: {
    docs: {
      description: {
        story: "Using the lower-level primitive components for more control over tooltip behavior.",
      },
    },
  },
};

export const PrimitiveWithSide: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <TooltipRoot>
        <TooltipTrigger asChild>
          <Button variant="outline">Left</Button>
        </TooltipTrigger>
        <TooltipContent side="left">Primitive tooltip on left</TooltipContent>
      </TooltipRoot>
      <TooltipRoot>
        <TooltipTrigger asChild>
          <Button variant="outline">Right</Button>
        </TooltipTrigger>
        <TooltipContent side="right">Primitive tooltip on right</TooltipContent>
      </TooltipRoot>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Primitive components with different side positioning.",
      },
    },
  },
};

// ============================================================================
// Accessibility Stories
// ============================================================================

export const AccessibleIconButtons: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Tooltip content="Edit document">
        <Button size="icon" variant="ghost" aria-label="Edit document">
          <Settings className="h-4 w-4" />
        </Button>
      </Tooltip>
      <Tooltip content="Delete document permanently">
        <Button size="icon" variant="ghost" aria-label="Delete document">
          <Trash2 className="h-4 w-4" />
        </Button>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Icon buttons with tooltips providing accessible descriptions. Always include aria-label for icon-only buttons.",
      },
    },
  },
};

// ============================================================================
// Disabled Trigger Stories
// ============================================================================

export const OnDisabledButton: Story = {
  render: () => (
    <Tooltip content="This action is currently unavailable">
      <span>
        <Button disabled>Disabled Button</Button>
      </span>
    </Tooltip>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Tooltip on a disabled button. Note: disabled buttons need a wrapper span for the tooltip to work.",
      },
    },
  },
};
