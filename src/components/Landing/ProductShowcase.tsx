import type { LucideIcon } from "@/lib/icons";
import { ArrowRight, Bot, Clock, FileText, KanbanSquare, Sparkles } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Badge, type BadgeProps } from "../ui/Badge";
import { Card, getCardRecipeClassName } from "../ui/Card";
import { Dot } from "../ui/Dot";
import { Flex } from "../ui/Flex";
import { Grid, GridItem } from "../ui/Grid";
import { Icon, type IconTone } from "../ui/Icon";
import { IconCircle } from "../ui/IconCircle";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

type BoardCardPreview = {
  detail: string;
  key: string;
  priorityTone: NonNullable<BadgeProps["priorityTone"]>;
  title: string;
};

const boardColumns = [
  {
    title: "In review",
    accent: "warning" as const,
    cards: [
      {
        key: "POL-142",
        title: "Polish search flows",
        detail: "Waiting on final approval notes",
        priorityTone: "high" as const,
      },
      {
        key: "DOC-18",
        title: "Update API notes",
        detail: "Link the launch brief before publish",
        priorityTone: "medium" as const,
      },
    ] satisfies BoardCardPreview[],
  },
  {
    title: "Shipping next",
    accent: "info" as const,
    cards: [
      {
        key: "OPS-44",
        title: "Automate client handoff",
        detail: "Client digest pulls directly from board state",
        priorityTone: "high" as const,
      },
      {
        key: "WEB-29",
        title: "Refine landing proof",
        detail: "Screenshots stay aligned with product surfaces",
        priorityTone: "low" as const,
      },
    ] satisfies BoardCardPreview[],
  },
  {
    title: "Done",
    accent: "success" as const,
    cards: [
      {
        key: "BOT-12",
        title: "Retry-safe sync worker",
        detail: "Summaries stay grounded after reconnects",
        priorityTone: "medium" as const,
      },
      {
        key: "AUTH-07",
        title: "SSO org mapping",
        detail: "Provisioning landed without manual cleanup",
        priorityTone: "low" as const,
      },
    ] satisfies BoardCardPreview[],
  },
];

const workspaceSignals = [
  {
    title: "Active projects",
    value: "18",
    body: "Boards, specs, and client summaries stay attached to the same work.",
    icon: KanbanSquare,
    iconTone: "brand" as const,
  },
  {
    title: "AI assists today",
    value: "142",
    body: "Drafted updates and release notes from linked issues and docs.",
    icon: Bot,
    iconTone: "info" as const,
  },
  {
    title: "Time recovered",
    value: "11h",
    body: "Less context chasing and fewer manual handoff recaps every week.",
    icon: Clock,
    iconTone: "success" as const,
  },
];

const showcaseAssistantActions = [
  "Surface blocker issues tied to missing approvals",
  "Draft release notes from merged documents",
];

/** Product preview card used in the landing hero. */
export function ProductShowcase() {
  return (
    <div id="product-showcase" className="relative mx-auto max-w-6xl">
      <div
        className="pointer-events-none absolute inset-x-16 top-8 h-52 bg-landing-accent/14 blur-glow"
        style={{ borderRadius: "var(--radius-pill)" }}
      />

      <Card recipe="dashboardShell" padding="none" className="overflow-hidden">
        <Card recipe="appHeaderShell" variant="section" padding="none" radius="none">
          <Flex align="center" justify="between" gap="sm" className="w-full">
            <Flex align="center" gap="sm" className="min-w-0">
              <div className={cn(getCardRecipeClassName("workspaceCockpitChip"), "min-w-0")}>
                <Flex align="center" gap="sm">
                  <Dot size="md" halo />
                  <div className="min-w-0">
                    <Typography variant="pageHeaderEyebrow" className="block">
                      Workspace cockpit
                    </Typography>
                    <Typography variant="label" className="block truncate">
                      Search, plan, ship, and brief clients from one surface
                    </Typography>
                  </div>
                </Flex>
              </div>
            </Flex>

            <Flex align="center" gap="sm" className="hidden shrink-0 lg:flex">
              <WorkspaceHeaderChip icon={Bot} iconTone="brand" label="AI summaries" />
              <WorkspaceHeaderChip icon={Clock} iconTone="secondary" label="Time tracking" />
            </Flex>
          </Flex>
        </Card>

        <div className="bg-linear-to-b from-ui-bg-soft/82 via-ui-bg-elevated/96 to-ui-bg px-4 py-5 sm:px-6 sm:py-6">
          <Grid cols={1} colsLg={12} gap="lg">
            <GridItem colSpanLg={8}>
              <Card recipe="dashboardPanelInset" variant="section" padding="lg" className="h-full">
                <Stack gap="lg">
                  <Flex
                    direction="column"
                    directionSm="row"
                    align="start"
                    justify="between"
                    gap="md"
                  >
                    <Stack gap="xs" className="min-w-0">
                      <Typography variant="pageHeaderEyebrow">Delivery board</Typography>
                      <Typography variant="landingShowcaseTitle">Product control tower</Typography>
                      <Typography variant="pageHeaderDescription">
                        Work, documentation, and client-facing summaries stay attached to the same
                        execution flow instead of being recopied into separate status theater.
                      </Typography>
                    </Stack>

                    <Flex align="center" gap="sm" wrap className="shrink-0">
                      <Badge variant="outline" shape="pill">
                        <Icon icon={FileText} size="xs" tone="secondary" />
                        Client-ready updates
                      </Badge>
                      <Badge variant="outline" shape="pill">
                        <Icon icon={Sparkles} size="xs" tone="brand" />
                        Docs stay linked
                      </Badge>
                    </Flex>
                  </Flex>

                  <Grid cols={1} colsSm={3} gap="md">
                    {boardColumns.map((column) => (
                      <BoardPreviewColumn key={column.title} {...column} />
                    ))}
                  </Grid>
                </Stack>
              </Card>
            </GridItem>

            <GridItem colSpanLg={4}>
              <Card recipe="dashboardPanel" variant="section" padding="lg" className="h-full">
                <Stack gap="lg">
                  <Flex align="center" justify="between" gap="md">
                    <Stack gap="xs">
                      <Typography variant="pageHeaderEyebrow">Workspace pulse</Typography>
                      <Typography variant="cardTitle">Context that stays attached</Typography>
                    </Stack>
                    <Badge variant="neutral" shape="pill">
                      Live sync
                    </Badge>
                  </Flex>

                  <Stack gap="sm">
                    {workspaceSignals.map((signal) => (
                      <WorkspaceSignalRow key={signal.title} {...signal} />
                    ))}
                  </Stack>

                  <Card recipe="overlayInset" variant="section" padding="md">
                    <Stack gap="sm">
                      <Flex align="center" gap="sm">
                        <IconCircle size="xs" variant="brand">
                          <Icon icon={Bot} size="xs" tone="brand" />
                        </IconCircle>
                        <div>
                          <Typography variant="label">AI workspace assistant</Typography>
                          <Typography variant="caption">
                            Understands issues, docs, and handoffs
                          </Typography>
                        </div>
                      </Flex>

                      <Typography variant="small" color="secondary">
                        "Summarize what changed since the last client review and flag blockers."
                      </Typography>
                    </Stack>
                  </Card>

                  <Stack gap="sm">
                    {showcaseAssistantActions.map((item) => (
                      <ShowcaseActionRow key={item}>{item}</ShowcaseActionRow>
                    ))}
                  </Stack>
                </Stack>
              </Card>
            </GridItem>
          </Grid>
        </div>
      </Card>
    </div>
  );
}

function BoardPreviewColumn({
  accent,
  cards,
  title,
}: {
  accent: "info" | "success" | "warning";
  cards: BoardCardPreview[];
  title: string;
}) {
  return (
    <Card recipe="showcasePanelQuiet" variant="section" padding="sm" className="h-full">
      <Stack gap="md">
        <Flex align="center" justify="between">
          <Typography variant="boardColumnTitle">{title}</Typography>
          <Dot size="sm" color={accent} />
        </Flex>

        <Stack gap="sm">
          {cards.map((card) => (
            <Card key={card.key} recipe="issueCard" variant="section" padding="none">
              <Stack gap="xs" className="min-w-0">
                <Flex align="center" justify="between" gap="sm">
                  <Typography variant="issueKeyMono">{card.key}</Typography>
                  <Badge variant="outline" shape="pill" size="sm" priorityTone={card.priorityTone}>
                    {getPriorityLabel(card.priorityTone)}
                  </Badge>
                </Flex>
                <Typography variant="small">{card.title}</Typography>
                <Typography variant="caption">{card.detail}</Typography>
              </Stack>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Card>
  );
}

function ShowcaseActionRow({ children }: { children: string }) {
  return (
    <Flex align="start" gap="sm">
      <IconCircle size="xs" variant="success" className="mt-0.5">
        <Icon icon={ArrowRight} size="xs" tone="successText" />
      </IconCircle>
      <Typography variant="small" color="secondary">
        {children}
      </Typography>
    </Flex>
  );
}

function WorkspaceHeaderChip({
  icon,
  iconTone,
  label,
}: {
  icon: LucideIcon;
  iconTone: IconTone;
  label: string;
}) {
  return (
    <Badge variant="neutral" shape="pill">
      <Icon icon={icon} size="xs" tone={iconTone} />
      {label}
    </Badge>
  );
}

function WorkspaceSignalRow({
  body,
  icon,
  iconTone,
  title,
  value,
}: {
  body: string;
  icon: LucideIcon;
  iconTone: IconTone;
  title: string;
  value: string;
}) {
  return (
    <Card recipe="overlayInset" variant="section" padding="sm">
      <Flex align="start" justify="between" gap="sm">
        <Flex align="start" gap="sm">
          <IconCircle size="xs" variant="soft">
            <Icon icon={icon} size="xs" tone={iconTone} />
          </IconCircle>
          <Stack gap="xs">
            <Typography variant="label">{title}</Typography>
            <Typography variant="caption">{body}</Typography>
          </Stack>
        </Flex>

        <Typography as="span" variant="landingMetricValue">
          {value}
        </Typography>
      </Flex>
    </Card>
  );
}

function getPriorityLabel(priorityTone: BoardCardPreview["priorityTone"]) {
  switch (priorityTone) {
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "low":
      return "Low";
    case "highest":
      return "Highest";
    case "lowest":
      return "Lowest";
    default:
      return "";
  }
}
