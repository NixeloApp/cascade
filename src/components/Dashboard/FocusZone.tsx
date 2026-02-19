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
    <Stack gap="sm" className="mb-8">
      <Typography variant="label" color="tertiary" className="uppercase tracking-widest">
        Focus Item
      </Typography>
      <Card
        hoverable
        onClick={handleClick}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
        tabIndex={0}
        role="button"
        aria-label={`Focus task: ${task.title}`}
        className="group relative overflow-hidden hover:shadow-card-hover transition-shadow"
      >
        {/* Brand left border accent */}
        <div className="absolute left-0 top-0 h-full w-1 bg-brand" />
        <Card padding="lg" radius="none" variant="ghost" className="pl-7">
          <Stack gap="md">
            <Flex justify="between" align="center">
              <Badge variant="primary">{task.priority.toUpperCase()}</Badge>
              <Typography variant="inlineCode" color="secondary">
                {task.key}
              </Typography>
            </Flex>

            <Stack gap="xs">
              <Typography variant="h3">{task.title}</Typography>
              <Typography variant="muted">
                In project: <strong>{task.projectName}</strong>
              </Typography>
            </Stack>

            <Flex justify="end" align="center" gap="xs">
              <Typography variant="label" className="text-brand">
                View Task
              </Typography>
              <Icon icon={ArrowRight} size="sm" className="text-brand" />
            </Flex>
          </Stack>
        </Card>
      </Card>
    </Stack>
  );
}
