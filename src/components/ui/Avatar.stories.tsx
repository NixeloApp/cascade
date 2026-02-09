import type { Meta, StoryObj } from "@storybook/react";
import { Avatar, AvatarGroup } from "./Avatar";

const meta: Meta<typeof Avatar> = {
  title: "UI/Avatar",
  component: Avatar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    name: {
      control: "text",
      description: "User's name - used to generate initials",
    },
    email: {
      control: "text",
      description: "User's email - fallback for initials if name is missing",
    },
    src: {
      control: "text",
      description: "Image URL for the avatar",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The size of the avatar",
    },
    variant: {
      control: "select",
      options: ["brand", "accent", "neutral", "success", "warning", "error", "soft"],
      description: "Color variant for the fallback background",
    },
    alt: {
      control: "text",
      description: "Alt text for image (defaults to name)",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

// Default story
export const Default: Story = {
  args: {
    name: "John Doe",
  },
};

// With image
export const WithImage: Story = {
  args: {
    name: "John Doe",
    src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    size: "lg",
  },
};

// With fallback initials (no image)
export const WithFallback: Story = {
  args: {
    name: "Jane Smith",
    size: "lg",
  },
};

// Loading state (image that will fail to load, showing fallback after delay)
export const LoadingState: Story = {
  args: {
    name: "Loading User",
    src: "https://invalid-url-that-will-fail.com/image.jpg",
    size: "lg",
  },
  parameters: {
    docs: {
      description: {
        story:
          "When an image fails to load, the avatar gracefully falls back to initials after a 600ms delay.",
      },
    },
  },
};

// Email fallback
export const EmailFallback: Story = {
  args: {
    email: "user@example.com",
    size: "md",
  },
  parameters: {
    docs: {
      description: {
        story: "When no name is provided, the first letter of the email is used as the initial.",
      },
    },
  },
};

// No name or email
export const UnknownUser: Story = {
  args: {
    size: "md",
  },
  parameters: {
    docs: {
      description: {
        story: "When neither name nor email is provided, a question mark is displayed.",
      },
    },
  },
};

// Size stories
export const SizeExtraSmall: Story = {
  args: {
    name: "John Doe",
    size: "xs",
  },
};

export const SizeSmall: Story = {
  args: {
    name: "John Doe",
    size: "sm",
  },
};

export const SizeMedium: Story = {
  args: {
    name: "John Doe",
    size: "md",
  },
};

export const SizeLarge: Story = {
  args: {
    name: "John Doe",
    size: "lg",
  },
};

export const SizeExtraLarge: Story = {
  args: {
    name: "John Doe",
    size: "xl",
  },
};

// Variant stories
export const VariantBrand: Story = {
  args: {
    name: "Brand User",
    variant: "brand",
    size: "lg",
  },
};

export const VariantAccent: Story = {
  args: {
    name: "Accent User",
    variant: "accent",
    size: "lg",
  },
};

export const VariantNeutral: Story = {
  args: {
    name: "Neutral User",
    variant: "neutral",
    size: "lg",
  },
};

export const VariantSuccess: Story = {
  args: {
    name: "Success User",
    variant: "success",
    size: "lg",
  },
};

export const VariantWarning: Story = {
  args: {
    name: "Warning User",
    variant: "warning",
    size: "lg",
  },
};

export const VariantError: Story = {
  args: {
    name: "Error User",
    variant: "error",
    size: "lg",
  },
};

export const VariantSoft: Story = {
  args: {
    name: "Soft User",
    variant: "soft",
    size: "lg",
  },
};

// All sizes grid
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-3 text-sm font-medium text-ui-text-secondary">Sizes</h3>
        <div className="flex items-end gap-4">
          <div className="flex flex-col items-center gap-2">
            <Avatar name="John Doe" size="xs" />
            <span className="text-xs text-ui-text-tertiary">xs</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar name="John Doe" size="sm" />
            <span className="text-xs text-ui-text-tertiary">sm</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar name="John Doe" size="md" />
            <span className="text-xs text-ui-text-tertiary">md</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar name="John Doe" size="lg" />
            <span className="text-xs text-ui-text-tertiary">lg</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar name="John Doe" size="xl" />
            <span className="text-xs text-ui-text-tertiary">xl</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-ui-text-secondary">Sizes with Images</h3>
        <div className="flex items-end gap-4">
          <div className="flex flex-col items-center gap-2">
            <Avatar
              name="John Doe"
              size="xs"
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
            />
            <span className="text-xs text-ui-text-tertiary">xs</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar
              name="John Doe"
              size="sm"
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
            />
            <span className="text-xs text-ui-text-tertiary">sm</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar
              name="John Doe"
              size="md"
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
            />
            <span className="text-xs text-ui-text-tertiary">md</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar
              name="John Doe"
              size="lg"
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
            />
            <span className="text-xs text-ui-text-tertiary">lg</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar
              name="John Doe"
              size="xl"
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
            />
            <span className="text-xs text-ui-text-tertiary">xl</span>
          </div>
        </div>
      </div>
    </div>
  ),
};

// All variants grid
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-3 text-sm font-medium text-ui-text-secondary">Variants</h3>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <Avatar name="Brand User" variant="brand" size="lg" />
            <span className="text-xs text-ui-text-tertiary">brand</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar name="Accent User" variant="accent" size="lg" />
            <span className="text-xs text-ui-text-tertiary">accent</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar name="Neutral User" variant="neutral" size="lg" />
            <span className="text-xs text-ui-text-tertiary">neutral</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar name="Success User" variant="success" size="lg" />
            <span className="text-xs text-ui-text-tertiary">success</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar name="Warning User" variant="warning" size="lg" />
            <span className="text-xs text-ui-text-tertiary">warning</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar name="Error User" variant="error" size="lg" />
            <span className="text-xs text-ui-text-tertiary">error</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar name="Soft User" variant="soft" size="lg" />
            <span className="text-xs text-ui-text-tertiary">soft</span>
          </div>
        </div>
      </div>
    </div>
  ),
};

// Avatar group stories
export const AvatarGroupDefault: Story = {
  render: () => (
    <AvatarGroup>
      <Avatar name="Alice Johnson" />
      <Avatar name="Bob Smith" />
      <Avatar name="Charlie Brown" />
    </AvatarGroup>
  ),
};

export const AvatarGroupWithImages: Story = {
  render: () => (
    <AvatarGroup size="lg">
      <Avatar
        name="Alice Johnson"
        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
        size="lg"
      />
      <Avatar
        name="Bob Smith"
        src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face"
        size="lg"
      />
      <Avatar
        name="Charlie Brown"
        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
        size="lg"
      />
    </AvatarGroup>
  ),
};

export const AvatarGroupWithMax: Story = {
  render: () => (
    <AvatarGroup max={3} size="md">
      <Avatar name="Alice Johnson" />
      <Avatar name="Bob Smith" />
      <Avatar name="Charlie Brown" />
      <Avatar name="Diana Prince" />
      <Avatar name="Edward Norton" />
      <Avatar name="Frank Castle" />
    </AvatarGroup>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "When max is set, only that many avatars are shown. The overflow count is displayed as +N.",
      },
    },
  },
};

export const AvatarGroupSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-3 text-sm font-medium text-ui-text-secondary">Group Sizes</h3>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <span className="w-8 text-xs text-ui-text-tertiary">xs</span>
            <AvatarGroup size="xs">
              <Avatar name="Alice Johnson" size="xs" />
              <Avatar name="Bob Smith" size="xs" />
              <Avatar name="Charlie Brown" size="xs" />
              <Avatar name="Diana Prince" size="xs" />
            </AvatarGroup>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-8 text-xs text-ui-text-tertiary">sm</span>
            <AvatarGroup size="sm">
              <Avatar name="Alice Johnson" size="sm" />
              <Avatar name="Bob Smith" size="sm" />
              <Avatar name="Charlie Brown" size="sm" />
              <Avatar name="Diana Prince" size="sm" />
            </AvatarGroup>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-8 text-xs text-ui-text-tertiary">md</span>
            <AvatarGroup size="md">
              <Avatar name="Alice Johnson" size="md" />
              <Avatar name="Bob Smith" size="md" />
              <Avatar name="Charlie Brown" size="md" />
              <Avatar name="Diana Prince" size="md" />
            </AvatarGroup>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-8 text-xs text-ui-text-tertiary">lg</span>
            <AvatarGroup size="lg">
              <Avatar name="Alice Johnson" size="lg" />
              <Avatar name="Bob Smith" size="lg" />
              <Avatar name="Charlie Brown" size="lg" />
              <Avatar name="Diana Prince" size="lg" />
            </AvatarGroup>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-8 text-xs text-ui-text-tertiary">xl</span>
            <AvatarGroup size="xl">
              <Avatar name="Alice Johnson" size="xl" />
              <Avatar name="Bob Smith" size="xl" />
              <Avatar name="Charlie Brown" size="xl" />
              <Avatar name="Diana Prince" size="xl" />
            </AvatarGroup>
          </div>
        </div>
      </div>
    </div>
  ),
};

// Real-world usage examples
export const UsageExamples: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="mb-3 text-sm font-medium text-ui-text-secondary">User Profile</h3>
        <div className="flex items-center gap-3">
          <Avatar
            name="Sarah Connor"
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
            size="xl"
          />
          <div>
            <p className="font-medium text-ui-text">Sarah Connor</p>
            <p className="text-sm text-ui-text-secondary">Product Designer</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-ui-text-secondary">Comment Thread</h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2">
            <Avatar name="Michael Scott" size="sm" variant="brand" />
            <div className="rounded-lg bg-ui-bg-secondary p-2 text-sm">That's what she said!</div>
          </div>
          <div className="flex items-start gap-2">
            <Avatar name="Jim Halpert" size="sm" variant="accent" />
            <div className="rounded-lg bg-ui-bg-secondary p-2 text-sm">
              Bears. Beets. Battlestar Galactica.
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-ui-text-secondary">Team Members</h3>
        <AvatarGroup max={5} size="md">
          <Avatar
            name="Alice Johnson"
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
          />
          <Avatar
            name="Bob Smith"
            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face"
          />
          <Avatar name="Charlie Brown" variant="brand" />
          <Avatar name="Diana Prince" variant="accent" />
          <Avatar name="Edward Norton" variant="success" />
          <Avatar name="Frank Castle" variant="warning" />
          <Avatar name="Grace Hopper" variant="neutral" />
        </AvatarGroup>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-ui-text-secondary">Status Indicators</h3>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <Avatar name="Online User" variant="success" size="lg" />
            <span className="text-xs text-ui-text-tertiary">Online</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar name="Away User" variant="warning" size="lg" />
            <span className="text-xs text-ui-text-tertiary">Away</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar name="Busy User" variant="error" size="lg" />
            <span className="text-xs text-ui-text-tertiary">Busy</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar name="Offline User" variant="neutral" size="lg" />
            <span className="text-xs text-ui-text-tertiary">Offline</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-ui-text-secondary">Initials Generation</h3>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <Avatar name="John Doe" size="lg" />
            <span className="text-xs text-ui-text-tertiary">John Doe</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar name="Alice" size="lg" />
            <span className="text-xs text-ui-text-tertiary">Alice</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar name="Jean-Claude Van Damme" size="lg" />
            <span className="text-xs text-ui-text-tertiary">Jean-Claude Van Damme</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar email="user@example.com" size="lg" />
            <span className="text-xs text-ui-text-tertiary">user@example.com</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar size="lg" />
            <span className="text-xs text-ui-text-tertiary">(no data)</span>
          </div>
        </div>
      </div>
    </div>
  ),
};
