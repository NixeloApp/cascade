import { EDITOR_TEXT_COLOR_OPTIONS } from "@convex/shared/colors";
import type { Meta, StoryObj } from "@storybook/react";
import { Palette, Settings } from "lucide-react";
import { useState } from "react";
import { Button } from "./Button";
import { ColorSwatchButton } from "./ColorSwatchButton";
import { Flex } from "./Flex";
import { Icon } from "./Icon";
import { Input } from "./Input";
import { Popover } from "./Popover";
import { Stack } from "./Stack";
import { Typography } from "./Typography";

const meta: Meta<typeof Popover> = {
  title: "UI/Popover",
  component: Popover,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <Popover
      className="w-80"
      trigger={<Button variant="outline">Open Popover</Button>}
      header={
        <Stack gap="xs">
          <Typography variant="label">Dimensions</Typography>
          <Typography variant="small" color="secondary">
            Adjust the workspace canvas bounds.
          </Typography>
        </Stack>
      }
      footer={<Button size="sm">Save</Button>}
    >
      <Stack gap="md">
        <Input defaultValue="100%" aria-label="Width" />
        <Input defaultValue="300px" aria-label="Max width" />
      </Stack>
    </Popover>
  ),
};

export const TooltipTrigger: Story = {
  render: () => (
    <Popover
      recipe="notificationMenu"
      tooltip={{ content: "Quick settings" }}
      trigger={
        <Button variant="ghost" size="icon" aria-label="Open quick settings">
          <Icon icon={Settings} size="sm" />
        </Button>
      }
    >
      <Stack gap="xs">
        <Typography variant="label">Quick settings</Typography>
        <Typography variant="small" color="secondary">
          This trigger uses the wrapper-managed tooltip support.
        </Typography>
      </Stack>
    </Popover>
  ),
};

export const ColorPicker: Story = {
  render: () => {
    const swatches = [
      EDITOR_TEXT_COLOR_OPTIONS[1]?.value ?? "",
      EDITOR_TEXT_COLOR_OPTIONS[2]?.value ?? "",
      EDITOR_TEXT_COLOR_OPTIONS[3]?.value ?? "",
      EDITOR_TEXT_COLOR_OPTIONS[4]?.value ?? "",
      EDITOR_TEXT_COLOR_OPTIONS[5]?.value ?? "",
      "",
    ];
    const [selected, setSelected] = useState(swatches[3] ?? "");

    return (
      <Popover
        align="start"
        recipe="colorPicker"
        side="top"
        sideOffset={8}
        trigger={
          <Button variant="outline">
            <Icon icon={Palette} size="sm" />
            Pick Color
          </Button>
        }
      >
        <Flex gap="xs" wrap>
          {swatches.map((color) => (
            <ColorSwatchButton
              key={color || "empty"}
              color={color}
              empty={!color}
              selected={selected === color}
              onClick={() => setSelected(color)}
              title={color || "Clear color"}
            />
          ))}
        </Flex>
      </Popover>
    );
  },
};

export const AnchoredOverlay: Story = {
  render: () => {
    const [open, setOpen] = useState(true);

    return (
      <div className="relative h-48 w-96 rounded-xl border border-dashed border-ui-border bg-ui-bg-secondary/60">
        <div className="absolute left-1/2 top-16 h-0 w-0 -translate-x-1/2">
          <Popover
            anchor={<div className="h-px w-px" />}
            className="w-auto"
            open={open}
            onOpenChange={setOpen}
            recipe="floatingToolbar"
            side="top"
            sideOffset={8}
          >
            {({ close }) => (
              <>
                <Button size="sm" variant="secondary">
                  Bold
                </Button>
                <Button size="sm" variant="secondary">
                  Link
                </Button>
                <Button size="sm" variant="ghost" onClick={close}>
                  Close
                </Button>
              </>
            )}
          </Popover>
        </div>
        <Typography className="p-6" color="secondary">
          Anchored overlays can render without a visible trigger by passing an explicit anchor node.
        </Typography>
      </div>
    );
  },
};
