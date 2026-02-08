import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "./Checkbox";
import { Input } from "./Input";
import { Label } from "./Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./Select";

const meta: Meta<typeof Label> = {
  title: "UI/Label",
  component: Label,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "hint"],
      description: "Visual variant of the label",
    },
    htmlFor: {
      control: "text",
      description: "The id of the form element the label is associated with",
    },
    children: {
      control: "text",
      description: "The label text content",
    },
  },
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Label>;

// ============================================================================
// Basic Label Stories
// ============================================================================

export const Default: Story = {
  args: {
    children: "Label",
  },
};

export const WithHtmlFor: Story = {
  args: {
    htmlFor: "username",
    children: "Username",
  },
};

// ============================================================================
// Variant Stories
// ============================================================================

export const DefaultVariant: Story = {
  args: {
    variant: "default",
    children: "Default Label",
  },
  parameters: {
    docs: {
      description: {
        story: "The default label variant with standard styling.",
      },
    },
  },
};

export const HintVariant: Story = {
  args: {
    variant: "hint",
    children: "This is a hint label",
  },
  parameters: {
    docs: {
      description: {
        story: "The hint variant with secondary text color and normal font weight.",
      },
    },
  },
};

// ============================================================================
// Required Indicator Stories
// ============================================================================

export const WithRequiredIndicator: Story = {
  render: () => (
    <Label htmlFor="required-field">
      Required Field <span className="text-status-error">*</span>
    </Label>
  ),
  parameters: {
    docs: {
      description: {
        story: "Label with a required indicator asterisk.",
      },
    },
  },
};

export const WithOptionalIndicator: Story = {
  render: () => (
    <Label htmlFor="optional-field">
      Optional Field <span className="text-ui-text-tertiary">(optional)</span>
    </Label>
  ),
  parameters: {
    docs: {
      description: {
        story: "Label with an optional indicator for non-required fields.",
      },
    },
  },
};

// ============================================================================
// Label with Hint Stories
// ============================================================================

export const WithHintText: Story = {
  render: () => (
    <div className="flex flex-col gap-1">
      <Label htmlFor="email">Email Address</Label>
      <Label variant="hint" htmlFor="email">
        We will never share your email with anyone.
      </Label>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Label paired with hint text for additional context.",
      },
    },
  },
};

export const RequiredWithHint: Story = {
  render: () => (
    <div className="flex flex-col gap-1">
      <Label htmlFor="password">
        Password <span className="text-status-error">*</span>
      </Label>
      <Label variant="hint" htmlFor="password">
        Must be at least 8 characters long.
      </Label>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Required field label with hint text for validation requirements.",
      },
    },
  },
};

// ============================================================================
// Disabled State Stories
// ============================================================================

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-64">
      <Label htmlFor="disabled-input">Disabled Field</Label>
      <Input id="disabled-input" placeholder="Cannot edit" disabled className="peer" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Label styled for a disabled input using the peer-disabled modifier.",
      },
    },
  },
};

export const DisabledWithValue: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-64">
      <Label htmlFor="disabled-value">Account Status</Label>
      <Input id="disabled-value" defaultValue="Active" disabled className="peer" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Label with a disabled input that has a pre-filled value.",
      },
    },
  },
};

// ============================================================================
// Label with Input Stories
// ============================================================================

export const WithInput: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-64">
      <Label htmlFor="username-input">Username</Label>
      <Input id="username-input" placeholder="Enter your username" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Label associated with a text input.",
      },
    },
  },
};

export const WithInputAndError: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-64">
      <Label htmlFor="email-error">Email Address</Label>
      <Input
        id="email-error"
        type="email"
        defaultValue="invalid-email"
        error="Please enter a valid email address"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Label with an input showing an error state.",
      },
    },
  },
};

export const WithInputRequired: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-64">
      <Label htmlFor="name-required">
        Full Name <span className="text-status-error">*</span>
      </Label>
      <Input id="name-required" placeholder="Enter your full name" required />
      <Label variant="hint">This field is required.</Label>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Required input with label and hint text.",
      },
    },
  },
};

// ============================================================================
// Label with Checkbox Stories
// ============================================================================

export const WithCheckbox: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Label associated with a checkbox in inline layout.",
      },
    },
  },
};

export const WithCheckboxRequired: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="terms-required" required />
      <Label htmlFor="terms-required">
        I agree to the Terms of Service <span className="text-status-error">*</span>
      </Label>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Required checkbox with associated label.",
      },
    },
  },
};

export const WithCheckboxDisabled: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="disabled-checkbox" disabled className="peer" />
      <Label
        htmlFor="disabled-checkbox"
        className="peer-disabled:cursor-not-allowed peer-disabled:text-ui-text-tertiary"
      >
        This option is unavailable
      </Label>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Disabled checkbox with muted label styling.",
      },
    },
  },
};

// ============================================================================
// Label with Select Stories
// ============================================================================

export const WithSelect: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-64">
      <Label htmlFor="country-select">Country</Label>
      <Select>
        <SelectTrigger id="country-select">
          <SelectValue placeholder="Select your country" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="us">United States</SelectItem>
          <SelectItem value="uk">United Kingdom</SelectItem>
          <SelectItem value="ca">Canada</SelectItem>
          <SelectItem value="au">Australia</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Label associated with a select dropdown.",
      },
    },
  },
};

export const WithSelectRequired: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-64">
      <Label htmlFor="role-select">
        Role <span className="text-status-error">*</span>
      </Label>
      <Select>
        <SelectTrigger id="role-select">
          <SelectValue placeholder="Select a role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="editor">Editor</SelectItem>
          <SelectItem value="viewer">Viewer</SelectItem>
        </SelectContent>
      </Select>
      <Label variant="hint">Choose the appropriate access level.</Label>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Required select with label and hint text.",
      },
    },
  },
};

export const WithSelectDisabled: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-64">
      <Label htmlFor="disabled-select">Department</Label>
      <Select disabled defaultValue="engineering">
        <SelectTrigger id="disabled-select">
          <SelectValue placeholder="Select department" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="engineering">Engineering</SelectItem>
          <SelectItem value="design">Design</SelectItem>
          <SelectItem value="product">Product</SelectItem>
        </SelectContent>
      </Select>
      <Label variant="hint">Contact admin to change department.</Label>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Label with a disabled select dropdown.",
      },
    },
  },
};

// ============================================================================
// Form Pattern Stories
// ============================================================================

export const FormPatternBasic: Story = {
  render: () => (
    <form className="flex flex-col gap-6 w-80">
      <div className="flex flex-col gap-2">
        <Label htmlFor="form-email">Email</Label>
        <Input id="form-email" type="email" placeholder="you@example.com" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="form-password">Password</Label>
        <Input id="form-password" type="password" placeholder="Enter password" />
      </div>
    </form>
  ),
  parameters: {
    docs: {
      description: {
        story: "Basic form pattern with labels and inputs.",
      },
    },
  },
};

export const FormPatternWithValidation: Story = {
  render: () => (
    <form className="flex flex-col gap-6 w-80">
      <div className="flex flex-col gap-2">
        <Label htmlFor="val-username">
          Username <span className="text-status-error">*</span>
        </Label>
        <Input id="val-username" placeholder="Choose a username" required />
        <Label variant="hint">3-20 characters, letters and numbers only.</Label>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="val-email">
          Email <span className="text-status-error">*</span>
        </Label>
        <Input
          id="val-email"
          type="email"
          defaultValue="invalid"
          error="Please enter a valid email address"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="val-bio">
          Bio <span className="text-ui-text-tertiary">(optional)</span>
        </Label>
        <Input id="val-bio" placeholder="Tell us about yourself" />
      </div>
    </form>
  ),
  parameters: {
    docs: {
      description: {
        story: "Form with required indicators, validation errors, and optional fields.",
      },
    },
  },
};

export const FormPatternComplete: Story = {
  render: () => (
    <form className="flex flex-col gap-6 w-80">
      <div className="flex flex-col gap-2">
        <Label htmlFor="complete-name">
          Full Name <span className="text-status-error">*</span>
        </Label>
        <Input id="complete-name" placeholder="Enter your full name" required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="complete-email">
          Email Address <span className="text-status-error">*</span>
        </Label>
        <Input id="complete-email" type="email" placeholder="you@example.com" required />
        <Label variant="hint">We will send confirmation to this address.</Label>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="complete-role">
          Role <span className="text-status-error">*</span>
        </Label>
        <Select>
          <SelectTrigger id="complete-role">
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="developer">Developer</SelectItem>
            <SelectItem value="designer">Designer</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="complete-company">
          Company <span className="text-ui-text-tertiary">(optional)</span>
        </Label>
        <Input id="complete-company" placeholder="Your company name" />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="complete-newsletter" />
        <Label htmlFor="complete-newsletter">Subscribe to newsletter</Label>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="complete-terms" required />
        <Label htmlFor="complete-terms">
          I agree to the Terms of Service <span className="text-status-error">*</span>
        </Label>
      </div>
    </form>
  ),
  parameters: {
    docs: {
      description: {
        story: "Complete form example with various input types, labels, and patterns.",
      },
    },
  },
};

// ============================================================================
// All Variants Comparison
// ============================================================================

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-sm text-ui-text-secondary">Default Variant</span>
        <Label variant="default">Default Label Text</Label>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-ui-text-secondary">Hint Variant</span>
        <Label variant="hint">Hint label for additional context</Label>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-ui-text-secondary">With Required Indicator</span>
        <Label>
          Required Field <span className="text-status-error">*</span>
        </Label>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-ui-text-secondary">With Optional Indicator</span>
        <Label>
          Optional Field <span className="text-ui-text-tertiary">(optional)</span>
        </Label>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Comparison of all label variants and common patterns.",
      },
    },
  },
};

// ============================================================================
// Accessibility Example
// ============================================================================

export const AccessibilityExample: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-80">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-ui-text">Proper Label Association</p>
        <p className="text-sm text-ui-text-secondary mb-4">
          Labels should always be associated with their inputs via htmlFor and id attributes for
          accessibility.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="accessible-input">Accessible Input</Label>
        <Input id="accessible-input" placeholder="Click the label to focus" />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="accessible-checkbox" />
        <Label htmlFor="accessible-checkbox">Click this label to toggle</Label>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="accessible-select">Accessible Select</Label>
        <Select>
          <SelectTrigger id="accessible-select">
            <SelectValue placeholder="Click the label to focus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates proper label-input association for accessibility. " +
          "Clicking the label should focus or activate the associated form element.",
      },
    },
  },
};
