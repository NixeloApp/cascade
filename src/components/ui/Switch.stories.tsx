import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Label } from "./Label";
import { Switch } from "./Switch";

const meta: Meta<typeof Switch> = {
  title: "UI/Switch",
  component: Switch,
  tags: ["autodocs"],
  argTypes: {
    checked: {
      control: "boolean",
      description: "The controlled checked state of the switch",
    },
    defaultChecked: {
      control: "boolean",
      description: "The default checked state when uncontrolled",
    },
    disabled: {
      control: "boolean",
      description: "Whether the switch is disabled",
    },
    required: {
      control: "boolean",
      description: "Whether the switch is required in a form",
    },
    name: {
      control: "text",
      description: "The name of the switch for form submission",
    },
    value: {
      control: "text",
      description: "The value of the switch for form submission",
    },
  },
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

// Basic States
export const Off: Story = {
  args: {},
};

export const On: Story = {
  args: {
    defaultChecked: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const DisabledOn: Story = {
  args: {
    disabled: true,
    defaultChecked: true,
  },
};

// With Label
export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane Mode</Label>
    </div>
  ),
};

export const WithLabelOn: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Switch id="airplane-mode-on" defaultChecked />
      <Label htmlFor="airplane-mode-on">Airplane Mode</Label>
    </div>
  ),
};

export const WithLabelDisabled: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Switch id="airplane-mode-disabled" disabled />
      <Label htmlFor="airplane-mode-disabled" className="opacity-50">
        Airplane Mode
      </Label>
    </div>
  ),
};

export const WithLabelDisabledOn: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Switch id="airplane-mode-disabled-on" disabled defaultChecked />
      <Label htmlFor="airplane-mode-disabled-on" className="opacity-50">
        Airplane Mode
      </Label>
    </div>
  ),
};

// Label Positioning
export const LabelLeft: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Label htmlFor="label-left">Dark Mode</Label>
      <Switch id="label-left" />
    </div>
  ),
};

export const LabelRight: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Switch id="label-right" />
      <Label htmlFor="label-right">Dark Mode</Label>
    </div>
  ),
};

// With Description
export const WithDescription: Story = {
  render: () => (
    <div className="flex items-start gap-3">
      <Switch id="notifications" className="mt-0.5" />
      <div className="flex flex-col gap-1">
        <Label htmlFor="notifications">Push Notifications</Label>
        <p className="text-sm text-ui-text-secondary">Receive push notifications on your device</p>
      </div>
    </div>
  ),
};

export const WithDescriptionOn: Story = {
  render: () => (
    <div className="flex items-start gap-3">
      <Switch id="notifications-on" defaultChecked className="mt-0.5" />
      <div className="flex flex-col gap-1">
        <Label htmlFor="notifications-on">Push Notifications</Label>
        <p className="text-sm text-ui-text-secondary">Receive push notifications on your device</p>
      </div>
    </div>
  ),
};

// Controlled Example
export const Controlled: Story = {
  render: function ControlledSwitch() {
    const [checked, setChecked] = useState(false);
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Switch id="controlled" checked={checked} onCheckedChange={setChecked} />
          <Label htmlFor="controlled">Controlled Switch</Label>
        </div>
        <p className="text-sm text-ui-text-secondary">Current state: {checked ? "On" : "Off"}</p>
      </div>
    );
  },
};

// Settings Panel Example
export const SettingsPanel: Story = {
  render: function SettingsPanelExample() {
    const [settings, setSettings] = useState({
      notifications: true,
      emails: false,
      marketing: false,
      updates: true,
    });

    const toggleSetting = (key: keyof typeof settings) => {
      setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
      <div className="flex flex-col gap-6 w-80">
        <p className="text-sm font-medium text-ui-text">Notification Settings</p>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <Label htmlFor="push-notifs">Push Notifications</Label>
              <p className="text-sm text-ui-text-secondary">Get notified on your device</p>
            </div>
            <Switch
              id="push-notifs"
              checked={settings.notifications}
              onCheckedChange={() => toggleSetting("notifications")}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <Label htmlFor="email-notifs">Email Notifications</Label>
              <p className="text-sm text-ui-text-secondary">Get notified via email</p>
            </div>
            <Switch
              id="email-notifs"
              checked={settings.emails}
              onCheckedChange={() => toggleSetting("emails")}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <Label htmlFor="marketing">Marketing Emails</Label>
              <p className="text-sm text-ui-text-secondary">Receive marketing updates</p>
            </div>
            <Switch
              id="marketing"
              checked={settings.marketing}
              onCheckedChange={() => toggleSetting("marketing")}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <Label htmlFor="product-updates">Product Updates</Label>
              <p className="text-sm text-ui-text-secondary">Learn about new features</p>
            </div>
            <Switch
              id="product-updates"
              checked={settings.updates}
              onCheckedChange={() => toggleSetting("updates")}
            />
          </div>
        </div>
      </div>
    );
  },
};

// Form Example
export const FormExample: Story = {
  render: () => (
    <form
      className="flex flex-col gap-6 w-80"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        console.log("Form submitted:", Object.fromEntries(formData));
      }}
    >
      <p className="text-sm font-medium text-ui-text">Privacy Settings</p>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="public-profile">Public Profile</Label>
          <Switch id="public-profile" name="publicProfile" defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="show-email">Show Email</Label>
          <Switch id="show-email" name="showEmail" />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="analytics">Analytics</Label>
          <Switch id="analytics" name="analytics" defaultChecked />
        </div>
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-brand text-brand-foreground rounded-md text-sm font-medium hover:bg-brand-hover transition-default"
      >
        Save Settings
      </button>
    </form>
  ),
};

// Form with Validation
export const FormWithValidation: Story = {
  render: function FormValidationExample() {
    const [accepted, setAccepted] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitted(true);
      if (accepted) {
        console.log("Form submitted successfully");
      }
    };

    return (
      <form className="flex flex-col gap-4 w-80" onSubmit={handleSubmit}>
        <p className="text-sm font-medium text-ui-text">Terms Agreement</p>
        <div className="flex items-start gap-3">
          <Switch
            id="terms"
            checked={accepted}
            onCheckedChange={setAccepted}
            required
            className="mt-0.5"
          />
          <div className="flex flex-col gap-1">
            <Label htmlFor="terms">Accept Terms and Conditions</Label>
            <p className="text-sm text-ui-text-secondary">You must accept to continue</p>
            {submitted && !accepted && (
              <p className="text-sm text-status-error">Please accept the terms to continue</p>
            )}
          </div>
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-brand text-brand-foreground rounded-md text-sm font-medium hover:bg-brand-hover transition-default disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </form>
    );
  },
};

// All States Comparison
export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <Switch />
          <span className="text-sm text-ui-text-secondary">Off</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Switch defaultChecked />
          <span className="text-sm text-ui-text-secondary">On</span>
        </div>
      </div>
      <div className="flex items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <Switch disabled />
          <span className="text-sm text-ui-text-secondary">Disabled Off</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Switch disabled defaultChecked />
          <span className="text-sm text-ui-text-secondary">Disabled On</span>
        </div>
      </div>
    </div>
  ),
};

// Feature Toggle Example
export const FeatureToggle: Story = {
  render: function FeatureToggleExample() {
    const [features, setFeatures] = useState({
      darkMode: true,
      autoSave: true,
      spellCheck: false,
      lineNumbers: true,
      wordWrap: false,
    });

    const toggleFeature = (key: keyof typeof features) => {
      setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
      <div className="flex flex-col gap-4 w-72 p-4 border border-ui-border rounded-lg bg-ui-bg">
        <p className="text-sm font-semibold text-ui-text">Editor Settings</p>
        <div className="flex flex-col gap-3">
          {Object.entries(features).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={key} className="capitalize text-sm text-ui-text-secondary">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </Label>
              <Switch
                id={key}
                checked={value}
                onCheckedChange={() => toggleFeature(key as keyof typeof features)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  },
};
