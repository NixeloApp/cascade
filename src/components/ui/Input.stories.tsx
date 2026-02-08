import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./Input";
import { Label } from "./Label";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "search", "ghost", "error"],
      description: "Visual variant of the input",
    },
    inputSize: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size variant of the input",
    },
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "search", "tel", "url"],
      description: "HTML input type",
    },
    disabled: {
      control: "boolean",
      description: "Whether the input is disabled",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text",
    },
    error: {
      control: "text",
      description: "Error message to display",
    },
  },
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

// Basic Stories
export const Default: Story = {
  args: {
    placeholder: "Enter text...",
  },
};

export const WithPlaceholder: Story = {
  args: {
    placeholder: "Type something here...",
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: "Hello, World!",
  },
};

// State Stories
export const Disabled: Story = {
  args: {
    placeholder: "Disabled input",
    disabled: true,
  },
};

export const DisabledWithValue: Story = {
  args: {
    defaultValue: "Cannot edit this",
    disabled: true,
  },
};

export const ErrorState: Story = {
  args: {
    placeholder: "Enter email",
    error: "This field is required",
  },
};

export const ErrorWithValue: Story = {
  args: {
    defaultValue: "invalid-email",
    error: "Please enter a valid email address",
  },
};

// Variant Stories
export const SearchVariant: Story = {
  args: {
    variant: "search",
    placeholder: "Search...",
  },
};

export const GhostVariant: Story = {
  args: {
    variant: "ghost",
    placeholder: "Ghost input",
  },
};

// Size Stories
export const SizeSmall: Story = {
  args: {
    inputSize: "sm",
    placeholder: "Small input",
  },
};

export const SizeMedium: Story = {
  args: {
    inputSize: "md",
    placeholder: "Medium input (default)",
  },
};

export const SizeLarge: Story = {
  args: {
    inputSize: "lg",
    placeholder: "Large input",
  },
};

// Type Stories
export const TypeText: Story = {
  args: {
    type: "text",
    placeholder: "Text input",
  },
};

export const TypeEmail: Story = {
  args: {
    type: "email",
    placeholder: "email@example.com",
  },
};

export const TypePassword: Story = {
  args: {
    type: "password",
    placeholder: "Enter password",
  },
};

export const TypeNumber: Story = {
  args: {
    type: "number",
    placeholder: "0",
  },
};

// Form Example with Label
export const FormExample: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-80">
      <Label htmlFor="email">Email Address</Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  ),
};

export const FormExampleWithError: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-80">
      <Label htmlFor="email-error">Email Address</Label>
      <Input
        id="email-error"
        type="email"
        defaultValue="not-an-email"
        error="Please enter a valid email address"
      />
    </div>
  ),
};

export const FormExampleRequired: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-80">
      <Label htmlFor="username">
        Username <span className="text-status-error">*</span>
      </Label>
      <Input id="username" type="text" placeholder="Enter your username" required />
      <p className="text-sm text-ui-text-secondary">Your username must be unique.</p>
    </div>
  ),
};

// All Sizes Comparison
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <div className="flex flex-col gap-2">
        <Label>Small</Label>
        <Input inputSize="sm" placeholder="Small input" />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Medium (default)</Label>
        <Input inputSize="md" placeholder="Medium input" />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Large</Label>
        <Input inputSize="lg" placeholder="Large input" />
      </div>
    </div>
  ),
};

// All Variants Comparison
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <div className="flex flex-col gap-2">
        <Label>Default</Label>
        <Input variant="default" placeholder="Default variant" />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Search</Label>
        <Input variant="search" placeholder="Search variant" />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Ghost</Label>
        <Input variant="ghost" placeholder="Ghost variant" />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Error</Label>
        <Input variant="error" placeholder="Error variant" />
      </div>
    </div>
  ),
};
