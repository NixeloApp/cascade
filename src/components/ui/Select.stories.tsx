import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Avatar } from "./Avatar";
import { Badge } from "./Badge";
import { Flex, FlexItem } from "./Flex";
import { Select, type SelectOptionGroup } from "./Select";
import { Typography } from "./Typography";

const FRUIT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "orange", label: "Orange" },
  { value: "grape", label: "Grape" },
];

const meta: Meta<typeof Select> = {
  title: "UI/Select",
  component: Select,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    disabled: {
      control: "boolean",
    },
    placeholder: {
      control: "text",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => <Select className="w-48" options={FRUIT_OPTIONS} placeholder="Select a fruit" />,
};

export const WithDefaultValue: Story = {
  render: () => (
    <Select
      className="w-48"
      defaultValue="banana"
      options={FRUIT_OPTIONS}
      placeholder="Select a fruit"
    />
  ),
};

export const DisabledOption: Story = {
  render: () => (
    <Select
      className="w-56"
      options={[
        { value: "free", label: "Free plan" },
        { value: "starter", label: "Starter plan" },
        { value: "pro", label: "Pro plan" },
        { disabled: true, value: "enterprise", label: "Enterprise (Coming soon)" },
      ]}
      placeholder="Select a plan"
    />
  ),
};

export const Grouped: Story = {
  render: () => (
    <Select
      className="w-64"
      groups={
        [
          {
            label: "Fruits",
            options: [
              { value: "apple", label: "Apple" },
              { value: "banana", label: "Banana" },
              { value: "cherry", label: "Cherry" },
            ],
          },
          {
            label: "Vegetables",
            options: [
              { value: "carrot", label: "Carrot" },
              { value: "broccoli", label: "Broccoli" },
              { value: "spinach", label: "Spinach" },
            ],
          },
        ] satisfies SelectOptionGroup<string>[]
      }
      placeholder="Select a food"
    />
  ),
};

type AssigneeOption = {
  avatarName: string;
  label: string;
  status?: "OOO" | "Lead";
  value: string;
};

const ASSIGNEE_OPTIONS: AssigneeOption[] = [
  { avatarName: "Alex", label: "Alex Morgan", status: "Lead", value: "alex" },
  { avatarName: "Priya", label: "Priya Shah", value: "priya" },
  { avatarName: "Noah", label: "Noah Kim", status: "OOO", value: "noah" },
];

export const CustomRendering: Story = {
  render: () => (
    <Select
      className="w-64"
      options={ASSIGNEE_OPTIONS}
      placeholder="Assign owner"
      renderOption={(option) => (
        <Flex align="center" gap="sm">
          <Avatar name={option.avatarName} size="xs" />
          <FlexItem flex="1">
            <Typography variant="small">{option.label}</Typography>
          </FlexItem>
          {option.status ? <Badge size="sm">{option.status}</Badge> : null}
        </Flex>
      )}
      renderValue={(option) => (
        <Flex align="center" gap="sm">
          <Avatar name={option.avatarName} size="xs" />
          <Typography variant="small">{option.label}</Typography>
        </Flex>
      )}
    />
  ),
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState("weeks");

    return (
      <Flex direction="column" gap="sm">
        <Select
          className="w-48"
          onChange={setValue}
          options={[
            { value: "days", label: "Days" },
            { value: "weeks", label: "Weeks" },
            { value: "months", label: "Months" },
          ]}
          value={value}
        />
        <Typography variant="caption" color="secondary">
          Selected: {value}
        </Typography>
      </Flex>
    );
  },
};
