import type { Meta, StoryObj } from "@storybook/react";
import { Calendar, Lightbulb, Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { SegmentedControl, SegmentedControlItem } from "./SegmentedControl";

const meta: Meta<typeof SegmentedControl> = {
  title: "UI/SegmentedControl",
  component: SegmentedControl,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof SegmentedControl>;

export const Default: Story = {
  render: () => (
    <SegmentedControl defaultValue="calendar">
      <SegmentedControlItem value="calendar">Calendar</SegmentedControlItem>
      <SegmentedControlItem value="roadmap">Roadmap</SegmentedControlItem>
    </SegmentedControl>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <SegmentedControl defaultValue="insights">
      <SegmentedControlItem value="all">All</SegmentedControlItem>
      <SegmentedControlItem value="insights" className="gap-2">
        <Lightbulb className="h-4 w-4" />
        Insights
      </SegmentedControlItem>
      <SegmentedControlItem value="planning" className="gap-2">
        <Calendar className="h-4 w-4" />
        Planning
      </SegmentedControlItem>
    </SegmentedControl>
  ),
};

export const Compact: Story = {
  render: () => (
    <SegmentedControl defaultValue="light" size="sm">
      <SegmentedControlItem value="light" className="gap-2">
        <Sun className="h-4 w-4" />
        Light
      </SegmentedControlItem>
      <SegmentedControlItem value="dark" className="gap-2">
        <Moon className="h-4 w-4" />
        Dark
      </SegmentedControlItem>
      <SegmentedControlItem value="system" className="gap-2">
        <Monitor className="h-4 w-4" />
        System
      </SegmentedControlItem>
    </SegmentedControl>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState("calendar");

    return (
      <div className="w-[28rem] space-y-4">
        <SegmentedControl value={value} onValueChange={(next: string) => next && setValue(next)}>
          <SegmentedControlItem value="calendar">Calendar</SegmentedControlItem>
          <SegmentedControlItem value="roadmap">Roadmap</SegmentedControlItem>
          <SegmentedControlItem value="timeline">Timeline</SegmentedControlItem>
        </SegmentedControl>
        <p className="text-sm text-ui-text-secondary">Selected view: {value}</p>
      </div>
    );
  },
};
