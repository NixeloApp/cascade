/**
 * AIErrorFallback - Error boundary fallback for AI components
 */

import { SectionErrorFallback } from "../SectionErrorFallback";
import { Alert, AlertDescription, AlertTitle } from "../ui/Alert";
import { Typography } from "../ui/Typography";

export interface AIErrorFallbackProps {
  error?: Error;
  onRetry?: () => void;
  title?: string;
  message?: string;
}

export function AIErrorFallback({
  error,
  onRetry,
  title = "AI Assistant Error",
  message = "Something went wrong with the AI assistant. Please try again.",
}: AIErrorFallbackProps) {
  return (
    <SectionErrorFallback
      title={title}
      message={message}
      onRetry={onRetry}
      iconClassName="text-status-warning"
    >
      {error && process.env.NODE_ENV === "development" && (
        <details className="w-full">
          <summary className="list-none cursor-pointer">
            <Typography variant="label" color="secondary">
              Error Details
            </Typography>
          </summary>
          <Alert variant="warning" className="mt-2 text-left">
            <AlertTitle>Development stack trace</AlertTitle>
            <AlertDescription>
              <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </AlertDescription>
          </Alert>
        </details>
      )}
    </SectionErrorFallback>
  );
}
