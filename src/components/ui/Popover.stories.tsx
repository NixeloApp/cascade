import type { Meta, StoryObj } from "@storybook/react";
import {
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Palette,
  Settings,
  Sliders,
  User,
} from "lucide-react";
import { useState } from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";

const meta: Meta<typeof Popover> = {
  title: "UI/Popover",
  component: Popover,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    open: {
      control: "boolean",
      description: "Controls whether the popover is open",
    },
    defaultOpen: {
      control: "boolean",
      description: "The default open state when uncontrolled",
    },
    modal: {
      control: "boolean",
      description: "Whether the popover blocks interaction with the rest of the page",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Basic Popover Stories
// ============================================================================

export const Basic: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Dimensions</h4>
            <p className="text-sm text-ui-text-secondary">Set the dimensions for the layer.</p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <label htmlFor="width" className="text-sm">
                Width
              </label>
              <Input id="width" defaultValue="100%" className="col-span-2 h-8" />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <label htmlFor="maxWidth" className="text-sm">
                Max. width
              </label>
              <Input id="maxWidth" defaultValue="300px" className="col-span-2 h-8" />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
  parameters: {
    docs: {
      description: {
        story: "A basic popover with a trigger button and content containing form fields.",
      },
    },
  },
};

export const SimpleText: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary">Info</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <p className="text-sm text-ui-text">
          This is a simple popover with text content. Popovers can contain any content and are great
          for showing additional information on demand.
        </p>
      </PopoverContent>
    </Popover>
  ),
  parameters: {
    docs: {
      description: {
        story: "A simple popover with just text content.",
      },
    },
  },
};

// ============================================================================
// Position Stories
// ============================================================================

export const Top: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Top</Button>
      </PopoverTrigger>
      <PopoverContent side="top">
        <p className="text-sm">This popover appears above the trigger.</p>
      </PopoverContent>
    </Popover>
  ),
  parameters: {
    docs: {
      description: {
        story: "Popover positioned above the trigger element.",
      },
    },
  },
};

export const Bottom: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Bottom</Button>
      </PopoverTrigger>
      <PopoverContent side="bottom">
        <p className="text-sm">This popover appears below the trigger.</p>
      </PopoverContent>
    </Popover>
  ),
  parameters: {
    docs: {
      description: {
        story: "Popover positioned below the trigger element.",
      },
    },
  },
};

export const Left: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Left</Button>
      </PopoverTrigger>
      <PopoverContent side="left">
        <p className="text-sm">This popover appears to the left.</p>
      </PopoverContent>
    </Popover>
  ),
  parameters: {
    docs: {
      description: {
        story: "Popover positioned to the left of the trigger element.",
      },
    },
  },
};

export const Right: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Right</Button>
      </PopoverTrigger>
      <PopoverContent side="right">
        <p className="text-sm">This popover appears to the right.</p>
      </PopoverContent>
    </Popover>
  ),
  parameters: {
    docs: {
      description: {
        story: "Popover positioned to the right of the trigger element.",
      },
    },
  },
};

export const AllPositions: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-8 p-8">
      <div />
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full">
            Top
          </Button>
        </PopoverTrigger>
        <PopoverContent side="top">
          <p className="text-sm">Top position</p>
        </PopoverContent>
      </Popover>
      <div />
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full">
            Left
          </Button>
        </PopoverTrigger>
        <PopoverContent side="left">
          <p className="text-sm">Left position</p>
        </PopoverContent>
      </Popover>
      <div />
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full">
            Right
          </Button>
        </PopoverTrigger>
        <PopoverContent side="right">
          <p className="text-sm">Right position</p>
        </PopoverContent>
      </Popover>
      <div />
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full">
            Bottom
          </Button>
        </PopoverTrigger>
        <PopoverContent side="bottom">
          <p className="text-sm">Bottom position</p>
        </PopoverContent>
      </Popover>
      <div />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "All four popover positions demonstrated in a grid layout.",
      },
    },
  },
};

// ============================================================================
// Alignment Stories
// ============================================================================

export const AlignStart: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Align Start</Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <p className="text-sm">This popover is aligned to the start.</p>
      </PopoverContent>
    </Popover>
  ),
  parameters: {
    docs: {
      description: {
        story: "Popover aligned to the start of the trigger.",
      },
    },
  },
};

export const AlignCenter: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Align Center</Button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-64">
        <p className="text-sm">This popover is aligned to the center.</p>
      </PopoverContent>
    </Popover>
  ),
  parameters: {
    docs: {
      description: {
        story: "Popover aligned to the center of the trigger (default).",
      },
    },
  },
};

export const AlignEnd: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Align End</Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <p className="text-sm">This popover is aligned to the end.</p>
      </PopoverContent>
    </Popover>
  ),
  parameters: {
    docs: {
      description: {
        story: "Popover aligned to the end of the trigger.",
      },
    },
  },
};

// ============================================================================
// Form Content Stories
// ============================================================================

export const WithFormContent: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" leftIcon={<User className="h-4 w-4" />}>
          Edit Profile
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Profile</h4>
            <p className="text-sm text-ui-text-secondary">Update your profile information.</p>
          </div>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <Input id="name" defaultValue="John Doe" />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input id="email" type="email" defaultValue="john@example.com" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm">
              Cancel
            </Button>
            <Button size="sm">Save</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
  parameters: {
    docs: {
      description: {
        story: "A popover containing a form with input fields and action buttons.",
      },
    },
  },
};

export const SettingsPanel: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Settings">
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Quick Settings</h4>
            <p className="text-sm text-ui-text-secondary">Adjust your preferences.</p>
          </div>
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Notifications</p>
                <p className="text-xs text-ui-text-secondary">Receive push notifications</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Auto-save</p>
                <p className="text-xs text-ui-text-secondary">Save changes automatically</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Compact view</p>
                <p className="text-xs text-ui-text-secondary">Show more items per page</p>
              </div>
              <input type="checkbox" className="h-4 w-4" />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
  parameters: {
    docs: {
      description: {
        story: "A settings panel popover with toggle options, commonly used in app headers.",
      },
    },
  },
};

// ============================================================================
// Date Picker Trigger Stories
// ============================================================================

export const DatePickerTrigger: Story = {
  render: () => {
    const [date, setDate] = useState<string>("2024-01-15");

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" leftIcon={<Calendar className="h-4 w-4" />}>
            {date ? new Date(date).toLocaleDateString() : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Select Date</h4>
              </div>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDate(new Date().toISOString().split("T")[0])}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    setDate(tomorrow.toISOString().split("T")[0]);
                  }}
                >
                  Tomorrow
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "A date picker trigger pattern showing how to use a popover for date selection.",
      },
    },
  },
};

export const TimePickerTrigger: Story = {
  render: () => {
    const [time, setTime] = useState<string>("09:00");

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" leftIcon={<Clock className="h-4 w-4" />}>
            {time || "Select time"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48" align="start">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Time</h4>
            </div>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => setTime("09:00")}>
                9:00 AM
              </Button>
              <Button variant="outline" size="sm" onClick={() => setTime("12:00")}>
                12:00 PM
              </Button>
              <Button variant="outline" size="sm" onClick={() => setTime("17:00")}>
                5:00 PM
              </Button>
              <Button variant="outline" size="sm" onClick={() => setTime("18:00")}>
                6:00 PM
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "A time picker pattern using a popover with quick selection buttons.",
      },
    },
  },
};

// ============================================================================
// Color Picker Stories
// ============================================================================

const COLORS = [
  { name: "Red", value: "var(--color-palette-red)" },
  { name: "Orange", value: "var(--color-palette-orange)" },
  { name: "Amber", value: "var(--color-palette-amber)" },
  { name: "Green", value: "var(--color-palette-green)" },
  { name: "Blue", value: "var(--color-palette-blue)" },
  { name: "Purple", value: "var(--color-palette-purple)" },
  { name: "Pink", value: "var(--color-palette-pink)" },
  { name: "Gray", value: "var(--color-palette-gray)" },
];

export const ColorPicker: Story = {
  render: () => {
    const [selectedColor, setSelectedColor] = useState(COLORS[4]);

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" leftIcon={<Palette className="h-4 w-4" />}>
            <span
              className="h-4 w-4 rounded-full border border-ui-border"
              style={{ backgroundColor: selectedColor.value }}
            />
            <span>{selectedColor.name}</span>
            <ChevronDown className="ml-auto h-4 w-4 text-ui-text-secondary" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Choose a color</h4>
              <p className="text-sm text-ui-text-secondary">Select a color for the label.</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className="group relative flex h-8 w-8 items-center justify-center rounded-full border border-ui-border transition-default hover:scale-110"
                  style={{ backgroundColor: color.value }}
                  aria-label={color.name}
                >
                  {selectedColor.value === color.value && <Check className="h-4 w-4 text-white" />}
                </button>
              ))}
            </div>
            <div className="grid gap-2">
              <label htmlFor="custom-color" className="text-sm font-medium">
                Custom color
              </label>
              <div className="flex gap-2">
                <Input
                  id="custom-color"
                  value={selectedColor.value}
                  onChange={(e) => setSelectedColor({ name: "Custom", value: e.target.value })}
                  className="flex-1"
                />
                <input
                  type="color"
                  value={selectedColor.value}
                  onChange={(e) => setSelectedColor({ name: "Custom", value: e.target.value })}
                  className="h-10 w-10 cursor-pointer rounded border border-ui-border"
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "A color picker popover with preset colors and custom color input.",
      },
    },
  },
};

// ============================================================================
// Filter Panel Stories
// ============================================================================

export const FilterPanel: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" leftIcon={<Sliders className="h-4 w-4" />}>
          Filters
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Filter Results</h4>
            <p className="text-sm text-ui-text-secondary">Narrow down your search results.</p>
          </div>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <select
                id="status"
                className="h-10 rounded-md border border-ui-border bg-ui-bg px-3 text-sm"
              >
                <option value="">All statuses</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="priority" className="text-sm font-medium">
                Priority
              </label>
              <select
                id="priority"
                className="h-10 rounded-md border border-ui-border bg-ui-bg px-3 text-sm"
              >
                <option value="">All priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="assignee" className="text-sm font-medium">
                Assignee
              </label>
              <Input id="assignee" placeholder="Search by name..." />
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" size="sm">
              Clear all
            </Button>
            <Button size="sm">Apply filters</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
  parameters: {
    docs: {
      description: {
        story: "A filter panel popover commonly used in list/table views.",
      },
    },
  },
};

// ============================================================================
// Controlled Popover Stories
// ============================================================================

function ControlledPopoverExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-ui-text-secondary">Popover is {open ? "open" : "closed"}</p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setOpen(true)}>
          Open via state
        </Button>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button>Open via trigger</Button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="grid gap-4">
              <p className="text-sm">
                This is a controlled popover. Its state is managed by React state.
              </p>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close via state
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledPopoverExample />,
  parameters: {
    docs: {
      description: {
        story: "A controlled popover where the open state is managed by React state.",
      },
    },
  },
};

// ============================================================================
// Custom Width Stories
// ============================================================================

export const CustomWidths: Story = {
  render: () => (
    <div className="flex gap-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Narrow (200px)</Button>
        </PopoverTrigger>
        <PopoverContent className="w-52">
          <p className="text-sm">This is a narrow popover at 200px width.</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Default (288px)</Button>
        </PopoverTrigger>
        <PopoverContent>
          <p className="text-sm">This is the default popover width at 288px (w-72).</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Wide (400px)</Button>
        </PopoverTrigger>
        <PopoverContent className="w-96">
          <p className="text-sm">
            This is a wider popover at 400px. Useful for forms or complex content that needs more
            horizontal space.
          </p>
        </PopoverContent>
      </Popover>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Popovers with different widths to accommodate various content sizes.",
      },
    },
  },
};

// ============================================================================
// Icon Trigger Stories
// ============================================================================

export const IconTrigger: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button size="icon" variant="ghost" aria-label="User profile">
            <User className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48">
          <div className="grid gap-2">
            <p className="font-medium">John Doe</p>
            <p className="text-sm text-ui-text-secondary">john@example.com</p>
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button size="icon" variant="ghost" aria-label="Settings">
            <Settings className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48">
          <div className="grid gap-1">
            <button
              type="button"
              className="rounded-md px-2 py-1.5 text-left text-sm hover:bg-ui-bg-hover"
            >
              Account settings
            </button>
            <button
              type="button"
              className="rounded-md px-2 py-1.5 text-left text-sm hover:bg-ui-bg-hover"
            >
              Preferences
            </button>
            <button
              type="button"
              className="rounded-md px-2 py-1.5 text-left text-sm hover:bg-ui-bg-hover"
            >
              Sign out
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Popovers triggered by icon buttons.",
      },
    },
  },
};

// ============================================================================
// Complex Content Stories
// ============================================================================

export const RichContent: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary">View Details</Button>
      </PopoverTrigger>
      <PopoverContent className="w-96">
        <div className="grid gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10">
              <User className="h-6 w-6 text-brand" />
            </div>
            <div>
              <h4 className="font-medium">John Doe</h4>
              <p className="text-sm text-ui-text-secondary">Senior Software Engineer</p>
              <p className="text-xs text-ui-text-tertiary">Engineering Department</p>
            </div>
          </div>
          <div className="border-t border-ui-border pt-4">
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ui-text-secondary">Email</span>
                <span>john@example.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ui-text-secondary">Location</span>
                <span>San Francisco, CA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ui-text-secondary">Timezone</span>
                <span>PST (UTC-8)</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1">
              Send message
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              View profile
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
  parameters: {
    docs: {
      description: {
        story: "A popover with rich content including an avatar, user details, and action buttons.",
      },
    },
  },
};

// ============================================================================
// Multiple Popovers Stories
// ============================================================================

export const MultiplePopovers: Story = {
  render: () => (
    <div className="flex gap-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">First</Button>
        </PopoverTrigger>
        <PopoverContent>
          <p className="text-sm">This is the first popover.</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Second</Button>
        </PopoverTrigger>
        <PopoverContent>
          <p className="text-sm">This is the second popover.</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Third</Button>
        </PopoverTrigger>
        <PopoverContent>
          <p className="text-sm">This is the third popover.</p>
        </PopoverContent>
      </Popover>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Multiple independent popovers on the same page. Opening one closes the others.",
      },
    },
  },
};
