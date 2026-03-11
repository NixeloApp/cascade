import { cva } from "class-variance-authority";
import { ArrowRight, Bot, Clock, Sparkles } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

const boardColumns = [
  {
    title: "In review",
    accent: "bg-status-warning/70",
    cards: ["POL-142 polish search flows", "DOC-18 update API notes"],
  },
  {
    title: "Shipping next",
    accent: "bg-status-info/70",
    cards: ["OPS-44 automate client handoff", "WEB-29 refine landing proof"],
  },
  {
    title: "Done",
    accent: "bg-status-success/70",
    cards: ["BOT-12 retry-safe sync worker", "AUTH-07 SSO org mapping"],
  },
];

const showcaseVariants = {
  glow: cva(
    "pointer-events-none absolute inset-x-16 top-8 h-52 rounded-full bg-landing-accent/10 blur-glow",
  ),
  frameHeader: cva("border-b border-ui-border/60 bg-ui-bg-soft/82 px-4 py-3 sm:px-5"),
  frameBody: cva("bg-linear-to-b from-ui-bg-soft/78 to-ui-bg px-4 py-5 sm:px-6 sm:py-6"),
  railBadges: cva("hidden sm:flex"),
  bulletIcon: cva("mt-0.5 shrink-0 rounded-full bg-status-success/15 p-1 text-status-success-text"),
  sparkBadge: cva("shrink-0 rounded-full bg-brand-subtle p-2 text-brand"),
};

/** Product preview card used in the landing hero. */
export function ProductShowcase() {
  return (
    <div id="product-showcase" className="relative mx-auto mt-0 max-w-6xl sm:mt-1">
      <div className={showcaseVariants.glow()} />

      <Card recipe="showcaseShell">
        {/* macOS-style chrome header */}
        <div className={showcaseVariants.frameHeader()}>
          <Flex align="center" justify="between" gap="md">
            <Flex align="center" gap="sm">
              <div className="h-2.5 w-2.5 rounded-full bg-status-error/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-status-warning/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-status-success/80" />
              <Badge variant="outline" shape="pill" className="ml-2">
                Live workspace preview
              </Badge>
            </Flex>

            <Flex align="center" gap="sm" className={showcaseVariants.railBadges()}>
              <Badge variant="neutral" shape="pill">
                <Bot className="h-3.5 w-3.5" />
                AI summaries
              </Badge>
              <Badge variant="neutral" shape="pill">
                <Clock className="h-3.5 w-3.5" />
                Time tracking
              </Badge>
            </Flex>
          </Flex>
        </div>

        {/* Main showcase body */}
        <div className={showcaseVariants.frameBody()}>
          <Stack gap="xl">
            {/* Hero section: intro + board preview side by side */}
            <Card recipe="showcasePanel" padding="lg">
              <Grid cols={1} colsLg={12} gap="xl">
                {/* Left: Intro content with breathing room */}
                <Stack gap="lg" className="lg:col-span-4">
                  <div>
                    <Badge variant="outline" shape="pill">
                      Product workspace
                    </Badge>
                    <Typography variant="h3" className="mt-4 text-2xl leading-tight sm:text-3xl">
                      Product control tower
                    </Typography>
                    <Typography variant="small" color="secondary" className="mt-3">
                      Specs, tasks, docs, and delivery signals stay connected instead of spreading
                      across five tools and three disconnected update loops.
                    </Typography>
                  </div>

                  <Stack gap="sm">
                    {[
                      "Planning stays attached to delivery work",
                      "AI help and time context in the same surface",
                    ].map((item) => (
                      <Flex key={item} align="start" gap="sm">
                        <div className={showcaseVariants.bulletIcon()}>
                          <ArrowRight className="h-3 w-3" />
                        </div>
                        <Typography variant="small" color="secondary">
                          {item}
                        </Typography>
                      </Flex>
                    ))}
                  </Stack>
                </Stack>

                {/* Right: Board preview columns */}
                <Grid cols={1} colsSm={3} gap="md" className="lg:col-span-8">
                  {boardColumns.map((column) => (
                    <Card key={column.title} recipe="showcasePanelQuiet" padding="sm">
                      <Flex align="center" justify="between" className="mb-3">
                        <Typography variant="label">{column.title}</Typography>
                        <div className={cn("h-2 w-2 rounded-full", column.accent)} />
                      </Flex>

                      <Stack gap="sm">
                        {column.cards.map((card) => (
                          <Card key={card} recipe="overlayInset" padding="sm">
                            <Typography variant="small">{card}</Typography>
                          </Card>
                        ))}
                      </Stack>
                    </Card>
                  ))}
                </Grid>
              </Grid>
            </Card>

            {/* Second row: Metrics + AI assistant + Connected surfaces */}
            <Grid cols={1} colsLg={12} gap="lg">
              {/* Metrics strip */}
              <Grid cols={1} colsSm={3} gap="md" className="lg:col-span-7">
                <Card recipe="metricTile" padding="md">
                  <Typography variant="meta" className="uppercase tracking-widest">
                    Active projects
                  </Typography>
                  <Typography variant="h2" className="mt-2 text-3xl sm:text-4xl">
                    18
                  </Typography>
                  <Typography variant="small" color="secondary" className="mt-2">
                    Cross-functional boards synced to docs and delivery.
                  </Typography>
                </Card>

                <Card recipe="metricTile" padding="md">
                  <Typography variant="meta" className="uppercase tracking-widest">
                    AI assists today
                  </Typography>
                  <Typography variant="h2" className="mt-2 text-3xl sm:text-4xl">
                    142
                  </Typography>
                  <Typography variant="small" color="secondary" className="mt-2">
                    Drafted updates and summarized handoffs.
                  </Typography>
                </Card>

                <Card recipe="metricTile" padding="md">
                  <Typography variant="meta" className="uppercase tracking-widest">
                    Time recovered
                  </Typography>
                  <Typography variant="h2" className="mt-2 text-3xl sm:text-4xl">
                    11h
                  </Typography>
                  <Typography variant="small" color="secondary" className="mt-2">
                    Less status chasing every week.
                  </Typography>
                </Card>
              </Grid>

              {/* AI assistant card */}
              <Card recipe="showcasePanel" padding="lg" className="lg:col-span-5">
                <Flex align="center" gap="sm" className="mb-4">
                  <div className={showcaseVariants.sparkBadge()}>
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <Typography variant="label">AI workspace assistant</Typography>
                    <Typography variant="caption">Understands issues, docs, and context</Typography>
                  </div>
                </Flex>

                <Card recipe="overlayInset" padding="md">
                  <Typography variant="small" color="secondary">
                    "Summarize what changed since the last client review and flag blockers."
                  </Typography>
                </Card>

                <Stack gap="sm" className="mt-4">
                  {[
                    "Surface blocker issues tied to missing approvals",
                    "Draft release notes from merged documents",
                  ].map((item) => (
                    <Flex key={item} align="start" gap="sm">
                      <div className={showcaseVariants.bulletIcon()}>
                        <ArrowRight className="h-3 w-3" />
                      </div>
                      <Typography variant="small" color="secondary">
                        {item}
                      </Typography>
                    </Flex>
                  ))}
                </Stack>
              </Card>
            </Grid>
          </Stack>
        </div>
      </Card>
    </div>
  );
}
