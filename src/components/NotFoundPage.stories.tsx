import type { Meta, StoryObj } from "@storybook/react";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Flex } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";

// =============================================================================
// Presentational Component
// =============================================================================

interface NotFoundPagePresentationalProps {
  errorCode?: string;
  message?: string;
  description?: string;
  showHomeButton?: boolean;
  onHomeClick?: () => void;
}

function NotFoundPagePresentational({
  errorCode = "404",
  message = "Page not found",
  description = "The page you are looking for does not exist or has been moved.",
  showHomeButton = true,
  onHomeClick = () => {},
}: NotFoundPagePresentationalProps) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      className="min-h-screen bg-ui-bg animate-fade-in"
    >
      <Flex direction="column" align="center" className="max-w-md text-center px-6">
        <Flex align="center" justify="center" className="mb-8 h-20 w-20 rounded-full bg-ui-bg-soft">
          <FileQuestion className="h-10 w-10 text-ui-text-tertiary" />
        </Flex>

        <Typography variant="h1" className="text-8xl font-bold tracking-tightest text-ui-text">
          {errorCode}
        </Typography>

        <Typography className="mt-4 text-lg text-ui-text-secondary">{message}</Typography>
        <Typography className="mt-2 text-ui-text-tertiary">{description}</Typography>

        {showHomeButton && (
          <Button size="lg" className="mt-8" onClick={onHomeClick}>
            Return home
          </Button>
        )}
      </Flex>
    </Flex>
  );
}

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof NotFoundPagePresentational> = {
  title: "Components/NotFoundPage",
  component: NotFoundPagePresentational,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A 404 error page displayed when users navigate to a non-existent route. Features a centered layout with error code, message, and navigation back home.",
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
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Default 404 page with standard messaging.",
      },
    },
  },
};

export const Error403: Story = {
  args: {
    errorCode: "403",
    message: "Access forbidden",
    description: "You don't have permission to access this resource.",
  },
  parameters: {
    docs: {
      description: {
        story: "Forbidden error page for access denied scenarios.",
      },
    },
  },
};

export const Error500: Story = {
  args: {
    errorCode: "500",
    message: "Server error",
    description: "Something went wrong on our end. Please try again later.",
  },
  parameters: {
    docs: {
      description: {
        story: "Internal server error page.",
      },
    },
  },
};

export const WithoutHomeButton: Story = {
  args: {
    showHomeButton: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Error page without the return home button.",
      },
    },
  },
};

export const CustomMessage: Story = {
  args: {
    errorCode: "404",
    message: "Project not found",
    description:
      "The project you're looking for may have been deleted or you don't have access to it.",
  },
  parameters: {
    docs: {
      description: {
        story: "Customized 404 for specific resource not found.",
      },
    },
  },
};

export const InContainer: Story = {
  render: () => (
    <div className="h-[600px] border border-ui-border rounded-lg overflow-hidden">
      <NotFoundPagePresentational />
    </div>
  ),
  parameters: {
    layout: "centered",
    docs: {
      description: {
        story: "Error page shown within a container (for embedded use cases).",
      },
    },
  },
};
