import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Card, CardBody } from "./Card";
import { ColorPicker } from "./ColorPicker";
import { Flex } from "./Flex";
import { Typography } from "./Typography";

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof ColorPicker> = {
  title: "Components/UI/ColorPicker",
  component: ColorPicker,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A color picker component with preset color swatches and a custom color input. Presets are aligned with theme tokens.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-80 p-4 bg-ui-bg border border-ui-border rounded-lg">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Stories
// =============================================================================

export const Default: Story = {
  args: {
    value: "#3B82F6",
    onChange: (color: string) => console.log("Selected color:", color),
  },
  parameters: {
    docs: {
      description: {
        story: "Default color picker with preset colors.",
      },
    },
  },
};

export const WithSelectedColor: Story = {
  args: {
    value: "#10B981",
    onChange: (color: string) => console.log("Selected color:", color),
  },
  parameters: {
    docs: {
      description: {
        story: "Color picker with a preset color selected.",
      },
    },
  },
};

export const CustomLabel: Story = {
  args: {
    value: "#EF4444",
    onChange: (color: string) => console.log("Selected color:", color),
    label: "Project Color",
  },
  parameters: {
    docs: {
      description: {
        story: "Color picker with a custom label.",
      },
    },
  },
};

export const CustomPresets: Story = {
  args: {
    value: "#FF6B6B",
    onChange: (color: string) => console.log("Selected color:", color),
    label: "Brand Colors",
    presetColors: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD"],
  },
  parameters: {
    docs: {
      description: {
        story: "Color picker with custom preset colors.",
      },
    },
  },
};

export const MinimalPresets: Story = {
  args: {
    value: "#000000",
    onChange: (color: string) => console.log("Selected color:", color),
    label: "Basic Colors",
    presetColors: ["#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF"],
  },
  parameters: {
    docs: {
      description: {
        story: "Color picker with minimal preset options.",
      },
    },
  },
};

export const Interactive: Story = {
  render: () => {
    const [color, setColor] = useState("#3B82F6");

    return (
      <div className="space-y-4">
        <ColorPicker value={color} onChange={setColor} label="Choose a Color" />
        <Flex align="center" gap="sm" className="pt-4 border-t border-ui-border">
          <div
            className="w-8 h-8 rounded border border-ui-border"
            style={{ backgroundColor: color }}
          />
          <Typography variant="small" className="font-mono">
            {color}
          </Typography>
        </Flex>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive demo - click colors to select them.",
      },
    },
  },
};

export const InForm: Story = {
  render: () => {
    const [color, setColor] = useState("#8B5CF6");

    return (
      <Card>
        <CardBody className="space-y-4">
          <Typography variant="h3">Create Project</Typography>
          <div>
            <Typography variant="small" className="font-medium mb-1">
              Project Name
            </Typography>
            <input
              type="text"
              placeholder="My Project"
              className="w-full px-3 py-2 border border-ui-border rounded-lg bg-ui-bg"
            />
          </div>
          <ColorPicker value={color} onChange={setColor} label="Project Color" />
          <Flex align="center" gap="sm" className="pt-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
            <Typography variant="small" color="secondary">
              Preview of project identifier
            </Typography>
          </Flex>
        </CardBody>
      </Card>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Color picker used within a form context.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export const AllDefaultColors: Story = {
  render: () => {
    const defaultColors = [
      { color: "#EF4444", name: "Error/Red" },
      { color: "#F59E0B", name: "Warning/Amber" },
      { color: "#10B981", name: "Success/Green" },
      { color: "#3B82F6", name: "Info/Blue" },
      { color: "#8B5CF6", name: "Story/Violet" },
      { color: "#EC4899", name: "Accent/Pink" },
      { color: "#6B7280", name: "Secondary/Gray" },
      { color: "#14B8A6", name: "Teal" },
    ];

    return (
      <div className="space-y-3">
        <Typography variant="label">Default Preset Colors</Typography>
        <Flex wrap gap="md">
          {defaultColors.map(({ color, name }) => (
            <Flex key={color} direction="column" align="center" gap="xs">
              <div
                className="w-10 h-10 rounded-full border border-ui-border"
                style={{ backgroundColor: color }}
              />
              <Typography variant="caption" className="text-center">
                {name}
              </Typography>
              <Typography variant="caption" color="tertiary" className="font-mono text-xs">
                {color}
              </Typography>
            </Flex>
          ))}
        </Flex>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Overview of all default preset colors with their names.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-lg p-4 bg-ui-bg border border-ui-border rounded-lg">
        <Story />
      </div>
    ),
  ],
};
