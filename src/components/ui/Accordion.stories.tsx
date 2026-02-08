import type { Meta, StoryObj } from "@storybook/react";
import { Bell, CreditCard, CircleHelp, Lock, Mail, Settings, User } from "@/lib/icons";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./Accordion";

const meta: Meta<typeof Accordion> = {
  title: "UI/Accordion",
  component: Accordion,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["single", "multiple"],
      description: "Whether one or multiple items can be open at the same time",
    },
    collapsible: {
      control: "boolean",
      description: "When type is 'single', allows closing all items",
    },
    defaultValue: {
      control: "text",
      description: "The default expanded item(s)",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Basic Accordion Stories
// ============================================================================

export const SingleExpand: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-96">
      <AccordionItem value="item-1">
        <AccordionTrigger>What is Nixelo?</AccordionTrigger>
        <AccordionContent>
          Nixelo is a collaborative project management platform that combines document management
          with issue tracking, featuring real-time collaboration and presence indicators.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>How do I get started?</AccordionTrigger>
        <AccordionContent>
          Sign up for an account, create your first workspace, and invite your team members. You can
          then create projects, documents, and start tracking issues.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Is there a free plan?</AccordionTrigger>
        <AccordionContent>
          Yes! We offer a generous free tier that includes unlimited projects, up to 5 team members,
          and all core features. Upgrade anytime for advanced features.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Single expand accordion where only one item can be open at a time. Set `collapsible` to allow closing all items.",
      },
    },
  },
};

export const MultipleExpand: Story = {
  render: () => (
    <Accordion type="multiple" className="w-96">
      <AccordionItem value="item-1">
        <AccordionTrigger>First Section</AccordionTrigger>
        <AccordionContent>
          This is the content for the first section. Multiple items can be expanded simultaneously
          in this mode.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Second Section</AccordionTrigger>
        <AccordionContent>
          This is the content for the second section. Try opening this while keeping the first
          section open.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Third Section</AccordionTrigger>
        <AccordionContent>
          This is the content for the third section. All three sections can be open at the same
          time.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  parameters: {
    docs: {
      description: {
        story: "Multiple expand accordion where any number of items can be open simultaneously.",
      },
    },
  },
};

export const DefaultExpanded: Story = {
  render: () => (
    <Accordion type="single" collapsible defaultValue="item-2" className="w-96">
      <AccordionItem value="item-1">
        <AccordionTrigger>Collapsed by Default</AccordionTrigger>
        <AccordionContent>This item starts collapsed.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Expanded by Default</AccordionTrigger>
        <AccordionContent>
          This item starts expanded because its value matches the defaultValue prop.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Also Collapsed</AccordionTrigger>
        <AccordionContent>This item also starts collapsed.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  parameters: {
    docs: {
      description: {
        story: "Accordion with a specific item expanded by default using `defaultValue`.",
      },
    },
  },
};

// ============================================================================
// FAQ Example
// ============================================================================

export const FAQ: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-ui-text">Frequently Asked Questions</h2>
        <p className="mt-2 text-ui-text-secondary">
          Find answers to common questions about our platform.
        </p>
      </div>
      <Accordion type="single" collapsible>
        <AccordionItem value="faq-1">
          <AccordionTrigger>
            <span className="flex items-center gap-2">
              <CircleHelp className="size-4 text-brand" />
              What makes Nixelo different from other project management tools?
            </span>
          </AccordionTrigger>
          <AccordionContent>
            Nixelo uniquely combines document management (similar to Confluence) with issue tracking
            (similar to Jira) in a single, seamlessly integrated platform. Our real-time
            collaboration features let you see who's working on what, with live presence indicators
            and instant updates.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="faq-2">
          <AccordionTrigger>
            <span className="flex items-center gap-2">
              <User className="size-4 text-brand" />
              How many team members can I invite?
            </span>
          </AccordionTrigger>
          <AccordionContent>
            The free plan includes up to 5 team members. Our Pro plan supports up to 50 members, and
            our Enterprise plan offers unlimited team members with advanced admin controls and SSO
            integration.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="faq-3">
          <AccordionTrigger>
            <span className="flex items-center gap-2">
              <Lock className="size-4 text-brand" />
              Is my data secure?
            </span>
          </AccordionTrigger>
          <AccordionContent>
            Absolutely. We use industry-standard encryption for all data in transit and at rest. Our
            infrastructure is hosted on secure cloud providers with SOC 2 Type II compliance. We
            also offer role-based access control (RBAC) to ensure only authorized team members can
            access sensitive information.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="faq-4">
          <AccordionTrigger>
            <span className="flex items-center gap-2">
              <CreditCard className="size-4 text-brand" />
              Can I cancel my subscription anytime?
            </span>
          </AccordionTrigger>
          <AccordionContent>
            Yes, you can cancel your subscription at any time. Your account will remain active until
            the end of your current billing period. We also offer a 30-day money-back guarantee for
            annual plans.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="faq-5">
          <AccordionTrigger>
            <span className="flex items-center gap-2">
              <Mail className="size-4 text-brand" />
              How do I contact support?
            </span>
          </AccordionTrigger>
          <AccordionContent>
            You can reach our support team via email at support@nixelo.com, through the in-app chat
            widget, or by opening a support ticket in your dashboard. Pro and Enterprise customers
            have access to priority support with faster response times.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "A complete FAQ section with icons and detailed answers, using single expand mode.",
      },
    },
  },
};

// ============================================================================
// Settings Sections
// ============================================================================

export const SettingsSections: Story = {
  render: () => (
    <div className="w-full max-w-lg">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-ui-text">Settings</h2>
        <p className="text-sm text-ui-text-secondary">
          Manage your account preferences and configurations.
        </p>
      </div>
      <Accordion type="multiple" defaultValue={["profile"]} className="space-y-2">
        <AccordionItem value="profile" className="rounded-lg border border-ui-border px-4">
          <AccordionTrigger>
            <span className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-md bg-brand/10">
                <User className="size-4 text-brand" />
              </div>
              <div className="text-left">
                <p className="font-medium">Profile Settings</p>
                <p className="text-xs text-ui-text-secondary">Manage your personal information</p>
              </div>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ui-text">Display Name</p>
                  <p className="text-xs text-ui-text-secondary">John Doe</p>
                </div>
                <button type="button" className="text-sm text-brand hover:underline">
                  Edit
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ui-text">Email</p>
                  <p className="text-xs text-ui-text-secondary">john@example.com</p>
                </div>
                <button type="button" className="text-sm text-brand hover:underline">
                  Edit
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ui-text">Avatar</p>
                  <p className="text-xs text-ui-text-secondary">Upload a profile picture</p>
                </div>
                <button type="button" className="text-sm text-brand hover:underline">
                  Change
                </button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="notifications" className="rounded-lg border border-ui-border px-4">
          <AccordionTrigger>
            <span className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-md bg-status-info/10">
                <Bell className="size-4 text-status-info" />
              </div>
              <div className="text-left">
                <p className="font-medium">Notifications</p>
                <p className="text-xs text-ui-text-secondary">Configure how you receive updates</p>
              </div>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <label className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ui-text">Email Notifications</p>
                  <p className="text-xs text-ui-text-secondary">Receive updates via email</p>
                </div>
                <input type="checkbox" defaultChecked className="size-4" />
              </label>
              <label className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ui-text">Push Notifications</p>
                  <p className="text-xs text-ui-text-secondary">Browser push notifications</p>
                </div>
                <input type="checkbox" className="size-4" />
              </label>
              <label className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ui-text">Weekly Digest</p>
                  <p className="text-xs text-ui-text-secondary">Weekly summary of activity</p>
                </div>
                <input type="checkbox" defaultChecked className="size-4" />
              </label>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="security" className="rounded-lg border border-ui-border px-4">
          <AccordionTrigger>
            <span className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-md bg-status-warning/10">
                <Lock className="size-4 text-status-warning" />
              </div>
              <div className="text-left">
                <p className="font-medium">Security</p>
                <p className="text-xs text-ui-text-secondary">Password and authentication</p>
              </div>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ui-text">Password</p>
                  <p className="text-xs text-ui-text-secondary">Last changed 30 days ago</p>
                </div>
                <button type="button" className="text-sm text-brand hover:underline">
                  Change
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ui-text">Two-Factor Authentication</p>
                  <p className="text-xs text-ui-text-secondary">Not enabled</p>
                </div>
                <button type="button" className="text-sm text-brand hover:underline">
                  Enable
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ui-text">Active Sessions</p>
                  <p className="text-xs text-ui-text-secondary">2 active sessions</p>
                </div>
                <button type="button" className="text-sm text-brand hover:underline">
                  Manage
                </button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="preferences" className="rounded-lg border border-ui-border px-4">
          <AccordionTrigger>
            <span className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-md bg-ui-text-secondary/10">
                <Settings className="size-4 text-ui-text-secondary" />
              </div>
              <div className="text-left">
                <p className="font-medium">Preferences</p>
                <p className="text-xs text-ui-text-secondary">Customize your experience</p>
              </div>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ui-text">Theme</p>
                  <p className="text-xs text-ui-text-secondary">System default</p>
                </div>
                <select className="rounded border border-ui-border bg-ui-bg px-2 py-1 text-sm text-ui-text">
                  <option>System</option>
                  <option>Light</option>
                  <option>Dark</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ui-text">Language</p>
                  <p className="text-xs text-ui-text-secondary">English (US)</p>
                </div>
                <select className="rounded border border-ui-border bg-ui-bg px-2 py-1 text-sm text-ui-text">
                  <option>English (US)</option>
                  <option>English (UK)</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ui-text">Timezone</p>
                  <p className="text-xs text-ui-text-secondary">America/New_York (EST)</p>
                </div>
                <button type="button" className="text-sm text-brand hover:underline">
                  Change
                </button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Settings page with multiple expandable sections, using icons and rich content. Uses `type="multiple"` to allow multiple sections open at once.',
      },
    },
  },
};

// ============================================================================
// Non-Collapsible Single
// ============================================================================

export const NonCollapsibleSingle: Story = {
  render: () => (
    <Accordion type="single" defaultValue="item-1" className="w-96">
      <AccordionItem value="item-1">
        <AccordionTrigger>Always One Open</AccordionTrigger>
        <AccordionContent>
          In non-collapsible mode, at least one item must always be expanded. Try clicking other
          items - the current one will close as the new one opens.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Second Option</AccordionTrigger>
        <AccordionContent>
          Clicking on an already-open item won't close it in this mode. You must click on a
          different item to change the selection.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Third Option</AccordionTrigger>
        <AccordionContent>
          This pattern is useful when you always want to show some content, like in a step-by-step
          wizard or required information display.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  parameters: {
    docs: {
      description: {
        story: "Single accordion without `collapsible` prop - one item must always remain open.",
      },
    },
  },
};

// ============================================================================
// Rich Content
// ============================================================================

export const RichContent: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-full max-w-xl">
      <AccordionItem value="item-1">
        <AccordionTrigger>Features Overview</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            <p className="text-ui-text">
              Our platform offers a comprehensive set of features designed to boost your team's
              productivity:
            </p>
            <ul className="list-inside list-disc space-y-2 text-ui-text-secondary">
              <li>Real-time document collaboration with presence indicators</li>
              <li>Kanban boards and sprint planning</li>
              <li>Custom workflow automation</li>
              <li>Role-based access control (RBAC)</li>
              <li>Google Calendar integration</li>
            </ul>
            <div className="rounded-md bg-ui-bg-hover p-3">
              <p className="text-sm text-ui-text-secondary">
                <strong className="text-ui-text">Pro tip:</strong> You can customize your workflow
                states to match your team's existing processes.
              </p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Pricing Tiers</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <div className="rounded-md border border-ui-border p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-ui-text">Free</span>
                <span className="text-ui-text-secondary">$0/month</span>
              </div>
              <p className="mt-1 text-sm text-ui-text-secondary">
                Up to 5 team members, unlimited projects
              </p>
            </div>
            <div className="rounded-md border border-brand p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-brand">Pro</span>
                <span className="text-ui-text-secondary">$12/user/month</span>
              </div>
              <p className="mt-1 text-sm text-ui-text-secondary">
                Up to 50 members, advanced analytics, priority support
              </p>
            </div>
            <div className="rounded-md border border-ui-border p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-ui-text">Enterprise</span>
                <span className="text-ui-text-secondary">Custom</span>
              </div>
              <p className="mt-1 text-sm text-ui-text-secondary">
                Unlimited members, SSO, dedicated support
              </p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Getting Started Guide</AccordionTrigger>
        <AccordionContent>
          <ol className="list-inside list-decimal space-y-3 text-ui-text-secondary">
            <li>
              <span className="text-ui-text">Create your account</span>
              <p className="ml-5 mt-1 text-sm">
                Sign up with your email or use Google/GitHub authentication.
              </p>
            </li>
            <li>
              <span className="text-ui-text">Set up your workspace</span>
              <p className="ml-5 mt-1 text-sm">
                Create a workspace and customize it with your team's branding.
              </p>
            </li>
            <li>
              <span className="text-ui-text">Invite your team</span>
              <p className="ml-5 mt-1 text-sm">
                Send invitations via email and assign appropriate roles.
              </p>
            </li>
            <li>
              <span className="text-ui-text">Create your first project</span>
              <p className="ml-5 mt-1 text-sm">Start with a template or build from scratch.</p>
            </li>
          </ol>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  parameters: {
    docs: {
      description: {
        story: "Accordion with rich content including lists, styled boxes, and complex layouts.",
      },
    },
  },
};

// ============================================================================
// All States Comparison
// ============================================================================

export const TypeComparison: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="mb-3 text-sm font-medium text-ui-text-secondary">Single (Collapsible)</h3>
        <Accordion type="single" collapsible className="w-80">
          <AccordionItem value="item-1">
            <AccordionTrigger>Item One</AccordionTrigger>
            <AccordionContent>Only one item open at a time. Can close all.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Item Two</AccordionTrigger>
            <AccordionContent>Click to switch between items.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-ui-text-secondary">
          Single (Non-Collapsible)
        </h3>
        <Accordion type="single" defaultValue="item-1" className="w-80">
          <AccordionItem value="item-1">
            <AccordionTrigger>Item One</AccordionTrigger>
            <AccordionContent>One item must always be open.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Item Two</AccordionTrigger>
            <AccordionContent>Cannot close the last open item.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-ui-text-secondary">Multiple</h3>
        <Accordion type="multiple" className="w-80">
          <AccordionItem value="item-1">
            <AccordionTrigger>Item One</AccordionTrigger>
            <AccordionContent>Multiple items can be open.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Item Two</AccordionTrigger>
            <AccordionContent>Open this without closing item one.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Comparison of all accordion type configurations: single collapsible, single non-collapsible, and multiple.",
      },
    },
  },
};
