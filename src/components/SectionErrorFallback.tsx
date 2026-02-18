import { Button } from "@/components/ui/Button";
import { Flex } from "@/components/ui/Flex";
import { Icon } from "@/components/ui/Icon";
import { Stack } from "@/components/ui/Stack";
import { AlertTriangle } from "@/lib/icons";
import { Typography } from "./ui/Typography";

interface Props {
  title: string;
  message?: string;
  onRetry?: () => void;
}

export function SectionErrorFallback({ title, message, onRetry }: Props) {
  return (
    <Flex align="center" justify="center" className="h-full">
      <Stack align="center" gap="md" className="max-w-md w-full text-center">
        <Icon icon={AlertTriangle} size="xl" className="text-status-error" />
        <Typography variant="h3">{title}</Typography>
        <Typography color="secondary">
          {message ||
            "This section encountered an error. Try reloading or contact support if the problem persists."}
        </Typography>
        {onRetry && (
          <Button variant="primary" onClick={onRetry}>
            Try Again
          </Button>
        )}
      </Stack>
    </Flex>
  );
}
