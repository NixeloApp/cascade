import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";

interface PortalProjectViewProps {
  token: string;
  project: {
    _id: string;
    name: string;
    key: string;
  };
}

/**
 * Displays a client-portal project card with navigation into project details.
 */
export function PortalProjectView({ token, project }: PortalProjectViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{project.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Stack gap="sm">
          <Typography variant="small" color="secondary">
            Project key: {project.key}
          </Typography>
          <Button asChild variant="link" size="content">
            <Link
              to="/portal/$token/projects/$projectId"
              params={{ token, projectId: project._id }}
            >
              Open project view
            </Link>
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
