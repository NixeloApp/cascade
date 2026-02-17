import type { Meta, StoryObj } from "@storybook/react";
import { useRef } from "react";
import { Folder } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/Badge";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { SkeletonProjectCard } from "../ui/Skeleton";
import { Typography } from "../ui/Typography";

// =============================================================================
// Types
// =============================================================================

interface Project {
  _id: string;
  key: string;
  name: string;
  role: string;
  myIssues: number;
  totalIssues: number;
}

interface ProjectsListPresentationalProps {
  projects?: Project[];
  isLoading?: boolean;
  selectedIndex?: number;
  onSelectProject?: (projectKey: string) => void;
  onNavigateToWorkspaces?: () => void;
}

// =============================================================================
// Presentational Component
// =============================================================================

function ProjectsListPresentational({
  projects,
  isLoading = false,
  selectedIndex = -1,
  onSelectProject = () => {},
  onNavigateToWorkspaces = () => {},
}: ProjectsListPresentationalProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const count = projects?.length || 0;
  const workspacesLabel = count === 1 ? "project" : "projects";

  return (
    <Card className="hover:shadow-card-hover transition-shadow">
      <CardHeader title="Workspaces" description={`${count} active ${workspacesLabel}`} />
      <CardBody>
        {isLoading ? (
          <Flex direction="column" gap="sm">
            <SkeletonProjectCard />
            <SkeletonProjectCard />
            <SkeletonProjectCard />
          </Flex>
        ) : !projects || projects.length === 0 ? (
          <EmptyState
            icon={Folder}
            title="No projects"
            description="You're not a member of any projects yet"
            action={{
              label: "Go to Workspaces",
              onClick: onNavigateToWorkspaces,
            }}
          />
        ) : (
          <Flex direction="column" gap="xs" ref={listRef}>
            {projects.map((project, index) => (
              <button
                key={project._id}
                type="button"
                onClick={() => onSelectProject(project.key)}
                className={cn(
                  "w-full text-left p-3 rounded-lg group cursor-pointer",
                  "bg-ui-bg-soft border border-transparent",
                  "hover:border-ui-border-secondary hover:bg-ui-bg-hover",
                  "transition-all duration-200",
                  selectedIndex === index && "ring-2 ring-brand-ring",
                )}
              >
                <Flex align="center" gap="sm">
                  <Flex
                    align="center"
                    justify="center"
                    className="w-8 h-8 rounded-md bg-brand/10 text-brand font-semibold text-xs shrink-0 ring-1 ring-brand/20 group-hover:ring-brand/40 transition-all"
                  >
                    {project.key.substring(0, 2).toUpperCase()}
                  </Flex>
                  <Flex direction="column" className="flex-1 min-w-0">
                    <Flex justify="between" align="center" gap="sm">
                      <Typography
                        variant="small"
                        className="font-semibold text-ui-text truncate group-hover:text-brand transition-colors tracking-tight"
                      >
                        {project.name}
                      </Typography>
                      <Badge
                        variant="neutral"
                        className="text-xs uppercase tracking-tighter bg-ui-bg-tertiary/50 shrink-0"
                      >
                        {project.role}
                      </Badge>
                    </Flex>
                    <Typography variant="small" className="text-ui-text-secondary">
                      {project.myIssues} assigned issues
                    </Typography>
                  </Flex>
                </Flex>
              </button>
            ))}
          </Flex>
        )}
      </CardBody>
    </Card>
  );
}

// =============================================================================
// Mock Data
// =============================================================================

const mockProjects: Project[] = [
  {
    _id: "p-1",
    key: "PLAT",
    name: "Platform Engineering",
    role: "admin",
    myIssues: 12,
    totalIssues: 45,
  },
  { _id: "p-2", key: "WEB", name: "Web Application", role: "editor", myIssues: 8, totalIssues: 32 },
  { _id: "p-3", key: "MOB", name: "Mobile App", role: "viewer", myIssues: 3, totalIssues: 18 },
];

const manyProjects: Project[] = [
  ...mockProjects,
  { _id: "p-4", key: "API", name: "API Services", role: "admin", myIssues: 15, totalIssues: 67 },
  { _id: "p-5", key: "DATA", name: "Data Analytics", role: "editor", myIssues: 5, totalIssues: 23 },
  {
    _id: "p-6",
    key: "INFRA",
    name: "Infrastructure",
    role: "admin",
    myIssues: 20,
    totalIssues: 89,
  },
  { _id: "p-7", key: "SEC", name: "Security", role: "viewer", myIssues: 2, totalIssues: 12 },
];

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof ProjectsListPresentational> = {
  title: "Components/Dashboard/ProjectsList",
  component: ProjectsListPresentational,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A card showing the user's projects in the dashboard. Displays project name, key, role, and assigned issues count.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-80 p-4 bg-ui-bg">
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
    projects: mockProjects,
  },
  parameters: {
    docs: {
      description: {
        story: "Default projects list with a few projects.",
      },
    },
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Loading state with skeleton placeholders.",
      },
    },
  },
};

export const Empty: Story = {
  args: {
    projects: [],
  },
  parameters: {
    docs: {
      description: {
        story: "Empty state when user has no projects.",
      },
    },
  },
};

export const SingleProject: Story = {
  args: {
    projects: [mockProjects[0]],
  },
  parameters: {
    docs: {
      description: {
        story: "Single project in the list.",
      },
    },
  },
};

export const ManyProjects: Story = {
  args: {
    projects: manyProjects,
  },
  parameters: {
    docs: {
      description: {
        story: "Many projects showing scrollable list.",
      },
    },
  },
};

export const WithSelection: Story = {
  args: {
    projects: mockProjects,
    selectedIndex: 1,
  },
  parameters: {
    docs: {
      description: {
        story: "A project is selected (keyboard navigation).",
      },
    },
  },
};

export const RoleVariants: Story = {
  args: {
    projects: [
      {
        _id: "p-1",
        key: "ADM",
        name: "Admin Project",
        role: "admin",
        myIssues: 10,
        totalIssues: 50,
      },
      {
        _id: "p-2",
        key: "EDT",
        name: "Editor Project",
        role: "editor",
        myIssues: 5,
        totalIssues: 25,
      },
      {
        _id: "p-3",
        key: "VWR",
        name: "Viewer Project",
        role: "viewer",
        myIssues: 0,
        totalIssues: 15,
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: "Different role badges for each project.",
      },
    },
  },
};

export const LongNames: Story = {
  args: {
    projects: [
      {
        _id: "p-1",
        key: "ENTERPRISE",
        name: "Enterprise Customer Portal Development",
        role: "admin",
        myIssues: 25,
        totalIssues: 120,
      },
      {
        _id: "p-2",
        key: "INTERNAL",
        name: "Internal Tools and Infrastructure Automation",
        role: "editor",
        myIssues: 8,
        totalIssues: 45,
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: "Projects with long names showing truncation.",
      },
    },
  },
};

export const InDashboardLayout: Story = {
  render: () => (
    <Grid cols={1} colsMd={2} gap="lg" className="w-full max-w-4xl">
      <div className="space-y-4">
        <Typography variant="h2">Main Content</Typography>
        <Flex
          align="center"
          justify="center"
          className="h-40 bg-ui-bg-soft border border-ui-border rounded-lg"
        >
          <Typography color="secondary">Issues list would go here</Typography>
        </Flex>
      </div>
      <div>
        <ProjectsListPresentational
          projects={mockProjects}
          onSelectProject={(key) => alert(`Selected project: ${key}`)}
        />
      </div>
    </Grid>
  ),
  parameters: {
    docs: {
      description: {
        story: "Projects list in the context of a dashboard layout.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-4xl p-4 bg-ui-bg">
        <Story />
      </div>
    ),
  ],
};
