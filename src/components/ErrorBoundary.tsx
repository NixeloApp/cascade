/**
 * Error Boundary
 *
 * React error boundary for catching and displaying runtime errors.
 * Shows a friendly error UI instead of crashing the entire app.
 * Supports custom fallback rendering and error reporting callbacks.
 */

import { Component, type ReactNode } from "react";
import { Flex } from "@/components/ui/Flex";
import { IconCircle } from "@/components/ui/IconCircle";
import { Stack } from "@/components/ui/Stack";
import { AlertTriangle, Home, RotateCcw } from "@/lib/icons";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Icon } from "./ui/Icon";
import { Typography } from "./ui/Typography";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

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
          <Card variant="flat" padding="lg" className="max-w-md text-center">
            <Stack align="center" gap="lg">
              {/* Subtle icon */}
              <IconCircle size="xl" variant="error">
                <AlertTriangle className="size-10 text-status-error" />
              </IconCircle>

              {/* Large error code with tight tracking */}
              <Typography variant="errorCodeDisplay">500</Typography>

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
                  <Typography
                    as="summary"
                    variant="small"
                    color="secondary"
                    className="cursor-pointer"
                  >
                    View error details
                  </Typography>
                  <div className="mt-2 overflow-auto max-h-40 rounded bg-ui-bg-soft p-4">
                    <Typography as="pre" variant="mono" color="secondary">
                      {this.state.error.message}
                      {this.state.errorInfo?.componentStack
                        ? `\n\nComponent stack:${this.state.errorInfo.componentStack}`
                        : ""}
                    </Typography>
                  </div>
                </details>
              )}

              {/* Recovery actions */}
              <Flex gap="sm" wrap justify="center">
                <Button
                  onClick={this.handleRetry}
                  size="lg"
                  variant="primary"
                  leftIcon={<Icon icon={RotateCcw} size="sm" />}
                >
                  Try again
                </Button>
                <Button
                  onClick={() => {
                    window.location.href = "/";
                  }}
                  size="lg"
                  variant="secondary"
                  leftIcon={<Icon icon={Home} size="sm" />}
                >
                  Go to dashboard
                </Button>
              </Flex>
            </Stack>
          </Card>
        </Flex>
      );
    }

    return this.props.children;
  }
}
