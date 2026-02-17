import type { Meta, StoryObj } from "@storybook/react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./ui/Button";
import { Flex } from "./ui/Flex";
import { Typography } from "./ui/Typography";

// =============================================================================
// Presentational Error UI
// =============================================================================

interface ErrorFallbackProps {
  errorMessage?: string;
  showDetails?: boolean;
  onTryAgain?: () => void;
  onReload?: () => void;
}

function ErrorFallbackPresentational({
  errorMessage = "An unexpected error occurred",
  showDetails = true,
  onTryAgain = () => {},
  onReload = () => {},
}: ErrorFallbackProps) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      className="min-h-[400px] bg-ui-bg animate-fade-in"
    >
      <Flex direction="column" align="center" className="max-w-md text-center px-6">
        {/* Subtle icon */}
        <Flex
          align="center"
          justify="center"
          className="mb-8 h-20 w-20 rounded-full bg-status-error-bg"
        >
          <AlertTriangle className="h-10 w-10 text-status-error" />
        </Flex>

        {/* Large error code with tight tracking */}
        <Typography variant="h1" className="text-8xl font-bold tracking-tightest text-ui-text">
          500
        </Typography>

        {/* Message with secondary text styling */}
        <Typography className="mt-4 text-lg text-ui-text-secondary">
          Something went wrong
        </Typography>
        <Typography className="mt-2 text-ui-text-tertiary">
          We encountered an unexpected error. Please try refreshing the page.
        </Typography>

        {/* Error details collapsible */}
        {showDetails && errorMessage && (
          <details className="mt-6 w-full text-left">
            <summary className="cursor-pointer text-sm text-ui-text-secondary hover:text-ui-text transition-default">
              View error details
            </summary>
            <pre className="mt-2 text-xs bg-ui-bg-tertiary text-ui-text-secondary p-4 rounded-lg overflow-auto max-h-40">
              {errorMessage}
            </pre>
          </details>
        )}

        {/* Action buttons */}
        <Flex gap="md" className="mt-8">
          <Button variant="secondary" onClick={onTryAgain} size="lg">
            Try again
          </Button>
          <Button onClick={onReload} size="lg">
            Reload page
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
}

// =============================================================================
// Custom Fallback Variants
// =============================================================================

function MinimalErrorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <Flex direction="column" align="center" justify="center" className="p-8 text-center">
      <AlertTriangle className="h-8 w-8 text-status-error mb-4" />
      <Typography variant="p" className="font-medium">
        Something went wrong
      </Typography>
      <Typography variant="small" color="secondary" className="mt-1">
        Please try again
      </Typography>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      )}
    </Flex>
  );
}

function CardErrorFallback() {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      className="p-6 bg-status-error-bg rounded-lg border border-status-error/20"
    >
      <AlertTriangle className="h-6 w-6 text-status-error mb-2" />
      <Typography variant="small" className="font-medium text-status-error">
        Failed to load content
      </Typography>
    </Flex>
  );
}

function InlineErrorFallback() {
  return (
    <Flex align="center" gap="sm" className="text-status-error">
      <AlertTriangle className="h-4 w-4" />
      <Typography variant="small">Error loading component</Typography>
    </Flex>
  );
}

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof ErrorFallbackPresentational> = {
  title: "Components/ErrorBoundary",
  component: ErrorFallbackPresentational,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Error boundary fallback UI shown when a React component throws an error. Provides error details and recovery options.",
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
    errorMessage: "TypeError: Cannot read property 'map' of undefined",
    showDetails: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Default error boundary UI with error details and recovery buttons.",
      },
    },
  },
};

export const WithoutDetails: Story = {
  args: {
    errorMessage: "TypeError: Cannot read property 'map' of undefined",
    showDetails: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Error boundary without the expandable error details section.",
      },
    },
  },
};

export const LongErrorMessage: Story = {
  args: {
    errorMessage: `Error: Failed to fetch data from API
at fetchData (api.ts:45:12)
at async loadUserData (user.ts:23:8)
at async UserProfile (UserProfile.tsx:15:5)
at renderWithHooks (react-dom.development.js:14985:18)
at mountIndeterminateComponent (react-dom.development.js:17811:13)

Caused by: NetworkError: Failed to connect to server
  - Connection refused (ECONNREFUSED)
  - Retry attempts: 3
  - Last attempt: 2024-01-15T10:30:00.000Z`,
    showDetails: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Error with a long stack trace that scrolls in the details section.",
      },
    },
  },
};

export const MinimalFallback: Story = {
  render: () => <MinimalErrorFallback onRetry={() => {}} />,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        story: "Minimal error fallback for use in smaller components or cards.",
      },
    },
  },
};

export const CardFallback: Story = {
  render: () => (
    <div className="w-64 p-4">
      <CardErrorFallback />
    </div>
  ),
  parameters: {
    layout: "centered",
    docs: {
      description: {
        story: "Compact error fallback styled for use within cards.",
      },
    },
  },
};

export const InlineFallback: Story = {
  render: () => <InlineErrorFallback />,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        story: "Inline error indicator for use within text or lists.",
      },
    },
  },
};

export const AllVariants: Story = {
  render: () => (
    <Flex direction="column" gap="xl" className="p-8 max-w-4xl">
      <div>
        <Typography variant="h3" className="mb-4">
          Full Page Error
        </Typography>
        <div className="border border-ui-border rounded-lg overflow-hidden">
          <ErrorFallbackPresentational
            errorMessage="Component crashed unexpectedly"
            showDetails={true}
          />
        </div>
      </div>

      <div>
        <Typography variant="h3" className="mb-4">
          Minimal Fallback
        </Typography>
        <div className="border border-ui-border rounded-lg p-4">
          <MinimalErrorFallback />
        </div>
      </div>

      <div>
        <Typography variant="h3" className="mb-4">
          Card Fallback
        </Typography>
        <div className="w-64">
          <CardErrorFallback />
        </div>
      </div>

      <div>
        <Typography variant="h3" className="mb-4">
          Inline Fallback
        </Typography>
        <InlineErrorFallback />
      </div>
    </Flex>
  ),
  parameters: {
    layout: "padded",
    docs: {
      description: {
        story: "Comparison of all error fallback variants.",
      },
    },
  },
};
