import type { Meta, StoryObj } from "@storybook/react";
import { Calendar, Kanban, Settings } from "lucide-react";
import { RouteNav, RouteNavItem } from "./RouteNav";

const meta: Meta<typeof RouteNav> = {
  title: "UI/RouteNav",
  component: RouteNav,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof RouteNav>;

export const Underline: Story = {
  render: () => (
    <div className="w-[36rem]">
      <RouteNav>
        <RouteNavItem active>Teams</RouteNavItem>
        <RouteNavItem>Backlog</RouteNavItem>
        <RouteNavItem>Calendar</RouteNavItem>
        <RouteNavItem>Settings</RouteNavItem>
      </RouteNav>
    </div>
  ),
};

export const Pill: Story = {
  render: () => (
    <RouteNav variant="pill">
      <RouteNavItem active className="gap-2">
        <Kanban className="h-4 w-4" />
        Board
      </RouteNavItem>
      <RouteNavItem className="gap-2">
        <Calendar className="h-4 w-4" />
        Calendar
      </RouteNavItem>
      <RouteNavItem className="gap-2">
        <Settings className="h-4 w-4" />
        Settings
      </RouteNavItem>
    </RouteNav>
  ),
};

export const CompactPill: Story = {
  render: () => (
    <RouteNav variant="pill" size="sm">
      <RouteNavItem active>Board</RouteNavItem>
      <RouteNavItem>Backlog</RouteNavItem>
      <RouteNavItem>Roadmap</RouteNavItem>
      <RouteNavItem>Calendar</RouteNavItem>
    </RouteNav>
  ),
};
