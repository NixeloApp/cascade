import type { Meta, StoryObj } from "@storybook/react";
import { RocketIcon, ShieldCheckIcon, TerminalIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./Alert";

const meta: Meta<typeof Alert> = {
  title: "UI/Alert",
  component: Alert,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "info", "success", "warning", "error"],
      description: "The visual style variant of the alert",
    },
    onDismiss: {
      action: "dismissed",
      description:
        "Callback when dismiss button is clicked. If not provided, dismiss button is hidden.",
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[450px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Alert>;

// Default story
export const Default: Story = {
  render: () => (
    <Alert>
      <AlertTitle>Default Alert</AlertTitle>
      <AlertDescription>This is a default alert with neutral styling.</AlertDescription>
    </Alert>
  ),
};

// Variant stories
export const Info: Story = {
  render: () => (
    <Alert variant="info">
      <AlertTitle>Information</AlertTitle>
      <AlertDescription>This alert provides helpful information to the user.</AlertDescription>
    </Alert>
  ),
};

export const Success: Story = {
  render: () => (
    <Alert variant="success">
      <AlertTitle>Success!</AlertTitle>
      <AlertDescription>Your changes have been saved successfully.</AlertDescription>
    </Alert>
  ),
};

export const Warning: Story = {
  render: () => (
    <Alert variant="warning">
      <AlertTitle>Warning</AlertTitle>
      <AlertDescription>Please review your changes before proceeding.</AlertDescription>
    </Alert>
  ),
};

export const ErrorVariant: Story = {
  name: "Error",
  render: () => (
    <Alert variant="error">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>Something went wrong. Please try again later.</AlertDescription>
    </Alert>
  ),
};

// Dismissible stories
export const Dismissible: Story = {
  render: () => (
    <Alert variant="info" onDismiss={() => {}}>
      <AlertTitle>Dismissible Alert</AlertTitle>
      <AlertDescription>Click the X button to dismiss this alert.</AlertDescription>
    </Alert>
  ),
};

export const DismissibleSuccess: Story = {
  render: () => (
    <Alert variant="success" onDismiss={() => {}}>
      <AlertTitle>Operation Complete</AlertTitle>
      <AlertDescription>Your file has been uploaded successfully.</AlertDescription>
    </Alert>
  ),
};

export const DismissibleWarning: Story = {
  render: () => (
    <Alert variant="warning" onDismiss={() => {}}>
      <AlertTitle>Session Expiring</AlertTitle>
      <AlertDescription>Your session will expire in 5 minutes.</AlertDescription>
    </Alert>
  ),
};

export const DismissibleError: Story = {
  render: () => (
    <Alert variant="error" onDismiss={() => {}}>
      <AlertTitle>Connection Lost</AlertTitle>
      <AlertDescription>
        Unable to connect to the server. Please check your network.
      </AlertDescription>
    </Alert>
  ),
};

// Title only stories
export const TitleOnly: Story = {
  render: () => (
    <Alert variant="info">
      <AlertTitle>Just a title, no description</AlertTitle>
    </Alert>
  ),
};

// Description only stories
export const DescriptionOnly: Story = {
  render: () => (
    <Alert variant="warning">
      <AlertDescription>This alert has only a description without a title.</AlertDescription>
    </Alert>
  ),
};

// With custom icon stories
export const WithCustomIcon: Story = {
  render: () => (
    <Alert>
      <TerminalIcon className="size-4" />
      <AlertTitle>Terminal Command</AlertTitle>
      <AlertDescription>Run `npm install` to install dependencies.</AlertDescription>
    </Alert>
  ),
};

export const WithRocketIcon: Story = {
  render: () => (
    <Alert variant="info">
      <RocketIcon className="size-4" />
      <AlertTitle>New Feature Available</AlertTitle>
      <AlertDescription>Check out our latest release with exciting new features!</AlertDescription>
    </Alert>
  ),
};

export const WithSecurityIcon: Story = {
  render: () => (
    <Alert variant="success">
      <ShieldCheckIcon className="size-4" />
      <AlertTitle>Security Verified</AlertTitle>
      <AlertDescription>Your account has passed all security checks.</AlertDescription>
    </Alert>
  ),
};

// Long content stories
export const LongContent: Story = {
  render: () => (
    <Alert variant="info">
      <AlertTitle>Important Information About Your Account</AlertTitle>
      <AlertDescription>
        We have updated our terms of service and privacy policy. Please take a moment to review
        these changes as they affect how we handle your data. By continuing to use our services, you
        agree to the new terms.
      </AlertDescription>
    </Alert>
  ),
};

export const LongContentDismissible: Story = {
  render: () => (
    <Alert variant="warning" onDismiss={() => {}}>
      <AlertTitle>System Maintenance Scheduled</AlertTitle>
      <AlertDescription>
        Our systems will undergo scheduled maintenance on Saturday, January 15th from 2:00 AM to
        6:00 AM UTC. During this time, some features may be temporarily unavailable. We apologize
        for any inconvenience.
      </AlertDescription>
    </Alert>
  ),
};

// All variants grid
export const AllVariants: Story = {
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-medium text-ui-text-secondary">All Variants</h3>
      <Alert>
        <AlertTitle>Default</AlertTitle>
        <AlertDescription>A default alert with neutral styling.</AlertDescription>
      </Alert>
      <Alert variant="info">
        <AlertTitle>Info</AlertTitle>
        <AlertDescription>An informational alert for general notices.</AlertDescription>
      </Alert>
      <Alert variant="success">
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>A success alert for positive feedback.</AlertDescription>
      </Alert>
      <Alert variant="warning">
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>A warning alert for cautionary messages.</AlertDescription>
      </Alert>
      <Alert variant="error">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>An error alert for critical issues.</AlertDescription>
      </Alert>
    </div>
  ),
};

// All variants dismissible
export const AllVariantsDismissible: Story = {
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-medium text-ui-text-secondary">All Variants (Dismissible)</h3>
      <Alert onDismiss={() => {}}>
        <AlertTitle>Default</AlertTitle>
        <AlertDescription>A dismissible default alert.</AlertDescription>
      </Alert>
      <Alert variant="info" onDismiss={() => {}}>
        <AlertTitle>Info</AlertTitle>
        <AlertDescription>A dismissible info alert.</AlertDescription>
      </Alert>
      <Alert variant="success" onDismiss={() => {}}>
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>A dismissible success alert.</AlertDescription>
      </Alert>
      <Alert variant="warning" onDismiss={() => {}}>
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>A dismissible warning alert.</AlertDescription>
      </Alert>
      <Alert variant="error" onDismiss={() => {}}>
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>A dismissible error alert.</AlertDescription>
      </Alert>
    </div>
  ),
};

// Real-world usage examples
export const UsageExamples: Story = {
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-3 text-sm font-medium text-ui-text-secondary">Form Validation</h3>
        <Alert variant="error">
          <AlertTitle>Form Submission Failed</AlertTitle>
          <AlertDescription>
            Please correct the following errors:
            <ul className="mt-2 list-disc pl-5">
              <li>Email address is required</li>
              <li>Password must be at least 8 characters</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-ui-text-secondary">Feature Announcement</h3>
        <Alert variant="info" onDismiss={() => {}}>
          <RocketIcon className="size-4" />
          <AlertTitle>New Feature: Dark Mode</AlertTitle>
          <AlertDescription>
            You can now toggle dark mode in your settings. Give it a try!
          </AlertDescription>
        </Alert>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-ui-text-secondary">Payment Success</h3>
        <Alert variant="success">
          <AlertTitle>Payment Successful</AlertTitle>
          <AlertDescription>
            Thank you for your purchase! A confirmation email has been sent to your inbox.
          </AlertDescription>
        </Alert>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-ui-text-secondary">Deprecation Notice</h3>
        <Alert variant="warning" onDismiss={() => {}}>
          <AlertTitle>API v1 Deprecation</AlertTitle>
          <AlertDescription>
            API v1 will be deprecated on March 1st, 2026. Please migrate to v2 before this date.
          </AlertDescription>
        </Alert>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-ui-text-secondary">Simple Notification</h3>
        <Alert variant="info">
          <AlertDescription>You have 3 unread messages in your inbox.</AlertDescription>
        </Alert>
      </div>
    </div>
  ),
};

// Inline code example
export const WithInlineCode: Story = {
  render: () => (
    <Alert>
      <TerminalIcon className="size-4" />
      <AlertTitle>Installation</AlertTitle>
      <AlertDescription>
        Install the package using{" "}
        <code className="rounded bg-ui-bg-tertiary px-1 py-0.5 font-mono text-xs">
          pnpm add @nixelo/ui
        </code>
      </AlertDescription>
    </Alert>
  ),
};
