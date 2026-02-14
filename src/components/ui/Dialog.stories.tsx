import type { Meta, StoryObj } from "@storybook/react";
import { Mail, Settings, Trash2, User } from "lucide-react";
import { useState } from "react";
import { Button } from "./Button";
import { Dialog, DialogTrigger } from "./Dialog";
import { Flex } from "./Flex";
import { Input } from "./Input";

const meta: Meta<typeof Dialog> = {
  title: "UI/Dialog",
  component: Dialog,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    open: {
      control: "boolean",
      description: "Controls whether the dialog is open",
    },
    title: {
      control: "text",
      description: "Dialog title (required for accessibility)",
    },
    description: {
      control: "text",
      description: "Dialog description (required for accessibility)",
    },
    className: {
      control: "text",
      description: "Additional CSS classes for the dialog panel",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Basic Dialog Stories
// ============================================================================

export const Basic: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Dialog</Button>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="Basic Dialog"
          description="This is a basic dialog with a title and description. Click outside or press Escape to close."
        >
          <p>Dialog content goes here.</p>
        </Dialog>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "A simple dialog with a title and description.",
      },
    },
  },
};

export const WithActions: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Dialog</Button>
        <Dialog
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
          <p>This action cannot be undone. Please confirm you want to proceed.</p>
        </Dialog>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "A dialog with action buttons in the footer.",
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
        <Dialog
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
          <form className="space-y-4">
            <Input label="Name" placeholder="Enter your name" />
            <Input label="Email" type="email" placeholder="Enter your email" />
          </form>
        </Dialog>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "A dialog containing a form with input fields.",
      },
    },
  },
};

export const CustomWidth: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Wide Dialog</Button>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="Wide Dialog"
          description="This dialog uses a custom width class."
          className="sm:max-w-2xl"
        >
          <p>This dialog is wider than the default. Use className to customize the size.</p>
        </Dialog>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "A dialog with custom width using className prop.",
      },
    },
  },
};

export const NoCloseButton: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Dialog</Button>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="No Close Button"
          description="This dialog doesn't have an X close button."
          showCloseButton={false}
          footer={<Button onClick={() => setOpen(false)}>Close</Button>}
        >
          <p>You must use the button below to close this dialog.</p>
        </Dialog>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "A dialog without the default close button.",
      },
    },
  },
};

export const DeleteConfirmation: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="danger" onClick={() => setOpen(true)}>
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Item
        </Button>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="Delete Item"
          description="This action cannot be undone. The item will be permanently deleted."
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => setOpen(false)}>
                Delete
              </Button>
            </>
          }
        >
          <p>Are you sure you want to delete this item? All associated data will be lost.</p>
        </Dialog>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "A confirmation dialog for destructive actions.",
      },
    },
  },
};

export const SettingsDialog: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="Settings"
          description="Configure your preferences"
          className="sm:max-w-xl"
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setOpen(false)}>Save Settings</Button>
            </>
          }
        >
          <Flex direction="column" gap="md">
            <Input label="Display Name" defaultValue="John Doe" />
            <Input label="Email" type="email" defaultValue="john@example.com" />
            <Input label="Timezone" defaultValue="UTC-5" />
          </Flex>
        </Dialog>
      </>
    );
  },
};

export const InviteUsers: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>
          <User className="w-4 h-4 mr-2" />
          Invite Users
        </Button>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="Invite Team Members"
          description="Send invitations to collaborate on this project"
          className="sm:max-w-md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setOpen(false)}>
                <Mail className="w-4 h-4 mr-2" />
                Send Invites
              </Button>
            </>
          }
        >
          <Input
            label="Email Addresses"
            placeholder="Enter email addresses, separated by commas"
            helperText="Team members will receive an email invitation"
          />
        </Dialog>
      </>
    );
  },
};
