import type { Meta, StoryObj } from "@storybook/react";
import {
  Calendar,
  ChevronRight,
  Filter,
  Home,
  Menu,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  User,
} from "lucide-react";
import { useState } from "react";
import { Button } from "./button";
import { Input } from "./Input";
import { Label } from "./label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./Sheet";

const meta: Meta<typeof Sheet> = {
  title: "UI/Sheet",
  component: Sheet,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    open: {
      control: "boolean",
      description: "Controls whether the sheet is open",
    },
    defaultOpen: {
      control: "boolean",
      description: "The default open state when uncontrolled",
    },
    modal: {
      control: "boolean",
      description: "Whether the sheet blocks interaction with the rest of the page",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Basic Sheet Stories
// ============================================================================

export const Basic: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open Sheet</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Basic Sheet</SheetTitle>
          <SheetDescription>
            This is a basic sheet panel that slides in from the right. Click outside or press Escape
            to close.
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
  parameters: {
    docs: {
      description: {
        story: "A simple sheet with a title and description, sliding in from the right (default).",
      },
    },
  },
};

export const WithActions: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open Sheet</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Confirm Action</SheetTitle>
          <SheetDescription>
            Are you sure you want to proceed with this action? This can be undone later.
          </SheetDescription>
        </SheetHeader>
        <SheetFooter className="mt-6">
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button>Continue</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
  parameters: {
    docs: {
      description: {
        story: "Sheet with footer actions including Cancel and Continue buttons.",
      },
    },
  },
};

// ============================================================================
// Side Variants
// ============================================================================

export const LeftSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Left Sheet</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Left Sheet</SheetTitle>
          <SheetDescription>
            This sheet slides in from the left side of the screen.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <p className="text-sm text-ui-text-secondary">
            Left-side sheets are commonly used for navigation menus on mobile devices.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  ),
  parameters: {
    docs: {
      description: {
        story: "Sheet that slides in from the left side.",
      },
    },
  },
};

export const RightSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Right Sheet</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Right Sheet</SheetTitle>
          <SheetDescription>
            This sheet slides in from the right side of the screen (default).
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <p className="text-sm text-ui-text-secondary">
            Right-side sheets are commonly used for detail panels and settings.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  ),
  parameters: {
    docs: {
      description: {
        story: "Sheet that slides in from the right side (default behavior).",
      },
    },
  },
};

export const TopSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Top Sheet</Button>
      </SheetTrigger>
      <SheetContent side="top">
        <SheetHeader>
          <SheetTitle>Top Sheet</SheetTitle>
          <SheetDescription>This sheet slides down from the top of the screen.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
  parameters: {
    docs: {
      description: {
        story: "Sheet that slides down from the top.",
      },
    },
  },
};

export const BottomSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Bottom Sheet</Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Bottom Sheet</SheetTitle>
          <SheetDescription>This sheet slides up from the bottom of the screen.</SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <p className="text-sm text-ui-text-secondary">
            Bottom sheets are popular on mobile for action menus and quick selections.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  ),
  parameters: {
    docs: {
      description: {
        story: "Sheet that slides up from the bottom.",
      },
    },
  },
};

export const AllSides: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Left</Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Left Sheet</SheetTitle>
            <SheetDescription>Slides in from the left.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Right</Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Right Sheet</SheetTitle>
            <SheetDescription>Slides in from the right.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Top</Button>
        </SheetTrigger>
        <SheetContent side="top">
          <SheetHeader>
            <SheetTitle>Top Sheet</SheetTitle>
            <SheetDescription>Slides down from the top.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Bottom</Button>
        </SheetTrigger>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Bottom Sheet</SheetTitle>
            <SheetDescription>Slides up from the bottom.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "All four side variants displayed together for comparison.",
      },
    },
  },
};

// ============================================================================
// Form Content Stories
// ============================================================================

export const WithForm: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button leftIcon={<User className="h-4 w-4" />}>Edit Profile</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        <form className="grid gap-4 py-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue="John Doe" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" defaultValue="@johndoe" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue="john@example.com" />
          </div>
        </form>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button type="submit">Save changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
  parameters: {
    docs: {
      description: {
        story: "Sheet containing a form with input fields for editing profile information.",
      },
    },
  },
};

export const CreateItemForm: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button leftIcon={<Plus className="h-4 w-4" />}>Create Project</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Create New Project</SheetTitle>
          <SheetDescription>
            Add a new project to your workspace. Fill in the details below.
          </SheetDescription>
        </SheetHeader>
        <form className="grid gap-4 py-6">
          <div className="grid gap-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input id="project-name" placeholder="My Awesome Project" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="project-key">Project Key</Label>
            <Input id="project-key" placeholder="MAP" maxLength={4} />
            <p className="text-xs text-ui-text-secondary">
              A short identifier for issues (e.g., MAP-123)
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="project-description">Description (optional)</Label>
            <Input id="project-description" placeholder="Brief description of the project" />
          </div>
        </form>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button>Create Project</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
  parameters: {
    docs: {
      description: {
        story: "Sheet for creating a new project with multiple form fields.",
      },
    },
  },
};

// ============================================================================
// Common Use Cases - Settings Panel
// ============================================================================

export const SettingsPanel: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary" leftIcon={<Settings className="h-4 w-4" />}>
          Settings
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>Manage your account settings and preferences.</SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-6">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-ui-text">Notifications</h4>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ui-text">Email Notifications</p>
                <p className="text-xs text-ui-text-secondary">
                  Receive email updates about your projects
                </p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ui-text">Push Notifications</p>
                <p className="text-xs text-ui-text-secondary">
                  Get notified about mentions and replies
                </p>
              </div>
              <input type="checkbox" className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-ui-text">Appearance</h4>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ui-text">Dark Mode</p>
                <p className="text-xs text-ui-text-secondary">Use dark theme across the app</p>
              </div>
              <input type="checkbox" className="h-4 w-4" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ui-text">Compact View</p>
                <p className="text-xs text-ui-text-secondary">
                  Show more content with less spacing
                </p>
              </div>
              <input type="checkbox" className="h-4 w-4" />
            </div>
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button>Save Preferences</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
  parameters: {
    docs: {
      description: {
        story: "A settings panel sheet with grouped toggle options.",
      },
    },
  },
};

// ============================================================================
// Common Use Cases - Filters Panel
// ============================================================================

export const FiltersPanel: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filter Results</SheetTitle>
          <SheetDescription>
            Narrow down your search results with the following filters.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-6">
          <div className="space-y-3">
            <Label>Status</Label>
            <div className="space-y-2">
              {["Open", "In Progress", "Closed", "Archived"].map((status) => (
                <label key={status} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4" />
                  <span className="text-ui-text">{status}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <Label>Priority</Label>
            <div className="space-y-2">
              {["Critical", "High", "Medium", "Low"].map((priority) => (
                <label key={priority} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4" />
                  <span className="text-ui-text">{priority}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <Label htmlFor="date-range">Date Range</Label>
            <Input id="date-range" type="date" />
          </div>
        </div>
        <SheetFooter>
          <Button variant="ghost">Clear All</Button>
          <SheetClose asChild>
            <Button>Apply Filters</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
  parameters: {
    docs: {
      description: {
        story: "A filter panel sheet with checkboxes and date picker for filtering search results.",
      },
    },
  },
};

// ============================================================================
// Common Use Cases - Navigation Drawer
// ============================================================================

export const NavigationDrawer: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 space-y-1">
          {[
            { icon: Home, label: "Home", active: true },
            { icon: Calendar, label: "Calendar", active: false },
            { icon: User, label: "Profile", active: false },
            { icon: Settings, label: "Settings", active: false },
          ].map(({ icon: Icon, label, active }) => (
            <button
              type="button"
              key={label}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-ui-bg-secondary text-ui-text"
                  : "text-ui-text-secondary hover:bg-ui-bg-secondary hover:text-ui-text"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {active && <ChevronRight className="ml-auto h-4 w-4" />}
            </button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  ),
  parameters: {
    docs: {
      description: {
        story: "A mobile-style navigation drawer that slides in from the left.",
      },
    },
  },
};

// ============================================================================
// Common Use Cases - Search Panel
// ============================================================================

export const SearchPanel: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" leftIcon={<Search className="h-4 w-4" />}>
          Search
        </Button>
      </SheetTrigger>
      <SheetContent side="top" className="h-auto">
        <SheetHeader>
          <SheetTitle>Search</SheetTitle>
          <SheetDescription>Search for projects, issues, documents, and more.</SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ui-text-tertiary" />
            <Input placeholder="Type to search..." className="pl-9" />
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-xs text-ui-text-secondary">Recent searches</p>
            {["Design system", "API documentation", "Bug fixes"].map((term) => (
              <button
                type="button"
                key={term}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-ui-text-secondary hover:bg-ui-bg-secondary hover:text-ui-text"
              >
                <Search className="h-3 w-3" />
                {term}
              </button>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "A search panel that slides down from the top with search input and recent searches.",
      },
    },
  },
};

// ============================================================================
// Common Use Cases - Quick Actions
// ============================================================================

export const QuickActionsPanel: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" leftIcon={<SlidersHorizontal className="h-4 w-4" />}>
          Quick Actions
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-auto">
        <SheetHeader>
          <SheetTitle>Quick Actions</SheetTitle>
          <SheetDescription>Select an action to perform.</SheetDescription>
        </SheetHeader>
        <div className="grid grid-cols-3 gap-4 py-6">
          {[
            { icon: Plus, label: "New Issue" },
            { icon: Calendar, label: "Schedule" },
            { icon: User, label: "Assign" },
            { icon: Filter, label: "Filter" },
            { icon: Search, label: "Search" },
            { icon: Settings, label: "Settings" },
          ].map(({ icon: Icon, label }) => (
            <button
              type="button"
              key={label}
              className="flex flex-col items-center gap-2 rounded-lg p-4 text-sm text-ui-text-secondary transition-colors hover:bg-ui-bg-secondary hover:text-ui-text"
            >
              <Icon className="h-6 w-6" />
              {label}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  ),
  parameters: {
    docs: {
      description: {
        story: "A bottom sheet with quick action buttons in a grid layout.",
      },
    },
  },
};

// ============================================================================
// Controlled Sheet
// ============================================================================

function ControlledSheetExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-ui-text-secondary">Sheet is {open ? "open" : "closed"}</p>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button>Open Controlled Sheet</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Controlled Sheet</SheetTitle>
            <SheetDescription>
              This sheet's open state is controlled by React state.
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <p className="text-sm text-ui-text-secondary">
              You can close this sheet via state or the close button.
            </p>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close via State
            </Button>
            <SheetClose asChild>
              <Button>Close via SheetClose</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledSheetExample />,
  parameters: {
    docs: {
      description: {
        story: "A controlled sheet where the open state is managed by React state.",
      },
    },
  },
};

// ============================================================================
// Long Content Sheet
// ============================================================================

export const LongContent: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>View Details</Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Project Details</SheetTitle>
          <SheetDescription>
            Complete information about the project including history and activity.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-6">
          {["Overview", "Team Members", "Recent Activity", "Timeline", "Resources", "Settings"].map(
            (section) => (
              <div key={section} className="space-y-2">
                <h4 className="text-sm font-medium text-ui-text">{section}</h4>
                <p className="text-sm text-ui-text-secondary">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                  incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                  exercitation ullamco laboris.
                </p>
              </div>
            ),
          )}
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
          <Button>Edit Project</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
  parameters: {
    docs: {
      description: {
        story: "Sheet with long scrollable content.",
      },
    },
  },
};

// ============================================================================
// Multiple Sheets
// ============================================================================

export const MultipleSheets: Story = {
  render: () => (
    <div className="flex gap-4">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Left Nav</Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <nav className="mt-4 space-y-2">
            {["Home", "Projects", "Issues", "Settings"].map((item) => (
              <SheetClose key={item} asChild>
                <button
                  type="button"
                  className="block w-full rounded-md px-3 py-2 text-left text-sm text-ui-text-secondary hover:bg-ui-bg-secondary hover:text-ui-text"
                >
                  {item}
                </button>
              </SheetClose>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Right Details</Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Item Details</SheetTitle>
            <SheetDescription>View and edit item information.</SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <p className="text-sm text-ui-text-secondary">Details panel content goes here.</p>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Bottom Actions</Button>
        </SheetTrigger>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Actions</SheetTitle>
          </SheetHeader>
          <div className="flex justify-center gap-4 py-4">
            <Button variant="outline">Share</Button>
            <Button variant="outline">Export</Button>
            <Button variant="danger">Delete</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Multiple independent sheets demonstrating different side positions.",
      },
    },
  },
};

// ============================================================================
// Custom Width Sheet
// ============================================================================

export const CustomWidth: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Wide Sheet</Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Wide Sheet Panel</SheetTitle>
          <SheetDescription>
            This sheet has a custom width of max-w-lg for more content space.
          </SheetDescription>
        </SheetHeader>
        <div className="py-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first-name">First Name</Label>
              <Input id="first-name" placeholder="John" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">Last Name</Label>
              <Input id="last-name" placeholder="Doe" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="wide-email">Email</Label>
              <Input id="wide-email" type="email" placeholder="john@example.com" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" placeholder="123 Main St" />
            </div>
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button>Save</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
  parameters: {
    docs: {
      description: {
        story: "Sheet with custom width using Tailwind classes.",
      },
    },
  },
};
