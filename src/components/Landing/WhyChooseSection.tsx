import { ArrowRight, Building2, KanbanSquare, MessageSquare } from "@/lib/icons";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Typography } from "../ui/Typography";

const stories = [
  {
    icon: KanbanSquare,
    title: "Product teams stop rebuilding the same context",
    body: "Specs, execution, and delivery signals live in the same system, so project updates stop becoming a manual reporting exercise.",
    stat: "11h saved weekly",
  },
  {
    icon: MessageSquare,
    title: "Client-facing teams keep updates grounded in real work",
    body: "Shared issues, docs, and summaries reduce the drift between internal execution and external communication.",
    stat: "2 fewer tools in the loop",
  },
  {
    icon: Building2,
    title: "Ops leaders get cleaner visibility without heavier process",
    body: "Boards, docs, and timers produce a clearer operating picture without asking the team to fill out three extra systems.",
    stat: "Faster handoffs",
  },
];

/** Proof section with outcome-oriented customer-style cards. */
export function WhyChooseSection() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <Badge variant="outline" shape="pill" className="mb-4">
            Why teams move
          </Badge>
          <Typography variant="h2" className="text-4xl md:text-5xl">
            Better product ops usually starts with fewer disconnected surfaces
          </Typography>
          <Typography variant="lead" className="mx-auto mt-4 max-w-3xl">
            The win is not just prettier UI. It is less repeated searching, less status translation,
            and fewer places where the truth can drift.
          </Typography>
        </div>

        <Grid cols={1} colsLg={3} gap="xl">
          {stories.map((story) => (
            <Card
              key={story.title}
              className="rounded-3xl border-ui-border/50 bg-ui-bg-secondary/80 p-6 transition-all duration-medium hover:-translate-y-1 hover:border-ui-border-secondary"
            >
              <Flex align="center" justify="between" className="mb-5">
                <div className="rounded-full bg-ui-bg-soft p-3 text-brand">
                  <story.icon className="h-5 w-5" />
                </div>
                <Badge variant="neutral" shape="pill">
                  {story.stat}
                </Badge>
              </Flex>

              <Typography variant="h3" className="text-2xl">
                {story.title}
              </Typography>
              <Typography variant="small" color="secondary" className="mt-3 leading-7">
                {story.body}
              </Typography>

              <a
                href="#product-showcase"
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-brand transition-colors hover:text-brand-active"
              >
                See the product flow
                <ArrowRight className="h-4 w-4" />
              </a>
            </Card>
          ))}
        </Grid>
      </div>
    </section>
  );
}
