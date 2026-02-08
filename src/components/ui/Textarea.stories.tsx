import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "./label";
import { Textarea } from "./textarea";

const meta: Meta<typeof Textarea> = {
  title: "UI/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "error"],
      description: "Visual variant of the textarea",
    },
    disabled: {
      control: "boolean",
      description: "Whether the textarea is disabled",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text",
    },
    error: {
      control: "text",
      description: "Error message to display",
    },
    rows: {
      control: "number",
      description: "Number of visible text lines",
    },
  },
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

// Basic Stories
export const Default: Story = {
  args: {
    placeholder: "Enter text...",
  },
};

export const WithPlaceholder: Story = {
  args: {
    placeholder: "Type your message here...",
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: "This is some pre-filled content in the textarea.",
  },
};

// State Stories
export const Disabled: Story = {
  args: {
    placeholder: "Disabled textarea",
    disabled: true,
  },
};

export const DisabledWithValue: Story = {
  args: {
    defaultValue: "This content cannot be edited",
    disabled: true,
  },
};

export const ErrorState: Story = {
  args: {
    placeholder: "Enter description",
    error: "Description is required",
  },
};

export const ErrorWithValue: Story = {
  args: {
    defaultValue: "Too short",
    error: "Description must be at least 50 characters",
  },
};

// Variant Stories
export const DefaultVariant: Story = {
  args: {
    variant: "default",
    placeholder: "Default variant textarea",
  },
};

export const ErrorVariant: Story = {
  args: {
    variant: "error",
    placeholder: "Error variant textarea",
  },
};

// Size/Rows Stories
export const SmallRows: Story = {
  args: {
    rows: 2,
    placeholder: "Small textarea (2 rows)",
  },
};

export const MediumRows: Story = {
  args: {
    rows: 4,
    placeholder: "Medium textarea (4 rows)",
  },
};

export const LargeRows: Story = {
  args: {
    rows: 8,
    placeholder: "Large textarea (8 rows)",
  },
};

export const ExtraLargeRows: Story = {
  args: {
    rows: 12,
    placeholder: "Extra large textarea (12 rows)",
  },
};

// Form Example with Label
export const FormExample: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-80">
      <Label htmlFor="description">Description</Label>
      <Textarea id="description" placeholder="Enter a detailed description..." />
    </div>
  ),
};

export const FormExampleWithError: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-80">
      <Label htmlFor="bio-error">Bio</Label>
      <Textarea id="bio-error" defaultValue="Hi" error="Bio must be at least 20 characters long" />
    </div>
  ),
};

export const FormExampleRequired: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-80">
      <Label htmlFor="feedback">
        Feedback <span className="text-status-error">*</span>
      </Label>
      <Textarea id="feedback" placeholder="Please share your feedback..." rows={4} required />
      <p className="text-sm text-ui-text-secondary">Your feedback helps us improve.</p>
    </div>
  ),
};

export const FormExampleWithHint: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-80">
      <Label htmlFor="notes">Notes</Label>
      <Textarea id="notes" placeholder="Add any additional notes..." rows={3} />
      <Label variant="hint">Optional - max 500 characters</Label>
    </div>
  ),
};

// All Rows Comparison
export const AllRowSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <div className="flex flex-col gap-2">
        <Label>2 Rows (Small)</Label>
        <Textarea rows={2} placeholder="Small textarea" />
      </div>
      <div className="flex flex-col gap-2">
        <Label>4 Rows (Medium)</Label>
        <Textarea rows={4} placeholder="Medium textarea" />
      </div>
      <div className="flex flex-col gap-2">
        <Label>6 Rows (Large)</Label>
        <Textarea rows={6} placeholder="Large textarea" />
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
        <Textarea variant="default" placeholder="Default variant" />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Error</Label>
        <Textarea variant="error" placeholder="Error variant" />
      </div>
      <div className="flex flex-col gap-2">
        <Label>With Error Message</Label>
        <Textarea placeholder="With error prop" error="This field has an error" />
      </div>
    </div>
  ),
};

// All States Comparison
export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <div className="flex flex-col gap-2">
        <Label>Default</Label>
        <Textarea placeholder="Default state" />
      </div>
      <div className="flex flex-col gap-2">
        <Label>With Value</Label>
        <Textarea defaultValue="Some content here" />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Disabled</Label>
        <Textarea placeholder="Disabled state" disabled />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Error</Label>
        <Textarea placeholder="Error state" error="Something went wrong" />
      </div>
    </div>
  ),
};

// Long Content Example
export const LongContent: Story = {
  args: {
    defaultValue: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`,
    rows: 6,
  },
};
