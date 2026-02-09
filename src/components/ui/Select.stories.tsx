import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Label } from "./Label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./Select";

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
      description: "Whether the select is disabled",
    },
    defaultValue: {
      control: "text",
      description: "The default selected value (uncontrolled)",
    },
    value: {
      control: "text",
      description: "The selected value (controlled)",
    },
    open: {
      control: "boolean",
      description: "Whether the select menu is open (controlled)",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Basic Select Stories
// ============================================================================

export const Basic: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="cherry">Cherry</SelectItem>
        <SelectItem value="orange">Orange</SelectItem>
        <SelectItem value="grape">Grape</SelectItem>
      </SelectContent>
    </Select>
  ),
  parameters: {
    docs: {
      description: {
        story: "A basic select dropdown with simple options.",
      },
    },
  },
};

export const WithDefaultValue: Story = {
  render: () => (
    <Select defaultValue="banana">
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="cherry">Cherry</SelectItem>
        <SelectItem value="orange">Orange</SelectItem>
        <SelectItem value="grape">Grape</SelectItem>
      </SelectContent>
    </Select>
  ),
  parameters: {
    docs: {
      description: {
        story: "Select with a pre-selected default value.",
      },
    },
  },
};

export const WithPlaceholder: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Choose your favorite color..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="red">Red</SelectItem>
        <SelectItem value="green">Green</SelectItem>
        <SelectItem value="blue">Blue</SelectItem>
        <SelectItem value="yellow">Yellow</SelectItem>
        <SelectItem value="purple">Purple</SelectItem>
      </SelectContent>
    </Select>
  ),
  parameters: {
    docs: {
      description: {
        story: "Select with a descriptive placeholder text.",
      },
    },
  },
};

// ============================================================================
// State Stories
// ============================================================================

export const Disabled: Story = {
  render: () => (
    <Select disabled>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="cherry">Cherry</SelectItem>
      </SelectContent>
    </Select>
  ),
  parameters: {
    docs: {
      description: {
        story: "A disabled select that cannot be interacted with.",
      },
    },
  },
};

export const DisabledWithValue: Story = {
  render: () => (
    <Select disabled defaultValue="cherry">
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="cherry">Cherry</SelectItem>
      </SelectContent>
    </Select>
  ),
  parameters: {
    docs: {
      description: {
        story: "A disabled select with a pre-selected value.",
      },
    },
  },
};

export const WithDisabledOptions: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Select a plan" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="free">Free Plan</SelectItem>
        <SelectItem value="starter">Starter Plan</SelectItem>
        <SelectItem value="pro">Pro Plan</SelectItem>
        <SelectItem value="enterprise" disabled>
          Enterprise (Coming Soon)
        </SelectItem>
      </SelectContent>
    </Select>
  ),
  parameters: {
    docs: {
      description: {
        story: "Select with some options disabled while others remain selectable.",
      },
    },
  },
};

// ============================================================================
// Grouped Select Stories
// ============================================================================

export const WithGroups: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Select a food" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="cherry">Cherry</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Vegetables</SelectLabel>
          <SelectItem value="carrot">Carrot</SelectItem>
          <SelectItem value="broccoli">Broccoli</SelectItem>
          <SelectItem value="spinach">Spinach</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
  parameters: {
    docs: {
      description: {
        story: "Select with options organized into labeled groups separated by dividers.",
      },
    },
  },
};

export const MultipleGroups: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Select a timezone" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>North America</SelectLabel>
          <SelectItem value="pst">Pacific Time (PST)</SelectItem>
          <SelectItem value="mst">Mountain Time (MST)</SelectItem>
          <SelectItem value="cst">Central Time (CST)</SelectItem>
          <SelectItem value="est">Eastern Time (EST)</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Europe</SelectLabel>
          <SelectItem value="gmt">Greenwich Mean Time (GMT)</SelectItem>
          <SelectItem value="cet">Central European Time (CET)</SelectItem>
          <SelectItem value="eet">Eastern European Time (EET)</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Asia</SelectLabel>
          <SelectItem value="ist">India Standard Time (IST)</SelectItem>
          <SelectItem value="jst">Japan Standard Time (JST)</SelectItem>
          <SelectItem value="cst-china">China Standard Time (CST)</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
  parameters: {
    docs: {
      description: {
        story: "Select with multiple groups for organizing a large number of options.",
      },
    },
  },
};

export const GroupsWithDisabledOptions: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Select a role" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Standard Roles</SelectLabel>
          <SelectItem value="viewer">Viewer</SelectItem>
          <SelectItem value="editor">Editor</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Premium Roles</SelectLabel>
          <SelectItem value="super-admin" disabled>
            Super Admin (Premium)
          </SelectItem>
          <SelectItem value="owner" disabled>
            Owner (Premium)
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
  parameters: {
    docs: {
      description: {
        story: "Grouped select where some groups contain disabled options.",
      },
    },
  },
};

// ============================================================================
// Controlled Select Stories
// ============================================================================

function ControlledSelectExample() {
  const [value, setValue] = useState("medium");

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-ui-text-secondary">Selected: {value || "none"}</p>
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select size" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="small">Small</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="large">Large</SelectItem>
          <SelectItem value="xlarge">Extra Large</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledSelectExample />,
  parameters: {
    docs: {
      description: {
        story: "A controlled select where the value is managed by React state.",
      },
    },
  },
};

// ============================================================================
// Form Integration Stories
// ============================================================================

export const FormExample: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-64">
      <Label htmlFor="country-select">Country</Label>
      <Select>
        <SelectTrigger id="country-select">
          <SelectValue placeholder="Select your country" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="us">United States</SelectItem>
          <SelectItem value="uk">United Kingdom</SelectItem>
          <SelectItem value="ca">Canada</SelectItem>
          <SelectItem value="au">Australia</SelectItem>
          <SelectItem value="de">Germany</SelectItem>
          <SelectItem value="fr">France</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Select used within a form with an associated label.",
      },
    },
  },
};

export const FormExampleRequired: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-64">
      <Label htmlFor="priority-select">
        Priority <span className="text-status-error">*</span>
      </Label>
      <Select required>
        <SelectTrigger id="priority-select">
          <SelectValue placeholder="Select priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="urgent">Urgent</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-sm text-ui-text-secondary">This field is required.</p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Required select field in a form context with helper text.",
      },
    },
  },
};

export const FormWithMultipleSelects: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-72">
      <div className="flex flex-col gap-2">
        <Label htmlFor="project-select">Project</Label>
        <Select>
          <SelectTrigger id="project-select">
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="web">Web Application</SelectItem>
            <SelectItem value="mobile">Mobile App</SelectItem>
            <SelectItem value="api">API Service</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="assignee-select">Assignee</Label>
        <Select>
          <SelectTrigger id="assignee-select">
            <SelectValue placeholder="Assign to someone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="john">John Doe</SelectItem>
            <SelectItem value="jane">Jane Smith</SelectItem>
            <SelectItem value="bob">Bob Johnson</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="status-select">Status</Label>
        <Select defaultValue="todo">
          <SelectTrigger id="status-select">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="review">In Review</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Multiple selects used together in a form.",
      },
    },
  },
};

// ============================================================================
// Width Variations
// ============================================================================

export const WidthVariations: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label>Small width (w-32)</Label>
        <Select>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
            <SelectItem value="b">Option B</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <Label>Medium width (w-48)</Label>
        <Select>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
            <SelectItem value="b">Option B</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <Label>Large width (w-64)</Label>
        <Select>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select your preferred option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
            <SelectItem value="b">Option B</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <Label>Full width</Label>
        <Select>
          <SelectTrigger className="w-full max-w-sm">
            <SelectValue placeholder="Select your preferred option from the list" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
            <SelectItem value="b">Option B</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Select triggers can be sized using Tailwind width utilities.",
      },
    },
  },
};

// ============================================================================
// Real-world Examples
// ============================================================================

export const LanguageSelector: Story = {
  render: () => (
    <Select defaultValue="en">
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Select language" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="es">Espanol</SelectItem>
        <SelectItem value="fr">Francais</SelectItem>
        <SelectItem value="de">Deutsch</SelectItem>
        <SelectItem value="pt">Portugues</SelectItem>
        <SelectItem value="ja">Japanese</SelectItem>
        <SelectItem value="zh">Chinese</SelectItem>
      </SelectContent>
    </Select>
  ),
  parameters: {
    docs: {
      description: {
        story: "A language selector dropdown commonly used in application headers.",
      },
    },
  },
};

export const IssueTypeSelector: Story = {
  render: () => (
    <Select defaultValue="task">
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Select issue type" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Standard</SelectLabel>
          <SelectItem value="task">Task</SelectItem>
          <SelectItem value="bug">Bug</SelectItem>
          <SelectItem value="story">Story</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Sub-items</SelectLabel>
          <SelectItem value="subtask">Sub-task</SelectItem>
          <SelectItem value="sub-bug">Sub-bug</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Epic</SelectLabel>
          <SelectItem value="epic">Epic</SelectItem>
          <SelectItem value="initiative">Initiative</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
  parameters: {
    docs: {
      description: {
        story: "Issue type selector commonly used in project management applications.",
      },
    },
  },
};

export const FontSizeSelector: Story = {
  render: () => (
    <Select defaultValue="16">
      <SelectTrigger className="w-36">
        <SelectValue placeholder="Font size" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="12">12px</SelectItem>
        <SelectItem value="14">14px</SelectItem>
        <SelectItem value="16">16px</SelectItem>
        <SelectItem value="18">18px</SelectItem>
        <SelectItem value="20">20px</SelectItem>
        <SelectItem value="24">24px</SelectItem>
        <SelectItem value="32">32px</SelectItem>
      </SelectContent>
    </Select>
  ),
  parameters: {
    docs: {
      description: {
        story: "Font size selector typically found in text editors and settings.",
      },
    },
  },
};

// ============================================================================
// Long Options List
// ============================================================================

export const LongOptionsList: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Select a month" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="01">January</SelectItem>
        <SelectItem value="02">February</SelectItem>
        <SelectItem value="03">March</SelectItem>
        <SelectItem value="04">April</SelectItem>
        <SelectItem value="05">May</SelectItem>
        <SelectItem value="06">June</SelectItem>
        <SelectItem value="07">July</SelectItem>
        <SelectItem value="08">August</SelectItem>
        <SelectItem value="09">September</SelectItem>
        <SelectItem value="10">October</SelectItem>
        <SelectItem value="11">November</SelectItem>
        <SelectItem value="12">December</SelectItem>
      </SelectContent>
    </Select>
  ),
  parameters: {
    docs: {
      description: {
        story: "Select with a long list of options that may require scrolling.",
      },
    },
  },
};
