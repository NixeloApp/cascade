import { Flex } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { AlertTriangle } from "@/lib/icons";
import { Typography } from "./ui/Typography";

interface Props {
  title: string;
  message?: string;
  onRetry?: () => void;
}

export function SectionErrorFallback({ title, message, onRetry }: Props) {
  return (
    <Flex align="center" justify="center" className="h-full p-8">
      <div className="max-w-md w-full text-center">
        <Icon icon={AlertTriangle} size="xl" className="mx-auto text-status-error mb-3" />
        <Typography variant="h2" className="text-xl font-semibold text-ui-text mb-2">
          {title}
        </Typography>
        <Typography className="text-ui-text-secondary mb-4">
          {message ||
            "This section encountered an error. Try reloading or contact support if the problem persists."}
        </Typography>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand-hover transition-colors font-medium"
          >
            Try Again
          </button>
        )}
      </div>
    </Flex>
  );
}
