import type { Meta, StoryObj } from "@storybook/react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import {
  Bug,
  CheckSquare,
  Clock,
  FileText,
  FolderKanban,
  Home,
  LayoutGrid,
  Plus,
  Settings,
  User,
} from "@/lib/icons";
import { Button } from "./ui/Button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/Command";
import { Flex, FlexItem } from "./ui/Flex";
import { Icon } from "./ui/Icon";
import { ShortcutHint } from "./ui/KeyboardShortcut";
import { Typography } from "./ui/Typography";

// =============================================================================
// Types
// =============================================================================

interface CommandAction {
  id: string;
  label: string;
  icon?: LucideIcon;
  description?: string;
  keywords?: string[];
  action: () => void;
  group?: string;
}

// =============================================================================
// Presentational Component
// =============================================================================

interface CommandPalettePresentationalProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandAction[];
  initialSearch?: string;
}

function CommandPalettePresentational({
  isOpen,
  onClose,
  commands,
  initialSearch = "",
}: CommandPalettePresentationalProps) {
  const [search, setSearch] = useState(initialSearch);

  // Group commands
  const groupedCommands = commands.reduce(
    (acc: Record<string, CommandAction[]>, cmd: CommandAction) => {
      const group = cmd.group || "Other";
      if (!acc[group]) acc[group] = [];
      acc[group].push(cmd);
      return acc;
    },
    {} as Record<string, CommandAction[]>,
  );

  const handleSelect = (cmd: CommandAction) => {
    cmd.action();
    onClose();
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Command
        className="bg-ui-bg"
        filter={(value, searchTerm) => {
          const cmd = commands.find((c) => c.id === value);
          if (!cmd) return 0;

          const searchLower = searchTerm.toLowerCase();
          const labelMatch = cmd.label.toLowerCase().includes(searchLower);
          const descMatch = cmd.description?.toLowerCase().includes(searchLower);
          const keywordMatch = cmd.keywords?.some((k) => k.toLowerCase().includes(searchLower));

          return labelMatch || descMatch || keywordMatch ? 1 : 0;
        }}
      >
        <CommandInput
          placeholder="Type a command or search..."
          value={search}
          onValueChange={setSearch}
          className="text-ui-text"
        />
        <CommandList className="max-h-panel-sm sm:max-h-panel-md">
          <CommandEmpty className="text-ui-text-secondary">No commands found</CommandEmpty>
          {Object.entries(groupedCommands).map(([group, cmds]) => (
            <CommandGroup
              key={group}
              heading={group}
              className="text-ui-text-secondary [&_[cmdk-group-heading]]:text-ui-text-tertiary"
            >
              {cmds.map((cmd) => (
                <CommandItem
                  key={cmd.id}
                  value={cmd.id}
                  onSelect={() => handleSelect(cmd)}
                  className="cursor-pointer data-[selected=true]:bg-brand-subtle"
                >
                  {cmd.icon && <Icon icon={cmd.icon} size="md" className="mr-2" />}
                  <FlexItem flex="1">
                    <Typography variant="label" as="p">
                      {cmd.label}
                    </Typography>
                    {cmd.description && (
                      <Typography variant="caption">{cmd.description}</Typography>
                    )}
                  </FlexItem>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
        <Flex
          wrap
          gap="md"
          className="px-4 py-2 border-t border-ui-border bg-ui-bg-secondary text-xs text-ui-text-tertiary sm:gap-4"
        >
          <ShortcutHint keys="up+down">Navigate</ShortcutHint>
          <ShortcutHint keys="Enter">Select</ShortcutHint>
          <ShortcutHint keys="Esc">Close</ShortcutHint>
        </Flex>
      </Command>
    </CommandDialog>
  );
}

// =============================================================================
// Mock Data
// =============================================================================

const mockNavigationCommands: CommandAction[] = [
  {
    id: "nav-dashboard",
    label: "Go to Dashboard",
    icon: Home,
    description: "View your personal dashboard",
    keywords: ["home", "my work"],
    action: () => console.log("Navigate to dashboard"),
    group: "Navigation",
  },
  {
    id: "nav-documents",
    label: "Go to Documents",
    icon: FileText,
    description: "View all documents",
    keywords: ["docs", "files"],
    action: () => console.log("Navigate to documents"),
    group: "Navigation",
  },
  {
    id: "nav-projects",
    label: "Go to Workspaces",
    icon: FolderKanban,
    description: "View all workspaces",
    keywords: ["boards", "kanban", "projects", "workspaces"],
    action: () => console.log("Navigate to workspaces"),
    group: "Navigation",
  },
  {
    id: "nav-settings",
    label: "Go to Settings",
    icon: Settings,
    description: "Manage your preferences",
    keywords: ["preferences", "config"],
    action: () => console.log("Navigate to settings"),
    group: "Navigation",
  },
];

const mockCreateCommands: CommandAction[] = [
  {
    id: "create-issue",
    label: "Create Issue",
    icon: Plus,
    description: "Create a new issue",
    keywords: ["new", "task", "bug"],
    action: () => console.log("Create issue"),
    group: "Create",
  },
  {
    id: "create-document",
    label: "Create Document",
    icon: FileText,
    description: "Create a new document",
    keywords: ["new", "doc", "page"],
    action: () => console.log("Create document"),
    group: "Create",
  },
  {
    id: "create-project",
    label: "Create Project",
    icon: FolderKanban,
    description: "Create a new project",
    keywords: ["new", "board", "project"],
    action: () => console.log("Create project"),
    group: "Create",
  },
];

const mockProjectCommands: CommandAction[] = [
  {
    id: "project-1",
    label: "Frontend App",
    icon: LayoutGrid,
    description: "Go to Frontend App board",
    keywords: ["FE", "board", "project"],
    action: () => console.log("Navigate to Frontend App"),
    group: "Projects",
  },
  {
    id: "project-2",
    label: "Backend API",
    icon: LayoutGrid,
    description: "Go to Backend API board",
    keywords: ["BE", "board", "project"],
    action: () => console.log("Navigate to Backend API"),
    group: "Projects",
  },
  {
    id: "project-3",
    label: "Mobile App",
    icon: LayoutGrid,
    description: "Go to Mobile App board",
    keywords: ["mobile", "board", "project"],
    action: () => console.log("Navigate to Mobile App"),
    group: "Projects",
  },
];

const mockRecentIssues: CommandAction[] = [
  {
    id: "issue-1",
    label: "Fix login button alignment",
    icon: Bug,
    description: "FE-123 • Frontend App",
    keywords: ["FE", "Frontend App"],
    action: () => console.log("Navigate to issue"),
    group: "Recent Issues",
  },
  {
    id: "issue-2",
    label: "Add user avatar component",
    icon: CheckSquare,
    description: "FE-124 • Frontend App",
    keywords: ["FE", "Frontend App"],
    action: () => console.log("Navigate to issue"),
    group: "Recent Issues",
  },
  {
    id: "issue-3",
    label: "Implement caching layer",
    icon: CheckSquare,
    description: "BE-89 • Backend API",
    keywords: ["BE", "Backend API"],
    action: () => console.log("Navigate to issue"),
    group: "Recent Issues",
  },
];

const mockUserCommands: CommandAction[] = [
  {
    id: "user-profile",
    label: "View Profile",
    icon: User,
    description: "View and edit your profile",
    action: () => console.log("View profile"),
    group: "User",
  },
  {
    id: "user-timesheet",
    label: "My Timesheet",
    icon: Clock,
    description: "View your time entries",
    action: () => console.log("View timesheet"),
    group: "User",
  },
];

const allCommands: CommandAction[] = [
  ...mockNavigationCommands,
  ...mockCreateCommands,
  ...mockProjectCommands,
  ...mockRecentIssues,
  ...mockUserCommands,
];

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof CommandPalettePresentational> = {
  title: "Components/CommandPalette",
  component: CommandPalettePresentational,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A command palette for quick navigation and actions. Triggered by Cmd/Ctrl+K. Supports fuzzy search across commands, descriptions, and keywords.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Stories
// =============================================================================

export const Default: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    commands: allCommands,
  },
  parameters: {
    docs: {
      description: {
        story: "Command palette with all available commands grouped by category.",
      },
    },
  },
};

export const NavigationOnly: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    commands: mockNavigationCommands,
  },
  parameters: {
    docs: {
      description: {
        story: "Command palette showing only navigation commands.",
      },
    },
  },
};

export const CreateActions: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    commands: [...mockNavigationCommands, ...mockCreateCommands],
  },
  parameters: {
    docs: {
      description: {
        story: "Command palette with navigation and create actions.",
      },
    },
  },
};

export const WithProjects: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    commands: [...mockNavigationCommands, ...mockProjectCommands],
  },
  parameters: {
    docs: {
      description: {
        story: "Command palette showing projects for quick navigation.",
      },
    },
  },
};

export const WithRecentIssues: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    commands: [...mockNavigationCommands, ...mockRecentIssues],
  },
  parameters: {
    docs: {
      description: {
        story: "Command palette showing recent issues for quick access.",
      },
    },
  },
};

export const WithSearch: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    commands: allCommands,
    initialSearch: "create",
  },
  parameters: {
    docs: {
      description: {
        story: "Command palette with pre-filled search to filter commands.",
      },
    },
  },
};

export const EmptySearch: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    commands: allCommands,
    initialSearch: "xyz123nonexistent",
  },
  parameters: {
    docs: {
      description: {
        story: "Command palette showing empty state when no commands match.",
      },
    },
  },
};

export const MinimalCommands: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    commands: [
      {
        id: "home",
        label: "Home",
        icon: Home,
        action: () => {},
        group: "Navigation",
      },
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        action: () => {},
        group: "Navigation",
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: "Command palette with minimal commands.",
      },
    },
  },
};

export const Interactive: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-8">
        <Typography variant="p" className="mb-4 text-center">
          Press the button or use{" "}
          <kbd className="px-2 py-1 bg-ui-bg-secondary rounded">Cmd/Ctrl + K</kbd> to open
        </Typography>
        <Flex justify="center">
          <Button onClick={() => setIsOpen(true)}>Open Command Palette</Button>
        </Flex>
        <CommandPalettePresentational
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          commands={allCommands}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive demo where you can open and close the command palette.",
      },
    },
  },
};
