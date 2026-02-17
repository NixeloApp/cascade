import type { Meta, StoryObj } from "@storybook/react";
import { X } from "lucide-react";
import { useState } from "react";
import { Flex } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { Tooltip } from "@/components/ui/Tooltip";
import { ISSUE_TYPE_ICONS, type IssueType } from "@/lib/issue-utils";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Typography } from "./ui/Typography";

// =============================================================================
// Types
// =============================================================================

interface IssueLink {
  _id: string;
  linkType: "blocks" | "relates" | "duplicates";
  issue: {
    type: IssueType;
    key: string;
    title: string;
  };
}

interface IssueDependenciesPresentationalProps {
  outgoingLinks?: IssueLink[];
  incomingLinks?: IssueLink[];
  isLoading?: boolean;
  onAddDependency?: () => void;
  onRemoveLink?: (linkId: string) => void;
}

// =============================================================================
// Helper Components
// =============================================================================

function IssueDisplay({
  type,
  issueKey,
  title,
}: {
  type: IssueType;
  issueKey: string;
  title: string;
}) {
  return (
    <Flex as="span" align="center" gap="sm" className="min-w-0">
      <Icon icon={ISSUE_TYPE_ICONS[type]} size="sm" className="shrink-0" />
      <Typography variant="mono" as="code" className="shrink-0 text-ui-text-secondary">
        {issueKey}
      </Typography>
      <Typography variant="small" as="span" className="truncate text-ui-text">
        {title}
      </Typography>
    </Flex>
  );
}

// =============================================================================
// Presentational Component
// =============================================================================

function IssueDependenciesPresentational({
  outgoingLinks = [],
  incomingLinks = [],
  isLoading = false,
  onAddDependency = () => {},
  onRemoveLink = () => {},
}: IssueDependenciesPresentationalProps) {
  const getLinkTypeLabel = (type: string, direction: "outgoing" | "incoming") => {
    if (direction === "outgoing") {
      switch (type) {
        case "blocks":
          return "Blocks";
        case "relates":
          return "Relates to";
        case "duplicates":
          return "Duplicates";
        default:
          return type;
      }
    } else {
      switch (type) {
        case "blocks":
          return "Blocked by";
        case "relates":
          return "Related by";
        case "duplicates":
          return "Duplicated by";
        default:
          return type;
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-ui-bg-tertiary animate-pulse rounded" />
        <div className="space-y-2">
          <div className="h-14 bg-ui-bg-tertiary animate-pulse rounded-lg" />
          <div className="h-14 bg-ui-bg-tertiary animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Button onClick={onAddDependency} size="sm" variant="secondary">
          + Add Dependency
        </Button>
      </div>

      {outgoingLinks.length > 0 && (
        <div>
          <Typography variant="label" className="mb-2">
            Dependencies
          </Typography>
          <div className="space-y-2">
            {outgoingLinks.map((link) => (
              <Flex
                align="center"
                justify="between"
                className="p-3 bg-ui-bg-secondary rounded-lg"
                key={link._id}
              >
                <Flex align="center" gap="md" className="flex-1 min-w-0">
                  <Badge variant="brand" size="md">
                    {getLinkTypeLabel(link.linkType, "outgoing")}
                  </Badge>
                  <IssueDisplay
                    type={link.issue.type}
                    issueKey={link.issue.key}
                    title={link.issue.title}
                  />
                </Flex>
                <Tooltip content="Remove dependency">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-ui-text-tertiary hover:text-status-error"
                    onClick={() => onRemoveLink(link._id)}
                    aria-label="Remove dependency"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </Tooltip>
              </Flex>
            ))}
          </div>
        </div>
      )}

      {incomingLinks.length > 0 && (
        <div>
          <Typography variant="label" className="mb-2">
            Referenced By
          </Typography>
          <div className="space-y-2">
            {incomingLinks.map((link) => (
              <Flex
                align="center"
                justify="between"
                className="p-3 bg-ui-bg-secondary rounded-lg"
                key={link._id}
              >
                <Flex align="center" gap="md" className="flex-1 min-w-0">
                  <Badge variant="accent" size="md">
                    {getLinkTypeLabel(link.linkType, "incoming")}
                  </Badge>
                  <IssueDisplay
                    type={link.issue.type}
                    issueKey={link.issue.key}
                    title={link.issue.title}
                  />
                </Flex>
                <Tooltip content="Remove dependency">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-ui-text-tertiary hover:text-status-error"
                    onClick={() => onRemoveLink(link._id)}
                    aria-label="Remove dependency"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </Tooltip>
              </Flex>
            ))}
          </div>
        </div>
      )}

      {outgoingLinks.length === 0 && incomingLinks.length === 0 && (
        <div className="text-center py-6">
          <Typography variant="caption">No dependencies yet</Typography>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Mock Data
// =============================================================================

const mockOutgoingLinks: IssueLink[] = [
  {
    _id: "link-1",
    linkType: "blocks",
    issue: { type: "task", key: "PROJ-124", title: "Setup database migrations" },
  },
  {
    _id: "link-2",
    linkType: "relates",
    issue: { type: "bug", key: "PROJ-125", title: "Fix authentication flow" },
  },
];

const mockIncomingLinks: IssueLink[] = [
  {
    _id: "link-3",
    linkType: "blocks",
    issue: { type: "story", key: "PROJ-100", title: "User onboarding flow" },
  },
  {
    _id: "link-4",
    linkType: "duplicates",
    issue: { type: "bug", key: "PROJ-110", title: "Login button not working" },
  },
];

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof IssueDependenciesPresentational> = {
  title: "Components/IssueDependencies",
  component: IssueDependenciesPresentational,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Displays and manages issue dependencies (blocks, relates to, duplicates). Shows both outgoing dependencies and incoming references.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-96 p-4 bg-ui-bg border border-ui-border rounded-lg">
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
    outgoingLinks: mockOutgoingLinks,
    incomingLinks: mockIncomingLinks,
  },
  parameters: {
    docs: {
      description: {
        story: "Issue with both outgoing and incoming dependencies.",
      },
    },
  },
};

export const Empty: Story = {
  args: {
    outgoingLinks: [],
    incomingLinks: [],
  },
  parameters: {
    docs: {
      description: {
        story: "No dependencies yet.",
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
        story: "Loading state while fetching dependencies.",
      },
    },
  },
};

export const OnlyOutgoing: Story = {
  args: {
    outgoingLinks: mockOutgoingLinks,
    incomingLinks: [],
  },
  parameters: {
    docs: {
      description: {
        story: "Issue that only blocks other issues.",
      },
    },
  },
};

export const OnlyIncoming: Story = {
  args: {
    outgoingLinks: [],
    incomingLinks: mockIncomingLinks,
  },
  parameters: {
    docs: {
      description: {
        story: "Issue that is only referenced by other issues.",
      },
    },
  },
};

export const AllLinkTypes: Story = {
  args: {
    outgoingLinks: [
      {
        _id: "l-1",
        linkType: "blocks",
        issue: { type: "task", key: "PROJ-1", title: "Blocked task" },
      },
      {
        _id: "l-2",
        linkType: "relates",
        issue: { type: "story", key: "PROJ-2", title: "Related story" },
      },
      {
        _id: "l-3",
        linkType: "duplicates",
        issue: { type: "bug", key: "PROJ-3", title: "Duplicate bug" },
      },
    ],
    incomingLinks: [
      {
        _id: "l-4",
        linkType: "blocks",
        issue: { type: "epic", key: "PROJ-4", title: "Blocking epic" },
      },
      {
        _id: "l-5",
        linkType: "relates",
        issue: { type: "task", key: "PROJ-5", title: "Related task" },
      },
      {
        _id: "l-6",
        linkType: "duplicates",
        issue: { type: "bug", key: "PROJ-6", title: "Original bug" },
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: "Showing all link types: blocks, relates, duplicates.",
      },
    },
  },
};

export const ManyDependencies: Story = {
  args: {
    outgoingLinks: Array.from({ length: 5 }, (_, i) => ({
      _id: `out-${i}`,
      linkType: ["blocks", "relates", "duplicates"][i % 3] as "blocks" | "relates" | "duplicates",
      issue: {
        type: ["task", "bug", "story"][i % 3] as IssueType,
        key: `PROJ-${100 + i}`,
        title: `Task ${i + 1} with a longer title that might truncate`,
      },
    })),
    incomingLinks: Array.from({ length: 3 }, (_, i) => ({
      _id: `in-${i}`,
      linkType: "blocks" as const,
      issue: { type: "epic" as IssueType, key: `PROJ-${200 + i}`, title: `Epic ${i + 1}` },
    })),
  },
  parameters: {
    docs: {
      description: {
        story: "Issue with many dependencies showing scrolling behavior.",
      },
    },
  },
};

export const Interactive: Story = {
  render: () => {
    const [outgoing, setOutgoing] = useState<IssueLink[]>(mockOutgoingLinks);
    const [incoming, setIncoming] = useState<IssueLink[]>(mockIncomingLinks);

    const handleRemove = (linkId: string) => {
      setOutgoing((prev) => prev.filter((l) => l._id !== linkId));
      setIncoming((prev) => prev.filter((l) => l._id !== linkId));
    };

    return (
      <IssueDependenciesPresentational
        outgoingLinks={outgoing}
        incomingLinks={incoming}
        onAddDependency={() => alert("Add dependency dialog would open")}
        onRemoveLink={handleRemove}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive demo - click X to remove dependencies.",
      },
    },
  },
};

export const InIssueDetail: Story = {
  render: () => (
    <div className="w-full max-w-2xl space-y-6">
      <div>
        <Typography variant="h2" className="mb-2">
          PROJ-123: Implement user authentication
        </Typography>
        <Typography color="secondary">Add OAuth2 support for Google and GitHub login.</Typography>
      </div>

      <div className="border-t border-ui-border pt-4">
        <Typography variant="h3" className="mb-4">
          Dependencies
        </Typography>
        <IssueDependenciesPresentational
          outgoingLinks={mockOutgoingLinks}
          incomingLinks={mockIncomingLinks}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Dependencies section in an issue detail view.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl p-4 bg-ui-bg border border-ui-border rounded-lg">
        <Story />
      </div>
    ),
  ],
};
