import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardBody, CardHeader } from "./Card";
import { Flex } from "./Flex";
import { PaginationInfo } from "./PaginationInfo";
import { Typography } from "./Typography";

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof PaginationInfo> = {
  title: "Components/UI/PaginationInfo",
  component: PaginationInfo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A component displaying pagination status like 'Showing X of Y items'. Shows just the total when all items are loaded.",
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
    loaded: 25,
    total: 100,
  },
  parameters: {
    docs: {
      description: {
        story: "Default pagination info showing partial load.",
      },
    },
  },
};

export const AllLoaded: Story = {
  args: {
    loaded: 100,
    total: 100,
  },
  parameters: {
    docs: {
      description: {
        story: "When all items are loaded, shows just the total.",
      },
    },
  },
};

export const CustomItemName: Story = {
  args: {
    loaded: 15,
    total: 47,
    itemName: "issues",
  },
  parameters: {
    docs: {
      description: {
        story: "With a custom item name.",
      },
    },
  },
};

export const SingleItem: Story = {
  args: {
    loaded: 1,
    total: 1,
    itemName: "result",
  },
  parameters: {
    docs: {
      description: {
        story: "Single item loaded.",
      },
    },
  },
};

export const LargeNumbers: Story = {
  args: {
    loaded: 250,
    total: 1523,
    itemName: "records",
  },
  parameters: {
    docs: {
      description: {
        story: "With larger numbers.",
      },
    },
  },
};

export const SmallPartialLoad: Story = {
  args: {
    loaded: 3,
    total: 50,
    itemName: "comments",
  },
  parameters: {
    docs: {
      description: {
        story: "Early in pagination with few items loaded.",
      },
    },
  },
};

export const InListHeader: Story = {
  render: () => (
    <Card>
      <CardHeader title="Issues" />
      <CardBody>
        <Flex justify="between" align="center" className="mb-3">
          <PaginationInfo loaded={25} total={147} itemName="issues" />
          <button type="button" className="text-sm text-brand hover:underline">
            Load more
          </button>
        </Flex>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-3 py-2 bg-ui-bg-secondary rounded border border-ui-border">
              <Typography variant="small">Issue {i}</Typography>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: "Pagination info used in a list header.",
      },
    },
  },
};

export const InTableFooter: Story = {
  render: () => (
    <div className="w-96">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ui-border">
            <th className="text-left py-2 px-3">Name</th>
            <th className="text-left py-2 px-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {["Alice", "Bob", "Charlie"].map((name) => (
            <tr key={name} className="border-b border-ui-border">
              <td className="py-2 px-3">{name}</td>
              <td className="py-2 px-3">Active</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Flex justify="between" align="center" className="py-3 px-3 bg-ui-bg-secondary">
        <PaginationInfo loaded={3} total={25} itemName="users" />
        <Flex gap="sm">
          <button type="button" className="text-sm text-ui-text-tertiary">
            Previous
          </button>
          <button type="button" className="text-sm text-brand">
            Next
          </button>
        </Flex>
      </Flex>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Pagination info in a table footer.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-96 bg-ui-bg border border-ui-border rounded-lg overflow-hidden">
        <Story />
      </div>
    ),
  ],
};

export const DifferentItemTypes: Story = {
  render: () => (
    <div className="space-y-3">
      <Flex justify="between" align="center" className="px-3 py-2 bg-ui-bg-secondary rounded">
        <Typography variant="small">Projects</Typography>
        <PaginationInfo loaded={5} total={12} itemName="projects" />
      </Flex>
      <Flex justify="between" align="center" className="px-3 py-2 bg-ui-bg-secondary rounded">
        <Typography variant="small">Documents</Typography>
        <PaginationInfo loaded={25} total={89} itemName="documents" />
      </Flex>
      <Flex justify="between" align="center" className="px-3 py-2 bg-ui-bg-secondary rounded">
        <Typography variant="small">Team Members</Typography>
        <PaginationInfo loaded={8} total={8} itemName="members" />
      </Flex>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Multiple pagination infos with different item types.",
      },
    },
  },
};
