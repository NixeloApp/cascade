/**
 * Error Boundary
 *
 * React error boundary for catching and displaying runtime errors.
 * Shows a friendly error UI instead of crashing the entire app.
 * Supports custom fallback rendering and error reporting callbacks.
 */

import { AlertTriangle } from "lucide-react";
import { Component, type ReactNode } from "react";
import { Flex } from "@/components/ui/Flex";
import { IconCircle } from "@/components/ui/IconCircle";
import { Stack } from "@/components/ui/Stack";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
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
    // Keep uncaught render failures at error severity for observability.
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
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
                    </Typography>
                  </div>
                </details>
              )}

              {/* Reload button */}
              <Button onClick={() => window.location.reload()} size="lg">
                Reload page
              </Button>
            </Stack>
          </Card>
        </Flex>
      );
    }

    return this.props.children;
  }
}
