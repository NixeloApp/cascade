import { cva } from "class-variance-authority";
import { ArrowRight, Bot, Clock, LayoutGrid, Sparkles } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
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

const productShowcaseVariants = {
  glow: cva(
    "pointer-events-none absolute inset-x-16 top-8 h-52 rounded-full bg-landing-accent/10 blur-glow",
  ),
  frameHeader: cva("border-b border-ui-border/60 bg-ui-bg-soft/82 px-4 py-3 sm:px-5"),
  frameBody: cva("bg-linear-to-b from-ui-bg-soft/78 to-ui-bg px-4 py-4 sm:px-5"),
  railBadges: cva("hidden sm:flex"),
  columnStack: cva("space-y-4 lg:col-span-8"),
  sideStack: cva("space-y-4 lg:col-span-4"),
  panelPadding: cva("p-4 sm:p-5"),
  introStack: cva("space-y-4 xl:col-span-4"),
  introList: cva("space-y-3"),
  bulletIcon: cva("mt-1 rounded-full bg-status-success/15 p-1 text-status-success-text"),
  boardGrid: cva("xl:col-span-8"),
  cardList: cva("space-y-2"),
  metricValue: cva("mt-3 text-4xl"),
  panelHeader: cva("mb-4"),
  sparkBadge: cva("rounded-full bg-brand-subtle p-2 text-brand"),
  assistantList: cva("mt-3 space-y-3"),
};

/** Product preview card used in the landing hero. */
export function ProductShowcase() {
  return (
    <div id="product-showcase" className="relative mx-auto mt-0 max-w-6xl sm:mt-1">
      <div className={productShowcaseVariants.glow()} />

      <Card recipe="showcaseShell">
        <div className={productShowcaseVariants.frameHeader()}>
          <Flex align="center" justify="between" gap="md">
            <Flex align="center" gap="sm">
              <div className="h-2.5 w-2.5 rounded-full bg-status-error/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-status-warning/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-status-success/80" />
              <Badge variant="outline" shape="pill" className="ml-2">
                Live workspace preview
              </Badge>
            </Flex>

            <Flex align="center" gap="sm" className={productShowcaseVariants.railBadges()}>
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

        <Grid cols={1} colsLg={12} gap="lg" className={productShowcaseVariants.frameBody()}>
          <div className={productShowcaseVariants.columnStack()}>
            <Card recipe="showcasePanel">
              <Grid
                cols={1}
                colsXl={12}
                gap="lg"
                className={productShowcaseVariants.panelPadding()}
              >
                <div className={productShowcaseVariants.introStack()}>
                  <div>
                    <Badge variant="outline" shape="pill">
                      Product workspace
                    </Badge>
                    <Typography variant="h3" className="mt-4 text-2xl sm:text-3xl">
                      Product control tower
                    </Typography>
                    <Typography variant="small" color="secondary" className="mt-2 max-w-sm">
                      Specs, tasks, docs, and delivery signals stay connected instead of spreading
                      across five tools and three disconnected update loops.
                    </Typography>
                  </div>

                  <Stack gap="md">
                    {[
                      "Planning stays attached to delivery work instead of drifting into separate docs",
                      "Board movement, AI help, and time context live in the same surface",
                    ].map((item) => (
                      <Flex key={item} align="start" gap="sm">
                        <div className={productShowcaseVariants.bulletIcon()}>
                          <ArrowRight className="h-3 w-3" />
                        </div>
                        <Typography variant="small" color="secondary">
                          {item}
                        </Typography>
                      </Flex>
                    ))}
                  </Stack>

                  <Button variant="secondary" size="sm" className="w-full sm:w-auto" disabled>
                    Open board
                  </Button>
                </div>

                <Grid cols={1} colsMd={3} gap="md" className={productShowcaseVariants.boardGrid()}>
                  {boardColumns.map((column) => (
                    <Card key={column.title} recipe="showcasePanelQuiet" padding="sm">
                      <Flex align="center" justify="between" className="mb-3">
                        <Typography variant="label">{column.title}</Typography>
                        <div className={cn("h-2 w-2 rounded-full", column.accent)} />
                      </Flex>

                      <Stack gap="sm" className={productShowcaseVariants.cardList()}>
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

            <Grid cols={1} colsMd={3} gap="lg">
              <Card recipe="metricTile" padding="md">
                <Typography variant="meta" className="uppercase tracking-widest">
                  Active projects
                </Typography>
                <Typography variant="h2" className={productShowcaseVariants.metricValue()}>
                  18
                </Typography>
                <Typography variant="small" color="secondary" className="mt-2">
                  Cross-functional boards synced to docs, support, and delivery.
                </Typography>
              </Card>

              <Card recipe="metricTile" padding="md">
                <Typography variant="meta" className="uppercase tracking-widest">
                  AI assists today
                </Typography>
                <Typography variant="h2" className={productShowcaseVariants.metricValue()}>
                  142
                </Typography>
                <Typography variant="small" color="secondary" className="mt-2">
                  Drafted updates, answered process questions, and summarized handoffs.
                </Typography>
              </Card>

              <Card recipe="metricTile" padding="md">
                <Typography variant="meta" className="uppercase tracking-widest">
                  Time recovered
                </Typography>
                <Typography variant="h2" className={productShowcaseVariants.metricValue()}>
                  11h
                </Typography>
                <Typography variant="small" color="secondary" className="mt-2">
                  Less status chasing every week once docs and execution share one system.
                </Typography>
              </Card>
            </Grid>
          </div>

          <div className={productShowcaseVariants.sideStack()}>
            <Card recipe="showcasePanel" padding="lg">
              <Flex align="center" gap="sm" className={productShowcaseVariants.panelHeader()}>
                <div className={productShowcaseVariants.sparkBadge()}>
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <Typography variant="label">AI workspace assistant</Typography>
                  <Typography variant="caption">
                    Understands issues, docs, and team context
                  </Typography>
                </div>
              </Flex>

              <Card recipe="overlayInset" padding="md">
                <Typography variant="small" color="secondary">
                  “Summarize what changed since the last client review and flag blockers.”
                </Typography>
              </Card>

              <Stack gap="md" className={productShowcaseVariants.assistantList()}>
                {[
                  "Surface blocker issues tied to missing approvals",
                  "Draft release note from merged documents and resolved tickets",
                  "Generate next-step checklist for the support handoff",
                ].map((item) => (
                  <Flex key={item} align="start" gap="sm">
                    <div className={productShowcaseVariants.bulletIcon()}>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                    <Typography variant="small" color="secondary">
                      {item}
                    </Typography>
                  </Flex>
                ))}
              </Stack>
            </Card>

            <Card recipe="showcasePanel" padding="lg">
              <Flex align="center" justify="between" className="mb-4">
                <div>
                  <Typography variant="label">Connected surfaces</Typography>
                  <Typography variant="caption">Boards, docs, client views, and timers</Typography>
                </div>
                <LayoutGrid className="h-5 w-5 text-ui-text-tertiary" />
              </Flex>

              <Stack gap="md">
                {[
                  "Spec links stay attached to execution tickets",
                  "Client updates can be generated from live project state",
                  "Time entries roll up without separate admin tooling",
                ].map((item) => (
                  <Card key={item} recipe="overlayInset" padding="sm">
                    <Typography variant="small">{item}</Typography>
                  </Card>
                ))}
              </Stack>
            </Card>
          </div>
        </Grid>
      </Card>
    </div>
  );
}
