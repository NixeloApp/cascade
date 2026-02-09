import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Checkbox } from "./Checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "UI/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  argTypes: {
    checked: {
      control: "select",
      options: [true, false, "indeterminate"],
      description: "The controlled checked state of the checkbox",
    },
    defaultChecked: {
      control: "boolean",
      description: "The default checked state when uncontrolled",
    },
    disabled: {
      control: "boolean",
      description: "Whether the checkbox is disabled",
    },
    label: {
      control: "text",
      description: "Label text for the checkbox",
    },
    description: {
      control: "text",
      description: "Description text below the label",
    },
    required: {
      control: "boolean",
      description: "Whether the checkbox is required",
    },
  },
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

// Basic States
export const Unchecked: Story = {
  args: {},
};

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
};

export const Indeterminate: Story = {
  args: {
    checked: "indeterminate",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    disabled: true,
    defaultChecked: true,
  },
};

// With Label
export const WithLabel: Story = {
  args: {
    label: "Accept terms and conditions",
  },
};

export const WithLabelChecked: Story = {
  args: {
    label: "Accept terms and conditions",
    defaultChecked: true,
  },
};

export const WithLabelDisabled: Story = {
  args: {
    label: "This option is unavailable",
    disabled: true,
  },
};

export const WithLabelDisabledChecked: Story = {
  args: {
    label: "This option is unavailable",
    disabled: true,
    defaultChecked: true,
  },
};

// With Label and Description
export const WithDescription: Story = {
  args: {
    label: "Email notifications",
    description: "Receive emails about your account activity",
  },
};

export const WithDescriptionChecked: Story = {
  args: {
    label: "Email notifications",
    description: "Receive emails about your account activity",
    defaultChecked: true,
  },
};

export const WithDescriptionDisabled: Story = {
  args: {
    label: "Email notifications",
    description: "This feature is currently unavailable",
    disabled: true,
  },
};

// Controlled Example
export const Controlled: Story = {
  render: function ControlledCheckbox() {
    const [checked, setChecked] = useState(false);
    return (
      <div className="flex flex-col gap-4">
        <Checkbox
          label="Controlled checkbox"
          description={`Current state: ${checked ? "checked" : "unchecked"}`}
          checked={checked}
          onCheckedChange={(value) => setChecked(value === true)}
        />
      </div>
    );
  },
};

// Checkbox Group Example
export const CheckboxGroup: Story = {
  render: function CheckboxGroupExample() {
    const [selected, setSelected] = useState<string[]>(["email"]);

    const toggleOption = (option: string) => {
      setSelected((prev) =>
        prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option],
      );
    };

    return (
      <div className="flex flex-col gap-4 w-80">
        <p className="text-sm font-medium text-ui-text">Notification Preferences</p>
        <div className="flex flex-col gap-3">
          <Checkbox
            label="Email notifications"
            description="Get notified via email"
            checked={selected.includes("email")}
            onCheckedChange={() => toggleOption("email")}
          />
          <Checkbox
            label="Push notifications"
            description="Get notified on your device"
            checked={selected.includes("push")}
            onCheckedChange={() => toggleOption("push")}
          />
          <Checkbox
            label="SMS notifications"
            description="Get notified via text message"
            checked={selected.includes("sms")}
            onCheckedChange={() => toggleOption("sms")}
          />
        </div>
        <p className="text-sm text-ui-text-secondary">
          Selected: {selected.length > 0 ? selected.join(", ") : "none"}
        </p>
      </div>
    );
  },
};

// Select All Pattern
export const SelectAllPattern: Story = {
  render: function SelectAllExample() {
    const [items, setItems] = useState([
      { id: "1", label: "Item 1", checked: true },
      { id: "2", label: "Item 2", checked: false },
      { id: "3", label: "Item 3", checked: true },
    ]);

    const allChecked = items.every((item) => item.checked);
    const someChecked = items.some((item) => item.checked) && !allChecked;

    const toggleAll = () => {
      const newChecked = !allChecked;
      setItems(items.map((item) => ({ ...item, checked: newChecked })));
    };

    const toggleItem = (id: string) => {
      setItems(items.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)));
    };

    return (
      <div className="flex flex-col gap-4 w-64">
        <Checkbox
          label="Select all"
          checked={allChecked ? true : someChecked ? "indeterminate" : false}
          onCheckedChange={toggleAll}
        />
        <div className="flex flex-col gap-2 pl-6 border-l border-ui-border">
          {items.map((item) => (
            <Checkbox
              key={item.id}
              label={item.label}
              checked={item.checked}
              onCheckedChange={() => toggleItem(item.id)}
            />
          ))}
        </div>
      </div>
    );
  },
};

// Form Example
export const FormExample: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <p className="text-sm font-medium text-ui-text">Account Settings</p>
      <div className="flex flex-col gap-3">
        <Checkbox
          label="Make profile public"
          description="Allow others to see your profile"
          defaultChecked
        />
        <Checkbox label="Show email address" description="Display your email on your profile" />
        <Checkbox
          label="Enable two-factor authentication"
          description="Add an extra layer of security"
        />
      </div>
    </div>
  ),
};

// All States Comparison
export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <Checkbox />
          <span className="text-sm text-ui-text-secondary">Unchecked</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Checkbox defaultChecked />
          <span className="text-sm text-ui-text-secondary">Checked</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Checkbox checked="indeterminate" />
          <span className="text-sm text-ui-text-secondary">Indeterminate</span>
        </div>
      </div>
      <div className="flex items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <Checkbox disabled />
          <span className="text-sm text-ui-text-secondary">Disabled Unchecked</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Checkbox disabled defaultChecked />
          <span className="text-sm text-ui-text-secondary">Disabled Checked</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Checkbox disabled checked="indeterminate" />
          <span className="text-sm text-ui-text-secondary">Disabled Indeterminate</span>
        </div>
      </div>
    </div>
  ),
};
