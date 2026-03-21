import { ArrowRight, Bot, Clock, Sparkles } from "@/lib/icons";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { Dot } from "../ui/Dot";
import { Flex } from "../ui/Flex";
import { Grid, GridItem } from "../ui/Grid";
import { IconCircle } from "../ui/IconCircle";
import { SectionIntro } from "../ui/SectionIntro";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

const boardColumns = [
  {
    title: "In review",
    accent: "warning" as const,
    cards: ["POL-142 polish search flows", "DOC-18 update API notes"],
  },
  {
    title: "Shipping next",
    accent: "info" as const,
    cards: ["OPS-44 automate client handoff", "WEB-29 refine landing proof"],
  },
  {
    title: "Done",
    accent: "success" as const,
    cards: ["BOT-12 retry-safe sync worker", "AUTH-07 SSO org mapping"],
  },
];

const showcaseBenefits = [
  "Planning stays attached to delivery work",
  "AI help and time context in the same surface",
];

const showcaseMetrics = [
  {
    title: "Active projects",
    value: "18",
    body: "Cross-functional boards synced to docs and delivery.",
  },
  {
    title: "AI assists today",
    value: "142",
    body: "Drafted updates and summarized handoffs.",
  },
  {
    title: "Time recovered",
    value: "11h",
    body: "Less status chasing every week.",
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

      <Card recipe="showcaseShell">
        {/* macOS-style chrome header */}
        <div className="border-b border-ui-border/60 bg-linear-to-r from-ui-bg-soft/88 via-ui-bg-elevated/92 to-ui-bg-soft/84 px-4 py-3 sm:px-5">
          <Flex align="center" justify="between" gap="md">
            <Flex align="center" gap="sm">
              <Dot size="md" color="error" className="opacity-80" />
              <Dot size="md" color="warning" className="opacity-80" />
              <Dot size="md" color="success" className="opacity-80" />
              <Badge variant="outline" shape="pill" className="ml-2">
                Live workspace preview
              </Badge>
            </Flex>

            <Flex align="center" gap="sm" className="hidden sm:flex">
              <Badge variant="neutral" shape="pill">
                <Bot size={14} />
                AI summaries
              </Badge>
              <Badge variant="neutral" shape="pill">
                <Clock size={14} />
                Time tracking
              </Badge>
            </Flex>
          </Flex>
        </div>

        {/* Main showcase body */}
        <div className="bg-linear-to-b from-ui-bg-soft/82 via-ui-bg-elevated/96 to-ui-bg px-4 py-5 sm:px-6 sm:py-6">
          <Stack gap="xl">
            {/* Hero section: intro + board preview side by side */}
            <Card recipe="showcasePanel" variant="section" padding="lg">
              <Grid cols={1} colsLg={12} gap="xl">
                {/* Left: Intro content with breathing room */}
                <GridItem colSpanLg={4}>
                  <Stack gap="lg">
                    <SectionIntro
                      eyebrow="Product workspace"
                      title="Product control tower"
                      titleVariant="landingShowcaseTitle"
                      description="Specs, tasks, docs, and delivery signals stay connected instead of spreading across five tools and three disconnected update loops."
                      descriptionVariant="small"
                      descriptionColor="secondary"
                    />

                    <Stack gap="sm">
                      {showcaseBenefits.map((item) => (
                        <ShowcaseActionRow key={item}>{item}</ShowcaseActionRow>
                      ))}
                    </Stack>
                  </Stack>
                </GridItem>

                {/* Right: Board preview columns */}
                <GridItem colSpanLg={8}>
                  <Grid cols={1} colsSm={3} gap="md">
                    {boardColumns.map((column) => (
                      <Card
                        key={column.title}
                        recipe="showcasePanelQuiet"
                        variant="section"
                        padding="sm"
                      >
                        <Stack gap="md">
                          <Flex align="center" justify="between">
                            <Typography variant="label">{column.title}</Typography>
                            <Dot size="sm" color={column.accent} />
                          </Flex>

                          <Stack gap="sm">
                            {column.cards.map((card) => (
                              <Card key={card} recipe="overlayInset" variant="section" padding="sm">
                                <Typography variant="small">{card}</Typography>
                              </Card>
                            ))}
                          </Stack>
                        </Stack>
                      </Card>
                    ))}
                  </Grid>
                </GridItem>
              </Grid>
            </Card>

            {/* Second row: Metrics + AI assistant + Connected surfaces */}
            <Grid cols={1} colsLg={12} gap="lg">
              {/* Metrics strip */}
              <GridItem colSpanLg={7}>
                <Grid cols={1} colsSm={3} gap="md">
                  {showcaseMetrics.map((metric) => (
                    <MetricTile key={metric.title} {...metric} />
                  ))}
                </Grid>
              </GridItem>

              {/* AI assistant card */}
              <GridItem colSpanLg={5}>
                <Card recipe="showcasePanel" variant="section" padding="lg">
                  <Stack gap="lg">
                    <Flex align="center" justify="between">
                      <Flex align="center" gap="sm">
                        <IconCircle size="sm" variant="brand" className="text-brand">
                          <Sparkles size={16} />
                        </IconCircle>
                        <div>
                          <Typography variant="label">AI workspace assistant</Typography>
                          <Typography variant="caption">
                            Understands issues, docs, and context
                          </Typography>
                        </div>
                      </Flex>
                      <Badge variant="brand" shape="pill">
                        <Bot size={14} />
                        Context aware
                      </Badge>
                    </Flex>

                    <Card recipe="overlayInset" variant="section" padding="md">
                      <Typography variant="small" color="secondary">
                        "Summarize what changed since the last client review and flag blockers."
                      </Typography>
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
          </Stack>
        </div>
      </Card>
    </div>
  );
}

function ShowcaseActionRow({ children }: { children: string }) {
  return (
    <Flex align="start" gap="sm">
      <IconCircle size="xs" variant="success" className="mt-0.5 text-status-success-text">
        <ArrowRight size={12} />
      </IconCircle>
      <Typography variant="small" color="secondary">
        {children}
      </Typography>
    </Flex>
  );
}

function MetricTile({ body, title, value }: { body: string; title: string; value: string }) {
  return (
    <Card recipe="metricTile" variant="section" padding="md">
      <Stack gap="sm">
        <Typography variant="eyebrowWide">{title}</Typography>
        <Typography variant="landingMetricValue">{value}</Typography>
        <Typography variant="small" color="secondary">
          {body}
        </Typography>
      </Stack>
    </Card>
  );
}
