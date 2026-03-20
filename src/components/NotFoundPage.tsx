/**
 * Not Found Page
 *
 * 404 error page displayed when a route doesn't exist.
 * Shows a friendly message with navigation back to home.
 * Uses consistent styling with the rest of the app.
 */

import { Link } from "@tanstack/react-router";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Flex } from "@/components/ui/Flex";
import { IconCircle } from "@/components/ui/IconCircle";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";

/** 404 error page with link to return home. */
export function NotFoundPage() {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      className="min-h-screen bg-ui-bg animate-fade-in"
    >
      <Card padding="lg" variant="ghost" className="max-w-md text-center">
        <Stack align="center" gap="lg">
          {/* Subtle icon */}
          <IconCircle size="xl" variant="soft">
            <FileQuestion className="h-10 w-10 text-ui-text-tertiary" />
          </IconCircle>

          {/* Large error code with tight tracking */}
          <Typography variant="errorCodeDisplay">404</Typography>

          {/* Message with secondary text styling */}
          <Stack gap="sm" align="center">
            <Typography variant="large" color="secondary">
              Page not found
            </Typography>
            <Typography color="tertiary">
              The page you are looking for does not exist or has been moved.
            </Typography>
          </Stack>

          {/* Return home button using Button component */}
          <Button asChild size="lg">
            <Link to={ROUTES.home.path}>Return home</Link>
          </Button>
        </Stack>
      </Card>
    </Flex>
  );
}
