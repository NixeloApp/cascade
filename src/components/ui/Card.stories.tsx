import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";
import {
  Card,
  CardBody,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./Card";
import { Flex } from "./Flex";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "soft", "flat"],
      description: "Visual variant of the card",
    },
    hoverable: {
      control: "boolean",
      description: "Whether the card has hover effects",
    },
    onClick: {
      action: "clicked",
      description: "Click handler for interactive cards",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

// ============================================================================
// Card Variants
// ============================================================================

export const Default: Story = {
  args: {
    variant: "default",
    children: (
      <CardBody>
        <p className="text-ui-text">
          This is the default card variant with standard background and shadow.
        </p>
      </CardBody>
    ),
  },
};

export const Soft: Story = {
  args: {
    variant: "soft",
    children: (
      <CardBody>
        <p className="text-ui-text">
          This is the soft card variant with a softer background color.
        </p>
      </CardBody>
    ),
  },
};

export const Flat: Story = {
  args: {
    variant: "flat",
    children: (
      <CardBody>
        <p className="text-ui-text">This is the flat card variant without shadow.</p>
      </CardBody>
    ),
  },
};

// ============================================================================
// Hoverable State
// ============================================================================

export const Hoverable: Story = {
  args: {
    hoverable: true,
    children: (
      <CardBody>
        <p className="text-ui-text">Hover over this card to see the hover effect.</p>
      </CardBody>
    ),
  },
};

export const HoverableWithVariants: Story = {
  render: () => (
    <Flex gap="md" wrap>
      <Card hoverable variant="default" className="w-64">
        <CardBody>
          <p className="text-ui-text font-medium">Default Hoverable</p>
          <p className="text-ui-text-secondary text-sm mt-1">Hover to see effect</p>
        </CardBody>
      </Card>
      <Card hoverable variant="soft" className="w-64">
        <CardBody>
          <p className="text-ui-text font-medium">Soft Hoverable</p>
          <p className="text-ui-text-secondary text-sm mt-1">Hover to see effect</p>
        </CardBody>
      </Card>
      <Card hoverable variant="flat" className="w-64">
        <CardBody>
          <p className="text-ui-text font-medium">Flat Hoverable</p>
          <p className="text-ui-text-secondary text-sm mt-1">Hover to see effect</p>
        </CardBody>
      </Card>
    </Flex>
  ),
};

// ============================================================================
// Card with CardHeader
// ============================================================================

export const WithHeaderTitleOnly: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader title="Card Title" />
      <CardBody>
        <p className="text-ui-text">Card content goes here.</p>
      </CardBody>
    </Card>
  ),
};

export const WithHeaderTitleAndDescription: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader title="Project Overview" description="View and manage your project details" />
      <CardBody>
        <p className="text-ui-text">This card has both a title and description in the header.</p>
      </CardBody>
    </Card>
  ),
};

export const WithHeaderAndAction: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader
        title="Team Members"
        description="Manage your team"
        action={<Button size="sm">Add Member</Button>}
      />
      <CardBody>
        <p className="text-ui-text">The header includes an action button on the right side.</p>
      </CardBody>
    </Card>
  ),
};

export const WithHeaderChildren: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Custom Header</CardTitle>
        <CardDescription>Using CardTitle and CardDescription as children</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-ui-text">This uses the children pattern for the header.</p>
      </CardContent>
    </Card>
  ),
};

// ============================================================================
// Card with CardBody
// ============================================================================

export const WithBodyOnly: Story = {
  render: () => (
    <Card className="w-80">
      <CardBody>
        <p className="text-ui-text">
          A simple card with only CardBody content. This is useful for basic content containers.
        </p>
      </CardBody>
    </Card>
  ),
};

export const WithBodyRichContent: Story = {
  render: () => (
    <Card className="w-96">
      <CardBody>
        <Flex direction="column" gap="sm">
          <h4 className="text-lg font-semibold text-ui-text">Rich Content Example</h4>
          <p className="text-ui-text-secondary">
            Cards can contain any type of content including lists, images, and interactive elements.
          </p>
          <ul className="list-disc list-inside text-ui-text-secondary space-y-1">
            <li>Feature one</li>
            <li>Feature two</li>
            <li>Feature three</li>
          </ul>
        </Flex>
      </CardBody>
    </Card>
  ),
};

// ============================================================================
// Complete Card
// ============================================================================

export const CompleteCard: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader
        title="Complete Card Example"
        description="This card demonstrates all sections"
        action={
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        }
      />
      <CardBody>
        <Flex direction="column" gap="sm">
          <p className="text-ui-text">
            This is a complete card with header, body, and footer sections.
          </p>
          <p className="text-ui-text-secondary text-sm">
            Use this pattern for content that needs actions at both the top and bottom.
          </p>
        </Flex>
      </CardBody>
      <CardFooter className="border-t border-ui-border pt-4">
        <Flex justify="end" gap="sm" className="w-full">
          <Button variant="outline">Cancel</Button>
          <Button>Save</Button>
        </Flex>
      </CardFooter>
    </Card>
  ),
};

export const CompleteCardWithContent: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Using CardContent</CardTitle>
        <CardDescription>With CardContent instead of CardBody</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-ui-text">
          CardContent has different padding than CardBody. Use CardContent when following the
          shadcn/ui pattern, or CardBody for the custom Nixelo pattern.
        </p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Continue</Button>
      </CardFooter>
    </Card>
  ),
};

// ============================================================================
// Interactive Card
// ============================================================================

export const InteractiveCard: Story = {
  args: {
    hoverable: true,
    onClick: () => alert("Card clicked!"),
    children: (
      <CardBody>
        <Flex direction="column" gap="xs">
          <h4 className="text-lg font-semibold text-ui-text">Interactive Card</h4>
          <p className="text-ui-text-secondary">
            Click anywhere on this card to trigger the onClick handler. It also responds to Enter
            and Space keys for accessibility.
          </p>
        </Flex>
      </CardBody>
    ),
  },
};

export const InteractiveCardGrid: Story = {
  render: () => {
    const handleClick = (item: string) => {
      alert(`Selected: ${item}`);
    };

    return (
      <Flex gap="md" wrap>
        {["Dashboard", "Projects", "Settings", "Profile"].map((item) => (
          <Card key={item} hoverable onClick={() => handleClick(item)} className="w-48">
            <CardBody>
              <Flex direction="column" align="center" gap="xs" className="text-center">
                <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center">
                  <span className="text-brand font-bold">{item[0]}</span>
                </div>
                <span className="text-ui-text font-medium">{item}</span>
              </Flex>
            </CardBody>
          </Card>
        ))}
      </Flex>
    );
  },
};

// ============================================================================
// All Variants Comparison
// ============================================================================

export const AllVariants: Story = {
  render: () => (
    <Flex direction="column" gap="lg">
      <Flex gap="md" wrap>
        <Card variant="default" className="w-64">
          <CardHeader title="Default" description="Standard card style" />
          <CardBody>
            <p className="text-ui-text-secondary text-sm">With shadow and border</p>
          </CardBody>
        </Card>
        <Card variant="soft" className="w-64">
          <CardHeader title="Soft" description="Soft background" />
          <CardBody>
            <p className="text-ui-text-secondary text-sm">Subtle background color</p>
          </CardBody>
        </Card>
        <Card variant="flat" className="w-64">
          <CardHeader title="Flat" description="No shadow" />
          <CardBody>
            <p className="text-ui-text-secondary text-sm">Border only, no shadow</p>
          </CardBody>
        </Card>
      </Flex>
    </Flex>
  ),
};
