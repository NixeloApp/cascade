import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button } from "./Button";
import { ConfirmDialog } from "./ConfirmDialog";
import { Flex } from "./Flex";

const meta: Meta<typeof ConfirmDialog> = {
  title: "UI/ConfirmDialog",
  component: ConfirmDialog,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    isOpen: {
      control: "boolean",
      description: "Controls whether the dialog is open",
    },
    title: {
      control: "text",
      description: "The dialog title",
    },
    message: {
      control: "text",
      description: "The dialog message/description",
    },
    confirmLabel: {
      control: "text",
      description: 'Label for the confirm button (default: "Confirm")',
    },
    cancelLabel: {
      control: "text",
      description: 'Label for the cancel button (default: "Cancel")',
    },
    variant: {
      control: "select",
      options: ["danger", "warning", "info"],
      description: "Visual variant of the dialog",
    },
    isLoading: {
      control: "boolean",
      description: "Shows loading state on the confirm button",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Interactive Wrapper Component
// ============================================================================

function ConfirmDialogDemo({
  variant = "warning",
  title = "Confirm Action",
  message = "Are you sure you want to proceed with this action?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isLoading = false,
}: {
  variant?: "danger" | "warning" | "info";
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
      <ConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={() => alert("Confirmed!")}
        title={title}
        message={message}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        variant={variant}
        isLoading={isLoading}
      />
    </div>
  );
}

// ============================================================================
// Basic Variant Stories
// ============================================================================

export const Warning: Story = {
  render: () => <ConfirmDialogDemo variant="warning" />,
  parameters: {
    docs: {
      description: {
        story:
          "Default warning variant with an orange alert icon. Used for actions that need user attention but are not destructive.",
      },
    },
  },
};

export const Danger: Story = {
  render: () => (
    <ConfirmDialogDemo
      variant="danger"
      title="Delete Item"
      message="This action cannot be undone. Are you sure you want to permanently delete this item?"
      confirmLabel="Delete"
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Danger/destructive variant with a red alert icon. Used for irreversible or destructive actions like deletion.",
      },
    },
  },
};

export const Info: Story = {
  render: () => (
    <ConfirmDialogDemo
      variant="info"
      title="Submit for Review"
      message="Your changes will be submitted for review. You can continue editing until the review is complete."
      confirmLabel="Submit"
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Informational variant with a blue info icon. Used for neutral confirmations that don't involve risk.",
      },
    },
  },
};

// ============================================================================
// Custom Button Labels
// ============================================================================

export const CustomConfirmLabel: Story = {
  render: () => (
    <ConfirmDialogDemo
      variant="danger"
      title="Archive Project"
      message="This project will be archived and hidden from your dashboard. You can restore it later from settings."
      confirmLabel="Archive Project"
      cancelLabel="Keep Active"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: "Dialog with custom confirm and cancel button labels for clearer user intent.",
      },
    },
  },
};

export const SaveDiscardLabels: Story = {
  render: () => (
    <ConfirmDialogDemo
      variant="warning"
      title="Unsaved Changes"
      message="You have unsaved changes. Do you want to save them before leaving?"
      confirmLabel="Save Changes"
      cancelLabel="Discard"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: "Common use case for prompting users about unsaved changes.",
      },
    },
  },
};

// ============================================================================
// Different Titles and Messages
// ============================================================================

export const DeleteConfirmation: Story = {
  render: () => (
    <ConfirmDialogDemo
      variant="danger"
      title="Delete Document"
      message="Are you sure you want to delete 'Project Roadmap.doc'? This will remove all content and cannot be undone."
      confirmLabel="Delete Document"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: "Delete confirmation with specific item name in the message.",
      },
    },
  },
};

export const LeavePageConfirmation: Story = {
  render: () => (
    <ConfirmDialogDemo
      variant="warning"
      title="Leave Page?"
      message="You have unsaved work on this page. Leaving now will discard your changes."
      confirmLabel="Leave Page"
      cancelLabel="Stay"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: "Confirmation for navigating away from a page with unsaved work.",
      },
    },
  },
};

export const PublishConfirmation: Story = {
  render: () => (
    <ConfirmDialogDemo
      variant="info"
      title="Publish Document"
      message="This document will become publicly accessible. Anyone with the link will be able to view it."
      confirmLabel="Publish"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: "Info confirmation for publishing content publicly.",
      },
    },
  },
};

export const RemoveTeamMember: Story = {
  render: () => (
    <ConfirmDialogDemo
      variant="danger"
      title="Remove Team Member"
      message="John Doe will be removed from this project and lose access to all associated resources."
      confirmLabel="Remove Member"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: "Danger confirmation for removing a team member.",
      },
    },
  },
};

// ============================================================================
// Loading State
// ============================================================================

function LoadingDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsOpen(false);
      alert("Action completed!");
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
      <ConfirmDialog
        isOpen={isOpen}
        onClose={() => !isLoading && setIsOpen(false)}
        onConfirm={handleConfirm}
        title="Delete All Data"
        message="This will permanently delete all your data. This action cannot be undone."
        confirmLabel="Delete Everything"
        variant="danger"
        isLoading={isLoading}
      />
    </div>
  );
}

export const Loading: Story = {
  render: () => <LoadingDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Dialog with loading state shown when an async action is in progress. Both buttons are disabled during loading.",
      },
    },
  },
};

// ============================================================================
// All Variants Comparison
// ============================================================================

function AllVariantsDemo() {
  const [openVariant, setOpenVariant] = useState<"danger" | "warning" | "info" | null>(null);

  return (
    <Flex direction="column" gap="md" align="center">
      <Flex gap="sm">
        <Button variant="outline" onClick={() => setOpenVariant("warning")}>
          Warning
        </Button>
        <Button variant="danger" onClick={() => setOpenVariant("danger")}>
          Danger
        </Button>
        <Button variant="secondary" onClick={() => setOpenVariant("info")}>
          Info
        </Button>
      </Flex>

      <ConfirmDialog
        isOpen={openVariant === "warning"}
        onClose={() => setOpenVariant(null)}
        onConfirm={() => {}}
        title="Warning Dialog"
        message="This is a warning dialog. It's used for actions that need user attention."
        variant="warning"
      />

      <ConfirmDialog
        isOpen={openVariant === "danger"}
        onClose={() => setOpenVariant(null)}
        onConfirm={() => {}}
        title="Danger Dialog"
        message="This is a danger dialog. It's used for destructive or irreversible actions."
        confirmLabel="Delete"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={openVariant === "info"}
        onClose={() => setOpenVariant(null)}
        onConfirm={() => {}}
        title="Info Dialog"
        message="This is an info dialog. It's used for neutral confirmations without risk."
        variant="info"
      />
    </Flex>
  );
}

export const AllVariants: Story = {
  render: () => <AllVariantsDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Compare all three variants side by side. Click each button to see the corresponding dialog style.",
      },
    },
  },
};

// ============================================================================
// Real-World Use Cases
// ============================================================================

export const DiscardDraft: Story = {
  render: () => (
    <ConfirmDialogDemo
      variant="warning"
      title="Discard Draft?"
      message="You have an unsaved draft. Are you sure you want to discard it and start fresh?"
      confirmLabel="Discard Draft"
      cancelLabel="Keep Editing"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: "Use case for discarding an unsaved draft document.",
      },
    },
  },
};

export const CancelSubscription: Story = {
  render: () => (
    <ConfirmDialogDemo
      variant="danger"
      title="Cancel Subscription"
      message="Your subscription will end at the end of the current billing period. You'll lose access to premium features."
      confirmLabel="Cancel Subscription"
      cancelLabel="Keep Subscription"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: "Use case for cancelling a paid subscription.",
      },
    },
  },
};

export const ResetSettings: Story = {
  render: () => (
    <ConfirmDialogDemo
      variant="warning"
      title="Reset to Defaults"
      message="All your custom settings will be reset to their default values. This includes theme preferences, notification settings, and display options."
      confirmLabel="Reset Settings"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: "Use case for resetting user settings to defaults.",
      },
    },
  },
};

export const SendNotification: Story = {
  render: () => (
    <ConfirmDialogDemo
      variant="info"
      title="Send Notification"
      message="This will send a notification to all 156 team members. Are you sure you want to proceed?"
      confirmLabel="Send to All"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: "Info confirmation for sending bulk notifications.",
      },
    },
  },
};
