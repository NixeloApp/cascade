import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "./ui/Avatar";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Flex, FlexItem } from "./ui/Flex";
import { Typography } from "./ui/Typography";

// =============================================================================
// Types
// =============================================================================

interface Member {
  _id: string;
  userId: string;
  userName: string;
}

interface MentionInputPresentationalProps {
  value?: string;
  placeholder?: string;
  members?: Member[];
  showSuggestions?: boolean;
  mentionSearch?: string;
  selectedIndex?: number;
  className?: string;
  onChange?: (value: string) => void;
  onSelectMember?: (member: Member) => void;
}

// =============================================================================
// Presentational Component
// =============================================================================

function MentionInputPresentational({
  value = "",
  placeholder = "Add a comment...",
  members = [],
  showSuggestions = false,
  mentionSearch = "",
  selectedIndex = 0,
  className = "",
  onChange = () => {},
  onSelectMember = () => {},
}: MentionInputPresentationalProps) {
  const filteredMembers = members.filter((member) =>
    (member.userName || "").toLowerCase().includes(mentionSearch.toLowerCase()),
  );

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full px-3 py-2 border border-ui-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-ring bg-ui-bg text-ui-text resize-none overflow-hidden",
          className,
        )}
        rows={3}
      />

      {/* Mention Suggestions Dropdown */}
      {showSuggestions && filteredMembers.length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-ui-bg border border-ui-border rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
          {filteredMembers.map((member, index) => (
            <button
              type="button"
              key={member._id}
              onClick={() => onSelectMember(member)}
              className={cn(
                "w-full px-4 py-2 text-left hover:bg-ui-bg-tertiary flex items-center gap-3",
                index === selectedIndex && "bg-ui-bg-tertiary",
              )}
            >
              <Avatar name={member.userName} size="md" />
              <FlexItem flex="1" className="min-w-0">
                <Typography variant="p" className="font-medium truncate">
                  {member.userName}
                </Typography>
                <Typography variant="caption" className="capitalize">
                  User
                </Typography>
              </FlexItem>
            </button>
          ))}
        </div>
      )}

      <Typography variant="caption" className="mt-1">
        Type @ to mention team members
      </Typography>
    </div>
  );
}

// =============================================================================
// Mock Data
// =============================================================================

const mockMembers: Member[] = [
  { _id: "m-1", userId: "u-1", userName: "Alice Chen" },
  { _id: "m-2", userId: "u-2", userName: "Bob Wilson" },
  { _id: "m-3", userId: "u-3", userName: "Charlie Brown" },
  { _id: "m-4", userId: "u-4", userName: "Diana Ross" },
  { _id: "m-5", userId: "u-5", userName: "Edward Smith" },
];

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof MentionInputPresentational> = {
  title: "Components/MentionInput",
  component: MentionInputPresentational,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A textarea input with @mention support. Shows a dropdown of team members when typing @ followed by text.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-96 p-4 bg-ui-bg border border-ui-border rounded-lg">
        <div className="pt-20">
          <Story />
        </div>
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
    placeholder: "Add a comment...",
  },
  parameters: {
    docs: {
      description: {
        story: "Default empty mention input.",
      },
    },
  },
};

export const WithValue: Story = {
  args: {
    value: "This is a great feature! Let me know what you think.",
  },
  parameters: {
    docs: {
      description: {
        story: "Mention input with existing text.",
      },
    },
  },
};

export const WithSuggestions: Story = {
  args: {
    value: "Hey @",
    members: mockMembers,
    showSuggestions: true,
    mentionSearch: "",
  },
  parameters: {
    docs: {
      description: {
        story: "Dropdown showing when @ is typed.",
      },
    },
  },
};

export const FilteredSuggestions: Story = {
  args: {
    value: "Hey @ali",
    members: mockMembers,
    showSuggestions: true,
    mentionSearch: "ali",
    selectedIndex: 0,
  },
  parameters: {
    docs: {
      description: {
        story: "Filtered suggestions based on typed text.",
      },
    },
  },
};

export const WithSelectedSuggestion: Story = {
  args: {
    value: "Hey @",
    members: mockMembers,
    showSuggestions: true,
    mentionSearch: "",
    selectedIndex: 2,
  },
  parameters: {
    docs: {
      description: {
        story: "A suggestion is selected via keyboard navigation.",
      },
    },
  },
};

export const WithMention: Story = {
  args: {
    value: "Hey @[Alice Chen](u-1), can you review this? Thanks!",
  },
  parameters: {
    docs: {
      description: {
        story: "Input with an inserted mention (raw format).",
      },
    },
  },
};

export const CustomPlaceholder: Story = {
  args: {
    placeholder: "Reply to this thread...",
  },
  parameters: {
    docs: {
      description: {
        story: "Custom placeholder text.",
      },
    },
  },
};

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [mentionSearch, setMentionSearch] = useState("");

    const handleChange = (newValue: string) => {
      setValue(newValue);

      // Check if user is typing @ mention
      const mentionMatch = newValue.match(/@(\w*)$/);
      if (mentionMatch) {
        setMentionSearch(mentionMatch[1]);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    };

    const handleSelectMember = (member: Member) => {
      const atIndex = value.lastIndexOf("@");
      const beforeMention = value.substring(0, atIndex);
      const mention = `@[${member.userName}](${member.userId})`;
      setValue(`${beforeMention}${mention} `);
      setShowSuggestions(false);
    };

    return (
      <MentionInputPresentational
        value={value}
        onChange={handleChange}
        members={mockMembers}
        showSuggestions={showSuggestions}
        mentionSearch={mentionSearch}
        onSelectMember={handleSelectMember}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive demo - type @ to see suggestions.",
      },
    },
  },
};

export const InCommentSection: Story = {
  render: () => (
    <Card className="w-full max-w-md">
      <CardHeader title="Comments" description="3 comments" />
      <CardBody>
        <Flex direction="column" gap="md">
          {/* Existing comments */}
          <Flex gap="sm" align="start">
            <Avatar name="Alice Chen" size="sm" />
            <FlexItem flex="1">
              <Typography variant="small" className="font-medium">
                Alice Chen
              </Typography>
              <Typography variant="p" className="text-ui-text-secondary">
                Looks good to me! Ship it.
              </Typography>
            </FlexItem>
          </Flex>
          <Flex gap="sm" align="start">
            <Avatar name="Bob Wilson" size="sm" />
            <FlexItem flex="1">
              <Typography variant="small" className="font-medium">
                Bob Wilson
              </Typography>
              <Typography variant="p" className="text-ui-text-secondary">
                @Alice Chen agreed, let's merge this.
              </Typography>
            </FlexItem>
          </Flex>

          {/* Add comment input */}
          <div className="border-t border-ui-border pt-4">
            <MentionInputPresentational placeholder="Add a comment..." members={mockMembers} />
          </div>
        </Flex>
      </CardBody>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: "Mention input in the context of a comment section.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-md p-4 bg-ui-bg">
        <Story />
      </div>
    ),
  ],
};

export const ManyMembers: Story = {
  args: {
    value: "Hey @",
    members: [
      ...mockMembers,
      { _id: "m-6", userId: "u-6", userName: "Frank Johnson" },
      { _id: "m-7", userId: "u-7", userName: "Grace Lee" },
      { _id: "m-8", userId: "u-8", userName: "Henry Davis" },
      { _id: "m-9", userId: "u-9", userName: "Iris Wang" },
      { _id: "m-10", userId: "u-10", userName: "Jack Thompson" },
    ],
    showSuggestions: true,
    mentionSearch: "",
  },
  parameters: {
    docs: {
      description: {
        story: "Scrollable suggestions dropdown with many members.",
      },
    },
  },
};
