import type { Meta, StoryObj } from "@storybook/react";
import { Settings, User } from "lucide-react";
import { useState } from "react";
import { Button } from "./Button";
import { Flex } from "./Flex";
import { Icon } from "./Icon";
import { Input } from "./Input";
import { Label } from "./Label";
import { Sheet } from "./Sheet";

const meta: Meta<typeof Sheet> = {
  title: "UI/Sheet",
  component: Sheet,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    open: {
      control: "boolean",
      description: "Controls whether the sheet is open",
    },
    title: {
      control: "text",
      description: "Sheet title (required for accessibility)",
    },
    description: {
      control: "text",
      description: "Sheet description (required for accessibility)",
    },
    side: {
      control: "select",
      options: ["left", "right", "top", "bottom"],
      description: "The side the sheet slides in from",
    },
    className: {
      control: "text",
      description: "Additional CSS classes for the sheet panel",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Basic Sheet Stories
// ============================================================================

export const Basic: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Sheet</Button>
        <Sheet
          open={open}
          onOpenChange={setOpen}
          title="Basic Sheet"
          description="This is a basic sheet panel that slides in from the right. Click outside or press Escape to close."
        >
          <div className="p-6">
            <p>Sheet content goes here.</p>
          </div>
        </Sheet>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "A simple sheet with a title and description, sliding in from the right (default).",
      },
    },
  },
};

export const WithActions: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Sheet</Button>
        <Sheet
          open={open}
          onOpenChange={setOpen}
          title="Confirm Action"
          description="Are you sure you want to proceed with this action?"
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setOpen(false)}>Confirm</Button>
            </>
          }
        >
          <div className="p-6">
            <p>This action can be undone later.</p>
          </div>
        </Sheet>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "A sheet with action buttons in the footer.",
      },
    },
  },
};

export const WithForm: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Edit Profile</Button>
        <Sheet
          open={open}
          onOpenChange={setOpen}
          title="Edit Profile"
          description="Update your profile information below."
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setOpen(false)}>Save Changes</Button>
            </>
          }
        >
          <form className="p-6 space-y-4">
            <Flex direction="column" gap="xs">
              <Label htmlFor="sheet-name">Name</Label>
              <Input id="sheet-name" placeholder="Enter your name" />
            </Flex>
            <Flex direction="column" gap="xs">
              <Label htmlFor="sheet-email">Email</Label>
              <Input id="sheet-email" type="email" placeholder="Enter your email" />
            </Flex>
          </form>
        </Sheet>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "A sheet containing a form with input fields.",
      },
    },
  },
};

export const LeftSide: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Left Sheet</Button>
        <Sheet
          open={open}
          onOpenChange={setOpen}
          title="Left Sheet"
          description="This sheet slides in from the left side."
          side="left"
        >
          <div className="p-6">
            <p>Navigation or menu items could go here.</p>
          </div>
        </Sheet>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "A sheet that slides in from the left, useful for navigation menus.",
      },
    },
  },
};

export const TopSide: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Top Sheet</Button>
        <Sheet
          open={open}
          onOpenChange={setOpen}
          title="Notifications"
          description="Your recent notifications"
          side="top"
        >
          <div className="p-6">
            <p>Notification content goes here.</p>
          </div>
        </Sheet>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "A sheet that slides in from the top, useful for notifications or alerts.",
      },
    },
  },
};

export const BottomSide: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Bottom Sheet</Button>
        <Sheet
          open={open}
          onOpenChange={setOpen}
          title="Quick Actions"
          description="Select an action below"
          side="bottom"
        >
          <div className="p-6">
            <p>Action buttons could go here.</p>
          </div>
        </Sheet>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "A sheet that slides in from the bottom, useful for mobile actions.",
      },
    },
  },
};

export const SettingsPanel: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          <Icon icon={Settings} size="sm" className="mr-2" />
          Settings
        </Button>
        <Sheet
          open={open}
          onOpenChange={setOpen}
          title="Settings"
          description="Configure your preferences"
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setOpen(false)}>Save Settings</Button>
            </>
          }
        >
          <Flex direction="column" gap="md" className="p-6">
            <Flex direction="column" gap="xs">
              <Label htmlFor="settings-display-name">Display Name</Label>
              <Input id="settings-display-name" defaultValue="John Doe" />
            </Flex>
            <Flex direction="column" gap="xs">
              <Label htmlFor="settings-email">Email</Label>
              <Input id="settings-email" type="email" defaultValue="john@example.com" />
            </Flex>
            <Flex direction="column" gap="xs">
              <Label htmlFor="settings-timezone">Timezone</Label>
              <Input id="settings-timezone" defaultValue="UTC-5" />
            </Flex>
          </Flex>
        </Sheet>
      </>
    );
  },
};

export const UserProfile: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="ghost" onClick={() => setOpen(true)}>
          <Icon icon={User} size="sm" className="mr-2" />
          Profile
        </Button>
        <Sheet
          open={open}
          onOpenChange={setOpen}
          title="User Profile"
          description="View and edit your profile"
          footer={
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Close
            </Button>
          }
        >
          <Flex direction="column" gap="md" className="p-6">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-ui-bg-secondary mx-auto mb-4" />
              <p className="font-semibold">John Doe</p>
              <p className="text-sm text-ui-text-secondary">john@example.com</p>
            </div>
          </Flex>
        </Sheet>
      </>
    );
  },
};

export const NoCloseButton: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Sheet</Button>
        <Sheet
          open={open}
          onOpenChange={setOpen}
          title="No Close Button"
          description="This sheet doesn't have an X close button."
          showCloseButton={false}
          footer={<Button onClick={() => setOpen(false)}>Close</Button>}
        >
          <div className="p-6">
            <p>You must use the button below to close this sheet.</p>
          </div>
        </Sheet>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "A sheet without the default close button.",
      },
    },
  },
};
