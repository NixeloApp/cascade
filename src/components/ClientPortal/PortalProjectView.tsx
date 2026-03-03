import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
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
      <CardContent className="space-y-2 pt-4">
        <Typography variant="small" color="secondary">
          Project key: {project.key}
        </Typography>
        <Link to="/portal/$token/projects/$projectId" params={{ token, projectId: project._id }}>
          <Typography variant="small" className="text-brand underline">
            Open project view
          </Typography>
        </Link>
      </CardContent>
    </Card>
  );
}
