import { AlertTriangle } from "lucide-react";
import { Component, type ReactNode } from "react";
import { Flex } from "@/components/ui/Flex";
import { Stack } from "@/components/ui/Stack";
import { Button } from "./ui/Button";
import { Typography } from "./ui/Typography";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Flex
          direction="column"
          align="center"
          justify="center"
          className="min-h-screen bg-ui-bg animate-fade-in"
        >
          <Stack align="center" gap="lg" className="max-w-md text-center px-6">
            {/* Subtle icon */}
            <Flex
              align="center"
              justify="center"
              className="h-20 w-20 rounded-full bg-status-error-bg"
            >
              <AlertTriangle className="h-10 w-10 text-status-error" />
            </Flex>

            {/* Large error code with tight tracking */}
            <Typography variant="h1" className="text-8xl font-bold tracking-tightest">
              500
            </Typography>

            {/* Message with secondary text styling */}
            <Stack gap="sm" align="center">
              <Typography variant="large" color="secondary">
                Something went wrong
              </Typography>
              <Typography color="tertiary">
                We encountered an unexpected error. Please try refreshing the page.
              </Typography>
            </Stack>

            {/* Error details collapsible */}
            {this.state.error && (
              <details className="w-full text-left">
                <summary className="cursor-pointer text-sm text-ui-text-secondary hover:text-ui-text transition-default">
                  View error details
                </summary>
                <pre className="mt-2 text-xs bg-ui-bg-tertiary text-ui-text-secondary p-4 rounded-lg overflow-auto max-h-40">
                  {this.state.error.message}
                </pre>
              </details>
            )}

            {/* Reload button */}
            <Button onClick={() => window.location.reload()} size="lg">
              Reload page
            </Button>
          </Stack>
        </Flex>
      );
    }

    return this.props.children;
  }
}
