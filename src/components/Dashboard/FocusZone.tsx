import { useNavigate } from "@tanstack/react-router";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrgContext";
import { ArrowRight } from "@/lib/icons";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

interface FocusTask {
  _id: string;
  key: string;
  title: string;
  priority: string;
  status: string;
  projectName: string;
  projectKey: string;
}

interface FocusZoneProps {
  task: FocusTask | null | undefined;
}

/** Highlighted card displaying the user's highest-priority focus task. */
export function FocusZone({ task }: FocusZoneProps) {
  const navigate = useNavigate();
  const { orgSlug } = useOrganization();

  if (!task) return null;

  const handleClick = () => {
    navigate({
      to: ROUTES.projects.board.path,
      params: { orgSlug, key: task.projectKey },
    });
  };

  return (
    <Stack gap="sm">
      <Flex align="center" justify="between" gap="md">
        <Typography variant="eyebrowWide">Focus Item</Typography>
        <Badge variant="neutral" shape="pill">
          Highest-impact next step
        </Badge>
      </Flex>
      <Card
        hoverable
        onClick={handleClick}
        aria-label={`Focus task: ${task.title}`}
        variant="outline"
        className="relative overflow-hidden border-ui-border/50 bg-ui-bg/80 shadow-soft backdrop-blur-sm"
      >
        <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-brand-subtle/30 to-transparent" />
        <div className="absolute left-0 top-0 h-full w-1 bg-brand" />
        <div className="p-6 pl-7">
          <Stack gap="lg" className="relative">
            <Flex justify="between" align="start" gap="md">
              <Stack gap="sm">
                <Badge variant="primary" className="w-fit">
                  {task.priority.toUpperCase()}
                </Badge>
                <Typography variant="h3" className="max-w-xl">
                  {task.title}
                </Typography>
              </Stack>
              <Typography variant="inlineCode" color="secondary" className="shrink-0">
                {task.key}
              </Typography>
            </Flex>

            <Flex align="center" gap="sm" wrap>
              <Badge variant="neutral" shape="pill">
                {task.status}
              </Badge>
              <Typography variant="small" color="secondary">
                Project
              </Typography>
              <Typography variant="label" className="text-ui-text">
                {task.projectName}
              </Typography>
            </Flex>

            <Flex justify="between" align="center" gap="md" wrap>
              <Typography variant="small" color="secondary" className="max-w-md">
                Keep this moving before lower-priority work. The board view opens directly to the
                containing project.
              </Typography>
              <Flex justify="end" align="center" gap="xs" className="shrink-0">
                <Typography variant="label" className="text-brand">
                  View task
                </Typography>
                <Icon icon={ArrowRight} size="sm" className="text-brand" />
              </Flex>
            </Flex>
          </Stack>
        </div>
      </Card>
    </Stack>
  );
}
