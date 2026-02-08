import type { Meta, StoryObj } from "@storybook/react";
import { Check, ChevronRight, Mail, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "success", "danger", "ghost", "link", "outline"],
      description: "The visual style variant of the button",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "icon"],
      description: "The size of the button",
    },
    isLoading: {
      control: "boolean",
      description: "Shows a loading spinner and disables the button",
    },
    disabled: {
      control: "boolean",
      description: "Disables the button",
    },
    asChild: {
      control: "boolean",
      description: "Render as child element (useful for links)",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Variant Stories
// ============================================================================

export const Primary: Story = {
  args: {
    children: "Primary Button",
    variant: "primary",
  },
};

export const Secondary: Story = {
  args: {
    children: "Secondary Button",
    variant: "secondary",
  },
};

export const Success: Story = {
  args: {
    children: "Success Button",
    variant: "success",
  },
};

export const Danger: Story = {
  args: {
    children: "Danger Button",
    variant: "danger",
  },
};

export const Ghost: Story = {
  args: {
    children: "Ghost Button",
    variant: "ghost",
  },
};

export const Link: Story = {
  args: {
    children: "Link Button",
    variant: "link",
  },
};

export const Outline: Story = {
  args: {
    children: "Outline Button",
    variant: "outline",
  },
};

// ============================================================================
// Size Stories
// ============================================================================

export const Small: Story = {
  args: {
    children: "Small Button",
    size: "sm",
  },
};

export const Medium: Story = {
  args: {
    children: "Medium Button",
    size: "md",
  },
};

export const Large: Story = {
  args: {
    children: "Large Button",
    size: "lg",
  },
};

export const Icon: Story = {
  args: {
    size: "icon",
    children: <Plus className="h-4 w-4" />,
    "aria-label": "Add item",
  },
};

// ============================================================================
// State Stories
// ============================================================================

export const Disabled: Story = {
  args: {
    children: "Disabled Button",
    disabled: true,
  },
};

export const Loading: Story = {
  args: {
    children: "Save",
    isLoading: true,
  },
};

export const LoadingIcon: Story = {
  args: {
    size: "icon",
    isLoading: true,
    "aria-label": "Loading",
  },
};

// ============================================================================
// Icon Stories
// ============================================================================

export const WithLeftIcon: Story = {
  args: {
    children: "Send Email",
    leftIcon: <Mail className="h-4 w-4" />,
  },
};

export const WithRightIcon: Story = {
  args: {
    children: "Continue",
    rightIcon: <ChevronRight className="h-4 w-4" />,
  },
};

export const WithBothIcons: Story = {
  args: {
    children: "Search",
    leftIcon: <Search className="h-4 w-4" />,
    rightIcon: <ChevronRight className="h-4 w-4" />,
  },
};

// ============================================================================
// Grid Stories - All Variants
// ============================================================================

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="success">Success</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
        <Button variant="outline">Outline</Button>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="primary" disabled>
          Primary
        </Button>
        <Button variant="secondary" disabled>
          Secondary
        </Button>
        <Button variant="success" disabled>
          Success
        </Button>
        <Button variant="danger" disabled>
          Danger
        </Button>
        <Button variant="ghost" disabled>
          Ghost
        </Button>
        <Button variant="link" disabled>
          Link
        </Button>
        <Button variant="outline" disabled>
          Outline
        </Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "All button variants in their default and disabled states.",
      },
    },
  },
};

// ============================================================================
// Grid Stories - All Sizes
// ============================================================================

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="Add">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "All button sizes from small to large, including icon size.",
      },
    },
  },
};

// ============================================================================
// Grid Stories - Complete Matrix
// ============================================================================

export const VariantSizeMatrix: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(["primary", "secondary", "success", "danger", "ghost", "link", "outline"] as const).map(
        (variant) => (
          <div key={variant} className="flex items-center gap-4">
            <span className="w-24 text-sm font-medium capitalize">{variant}</span>
            <Button variant={variant} size="sm">
              Small
            </Button>
            <Button variant={variant} size="md">
              Medium
            </Button>
            <Button variant={variant} size="lg">
              Large
            </Button>
            <Button variant={variant} size="icon" aria-label="Add">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        ),
      )}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Complete matrix showing all variants across all sizes.",
      },
    },
  },
};

// ============================================================================
// Use Case Stories
// ============================================================================

export const FormActions: Story = {
  render: () => (
    <div className="flex gap-3">
      <Button variant="primary">Save Changes</Button>
      <Button variant="secondary">Cancel</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Common form action button pattern.",
      },
    },
  },
};

export const DangerConfirmation: Story = {
  render: () => (
    <div className="flex gap-3">
      <Button variant="danger" leftIcon={<Trash2 className="h-4 w-4" />}>
        Delete
      </Button>
      <Button variant="ghost">Cancel</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Destructive action confirmation pattern.",
      },
    },
  },
};

export const SuccessAction: Story = {
  render: () => (
    <Button variant="success" leftIcon={<Check className="h-4 w-4" />}>
      Confirm
    </Button>
  ),
  parameters: {
    docs: {
      description: {
        story: "Success confirmation button with icon.",
      },
    },
  },
};

export const LoadingStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Button variant="primary" isLoading>
          Saving...
        </Button>
        <Button variant="secondary" isLoading>
          Loading...
        </Button>
        <Button variant="success" isLoading>
          Confirming...
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="danger" isLoading>
          Deleting...
        </Button>
        <Button variant="outline" isLoading>
          Processing...
        </Button>
        <Button size="icon" isLoading aria-label="Loading" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Various button variants in their loading states.",
      },
    },
  },
};

export const IconButtons: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="icon" variant="primary" aria-label="Add">
        <Plus className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="secondary" aria-label="Search">
        <Search className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" aria-label="Email">
        <Mail className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="danger" aria-label="Delete">
        <Trash2 className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="outline" aria-label="Next">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Icon-only buttons in various variants.",
      },
    },
  },
};
