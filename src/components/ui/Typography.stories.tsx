import type { Meta, StoryObj } from "@storybook/react";
import { Typography } from "./Typography";

const meta: Meta<typeof Typography> = {
  title: "UI/Typography",
  component: Typography,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "h1",
        "h2",
        "h3",
        "h4",
        "p",
        "blockquote",
        "list",
        "inlineCode",
        "lead",
        "large",
        "small",
        "muted",
      ],
      description: "The typography variant to render",
    },
    color: {
      control: "select",
      options: [
        "default",
        "secondary",
        "tertiary",
        "primary",
        "error",
        "success",
        "warning",
        "info",
        "accent",
      ],
      description: "The text color",
    },
    as: {
      control: "text",
      description: "Override the rendered HTML element",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Heading Variants
// ============================================================================

export const Heading1: Story = {
  args: {
    variant: "h1",
    children: "Heading 1",
  },
};

export const Heading2: Story = {
  args: {
    variant: "h2",
    children: "Heading 2",
  },
};

export const Heading3: Story = {
  args: {
    variant: "h3",
    children: "Heading 3",
  },
};

export const Heading4: Story = {
  args: {
    variant: "h4",
    children: "Heading 4",
  },
};

// ============================================================================
// Body Text Variants
// ============================================================================

export const Paragraph: Story = {
  args: {
    variant: "p",
    children:
      "This is a paragraph of text. It demonstrates the default body text styling with appropriate line height and spacing for readability.",
  },
};

export const Lead: Story = {
  args: {
    variant: "lead",
    children: "This is lead text, typically used for introductory paragraphs or emphasis.",
  },
};

export const Large: Story = {
  args: {
    variant: "large",
    children: "This is large text with semibold weight.",
  },
};

export const Small: Story = {
  args: {
    variant: "small",
    children: "This is small text, useful for captions or fine print.",
  },
};

export const Muted: Story = {
  args: {
    variant: "muted",
    children: "This is muted text with reduced emphasis.",
  },
};

// ============================================================================
// Special Variants
// ============================================================================

export const Blockquote: Story = {
  args: {
    variant: "blockquote",
    children:
      "This is a blockquote. It features a left border and italic styling to set it apart from regular content.",
  },
};

export const InlineCode: Story = {
  args: {
    variant: "inlineCode",
    children: "const greeting = 'Hello, World!';",
  },
};

export const List: Story = {
  render: () => (
    <Typography variant="list">
      <li>First item in the list</li>
      <li>Second item in the list</li>
      <li>Third item in the list</li>
    </Typography>
  ),
  parameters: {
    docs: {
      description: {
        story: "Unordered list with proper styling and spacing.",
      },
    },
  },
};

// ============================================================================
// Color Variants
// ============================================================================

export const ColorDefault: Story = {
  args: {
    variant: "p",
    color: "default",
    children: "Default color text",
  },
};

export const ColorSecondary: Story = {
  args: {
    variant: "p",
    color: "secondary",
    children: "Secondary color text",
  },
};

export const ColorTertiary: Story = {
  args: {
    variant: "p",
    color: "tertiary",
    children: "Tertiary color text",
  },
};

export const ColorPrimary: Story = {
  args: {
    variant: "p",
    color: "primary",
    children: "Primary (brand) color text",
  },
};

export const ColorError: Story = {
  args: {
    variant: "p",
    color: "error",
    children: "Error color text",
  },
};

export const ColorSuccess: Story = {
  args: {
    variant: "p",
    color: "success",
    children: "Success color text",
  },
};

export const ColorWarning: Story = {
  args: {
    variant: "p",
    color: "warning",
    children: "Warning color text",
  },
};

export const ColorInfo: Story = {
  args: {
    variant: "p",
    color: "info",
    children: "Info color text",
  },
};

export const ColorAccent: Story = {
  args: {
    variant: "p",
    color: "accent",
    children: "Accent color text",
  },
};

// ============================================================================
// Size Overrides
// ============================================================================

export const SizeExtraSmall: Story = {
  args: {
    variant: "p",
    size: "xs",
    children: "Extra small text size",
  },
};

export const SizeSmall: Story = {
  args: {
    variant: "p",
    size: "sm",
    children: "Small text size",
  },
};

export const SizeMedium: Story = {
  args: {
    variant: "p",
    size: "md",
    children: "Medium text size (base)",
  },
};

export const SizeLarge: Story = {
  args: {
    variant: "p",
    size: "lg",
    children: "Large text size",
  },
};

export const SizeExtraLarge: Story = {
  args: {
    variant: "p",
    size: "xl",
    children: "Extra large text size",
  },
};

// ============================================================================
// Typography Scale - All Variants Together
// ============================================================================

export const TypographyScale: Story = {
  render: () => (
    <div className="flex max-w-2xl flex-col gap-6">
      <Typography variant="h1">Heading 1 - The Quick Brown Fox</Typography>
      <Typography variant="h2">Heading 2 - The Quick Brown Fox</Typography>
      <Typography variant="h3">Heading 3 - The Quick Brown Fox</Typography>
      <Typography variant="h4">Heading 4 - The Quick Brown Fox</Typography>
      <Typography variant="lead">
        Lead text - A larger, slightly muted paragraph used for introductions.
      </Typography>
      <Typography variant="p">
        Paragraph - Regular body text with comfortable line height for extended reading. This is the
        default variant and works well for most content.
      </Typography>
      <Typography variant="large">Large text - Emphasized text that stands out.</Typography>
      <Typography variant="small">Small text - Reduced size for captions and metadata.</Typography>
      <Typography variant="muted">
        Muted text - De-emphasized content for secondary information.
      </Typography>
      <Typography variant="blockquote">
        Blockquote - Cited or referenced content with distinctive styling.
      </Typography>
      <Typography variant="p">
        Inline code example: <Typography variant="inlineCode">npm install</Typography> runs package
        installation.
      </Typography>
    </div>
  ),
  parameters: {
    layout: "padded",
    docs: {
      description: {
        story: "Complete typography scale showing all text variants from h1 to muted.",
      },
    },
  },
};

// ============================================================================
// All Colors Grid
// ============================================================================

export const AllColors: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Typography color="default">Default - Primary text color</Typography>
      <Typography color="secondary">Secondary - Subdued text</Typography>
      <Typography color="tertiary">Tertiary - Most subtle text</Typography>
      <Typography color="brand">Brand - Brand color</Typography>
      <Typography color="error">Error - Indicates errors</Typography>
      <Typography color="success">Success - Indicates success</Typography>
      <Typography color="warning">Warning - Indicates caution</Typography>
      <Typography color="info">Info - Informational content</Typography>
      <Typography color="accent">Accent - Accent highlights</Typography>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "All available color options for text.",
      },
    },
  },
};

// ============================================================================
// All Sizes Grid
// ============================================================================

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Typography variant="caption">Caption (xs) - 12px</Typography>
      <Typography variant="small">Small (sm) - 14px</Typography>
      <Typography variant="p">Paragraph (base) - 16px</Typography>
      <Typography variant="large">Large - 18px</Typography>
      <Typography variant="lead">Lead (xl) - 20px</Typography>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Text sizes are controlled through variants.",
      },
    },
  },
};

// ============================================================================
// Headings with Colors
// ============================================================================

export const HeadingsWithColors: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Typography variant="h2" color="default">
        Default Heading
      </Typography>
      <Typography variant="h2" color="brand">
        Brand Heading
      </Typography>
      <Typography variant="h2" color="secondary">
        Secondary Heading
      </Typography>
      <Typography variant="h2" color="success">
        Success Heading
      </Typography>
      <Typography variant="h2" color="error">
        Error Heading
      </Typography>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Headings can be combined with color variants for emphasis.",
      },
    },
  },
};

// ============================================================================
// Custom Element Override
// ============================================================================

export const CustomElement: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Typography variant="h1" as="span">
        H1 styled as span
      </Typography>
      <Typography variant="p" as="div">
        Paragraph styled as div
      </Typography>
      <Typography variant="muted" as="label">
        Muted styled as label
      </Typography>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Use the 'as' prop to override the default HTML element while keeping the visual styling.",
      },
    },
  },
};

// ============================================================================
// Usage Examples
// ============================================================================

export const ArticleExample: Story = {
  render: () => (
    <article className="flex max-w-2xl flex-col gap-4">
      <Typography variant="h1">Getting Started with Nixelo</Typography>
      <Typography variant="lead">
        A comprehensive guide to setting up your first project and understanding the core concepts.
      </Typography>
      <Typography variant="h2">Installation</Typography>
      <Typography variant="p">
        To get started, you will need to install the necessary dependencies. Run the following
        command in your terminal:
      </Typography>
      <Typography variant="inlineCode">pnpm install nixelo</Typography>
      <Typography variant="h2">Configuration</Typography>
      <Typography variant="p">
        After installation, create a configuration file in your project root. This file will contain
        all the settings needed to connect to your workspace.
      </Typography>
      <Typography variant="blockquote">
        Pro tip: Keep your API keys secure by using environment variables instead of hardcoding them
        in your configuration.
      </Typography>
      <Typography variant="h3">Required Settings</Typography>
      <Typography variant="list">
        <li>Workspace ID - Found in your dashboard</li>
        <li>API Key - Generate from settings</li>
        <li>Environment - Development or production</li>
      </Typography>
      <Typography variant="muted">Last updated: January 2026</Typography>
    </article>
  ),
  parameters: {
    layout: "padded",
    docs: {
      description: {
        story: "Example of typography variants used together in an article layout.",
      },
    },
  },
};

export const StatusMessages: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Typography color="success">Your changes have been saved successfully.</Typography>
      <Typography color="error">Unable to connect to the server. Please try again.</Typography>
      <Typography color="warning">Your session will expire in 5 minutes.</Typography>
      <Typography color="info">A new version is available. Refresh to update.</Typography>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Using color variants for status messages and notifications.",
      },
    },
  },
};

export const FormLabels: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Typography variant="small" as="label">
          Email Address
        </Typography>
        <Typography variant="muted">We will never share your email with anyone.</Typography>
      </div>
      <div className="flex flex-col gap-1">
        <Typography variant="small" as="label">
          Password
        </Typography>
        <Typography variant="muted">Must be at least 8 characters long.</Typography>
      </div>
      <div className="flex flex-col gap-1">
        <Typography variant="small" color="error" as="label">
          Username (required)
        </Typography>
        <Typography variant="muted" color="error">
          This field is required.
        </Typography>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Typography used for form labels and helper text.",
      },
    },
  },
};
