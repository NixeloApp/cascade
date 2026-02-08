import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Label } from "./Label";
import { RadioGroup, RadioGroupItem } from "./RadioGroup";

const meta: Meta<typeof RadioGroup> = {
  title: "UI/RadioGroup",
  component: RadioGroup,
  tags: ["autodocs"],
  argTypes: {
    defaultValue: {
      control: "text",
      description: "The default selected value (uncontrolled)",
    },
    value: {
      control: "text",
      description: "The selected value (controlled)",
    },
    disabled: {
      control: "boolean",
      description: "Whether the radio group is disabled",
    },
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
      description: "The orientation of the radio group",
    },
    required: {
      control: "boolean",
      description: "Whether the radio group is required",
    },
  },
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

// ============================================================================
// Basic Stories
// ============================================================================

export const Basic: Story = {
  render: () => (
    <RadioGroup defaultValue="option1">
      <RadioGroupItem value="option1" />
      <RadioGroupItem value="option2" />
      <RadioGroupItem value="option3" />
    </RadioGroup>
  ),
  parameters: {
    docs: {
      description: {
        story: "A basic radio group without labels.",
      },
    },
  },
};

export const WithLabels: Story = {
  render: () => (
    <RadioGroup defaultValue="comfortable">
      <RadioGroupItem value="default" label="Default" />
      <RadioGroupItem value="comfortable" label="Comfortable" />
      <RadioGroupItem value="compact" label="Compact" />
    </RadioGroup>
  ),
  parameters: {
    docs: {
      description: {
        story: "Radio group with label text for each option.",
      },
    },
  },
};

export const WithDescriptions: Story = {
  render: () => (
    <RadioGroup defaultValue="email" className="w-80">
      <RadioGroupItem
        value="email"
        label="Email notifications"
        description="Receive updates via email"
      />
      <RadioGroupItem
        value="push"
        label="Push notifications"
        description="Receive updates on your device"
      />
      <RadioGroupItem
        value="none"
        label="No notifications"
        description="You won't receive any updates"
      />
    </RadioGroup>
  ),
  parameters: {
    docs: {
      description: {
        story: "Radio group with labels and descriptions for each option.",
      },
    },
  },
};

// ============================================================================
// State Stories
// ============================================================================

export const Disabled: Story = {
  render: () => (
    <RadioGroup disabled defaultValue="option1">
      <RadioGroupItem value="option1" label="Option 1" />
      <RadioGroupItem value="option2" label="Option 2" />
      <RadioGroupItem value="option3" label="Option 3" />
    </RadioGroup>
  ),
  parameters: {
    docs: {
      description: {
        story: "A disabled radio group where all options are unselectable.",
      },
    },
  },
};

export const WithDisabledOptions: Story = {
  render: () => (
    <RadioGroup defaultValue="free">
      <RadioGroupItem value="free" label="Free Plan" />
      <RadioGroupItem value="starter" label="Starter Plan" />
      <RadioGroupItem value="pro" label="Pro Plan" />
      <RadioGroupItem
        value="enterprise"
        label="Enterprise Plan"
        description="Coming soon"
        disabled
      />
    </RadioGroup>
  ),
  parameters: {
    docs: {
      description: {
        story: "Radio group with specific options disabled while others remain selectable.",
      },
    },
  },
};

export const NoDefaultValue: Story = {
  render: () => (
    <RadioGroup>
      <RadioGroupItem value="option1" label="Option 1" />
      <RadioGroupItem value="option2" label="Option 2" />
      <RadioGroupItem value="option3" label="Option 3" />
    </RadioGroup>
  ),
  parameters: {
    docs: {
      description: {
        story: "Radio group without a pre-selected default value.",
      },
    },
  },
};

// ============================================================================
// Layout Stories
// ============================================================================

export const VerticalLayout: Story = {
  render: () => (
    <RadioGroup defaultValue="small" orientation="vertical">
      <RadioGroupItem value="small" label="Small" />
      <RadioGroupItem value="medium" label="Medium" />
      <RadioGroupItem value="large" label="Large" />
      <RadioGroupItem value="xlarge" label="Extra Large" />
    </RadioGroup>
  ),
  parameters: {
    docs: {
      description: {
        story: "Radio group with vertical orientation (default layout).",
      },
    },
  },
};

export const HorizontalLayout: Story = {
  render: () => (
    <RadioGroup defaultValue="left" orientation="horizontal" className="flex flex-row gap-4">
      <RadioGroupItem value="left" label="Left" />
      <RadioGroupItem value="center" label="Center" />
      <RadioGroupItem value="right" label="Right" />
    </RadioGroup>
  ),
  parameters: {
    docs: {
      description: {
        story: "Radio group with horizontal orientation for inline layouts.",
      },
    },
  },
};

export const HorizontalCompact: Story = {
  render: () => (
    <RadioGroup defaultValue="daily" orientation="horizontal" className="flex flex-row gap-6">
      <RadioGroupItem value="daily" label="Daily" />
      <RadioGroupItem value="weekly" label="Weekly" />
      <RadioGroupItem value="monthly" label="Monthly" />
      <RadioGroupItem value="yearly" label="Yearly" />
    </RadioGroup>
  ),
  parameters: {
    docs: {
      description: {
        story: "Horizontal radio group with compact spacing for frequency selection.",
      },
    },
  },
};

// ============================================================================
// Controlled Stories
// ============================================================================

function ControlledRadioGroupExample() {
  const [value, setValue] = useState("medium");

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-ui-text-secondary">Selected: {value}</p>
      <RadioGroup value={value} onValueChange={setValue}>
        <RadioGroupItem value="small" label="Small" />
        <RadioGroupItem value="medium" label="Medium" />
        <RadioGroupItem value="large" label="Large" />
      </RadioGroup>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledRadioGroupExample />,
  parameters: {
    docs: {
      description: {
        story: "A controlled radio group where the value is managed by React state.",
      },
    },
  },
};

// ============================================================================
// Form Integration Stories
// ============================================================================

export const FormExample: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-72">
      <Label>Notification Preference</Label>
      <RadioGroup defaultValue="all">
        <RadioGroupItem
          value="all"
          label="All notifications"
          description="Receive all updates about activity"
        />
        <RadioGroupItem
          value="important"
          label="Important only"
          description="Only receive critical updates"
        />
        <RadioGroupItem value="none" label="None" description="Disable all notifications" />
      </RadioGroup>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Radio group used within a form with an associated label.",
      },
    },
  },
};

export const FormExampleRequired: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-72">
      <Label>
        Priority <span className="text-status-error">*</span>
      </Label>
      <RadioGroup required>
        <RadioGroupItem value="low" label="Low" />
        <RadioGroupItem value="medium" label="Medium" />
        <RadioGroupItem value="high" label="High" />
        <RadioGroupItem value="urgent" label="Urgent" />
      </RadioGroup>
      <p className="text-sm text-ui-text-secondary">Please select a priority level.</p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Required radio group field in a form context with helper text.",
      },
    },
  },
};

export const FormHorizontal: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-96">
      <Label>Text Alignment</Label>
      <RadioGroup defaultValue="left" orientation="horizontal" className="flex flex-row gap-6">
        <RadioGroupItem value="left" label="Left" />
        <RadioGroupItem value="center" label="Center" />
        <RadioGroupItem value="right" label="Right" />
        <RadioGroupItem value="justify" label="Justify" />
      </RadioGroup>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Horizontal radio group in a form for alignment options.",
      },
    },
  },
};

export const FormWithMultipleGroups: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-80">
      <div className="flex flex-col gap-3">
        <Label>Visibility</Label>
        <RadioGroup defaultValue="public">
          <RadioGroupItem value="public" label="Public" />
          <RadioGroupItem value="private" label="Private" />
          <RadioGroupItem value="team" label="Team only" />
        </RadioGroup>
      </div>
      <div className="flex flex-col gap-3">
        <Label>Theme</Label>
        <RadioGroup defaultValue="system">
          <RadioGroupItem value="light" label="Light" />
          <RadioGroupItem value="dark" label="Dark" />
          <RadioGroupItem value="system" label="System" />
        </RadioGroup>
      </div>
      <div className="flex flex-col gap-3">
        <Label>Language</Label>
        <RadioGroup defaultValue="en">
          <RadioGroupItem value="en" label="English" />
          <RadioGroupItem value="es" label="Spanish" />
          <RadioGroupItem value="fr" label="French" />
        </RadioGroup>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Multiple radio groups used together in a settings form.",
      },
    },
  },
};

// ============================================================================
// Real-world Examples
// ============================================================================

export const ShippingMethod: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-80">
      <Label>Shipping Method</Label>
      <RadioGroup defaultValue="standard" className="gap-3">
        <RadioGroupItem
          value="standard"
          label="Standard Shipping"
          description="5-7 business days - Free"
        />
        <RadioGroupItem
          value="express"
          label="Express Shipping"
          description="2-3 business days - $9.99"
        />
        <RadioGroupItem
          value="overnight"
          label="Overnight Shipping"
          description="Next business day - $24.99"
        />
      </RadioGroup>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Shipping method selector commonly used in checkout flows.",
      },
    },
  },
};

export const PaymentMethod: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-80">
      <Label>Payment Method</Label>
      <RadioGroup defaultValue="card" className="gap-3">
        <RadioGroupItem
          value="card"
          label="Credit/Debit Card"
          description="Visa, Mastercard, American Express"
        />
        <RadioGroupItem value="paypal" label="PayPal" description="Pay with your PayPal account" />
        <RadioGroupItem
          value="bank"
          label="Bank Transfer"
          description="Direct transfer from your bank"
        />
        <RadioGroupItem
          value="crypto"
          label="Cryptocurrency"
          description="Bitcoin, Ethereum"
          disabled
        />
      </RadioGroup>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Payment method selector with one disabled option.",
      },
    },
  },
};

export const PlanSelector: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-96">
      <Label>Select Plan</Label>
      <RadioGroup defaultValue="pro" className="gap-3">
        <RadioGroupItem value="free" label="Free" description="Basic features, up to 3 projects" />
        <RadioGroupItem
          value="starter"
          label="Starter - $9/month"
          description="10 projects, 5GB storage, email support"
        />
        <RadioGroupItem
          value="pro"
          label="Pro - $29/month"
          description="Unlimited projects, 50GB storage, priority support"
        />
        <RadioGroupItem
          value="enterprise"
          label="Enterprise - Custom"
          description="Custom limits, dedicated support, SLA"
        />
      </RadioGroup>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Subscription plan selector with detailed descriptions.",
      },
    },
  },
};

export const FrequencySelector: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Label>Billing Frequency</Label>
      <RadioGroup defaultValue="monthly" orientation="horizontal" className="flex flex-row gap-6">
        <RadioGroupItem value="monthly" label="Monthly" />
        <RadioGroupItem value="quarterly" label="Quarterly" />
        <RadioGroupItem value="yearly" label="Yearly (Save 20%)" />
      </RadioGroup>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Billing frequency selector with horizontal layout.",
      },
    },
  },
};

// ============================================================================
// All States Comparison
// ============================================================================

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-ui-text">Basic (no labels)</p>
        <div className="flex items-center gap-4">
          <RadioGroup
            defaultValue="selected"
            orientation="horizontal"
            className="flex flex-row gap-4"
          >
            <div className="flex flex-col items-center gap-1">
              <RadioGroupItem value="unselected" />
              <span className="text-xs text-ui-text-secondary">Unselected</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <RadioGroupItem value="selected" />
              <span className="text-xs text-ui-text-secondary">Selected</span>
            </div>
          </RadioGroup>
          <RadioGroup
            disabled
            defaultValue="disabled-selected"
            orientation="horizontal"
            className="flex flex-row gap-4"
          >
            <div className="flex flex-col items-center gap-1">
              <RadioGroupItem value="disabled-unselected" />
              <span className="text-xs text-ui-text-secondary">Disabled</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <RadioGroupItem value="disabled-selected" />
              <span className="text-xs text-ui-text-secondary">Disabled Selected</span>
            </div>
          </RadioGroup>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-ui-text">With labels</p>
        <div className="flex gap-8">
          <RadioGroup defaultValue="b">
            <RadioGroupItem value="a" label="Option A" />
            <RadioGroupItem value="b" label="Option B" />
          </RadioGroup>
          <RadioGroup disabled defaultValue="b">
            <RadioGroupItem value="a" label="Option A (disabled)" />
            <RadioGroupItem value="b" label="Option B (disabled)" />
          </RadioGroup>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-ui-text">With descriptions</p>
        <RadioGroup defaultValue="option2" className="w-72">
          <RadioGroupItem
            value="option1"
            label="First Option"
            description="This is a description for the first option"
          />
          <RadioGroupItem
            value="option2"
            label="Second Option"
            description="This is a description for the second option"
          />
          <RadioGroupItem
            value="option3"
            label="Third Option (disabled)"
            description="This option is currently unavailable"
            disabled
          />
        </RadioGroup>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Comparison of all radio group states and configurations.",
      },
    },
  },
};
