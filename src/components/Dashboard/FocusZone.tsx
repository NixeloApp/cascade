import { useNavigate } from "@tanstack/react-router";
import { ROUTES } from "@/config/routes";
import { useOrganization } from "@/hooks/useOrgContext";
import { ArrowRight } from "@/lib/icons";
import { Badge } from "../ui/Badge";
import { Flex } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import { Typography } from "../ui/Typography";
import { DashboardPanel, DashboardPanelBody, DashboardPanelHeader } from "./DashboardPanel";

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
    <DashboardPanel hoverable onClick={handleClick} aria-label={`Focus task: ${task.title}`}>
      <DashboardPanelHeader
        padding="md"
        title="Focus item"
        description="Keep the highest-impact task moving before lower-priority work dilutes the week."
        badge={
          <Badge variant="neutral" shape="pill">
            Highest-impact next step
          </Badge>
        }
      />
      <DashboardPanelBody padding="md">
        <Flex direction="column" gap="md">
          <Flex justify="between" align="start" gap="md">
            <Flex direction="column" gap="sm" className="min-w-0">
              <Flex align="center" gap="sm" wrap>
                <Badge variant="primary" className="w-fit">
                  {task.priority.toUpperCase()}
                </Badge>
                <Badge variant="neutral" shape="pill">
                  {task.status}
                </Badge>
              </Flex>
              <Typography variant="h4" className="max-w-xl text-balance">
                {task.title}
              </Typography>
            </Flex>
            <Typography variant="inlineCode" color="secondary" className="shrink-0">
              {task.key}
            </Typography>
          </Flex>

          <Flex justify="between" align="end" gap="md" wrap>
            <Flex direction="column" gap="xs">
              <Typography variant="eyebrowWide">Project</Typography>
              <Typography variant="small">{task.projectName}</Typography>
            </Flex>
            <Flex justify="end" align="center" gap="xs" className="shrink-0">
              <Typography variant="label" className="text-brand">
                Open board
              </Typography>
              <Icon icon={ArrowRight} size="sm" tone="brand" />
            </Flex>
          </Flex>
        </Flex>
      </DashboardPanelBody>
    </DashboardPanel>
  );
}
