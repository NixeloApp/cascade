import type { LucideIcon } from "lucide-react";
import { ArrowRight, Building2, KanbanSquare, MessageSquare } from "@/lib/icons";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Container } from "../ui/Container";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { IconCircle } from "../ui/IconCircle";
import { SectionIntro } from "../ui/SectionIntro";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

type Story = {
  body: string;
  icon: LucideIcon;
  stat: string;
  title: string;
};

const stories: Story[] = [
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
    <section>
      <Container
        size="lg"
        style={{ paddingInline: "1.5rem", paddingTop: "6rem", paddingBottom: "6rem" }}
      >
        <Stack gap="2xl">
          <SectionIntro
            align="center"
            eyebrow="Why teams move"
            title="Better product ops usually starts with fewer disconnected surfaces"
            description="The win is not just prettier UI. It is less repeated searching, less status translation, and fewer places where the truth can drift."
          />

          <Grid cols={1} colsLg={3} gap="xl">
            {stories.map((story) => (
              <StoryCard key={story.title} {...story} />
            ))}
          </Grid>
        </Stack>
      </Container>
    </section>
  );
}

function StoryCard({ body, icon: Icon, stat, title }: Story) {
  return (
    <Card recipe="landingStoryCard" padding="none">
      <Stack gap="lg">
        <Flex align="center" justify="between">
          <IconCircle size="md" variant="soft" tone="brand">
            <Icon size={20} />
          </IconCircle>
          <Badge variant="neutral" shape="pill">
            {stat}
          </Badge>
        </Flex>

        <Stack gap="sm">
          <Typography variant="h3">{title}</Typography>
          <Typography variant="small" color="secondary">
            {body}
          </Typography>
        </Stack>

        <Button asChild variant="link" size="none">
          <a href="#product-showcase">
            See the product flow
            <ArrowRight size={16} />
          </a>
        </Button>
      </Stack>
    </Card>
  );
}
