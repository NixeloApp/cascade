import type { Meta, StoryObj } from "@storybook/react";
import { Bell, CreditCard, FileText, Home, Lock, Settings, User, Users } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./Tabs";

const meta: Meta<typeof Tabs> = {
  title: "UI/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  argTypes: {
    defaultValue: {
      control: "text",
      description: "The value of the tab that should be active when initially rendered",
    },
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
      description: "The orientation of the tabs",
    },
  },
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

// ============================================================================
// Basic Stories
// ============================================================================

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-96">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <p className="text-sm text-ui-text-secondary">
          Make changes to your account settings here.
        </p>
      </TabsContent>
      <TabsContent value="password">
        <p className="text-sm text-ui-text-secondary">
          Change your password here. We recommend using a strong password.
        </p>
      </TabsContent>
    </Tabs>
  ),
};

export const ThreeTabs: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-96">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <p className="text-sm text-ui-text-secondary">
          View your project overview and key metrics.
        </p>
      </TabsContent>
      <TabsContent value="analytics">
        <p className="text-sm text-ui-text-secondary">Detailed analytics and performance data.</p>
      </TabsContent>
      <TabsContent value="reports">
        <p className="text-sm text-ui-text-secondary">Generate and download reports.</p>
      </TabsContent>
    </Tabs>
  ),
};

// ============================================================================
// With Icons Stories
// ============================================================================

export const WithIcons: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-96">
      <TabsList>
        <TabsTrigger value="account" className="gap-2">
          <User className="h-4 w-4" />
          Account
        </TabsTrigger>
        <TabsTrigger value="password" className="gap-2">
          <Lock className="h-4 w-4" />
          Password
        </TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <p className="text-sm text-ui-text-secondary">
          Manage your account settings and preferences.
        </p>
      </TabsContent>
      <TabsContent value="password">
        <p className="text-sm text-ui-text-secondary">
          Update your password and security settings.
        </p>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: "Tabs with icons for better visual identification.",
      },
    },
  },
};

export const IconsOnly: Story = {
  render: () => (
    <Tabs defaultValue="home" className="w-64">
      <TabsList>
        <TabsTrigger value="home" aria-label="Home">
          <Home className="h-4 w-4" />
        </TabsTrigger>
        <TabsTrigger value="documents" aria-label="Documents">
          <FileText className="h-4 w-4" />
        </TabsTrigger>
        <TabsTrigger value="settings" aria-label="Settings">
          <Settings className="h-4 w-4" />
        </TabsTrigger>
      </TabsList>
      <TabsContent value="home">
        <p className="text-sm text-ui-text-secondary">Home dashboard content.</p>
      </TabsContent>
      <TabsContent value="documents">
        <p className="text-sm text-ui-text-secondary">Your documents list.</p>
      </TabsContent>
      <TabsContent value="settings">
        <p className="text-sm text-ui-text-secondary">Application settings.</p>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: "Compact tabs with icons only. Use aria-label for accessibility.",
      },
    },
  },
};

// ============================================================================
// Many Tabs Stories
// ============================================================================

export const ManyTabs: Story = {
  render: () => (
    <Tabs defaultValue="general" className="w-full max-w-2xl">
      <TabsList className="w-full">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>
      <TabsContent value="general">
        <p className="text-sm text-ui-text-secondary">General application settings.</p>
      </TabsContent>
      <TabsContent value="profile">
        <p className="text-sm text-ui-text-secondary">Your profile information.</p>
      </TabsContent>
      <TabsContent value="notifications">
        <p className="text-sm text-ui-text-secondary">Notification preferences.</p>
      </TabsContent>
      <TabsContent value="billing">
        <p className="text-sm text-ui-text-secondary">Billing and subscription details.</p>
      </TabsContent>
      <TabsContent value="team">
        <p className="text-sm text-ui-text-secondary">Team management.</p>
      </TabsContent>
      <TabsContent value="security">
        <p className="text-sm text-ui-text-secondary">Security settings.</p>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: "Example with many tabs. Consider using a scrollable container for overflow.",
      },
    },
  },
};

export const ManyTabsWithIcons: Story = {
  render: () => (
    <Tabs defaultValue="general" className="w-full max-w-3xl">
      <TabsList className="w-full">
        <TabsTrigger value="general" className="gap-2">
          <Settings className="h-4 w-4" />
          General
        </TabsTrigger>
        <TabsTrigger value="profile" className="gap-2">
          <User className="h-4 w-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="notifications" className="gap-2">
          <Bell className="h-4 w-4" />
          Notifications
        </TabsTrigger>
        <TabsTrigger value="billing" className="gap-2">
          <CreditCard className="h-4 w-4" />
          Billing
        </TabsTrigger>
        <TabsTrigger value="team" className="gap-2">
          <Users className="h-4 w-4" />
          Team
        </TabsTrigger>
      </TabsList>
      <TabsContent value="general">
        <p className="text-sm text-ui-text-secondary">Configure general application settings.</p>
      </TabsContent>
      <TabsContent value="profile">
        <p className="text-sm text-ui-text-secondary">Update your profile information.</p>
      </TabsContent>
      <TabsContent value="notifications">
        <p className="text-sm text-ui-text-secondary">Manage notification preferences.</p>
      </TabsContent>
      <TabsContent value="billing">
        <p className="text-sm text-ui-text-secondary">View billing and subscription details.</p>
      </TabsContent>
      <TabsContent value="team">
        <p className="text-sm text-ui-text-secondary">Manage team members and roles.</p>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: "Multiple tabs with icons for a settings-like interface.",
      },
    },
  },
};

// ============================================================================
// State Stories
// ============================================================================

export const WithDisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-96">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="premium" disabled>
          Premium
        </TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <p className="text-sm text-ui-text-secondary">Account settings content.</p>
      </TabsContent>
      <TabsContent value="password">
        <p className="text-sm text-ui-text-secondary">Password settings content.</p>
      </TabsContent>
      <TabsContent value="premium">
        <p className="text-sm text-ui-text-secondary">Premium features content.</p>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: "Tabs with a disabled tab that cannot be selected.",
      },
    },
  },
};

// ============================================================================
// Orientation Stories
// ============================================================================

export const Vertical: Story = {
  render: () => (
    <Tabs defaultValue="account" orientation="vertical" className="flex gap-4 w-96">
      <TabsList className="flex-col h-auto">
        <TabsTrigger value="account" className="w-full justify-start gap-2">
          <User className="h-4 w-4" />
          Account
        </TabsTrigger>
        <TabsTrigger value="password" className="w-full justify-start gap-2">
          <Lock className="h-4 w-4" />
          Password
        </TabsTrigger>
        <TabsTrigger value="notifications" className="w-full justify-start gap-2">
          <Bell className="h-4 w-4" />
          Notifications
        </TabsTrigger>
      </TabsList>
      <div className="flex-1">
        <TabsContent value="account" className="mt-0">
          <p className="text-sm text-ui-text-secondary">Manage your account settings.</p>
        </TabsContent>
        <TabsContent value="password" className="mt-0">
          <p className="text-sm text-ui-text-secondary">Update your password.</p>
        </TabsContent>
        <TabsContent value="notifications" className="mt-0">
          <p className="text-sm text-ui-text-secondary">Configure notifications.</p>
        </TabsContent>
      </div>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: "Vertical orientation for sidebar-style navigation. Requires custom flex styling.",
      },
    },
  },
};

// ============================================================================
// Controlled Stories
// ============================================================================

export const Controlled: Story = {
  render: function ControlledExample() {
    const [activeTab, setActiveTab] = useState("account");

    return (
      <div className="flex flex-col gap-4 w-96">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <p className="text-sm text-ui-text-secondary">Account content.</p>
          </TabsContent>
          <TabsContent value="password">
            <p className="text-sm text-ui-text-secondary">Password content.</p>
          </TabsContent>
          <TabsContent value="settings">
            <p className="text-sm text-ui-text-secondary">Settings content.</p>
          </TabsContent>
        </Tabs>
        <p className="text-sm text-ui-text-secondary">Active tab: {activeTab}</p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Controlled tabs with external state management.",
      },
    },
  },
};

// ============================================================================
// Use Case Stories
// ============================================================================

export const SettingsPage: Story = {
  render: () => (
    <Tabs defaultValue="profile" className="w-full max-w-lg">
      <TabsList className="w-full">
        <TabsTrigger value="profile" className="flex-1 gap-2">
          <User className="h-4 w-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="account" className="flex-1 gap-2">
          <Settings className="h-4 w-4" />
          Account
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex-1 gap-2">
          <Bell className="h-4 w-4" />
          Notifications
        </TabsTrigger>
      </TabsList>
      <TabsContent value="profile" className="space-y-4 pt-4">
        <div className="space-y-2">
          <label htmlFor="display-name" className="text-sm font-medium text-ui-text">
            Display Name
          </label>
          <input
            id="display-name"
            type="text"
            className="w-full rounded-md border border-ui-border bg-ui-bg px-3 py-2 text-sm"
            placeholder="John Doe"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-ui-text">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="w-full rounded-md border border-ui-border bg-ui-bg px-3 py-2 text-sm"
            placeholder="john@example.com"
          />
        </div>
      </TabsContent>
      <TabsContent value="account" className="space-y-4 pt-4">
        <div className="space-y-2">
          <label htmlFor="language" className="text-sm font-medium text-ui-text">
            Language
          </label>
          <select
            id="language"
            className="w-full rounded-md border border-ui-border bg-ui-bg px-3 py-2 text-sm"
          >
            <option>English</option>
            <option>Spanish</option>
            <option>French</option>
          </select>
        </div>
      </TabsContent>
      <TabsContent value="notifications" className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <label htmlFor="email-notif" className="text-sm text-ui-text">
            Email notifications
          </label>
          <input id="email-notif" type="checkbox" defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <label htmlFor="push-notif" className="text-sm text-ui-text">
            Push notifications
          </label>
          <input id="push-notif" type="checkbox" />
        </div>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: "A realistic settings page with form content in each tab.",
      },
    },
  },
};

export const DashboardTabs: Story = {
  render: function DashboardExample() {
    const [tab, setTab] = useState("overview");

    return (
      <Tabs value={tab} onValueChange={setTab} className="w-full max-w-2xl">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-ui-border bg-ui-bg-soft p-4">
              <p className="text-sm font-medium text-ui-text-secondary">Total Users</p>
              <p className="text-2xl font-bold text-ui-text">12,345</p>
            </div>
            <div className="rounded-lg border border-ui-border bg-ui-bg-soft p-4">
              <p className="text-sm font-medium text-ui-text-secondary">Active Projects</p>
              <p className="text-2xl font-bold text-ui-text">89</p>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="pt-4">
          <div className="rounded-lg border border-ui-border bg-ui-bg-soft p-8 text-center">
            <p className="text-sm text-ui-text-secondary">Analytics charts would go here</p>
          </div>
        </TabsContent>
        <TabsContent value="reports" className="pt-4">
          <div className="rounded-lg border border-ui-border bg-ui-bg-soft p-8 text-center">
            <p className="text-sm text-ui-text-secondary">Reports list would go here</p>
          </div>
        </TabsContent>
        <TabsContent value="notifications" className="pt-4">
          <div className="rounded-lg border border-ui-border bg-ui-bg-soft p-8 text-center">
            <p className="text-sm text-ui-text-secondary">Notifications would go here</p>
          </div>
        </TabsContent>
      </Tabs>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Dashboard-style tabs with rich content panels.",
      },
    },
  },
};

export const DocumentEditor: Story = {
  render: () => (
    <Tabs defaultValue="edit" className="w-full max-w-xl">
      <TabsList>
        <TabsTrigger value="edit" className="gap-2">
          <FileText className="h-4 w-4" />
          Edit
        </TabsTrigger>
        <TabsTrigger value="preview" className="gap-2">
          <FileText className="h-4 w-4" />
          Preview
        </TabsTrigger>
      </TabsList>
      <TabsContent value="edit" className="pt-4">
        <textarea
          className="min-h-40 w-full rounded-md border border-ui-border bg-ui-bg px-3 py-2 text-sm font-mono"
          placeholder="Write your content here..."
          defaultValue="# Hello World\n\nThis is a **markdown** document."
        />
      </TabsContent>
      <TabsContent value="preview" className="pt-4">
        <div className="min-h-40 rounded-md border border-ui-border bg-ui-bg-soft p-4">
          <h1 className="text-xl font-bold text-ui-text">Hello World</h1>
          <p className="text-sm text-ui-text-secondary">
            This is a <strong>markdown</strong> document.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: "Edit/Preview tabs commonly used in markdown editors.",
      },
    },
  },
};

// ============================================================================
// Full Width Stories
// ============================================================================

export const FullWidth: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-full max-w-xl">
      <TabsList className="w-full">
        <TabsTrigger value="tab1" className="flex-1">
          Tab One
        </TabsTrigger>
        <TabsTrigger value="tab2" className="flex-1">
          Tab Two
        </TabsTrigger>
        <TabsTrigger value="tab3" className="flex-1">
          Tab Three
        </TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <p className="text-sm text-ui-text-secondary">Content for tab one.</p>
      </TabsContent>
      <TabsContent value="tab2">
        <p className="text-sm text-ui-text-secondary">Content for tab two.</p>
      </TabsContent>
      <TabsContent value="tab3">
        <p className="text-sm text-ui-text-secondary">Content for tab three.</p>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: "Full-width tabs with equal-width triggers.",
      },
    },
  },
};
