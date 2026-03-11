import { ArrowRight, Bot, Clock, LayoutGrid, Sparkles } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
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

/** Product preview card used in the landing hero. */
export function ProductShowcase() {
  return (
    <div id="product-showcase" className="relative mx-auto mt-5 max-w-6xl sm:mt-6">
      <div className="pointer-events-none absolute inset-x-16 top-10 h-56 rounded-full bg-landing-accent/10 blur-glow dark:bg-landing-accent/15" />

      <Card
        variant="outline"
        className="relative overflow-hidden rounded-3xl border-ui-border-secondary/75 bg-ui-bg-elevated/98 shadow-elevated"
      >
        <div className="border-b border-ui-border/60 bg-ui-bg-soft/82 px-4 py-3">
          <Flex align="center" justify="between" gap="md">
            <Flex align="center" gap="sm">
              <div className="h-2.5 w-2.5 rounded-full bg-status-error/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-status-warning/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-status-success/80" />
              <Badge variant="outline" shape="pill" className="ml-2">
                Live workspace preview
              </Badge>
            </Flex>

            <Flex align="center" gap="sm" className="hidden sm:flex">
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

        <Grid
          cols={1}
          colsLg={3}
          gap="lg"
          className="bg-linear-to-b from-ui-bg-soft/78 to-ui-bg px-4 py-4"
        >
          <div className="space-y-4 lg:col-span-2">
            <Card
              variant="soft"
              className="rounded-2xl border-ui-border/60 bg-ui-bg-secondary/80 p-5"
            >
              <Flex justify="between" align="start" gap="md" className="mb-4">
                <div>
                  <Typography variant="h3" className="text-2xl">
                    Product control tower
                  </Typography>
                  <Typography variant="small" color="secondary" className="mt-1 max-w-xl">
                    Specs, tasks, docs, and delivery signals stay connected instead of spreading
                    across five tools.
                  </Typography>
                </div>

                <Button variant="secondary" size="sm" className="hidden md:inline-flex">
                  Open board
                </Button>
              </Flex>

              <Grid cols={1} colsMd={3} gap="md">
                {boardColumns.map((column) => (
                  <div
                    key={column.title}
                    className="rounded-2xl border border-ui-border/50 bg-ui-bg/80 p-3"
                  >
                    <Flex align="center" justify="between" className="mb-3">
                      <Typography variant="label">{column.title}</Typography>
                      <div className={cn("h-2 w-2 rounded-full", column.accent)} />
                    </Flex>

                    <div className="space-y-2">
                      {column.cards.map((card) => (
                        <Card
                          key={card}
                          variant="soft"
                          padding="sm"
                          className="rounded-xl border-ui-border/40 bg-ui-bg-secondary/70"
                        >
                          <Typography variant="small">{card}</Typography>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </Grid>
            </Card>

            <Grid cols={1} colsMd={3} gap="lg">
              <Card className="rounded-2xl border-ui-border/50 bg-ui-bg-secondary/80 p-4">
                <Typography variant="meta" className="uppercase tracking-widest">
                  Active projects
                </Typography>
                <Typography variant="h2" className="mt-3 text-4xl">
                  18
                </Typography>
                <Typography variant="small" color="secondary" className="mt-2">
                  Cross-functional boards synced to docs, support, and delivery.
                </Typography>
              </Card>

              <Card className="rounded-2xl border-ui-border/50 bg-ui-bg-secondary/80 p-4">
                <Typography variant="meta" className="uppercase tracking-widest">
                  AI assists today
                </Typography>
                <Typography variant="h2" className="mt-3 text-4xl">
                  142
                </Typography>
                <Typography variant="small" color="secondary" className="mt-2">
                  Drafted updates, answered process questions, and summarized handoffs.
                </Typography>
              </Card>

              <Card className="rounded-2xl border-ui-border/50 bg-ui-bg-secondary/80 p-4">
                <Typography variant="meta" className="uppercase tracking-widest">
                  Time recovered
                </Typography>
                <Typography variant="h2" className="mt-3 text-4xl">
                  11h
                </Typography>
                <Typography variant="small" color="secondary" className="mt-2">
                  Less status chasing every week once docs and execution share one system.
                </Typography>
              </Card>
            </Grid>
          </div>

          <div className="space-y-4">
            <Card className="rounded-2xl border-ui-border/50 bg-ui-bg-secondary/80 p-5">
              <Flex align="center" gap="sm" className="mb-4">
                <div className="rounded-full bg-brand-subtle p-2 text-brand">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <Typography variant="label">AI workspace assistant</Typography>
                  <Typography variant="caption">
                    Understands issues, docs, and team context
                  </Typography>
                </div>
              </Flex>

              <Card variant="soft" padding="md" className="rounded-2xl border-ui-border/40">
                <Typography variant="small" color="secondary">
                  “Summarize what changed since the last client review and flag blockers.”
                </Typography>
              </Card>

              <div className="mt-3 space-y-3">
                {[
                  "Surface blocker issues tied to missing approvals",
                  "Draft release note from merged documents and resolved tickets",
                  "Generate next-step checklist for the support handoff",
                ].map((item) => (
                  <Flex key={item} align="start" gap="sm">
                    <div className="mt-1 rounded-full bg-status-success/15 p-1 text-status-success-text">
                      <ArrowRight className="h-3 w-3" />
                    </div>
                    <Typography variant="small" color="secondary">
                      {item}
                    </Typography>
                  </Flex>
                ))}
              </div>
            </Card>

            <Card className="rounded-2xl border-ui-border/50 bg-ui-bg-secondary/80 p-5">
              <Flex align="center" justify="between" className="mb-4">
                <div>
                  <Typography variant="label">Connected surfaces</Typography>
                  <Typography variant="caption">Boards, docs, client views, and timers</Typography>
                </div>
                <LayoutGrid className="h-5 w-5 text-ui-text-tertiary" />
              </Flex>

              <div className="space-y-3">
                {[
                  "Spec links stay attached to execution tickets",
                  "Client updates can be generated from live project state",
                  "Time entries roll up without separate admin tooling",
                ].map((item) => (
                  <Card
                    key={item}
                    variant="soft"
                    padding="sm"
                    className="rounded-xl border-ui-border/40"
                  >
                    <Typography variant="small">{item}</Typography>
                  </Card>
                ))}
              </div>
            </Card>
          </div>
        </Grid>
      </Card>
    </div>
  );
}
