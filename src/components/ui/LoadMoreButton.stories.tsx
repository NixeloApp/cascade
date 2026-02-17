import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Card, CardBody } from "./Card";
import { Flex } from "./Flex";
import { LoadMoreButton } from "./LoadMoreButton";
import { Typography } from "./Typography";

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof LoadMoreButton> = {
  title: "Components/UI/LoadMoreButton",
  component: LoadMoreButton,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A button component for loading more items in paginated lists. Supports loading state, remaining count display, and custom labels.",
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
    onClick: () => alert("Loading more..."),
  },
  parameters: {
    docs: {
      description: {
        story: "Default load more button.",
      },
    },
  },
};

export const WithRemainingCount: Story = {
  args: {
    onClick: () => alert("Loading more..."),
    remainingCount: 47,
  },
  parameters: {
    docs: {
      description: {
        story: "Shows how many more items are available.",
      },
    },
  },
};

export const Loading: Story = {
  args: {
    onClick: () => {},
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Button in loading state.",
      },
    },
  },
};

export const LoadingWithCount: Story = {
  args: {
    onClick: () => {},
    isLoading: true,
    remainingCount: 25,
  },
  parameters: {
    docs: {
      description: {
        story: "Loading state with remaining count.",
      },
    },
  },
};

export const CustomLabel: Story = {
  args: {
    onClick: () => alert("Loading more..."),
    label: "Show older comments",
  },
  parameters: {
    docs: {
      description: {
        story: "Button with a custom label.",
      },
    },
  },
};

export const SmallRemainingCount: Story = {
  args: {
    onClick: () => alert("Loading more..."),
    remainingCount: 3,
  },
  parameters: {
    docs: {
      description: {
        story: "When only a few items remain.",
      },
    },
  },
};

export const Interactive: Story = {
  render: () => {
    const [items, setItems] = useState(["Item 1", "Item 2", "Item 3"]);
    const [isLoading, setIsLoading] = useState(false);
    const totalItems = 10;

    const loadMore = () => {
      setIsLoading(true);
      setTimeout(() => {
        const nextIndex = items.length + 1;
        const newItems = Array.from(
          { length: Math.min(3, totalItems - items.length) },
          (_, i) => `Item ${nextIndex + i}`,
        );
        setItems([...items, ...newItems]);
        setIsLoading(false);
      }, 1000);
    };

    const remaining = totalItems - items.length;

    return (
      <Card>
        <CardBody className="space-y-3">
          <Typography variant="label">Items List</Typography>
          {items.map((item) => (
            <div
              key={item}
              className="px-3 py-2 bg-ui-bg-secondary rounded border border-ui-border"
            >
              <Typography variant="small">{item}</Typography>
            </div>
          ))}
          {remaining > 0 && (
            <LoadMoreButton onClick={loadMore} isLoading={isLoading} remainingCount={remaining} />
          )}
          {remaining === 0 && (
            <Typography variant="caption" color="tertiary" className="text-center py-2">
              All items loaded
            </Typography>
          )}
        </CardBody>
      </Card>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive demo - click to load more items.",
      },
    },
  },
};

export const InList: Story = {
  render: () => (
    <Card>
      <CardBody className="space-y-2">
        <Flex justify="between" align="center" className="mb-2">
          <Typography variant="label">Recent Activity</Typography>
          <Typography variant="caption" color="tertiary">
            Showing 5 of 52
          </Typography>
        </Flex>
        {[
          "Created issue PROJ-123",
          "Updated issue PROJ-122",
          "Commented on PROJ-121",
          "Closed issue PROJ-120",
          "Assigned PROJ-119",
        ].map((activity) => (
          <div
            key={activity}
            className="px-3 py-2 bg-ui-bg-secondary rounded border border-ui-border"
          >
            <Typography variant="small">{activity}</Typography>
          </div>
        ))}
        <LoadMoreButton onClick={() => alert("Loading more...")} remainingCount={47} />
      </CardBody>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: "Load more button in a typical list context.",
      },
    },
  },
};
