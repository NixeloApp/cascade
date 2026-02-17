import type { Meta, StoryObj } from "@storybook/react";
import type { LucideIcon } from "lucide-react";
import { Archive, File, FileImage, FileSpreadsheet, FileText, Paperclip } from "@/lib/icons";
import { Flex, FlexItem } from "./ui/Flex";
import { Grid } from "./ui/Grid";
import { Icon } from "./ui/Icon";
import { Tooltip } from "./ui/Tooltip";
import { Typography } from "./ui/Typography";

// =============================================================================
// Types
// =============================================================================

interface Attachment {
  id: string;
  filename: string;
  url: string;
}

interface AttachmentListPresentationalProps {
  attachments?: Attachment[];
  canEdit?: boolean;
  isLoading?: boolean;
  onRemove?: (id: string) => void;
  onDownload?: (id: string) => void;
}

// =============================================================================
// Helper Functions
// =============================================================================

function getFileIcon(filename: string): LucideIcon {
  const ext = filename.split(".").pop()?.toLowerCase() || "";

  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    return FileImage;
  }
  if (ext === "pdf") {
    return FileText;
  }
  if (["txt", "md"].includes(ext)) {
    return File;
  }
  if (ext === "zip") {
    return Archive;
  }
  if (["json", "csv"].includes(ext)) {
    return FileSpreadsheet;
  }
  return Paperclip;
}

// =============================================================================
// Presentational Components
// =============================================================================

function AttachmentItemPresentational({
  attachment,
  canEdit,
  onRemove,
  onDownload,
}: {
  attachment: Attachment;
  canEdit: boolean;
  onRemove?: () => void;
  onDownload?: () => void;
}) {
  const fileIcon = getFileIcon(attachment.filename);

  return (
    <Flex
      align="center"
      gap="sm"
      className="p-2.5 bg-ui-bg-soft rounded-lg border border-ui-border hover:bg-ui-bg-hover hover:border-ui-border-secondary transition-colors duration-default group"
    >
      <Icon icon={fileIcon} size="lg" />
      <FlexItem flex="1" className="min-w-0">
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-ui-text hover:text-brand hover:underline truncate block transition-colors duration-default"
        >
          {attachment.filename}
        </a>
      </FlexItem>
      <Flex
        gap="xs"
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-default"
      >
        <Tooltip content="Download attachment">
          <button
            type="button"
            onClick={onDownload}
            className="p-1.5 text-ui-text-tertiary hover:text-ui-text rounded-md hover:bg-ui-bg-tertiary transition-colors duration-default"
            aria-label="Download attachment"
          >
            <svg
              aria-hidden="true"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>
        </Tooltip>
        {canEdit && (
          <Tooltip content="Remove attachment">
            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 text-ui-text-tertiary hover:text-status-error rounded-md hover:bg-status-error-bg transition-colors duration-default"
              aria-label="Remove attachment"
            >
              <svg
                aria-hidden="true"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </Tooltip>
        )}
      </Flex>
    </Flex>
  );
}

function AttachmentItemLoading() {
  return (
    <Flex
      align="center"
      gap="sm"
      className="p-2.5 bg-ui-bg-soft rounded-lg border border-ui-border"
    >
      <div className="animate-pulse h-8 w-8 bg-ui-bg-tertiary rounded-md" />
      <FlexItem flex="1">
        <div className="animate-pulse h-4 bg-ui-bg-tertiary rounded-md" />
      </FlexItem>
    </Flex>
  );
}

function AttachmentListPresentational({
  attachments = [],
  canEdit = false,
  isLoading = false,
  onRemove = () => {},
  onDownload = () => {},
}: AttachmentListPresentationalProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Typography variant="h4" className="text-sm font-medium text-ui-text">
          Attachments
        </Typography>
        <Flex direction="column" gap="sm">
          <AttachmentItemLoading />
          <AttachmentItemLoading />
        </Flex>
      </div>
    );
  }

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Typography variant="h4" className="text-sm font-medium text-ui-text">
        Attachments ({attachments.length})
      </Typography>
      <Flex direction="column" gap="sm">
        {attachments.map((attachment) => (
          <AttachmentItemPresentational
            key={attachment.id}
            attachment={attachment}
            canEdit={canEdit}
            onRemove={() => onRemove(attachment.id)}
            onDownload={() => onDownload(attachment.id)}
          />
        ))}
      </Flex>
    </div>
  );
}

// =============================================================================
// Mock Data
// =============================================================================

const mockAttachments: Attachment[] = [
  { id: "att-1", filename: "screenshot.png", url: "#" },
  { id: "att-2", filename: "report.pdf", url: "#" },
  { id: "att-3", filename: "data.csv", url: "#" },
];

const mockAttachmentsVaried: Attachment[] = [
  { id: "att-1", filename: "user-interface-mockup.png", url: "#" },
  { id: "att-2", filename: "technical-specification.pdf", url: "#" },
  { id: "att-3", filename: "export-data.csv", url: "#" },
  { id: "att-4", filename: "readme.md", url: "#" },
  { id: "att-5", filename: "archive.zip", url: "#" },
  { id: "att-6", filename: "config.json", url: "#" },
];

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof AttachmentListPresentational> = {
  title: "Components/AttachmentList",
  component: AttachmentListPresentational,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A list of file attachments with download and remove actions. Shows appropriate file type icons based on extension.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-80 p-4 bg-ui-bg border border-ui-border rounded-lg">
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
    attachments: mockAttachments,
    canEdit: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Attachment list in read-only mode (no remove button).",
      },
    },
  },
};

export const Editable: Story = {
  args: {
    attachments: mockAttachments,
    canEdit: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Attachment list with edit permissions showing remove button on hover.",
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
    attachments: [],
  },
  parameters: {
    docs: {
      description: {
        story: "Empty state - renders nothing when no attachments.",
      },
    },
  },
};

export const SingleAttachment: Story = {
  args: {
    attachments: [mockAttachments[0]],
    canEdit: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Single attachment file.",
      },
    },
  },
};

export const ManyAttachments: Story = {
  args: {
    attachments: mockAttachmentsVaried,
    canEdit: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Multiple attachments with various file types.",
      },
    },
  },
};

export const FileTypeIcons: Story = {
  render: () => {
    const fileTypes = [
      { name: "Image", filename: "photo.png", icon: FileImage },
      { name: "PDF", filename: "document.pdf", icon: FileText },
      { name: "Text", filename: "notes.txt", icon: File },
      { name: "Markdown", filename: "readme.md", icon: File },
      { name: "Archive", filename: "files.zip", icon: Archive },
      { name: "Spreadsheet", filename: "data.csv", icon: FileSpreadsheet },
      { name: "JSON", filename: "config.json", icon: FileSpreadsheet },
      { name: "Other", filename: "unknown.xyz", icon: Paperclip },
    ];

    return (
      <div className="space-y-3">
        <Typography variant="label" className="block">
          File Type Icons
        </Typography>
        <Grid cols={2} gap="sm">
          {fileTypes.map((type) => (
            <Flex key={type.filename} align="center" gap="sm" className="p-2 bg-ui-bg-soft rounded">
              <Icon icon={type.icon} size="md" />
              <div>
                <Typography variant="small" className="font-medium">
                  {type.name}
                </Typography>
                <Typography variant="caption" color="tertiary">
                  {type.filename}
                </Typography>
              </div>
            </Flex>
          ))}
        </Grid>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Showcase of all file type icons based on file extension.",
      },
    },
  },
};

export const InIssueDetail: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <div>
        <Typography variant="h3" className="text-lg font-semibold">
          Fix login button alignment
        </Typography>
        <Typography variant="p" color="secondary" className="mt-1">
          The login button is misaligned on mobile devices when the keyboard is visible.
        </Typography>
      </div>
      <div className="border-t border-ui-border pt-4">
        <AttachmentListPresentational attachments={mockAttachments} canEdit={true} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Attachment list shown in the context of an issue detail view.",
      },
    },
  },
};

export const LongFilenames: Story = {
  args: {
    attachments: [
      {
        id: "att-1",
        filename: "this-is-a-very-long-filename-that-should-be-truncated-properly.png",
        url: "#",
      },
      {
        id: "att-2",
        filename: "another-extremely-long-document-name-for-testing-purposes.pdf",
        url: "#",
      },
    ],
    canEdit: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Handling of long filenames with truncation.",
      },
    },
  },
};
