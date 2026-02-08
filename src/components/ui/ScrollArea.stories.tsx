import type { Meta, StoryObj } from "@storybook/react";
import { Avatar } from "./Avatar";
import { Badge } from "./Badge";
import { Card, CardBody, CardHeader } from "./Card";
import { Flex } from "./Flex";
import { ScrollArea, ScrollBar } from "./ScrollArea";

const meta: Meta<typeof ScrollArea> = {
  title: "UI/ScrollArea",
  component: ScrollArea,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  argTypes: {
    className: {
      control: "text",
      description: "Additional CSS classes to apply to the scroll area",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ScrollArea>;

// ============================================================================
// Sample Data
// ============================================================================

const sampleTags = [
  "React",
  "TypeScript",
  "JavaScript",
  "Tailwind CSS",
  "Node.js",
  "GraphQL",
  "REST API",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "Docker",
  "Kubernetes",
  "AWS",
  "Vercel",
  "CI/CD",
];

const sampleNotifications = [
  { id: "1", title: "New comment on your issue", time: "2 min ago", unread: true },
  { id: "2", title: "Project deadline updated", time: "15 min ago", unread: true },
  { id: "3", title: "You were mentioned in a document", time: "1 hour ago", unread: false },
  { id: "4", title: "Sprint planning meeting scheduled", time: "2 hours ago", unread: false },
  { id: "5", title: "Code review requested", time: "3 hours ago", unread: false },
  { id: "6", title: "New team member joined", time: "5 hours ago", unread: false },
  { id: "7", title: "Weekly report generated", time: "Yesterday", unread: false },
  { id: "8", title: "System maintenance scheduled", time: "Yesterday", unread: false },
  { id: "9", title: "Your task was completed", time: "2 days ago", unread: false },
  { id: "10", title: "New feature released", time: "3 days ago", unread: false },
];

const sampleTeamMembers = [
  { id: "1", name: "Alice Johnson", role: "Engineering Lead", status: "online" },
  { id: "2", name: "Bob Smith", role: "Senior Developer", status: "online" },
  { id: "3", name: "Carol White", role: "Product Manager", status: "away" },
  { id: "4", name: "David Brown", role: "UX Designer", status: "offline" },
  { id: "5", name: "Eva Martinez", role: "Frontend Developer", status: "online" },
  { id: "6", name: "Frank Lee", role: "Backend Developer", status: "online" },
  { id: "7", name: "Grace Kim", role: "QA Engineer", status: "away" },
  { id: "8", name: "Henry Chen", role: "DevOps Engineer", status: "offline" },
  { id: "9", name: "Ivy Wang", role: "Data Analyst", status: "online" },
  { id: "10", name: "Jack Davis", role: "Technical Writer", status: "offline" },
];

const loremParagraphs = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget aliquam ultricies, nunc nisl aliquet nunc, quis aliquam nisl nunc eu nisl.",
  "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis.",
  "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias.",
  "Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae.",
  "Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.",
  "Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore.",
];

// ============================================================================
// Basic Vertical Scroll
// ============================================================================

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-72 w-full rounded-lg border border-ui-border">
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium text-ui-text">Scrollable Content</h4>
        <div className="space-y-4">
          {loremParagraphs.map((paragraph, index) => (
            <p key={index} className="text-sm text-ui-text-secondary">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </ScrollArea>
  ),
};

export const VerticalScroll: Story = {
  render: () => (
    <ScrollArea className="h-64 w-80 rounded-lg border border-ui-border">
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium text-ui-text">Notifications</h4>
        <Flex direction="column" gap="sm">
          {sampleNotifications.map((notification) => (
            <div
              key={notification.id}
              className="rounded-md border border-ui-border p-3 transition-colors hover:bg-ui-bg-hover"
            >
              <Flex justify="between" align="start">
                <div>
                  <p className="text-sm font-medium text-ui-text">{notification.title}</p>
                  <p className="text-xs text-ui-text-tertiary">{notification.time}</p>
                </div>
                {notification.unread && <span className="h-2 w-2 rounded-full bg-brand" />}
              </Flex>
            </div>
          ))}
        </Flex>
      </div>
    </ScrollArea>
  ),
};

// ============================================================================
// Horizontal Scroll
// ============================================================================

export const HorizontalScroll: Story = {
  render: () => (
    <ScrollArea className="w-96 whitespace-nowrap rounded-lg border border-ui-border">
      <div className="p-4">
        <Flex gap="sm">
          {sampleTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="shrink-0">
              {tag}
            </Badge>
          ))}
        </Flex>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
};

export const HorizontalCardList: Story = {
  render: () => (
    <ScrollArea className="w-full max-w-2xl whitespace-nowrap rounded-lg border border-ui-border">
      <div className="p-4">
        <Flex gap="md">
          {sampleTeamMembers.slice(0, 6).map((member) => (
            <Card key={member.id} className="w-48 shrink-0">
              <CardBody>
                <Flex direction="column" align="center" gap="sm" className="text-center">
                  <Avatar name={member.name} />
                  <div>
                    <p className="text-sm font-medium text-ui-text">{member.name}</p>
                    <p className="text-xs text-ui-text-tertiary">{member.role}</p>
                  </div>
                </Flex>
              </CardBody>
            </Card>
          ))}
        </Flex>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
};

// ============================================================================
// Both Directions
// ============================================================================

export const BothDirections: Story = {
  render: () => (
    <ScrollArea className="h-72 w-96 rounded-lg border border-ui-border">
      <div className="w-[600px] p-4">
        <h4 className="mb-4 text-sm font-medium text-ui-text">Wide Content</h4>
        <div className="space-y-4">
          {loremParagraphs.map((paragraph, index) => (
            <p key={index} className="text-sm text-ui-text-secondary whitespace-nowrap">
              {paragraph}
            </p>
          ))}
          {loremParagraphs.map((paragraph, index) => (
            <p key={`repeat-${index}`} className="text-sm text-ui-text-secondary whitespace-nowrap">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
      <ScrollBar orientation="vertical" />
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
};

export const DataGrid: Story = {
  render: () => (
    <ScrollArea className="h-64 w-96 rounded-lg border border-ui-border">
      <div className="p-1">
        <table className="w-[700px]">
          <thead>
            <tr className="border-b border-ui-border">
              <th className="sticky top-0 bg-ui-bg-soft px-4 py-2 text-left text-xs font-medium text-ui-text-secondary">
                Name
              </th>
              <th className="sticky top-0 bg-ui-bg-soft px-4 py-2 text-left text-xs font-medium text-ui-text-secondary">
                Role
              </th>
              <th className="sticky top-0 bg-ui-bg-soft px-4 py-2 text-left text-xs font-medium text-ui-text-secondary">
                Department
              </th>
              <th className="sticky top-0 bg-ui-bg-soft px-4 py-2 text-left text-xs font-medium text-ui-text-secondary">
                Status
              </th>
              <th className="sticky top-0 bg-ui-bg-soft px-4 py-2 text-left text-xs font-medium text-ui-text-secondary">
                Location
              </th>
            </tr>
          </thead>
          <tbody>
            {sampleTeamMembers.map((member) => (
              <tr key={member.id} className="border-b border-ui-border">
                <td className="px-4 py-2 text-sm text-ui-text">{member.name}</td>
                <td className="px-4 py-2 text-sm text-ui-text-secondary">{member.role}</td>
                <td className="px-4 py-2 text-sm text-ui-text-secondary">Engineering</td>
                <td className="px-4 py-2">
                  <Badge
                    variant={
                      member.status === "online"
                        ? "success"
                        : member.status === "away"
                          ? "warning"
                          : "neutral"
                    }
                    shape="pill"
                  >
                    {member.status}
                  </Badge>
                </td>
                <td className="px-4 py-2 text-sm text-ui-text-secondary">Remote</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ScrollBar orientation="vertical" />
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
};

// ============================================================================
// Common Use Cases
// ============================================================================

export const ListWithItems: Story = {
  render: () => (
    <ScrollArea className="h-80 w-72 rounded-lg border border-ui-border">
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium text-ui-text">Team Members</h4>
        <Flex direction="column" gap="xs">
          {sampleTeamMembers.map((member) => (
            <div
              key={member.id}
              className="rounded-md p-2 transition-colors hover:bg-ui-bg-hover cursor-pointer"
            >
              <Flex align="center" gap="sm">
                <Avatar size="sm" name={member.name} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ui-text truncate">{member.name}</p>
                  <p className="text-xs text-ui-text-tertiary truncate">{member.role}</p>
                </div>
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    member.status === "online"
                      ? "bg-status-success"
                      : member.status === "away"
                        ? "bg-status-warning"
                        : "bg-ui-text-tertiary"
                  }`}
                />
              </Flex>
            </div>
          ))}
        </Flex>
      </div>
    </ScrollArea>
  ),
};

export const DropdownMenu: Story = {
  render: () => (
    <Card className="w-56">
      <CardHeader title="Select Option" />
      <ScrollArea className="h-48">
        <div className="p-2">
          {Array.from({ length: 15 }, (_, i) => (
            <div
              key={i}
              className="rounded-md px-3 py-2 text-sm text-ui-text transition-colors hover:bg-ui-bg-hover cursor-pointer"
            >
              Option {i + 1}
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  ),
};

export const ChatMessages: Story = {
  render: () => {
    const messages = [
      {
        id: "1",
        sender: "Alice",
        text: "Hey, how's the project going?",
        time: "10:30 AM",
        isMe: false,
      },
      {
        id: "2",
        sender: "Me",
        text: "Going well! Just finished the UI components.",
        time: "10:32 AM",
        isMe: true,
      },
      {
        id: "3",
        sender: "Alice",
        text: "Great! Can you share a preview?",
        time: "10:33 AM",
        isMe: false,
      },
      {
        id: "4",
        sender: "Me",
        text: "Sure, let me push the latest changes first.",
        time: "10:35 AM",
        isMe: true,
      },
      { id: "5", sender: "Alice", text: "Perfect, take your time.", time: "10:36 AM", isMe: false },
      {
        id: "6",
        sender: "Me",
        text: "Done! Check the staging environment.",
        time: "10:45 AM",
        isMe: true,
      },
      {
        id: "7",
        sender: "Alice",
        text: "Looks amazing! Love the new design.",
        time: "10:48 AM",
        isMe: false,
      },
      {
        id: "8",
        sender: "Me",
        text: "Thanks! Let me know if you want any changes.",
        time: "10:50 AM",
        isMe: true,
      },
    ];

    return (
      <Card className="w-80">
        <CardHeader title="Chat" />
        <ScrollArea className="h-72">
          <div className="p-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    msg.isMe ? "bg-brand text-white" : "bg-ui-bg-soft text-ui-text"
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.isMe ? "text-white/70" : "text-ui-text-tertiary"
                    }`}
                  >
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    );
  },
};

export const CodePreview: Story = {
  render: () => (
    <ScrollArea className="h-64 w-full max-w-lg rounded-lg border border-ui-border bg-ui-bg-soft">
      <pre className="p-4 text-sm font-mono text-ui-text">
        <code>{`import { ScrollArea, ScrollBar } from "./ScrollArea";

function Example() {
  return (
    <ScrollArea className="h-72 w-96">
      <div className="p-4">
        {/* Your scrollable content */}
        <h4>Title</h4>
        <p>
          Lorem ipsum dolor sit amet, consectetur
          adipiscing elit. Nullam euismod, nisl eget
          aliquam ultricies, nunc nisl aliquet nunc.
        </p>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

export { Example };`}</code>
      </pre>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
};

export const ImageGallery: Story = {
  render: () => (
    <ScrollArea className="w-full max-w-xl whitespace-nowrap rounded-lg border border-ui-border">
      <div className="p-4">
        <Flex gap="md">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="h-32 w-40 shrink-0 rounded-lg bg-ui-bg-soft flex items-center justify-center"
            >
              <span className="text-ui-text-tertiary text-sm">Image {i + 1}</span>
            </div>
          ))}
        </Flex>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
};

// ============================================================================
// Size Variations
// ============================================================================

export const SmallHeight: Story = {
  render: () => (
    <ScrollArea className="h-32 w-64 rounded-lg border border-ui-border">
      <div className="p-3">
        <Flex direction="column" gap="xs">
          {sampleTags.slice(0, 8).map((tag) => (
            <div
              key={tag}
              className="rounded-md px-2 py-1 text-sm text-ui-text transition-colors hover:bg-ui-bg-hover cursor-pointer"
            >
              {tag}
            </div>
          ))}
        </Flex>
      </div>
    </ScrollArea>
  ),
};

export const LargeHeight: Story = {
  render: () => (
    <ScrollArea className="h-96 w-80 rounded-lg border border-ui-border">
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium text-ui-text">Activity Log</h4>
        <Flex direction="column" gap="md">
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="border-l-2 border-ui-border pl-4">
              <p className="text-sm text-ui-text">Activity item {i + 1}</p>
              <p className="text-xs text-ui-text-tertiary">
                {i === 0 ? "Just now" : `${i * 5} minutes ago`}
              </p>
            </div>
          ))}
        </Flex>
      </div>
    </ScrollArea>
  ),
};

// ============================================================================
// Nested ScrollAreas
// ============================================================================

export const NestedScrollAreas: Story = {
  render: () => (
    <Flex gap="md">
      <Card className="w-64">
        <CardHeader title="Left Panel" />
        <ScrollArea className="h-48">
          <div className="p-2">
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className="rounded-md px-3 py-2 text-sm text-ui-text transition-colors hover:bg-ui-bg-hover cursor-pointer"
              >
                Left Item {i + 1}
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
      <Card className="w-64">
        <CardHeader title="Right Panel" />
        <ScrollArea className="h-48">
          <div className="p-2">
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className="rounded-md px-3 py-2 text-sm text-ui-text transition-colors hover:bg-ui-bg-hover cursor-pointer"
              >
                Right Item {i + 1}
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </Flex>
  ),
};

// ============================================================================
// All Features Showcase
// ============================================================================

export const AllFeatures: Story = {
  render: () => (
    <Flex direction="column" gap="lg">
      <div>
        <h3 className="mb-3 text-sm font-medium text-ui-text-secondary">Vertical Scroll</h3>
        <ScrollArea className="h-40 w-64 rounded-lg border border-ui-border">
          <div className="p-4 space-y-2">
            {sampleNotifications.slice(0, 5).map((n) => (
              <p key={n.id} className="text-sm text-ui-text-secondary">
                {n.title}
              </p>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-ui-text-secondary">Horizontal Scroll</h3>
        <ScrollArea className="w-80 whitespace-nowrap rounded-lg border border-ui-border">
          <div className="p-4">
            <Flex gap="sm">
              {sampleTags.map((tag) => (
                <Badge key={tag} variant="outline" className="shrink-0">
                  {tag}
                </Badge>
              ))}
            </Flex>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-ui-text-secondary">Both Directions</h3>
        <ScrollArea className="h-40 w-80 rounded-lg border border-ui-border">
          <div className="w-[500px] p-4 space-y-2">
            {loremParagraphs.slice(0, 4).map((p, i) => (
              <p key={i} className="text-sm text-ui-text-secondary whitespace-nowrap">
                {p}
              </p>
            ))}
          </div>
          <ScrollBar orientation="vertical" />
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </Flex>
  ),
};
