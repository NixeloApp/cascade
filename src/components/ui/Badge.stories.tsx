import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";

const meta: Meta<typeof Badge> = {
  title: "UI/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "primary",
        "secondary",
        "success",
        "error",
        "warning",
        "info",
        "neutral",
        "brand",
        "accent",
        "outline",
      ],
      description: "The visual style variant of the badge",
    },
    size: {
      control: "select",
      options: ["sm", "md"],
      description: "The size of the badge",
    },
    shape: {
      control: "select",
      options: ["rounded", "pill"],
      description: "The shape of the badge",
    },
    children: {
      control: "text",
      description: "The content of the badge",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

// Default story
export const Default: Story = {
  args: {
    children: "Badge",
  },
};

// Variant stories
export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Primary",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary",
  },
};

export const Success: Story = {
  args: {
    variant: "success",
    children: "Success",
  },
};

export const ErrorVariant: Story = {
  args: {
    variant: "error",
    children: "Error",
  },
};

export const Warning: Story = {
  args: {
    variant: "warning",
    children: "Warning",
  },
};

export const Info: Story = {
  args: {
    variant: "info",
    children: "Info",
  },
};

export const Neutral: Story = {
  args: {
    variant: "neutral",
    children: "Neutral",
  },
};

export const Brand: Story = {
  args: {
    variant: "brand",
    children: "Brand",
  },
};

export const Accent: Story = {
  args: {
    variant: "accent",
    children: "Accent",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Outline",
  },
};

// Size stories
export const SizeSmall: Story = {
  args: {
    size: "sm",
    children: "Small",
  },
};

export const SizeMedium: Story = {
  args: {
    size: "md",
    children: "Medium",
  },
};

// Shape stories
export const ShapeRounded: Story = {
  args: {
    shape: "rounded",
    children: "Rounded",
  },
};

export const ShapePill: Story = {
  args: {
    shape: "pill",
    children: "Pill",
  },
};

// All variants grid
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-3 text-sm font-medium text-ui-text-secondary">Variants</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary">Primary</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="error">Error</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="neutral">Neutral</Badge>
          <Badge variant="brand">Brand</Badge>
          <Badge variant="accent">Accent</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-ui-text-secondary">Sizes</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Badge size="sm">Small</Badge>
          <Badge size="md">Medium</Badge>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-ui-text-secondary">Shapes</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Badge shape="rounded">Rounded</Badge>
          <Badge shape="pill">Pill</Badge>
        </div>
      </div>
    </div>
  ),
};

// Combinations grid
export const Combinations: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-3 text-sm font-medium text-ui-text-secondary">Pill Variants</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary" shape="pill">
            Primary
          </Badge>
          <Badge variant="secondary" shape="pill">
            Secondary
          </Badge>
          <Badge variant="success" shape="pill">
            Success
          </Badge>
          <Badge variant="error" shape="pill">
            Error
          </Badge>
          <Badge variant="warning" shape="pill">
            Warning
          </Badge>
          <Badge variant="info" shape="pill">
            Info
          </Badge>
          <Badge variant="neutral" shape="pill">
            Neutral
          </Badge>
          <Badge variant="brand" shape="pill">
            Brand
          </Badge>
          <Badge variant="accent" shape="pill">
            Accent
          </Badge>
          <Badge variant="outline" shape="pill">
            Outline
          </Badge>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-ui-text-secondary">Medium Size Variants</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary" size="md">
            Primary
          </Badge>
          <Badge variant="secondary" size="md">
            Secondary
          </Badge>
          <Badge variant="success" size="md">
            Success
          </Badge>
          <Badge variant="error" size="md">
            Error
          </Badge>
          <Badge variant="warning" size="md">
            Warning
          </Badge>
          <Badge variant="info" size="md">
            Info
          </Badge>
          <Badge variant="neutral" size="md">
            Neutral
          </Badge>
          <Badge variant="brand" size="md">
            Brand
          </Badge>
          <Badge variant="accent" size="md">
            Accent
          </Badge>
          <Badge variant="outline" size="md">
            Outline
          </Badge>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-ui-text-secondary">Medium Pill Variants</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary" size="md" shape="pill">
            Primary
          </Badge>
          <Badge variant="secondary" size="md" shape="pill">
            Secondary
          </Badge>
          <Badge variant="success" size="md" shape="pill">
            Success
          </Badge>
          <Badge variant="error" size="md" shape="pill">
            Error
          </Badge>
          <Badge variant="warning" size="md" shape="pill">
            Warning
          </Badge>
          <Badge variant="info" size="md" shape="pill">
            Info
          </Badge>
          <Badge variant="neutral" size="md" shape="pill">
            Neutral
          </Badge>
          <Badge variant="brand" size="md" shape="pill">
            Brand
          </Badge>
          <Badge variant="accent" size="md" shape="pill">
            Accent
          </Badge>
          <Badge variant="outline" size="md" shape="pill">
            Outline
          </Badge>
        </div>
      </div>
    </div>
  ),
};

// Real-world usage examples
export const UsageExamples: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-3 text-sm font-medium text-ui-text-secondary">Status Indicators</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success" shape="pill">
            Active
          </Badge>
          <Badge variant="warning" shape="pill">
            Pending
          </Badge>
          <Badge variant="error" shape="pill">
            Inactive
          </Badge>
          <Badge variant="info" shape="pill">
            Draft
          </Badge>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-ui-text-secondary">Priority Labels</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="error">Critical</Badge>
          <Badge variant="warning">High</Badge>
          <Badge variant="info">Medium</Badge>
          <Badge variant="neutral">Low</Badge>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-ui-text-secondary">Tags and Categories</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="brand" shape="pill">
            New
          </Badge>
          <Badge variant="accent" shape="pill">
            Featured
          </Badge>
          <Badge variant="primary" shape="pill">
            Popular
          </Badge>
          <Badge variant="outline" shape="pill">
            Archived
          </Badge>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-ui-text-secondary">Numeric Badges</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="brand" shape="pill">
            3
          </Badge>
          <Badge variant="error" shape="pill">
            12
          </Badge>
          <Badge variant="secondary" shape="pill">
            99+
          </Badge>
        </div>
      </div>
    </div>
  ),
};
