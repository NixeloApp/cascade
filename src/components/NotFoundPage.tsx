import { Link } from "@tanstack/react-router";
import { Flex } from "@/components/ui/Flex";
import { Typography } from "@/components/ui/Typography";
import { ROUTES } from "@/config/routes";

export function NotFoundPage() {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      className="min-h-screen bg-ui-bg-secondary"
    >
      <Typography variant="h1" className="text-6xl text-ui-text-primary">
        404
      </Typography>
      <Typography variant="lead" className="mt-4">
        Page not found
      </Typography>
      <Link
        to={ROUTES.home.path}
        className="mt-8 rounded-lg bg-ui-brand px-6 py-3 text-white transition-colors hover:bg-ui-brand-hover"
      >
        Go home
      </Link>
    </Flex>
  );
}
