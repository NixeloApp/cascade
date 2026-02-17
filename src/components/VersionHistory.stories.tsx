import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Clock, RotateCcw } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Dialog } from "./ui/Dialog";
import { EmptyState } from "./ui/EmptyState";
import { Flex, FlexItem } from "./ui/Flex";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { Metadata, MetadataItem } from "./ui/Metadata";
import { Typography } from "./ui/Typography";

// =============================================================================
// Types
// =============================================================================

interface DocumentVersion {
  _id: string;
  title: string;
  _creationTime: number;
  createdByName: string;
  changeDescription?: string;
}

interface VersionHistoryPresentationalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  versions?: DocumentVersion[];
  isLoading?: boolean;
  selectedVersionId?: string | null;
  onRestore?: (versionId: string) => void;
}

// =============================================================================
// Helper Functions
// =============================================================================

function getRelativeTimeString(diffMs: number): string | null {
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  return null;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const relativeTime = getRelativeTimeString(diffMs);
  if (relativeTime) return relativeTime;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    hour: "numeric",
    minute: "2-digit",
  });
}

// =============================================================================
// Presentational Component
// =============================================================================

function VersionHistoryPresentational({
  open = true,
  onOpenChange = () => {},
  versions,
  isLoading = false,
  selectedVersionId = null,
  onRestore = () => {},
}: VersionHistoryPresentationalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Version History"
      description="View and restore previous versions of this document"
      className="sm:max-w-2xl max-h-panel flex flex-col bg-ui-bg-soft border-ui-border"
      footer={
        <Typography variant="meta">
          Tip: Versions are saved automatically every minute when you edit. Up to 50 recent versions
          are kept.
        </Typography>
      }
    >
      <FlexItem flex="1" className="overflow-auto scrollbar-subtle">
        {isLoading ? (
          <Flex align="center" justify="center" className="py-12">
            <LoadingSpinner size="lg" />
          </Flex>
        ) : !versions || versions.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No version history yet"
            description="Versions are automatically saved as you edit. Make some changes to create the first version."
          />
        ) : (
          <div className="space-y-2 py-2">
            {versions.map((version, index) => {
              const isLatest = index === 0;
              const isSelected = selectedVersionId === version._id;

              return (
                <div
                  key={version._id}
                  className={cn(
                    "p-4 rounded-container border transition-default",
                    isSelected
                      ? "border-brand-ring bg-brand-subtle"
                      : "border-ui-border bg-ui-bg hover:border-ui-border-secondary hover:bg-ui-bg-hover",
                  )}
                >
                  <Flex align="start" justify="between">
                    <FlexItem flex="1">
                      <Flex align="center" gap="sm" className="mb-1.5">
                        {isLatest && (
                          <Badge variant="success" size="sm">
                            Current
                          </Badge>
                        )}
                        <Typography variant="small" className="font-medium tracking-tight">
                          {version.title}
                        </Typography>
                      </Flex>
                      <Metadata>
                        <MetadataItem icon={<Clock className="w-3.5 h-3.5" />}>
                          {formatDate(version._creationTime)}
                        </MetadataItem>
                        <MetadataItem>by {version.createdByName}</MetadataItem>
                      </Metadata>
                      {version.changeDescription && (
                        <Typography variant="caption" className="mt-2">
                          {version.changeDescription}
                        </Typography>
                      )}
                    </FlexItem>

                    {!isLatest && (
                      <Button
                        onClick={() => onRestore(version._id)}
                        size="sm"
                        variant="outline"
                        className="ml-4 border-ui-border text-ui-text-secondary hover:text-ui-text hover:border-ui-border-secondary transition-default"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                        Restore
                      </Button>
                    )}
                  </Flex>
                </div>
              );
            })}
          </div>
        )}
      </FlexItem>
    </Dialog>
  );
}

// =============================================================================
// Mock Data
// =============================================================================

const now = Date.now();

const mockVersions: DocumentVersion[] = [
  {
    _id: "v-1",
    title: "Project Requirements Document",
    _creationTime: now - 5 * 60 * 1000, // 5 minutes ago
    createdByName: "Alice Chen",
    changeDescription: "Updated acceptance criteria section",
  },
  {
    _id: "v-2",
    title: "Project Requirements Document",
    _creationTime: now - 2 * 60 * 60 * 1000, // 2 hours ago
    createdByName: "Bob Wilson",
    changeDescription: "Added new feature requirements",
  },
  {
    _id: "v-3",
    title: "Project Requirements Document",
    _creationTime: now - 24 * 60 * 60 * 1000, // 1 day ago
    createdByName: "Alice Chen",
  },
  {
    _id: "v-4",
    title: "Project Requirements Document",
    _creationTime: now - 3 * 24 * 60 * 60 * 1000, // 3 days ago
    createdByName: "Charlie Brown",
    changeDescription: "Initial draft",
  },
];

const manyVersions: DocumentVersion[] = Array.from({ length: 15 }, (_, i) => ({
  _id: `v-${i + 1}`,
  title: "Technical Specification",
  _creationTime: now - i * 60 * 60 * 1000, // Each hour apart
  createdByName: ["Alice Chen", "Bob Wilson", "Charlie Brown"][i % 3],
  changeDescription: i % 3 === 0 ? `Edit ${i + 1}: Updated section ${i + 1}` : undefined,
}));

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof VersionHistoryPresentational> = {
  title: "Components/VersionHistory",
  component: VersionHistoryPresentational,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A dialog showing version history for documents. Displays version timeline with author, timestamp, and restore functionality.",
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
    versions: mockVersions,
  },
  parameters: {
    docs: {
      description: {
        story: "Default version history with several versions.",
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
        story: "Loading state while fetching version history.",
      },
    },
  },
};

export const Empty: Story = {
  args: {
    versions: [],
  },
  parameters: {
    docs: {
      description: {
        story: "Empty state when no versions exist yet.",
      },
    },
  },
};

export const SingleVersion: Story = {
  args: {
    versions: [mockVersions[0]],
  },
  parameters: {
    docs: {
      description: {
        story: "Only the current version exists (no restore option).",
      },
    },
  },
};

export const ManyVersions: Story = {
  args: {
    versions: manyVersions,
  },
  parameters: {
    docs: {
      description: {
        story: "Many versions showing scrollable list.",
      },
    },
  },
};

export const WithSelectedVersion: Story = {
  args: {
    versions: mockVersions,
    selectedVersionId: "v-2",
  },
  parameters: {
    docs: {
      description: {
        story: "A version is selected (highlighted).",
      },
    },
  },
};

export const Interactive: Story = {
  render: () => {
    const [open, setOpen] = useState(true);

    return (
      <div>
        <Button onClick={() => setOpen(true)}>Open Version History</Button>
        <VersionHistoryPresentational
          open={open}
          onOpenChange={setOpen}
          versions={mockVersions}
          onRestore={(versionId) => {
            alert(`Restoring version ${versionId}`);
            setOpen(false);
          }}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive demo with open/close and restore actions.",
      },
    },
  },
};

export const OlderVersions: Story = {
  args: {
    versions: [
      {
        _id: "v-1",
        title: "Annual Report 2023",
        _creationTime: now - 5 * 60 * 1000,
        createdByName: "Alice Chen",
      },
      {
        _id: "v-2",
        title: "Annual Report 2023",
        _creationTime: now - 14 * 24 * 60 * 60 * 1000, // 2 weeks ago
        createdByName: "Bob Wilson",
        changeDescription: "Q4 data update",
      },
      {
        _id: "v-3",
        title: "Annual Report 2023",
        _creationTime: now - 60 * 24 * 60 * 60 * 1000, // 2 months ago
        createdByName: "Alice Chen",
        changeDescription: "Initial draft for review",
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: "Versions with older dates showing absolute timestamps.",
      },
    },
  },
};
