import type { LucideIcon } from "@/lib/icons";
import { ArrowRight, Building2, KanbanSquare, MessageSquare } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Container } from "../ui/Container";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Icon, type IconTone } from "../ui/Icon";
import { IconCircle } from "../ui/IconCircle";
import { SectionIntro } from "../ui/SectionIntro";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

type EvidenceRow = {
  label: string;
  value: string;
};

type Story = {
  audience: string;
  body: string;
  evidence: EvidenceRow[];
  icon: LucideIcon;
  iconTone: IconTone;
  stat: string;
  statLabel: string;
  title: string;
};

const stories: Story[] = [
  {
    audience: "Product ops",
    icon: KanbanSquare,
    iconTone: "brand",
    title: "Planning, specs, and release prep stay attached",
    body: "Boards, specs, and delivery context stay on the same execution thread, so product leads stop rebuilding updates from scattered tools.",
    statLabel: "Recovered weekly",
    stat: "11h",
    evidence: [
      {
        label: "Comes from",
        value: "Live board state, linked docs, and release prep in one workflow.",
      },
      {
        label: "Removes",
        value: "Manual recap docs and duplicate status decks before every review.",
      },
    ],
  },
  {
    audience: "Client delivery",
    icon: MessageSquare,
    iconTone: "warning",
    title: "Client updates start from live work, not retelling",
    body: "Shared issues, docs, and summaries keep the external update path grounded in the same work the team is already shipping.",
    statLabel: "Tools removed",
    stat: "2",
    evidence: [
      {
        label: "Inputs",
        value: "Issue movement, linked briefs, and AI summaries stay in one handoff path.",
      },
      {
        label: "What changes",
        value: "Client-ready notes ship from current work instead of a separate recap workflow.",
      },
    ],
  },
  {
    audience: "Operations",
    icon: Building2,
    iconTone: "success",
    title: "Leadership sees an operating pulse instead of admin fog",
    body: "Boards, docs, summaries, and timers produce a cleaner operating view without asking the team to fill out another reporting layer.",
    statLabel: "Outcome",
    stat: "Faster handoffs",
    evidence: [
      {
        label: "Signals",
        value: "Time, blockers, and delivery context stay attached to the same workspace surface.",
      },
      {
        label: "Avoids",
        value: "Separate ops trackers and manual rollups just to explain current status.",
      },
    ],
  },
];

/** Product-grounded proof section showing how work stays attached across surfaces. */
export function WhyChooseSection() {
  return (
    <section data-testid={TEST_IDS.LANDING.PROOF_SECTION}>
      <Container size="lg" padding="section">
        <Stack gap="2xl">
          <SectionIntro
            align="center"
            eyebrow="What stays grounded"
            title="The proof is in how work survives every handoff"
            description="These are not abstract productivity claims. They are the concrete places where one shared workspace removes recap work, status translation, and context drift."
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

function StoryCard({ audience, body, evidence, icon, iconTone, stat, statLabel, title }: Story) {
  return (
    <Card recipe="landingStoryCard" padding="none">
      <Stack gap="lg">
        <Flex align="center" justify="between" gap="sm">
          <Flex align="center" gap="sm" className="min-w-0">
            <IconCircle size="md" variant="soft">
              <Icon icon={icon} size="md" tone={iconTone} />
            </IconCircle>
            <Stack gap="xs">
              <Typography variant="eyebrowWide">{audience}</Typography>
              <Typography variant="label">{statLabel}</Typography>
            </Stack>
          </Flex>

          <Badge variant="outline" shape="pill">
            {stat}
          </Badge>
        </Flex>

        <Stack gap="sm">
          <Typography variant="h3">{title}</Typography>
          <Typography variant="small" color="secondary">
            {body}
          </Typography>
        </Stack>

        <Stack gap="sm">
          {evidence.map((item) => (
            <ProofEvidenceRow key={`${title}-${item.label}`} {...item} />
          ))}
        </Stack>

        <Button asChild variant="link" size="content">
          <a href="#product-showcase">
            See the connected workflow
            <Icon icon={ArrowRight} size="sm" />
          </a>
        </Button>
      </Stack>
    </Card>
  );
}

function ProofEvidenceRow({ label, value }: EvidenceRow) {
  return (
    <Card recipe="overlayInset" variant="section" padding="sm">
      <Stack gap="xs">
        <Typography variant="eyebrowWide">{label}</Typography>
        <Typography variant="caption">{value}</Typography>
      </Stack>
    </Card>
  );
}
