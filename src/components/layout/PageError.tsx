import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Flex } from "@/components/ui/Flex";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";

interface PageErrorProps {
  title: string;
  message: string;
  action?: ReactNode;
}

export function PageError({ title, message, action }: PageErrorProps): ReactNode {
  const navigate = useNavigate();

  return (
    <Flex align="center" justify="center" className="py-20">
      <Stack align="center" gap="md" className="text-center max-w-md">
        <Typography variant="h3">{title}</Typography>
        <Typography variant="muted">{message}</Typography>
        {action ?? (
          <Button variant="outline" onClick={() => navigate({ to: ".." })}>
            Go back
          </Button>
        )}
      </Stack>
    </Flex>
  );
}
