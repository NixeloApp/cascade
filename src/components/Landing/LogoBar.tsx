import type { LucideIcon } from "@/lib/icons";
import { Bot, Clock, FileText, MessageSquare } from "@/lib/icons";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { Container } from "../ui/Container";
import { Dot } from "../ui/Dot";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Icon } from "../ui/Icon";
import { IconCircle } from "../ui/IconCircle";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

type ProofSignal = {
  audience: string;
  body: string;
  icon: LucideIcon;
  iconTone: "brand" | "info" | "success" | "warning";
  source: string;
  title: string;
};

const proofSignals = [
  {
    audience: "Product ops",
    title: "Boards and docs stay linked",
    body: "Specs, execution notes, and release context move with the issue instead of being recopied into a status deck.",
    source: "Boards + docs",
    icon: FileText,
    iconTone: "brand",
  },
  {
    audience: "Client delivery",
    title: "Updates stay grounded in live work",
    body: "Client-facing summaries pull from the board state and linked documents before anything gets sent out.",
    source: "Summaries + handoff",
    icon: MessageSquare,
    iconTone: "warning",
  },
  {
    audience: "AI assistance",
    title: "Search answers come from real context",
    body: "AI reads projects, issues, and docs together so the next action comes from the workspace, not a guess.",
    source: "Search + AI",
    icon: Bot,
    iconTone: "info",
  },
  {
    audience: "Time tracking",
    title: "Timers stay attached to delivery",
    body: "Tracked time, work state, and follow-up notes live in one operating layer instead of separate admin cleanup.",
    source: "Timers + delivery",
    icon: Clock,
    iconTone: "success",
  },
] satisfies ProofSignal[];

/** Product-grounded proof strip below the landing hero. */
export function LogoBar() {
  return (
    <section aria-labelledby="landing-proof-strip-title">
      <Card recipe="landingNavFrame" className="border-y border-ui-border/20 py-10">
        <Container size="lg">
          <Stack gap="xl">
            <Stack gap="sm" align="center" className="text-center">
              <Typography id="landing-proof-strip-title" variant="eyebrowWide">
                Product proof in the same workflow surfaces
              </Typography>
              <Typography variant="small" color="secondary" className="max-w-3xl">
                Nixelo works when boards, docs, client updates, AI answers, and tracked time all
                stay attached to the same operating layer.
              </Typography>
            </Stack>

            <Grid cols={1} colsSm={2} colsLg={4} gap="md">
              {proofSignals.map((signal) => (
                <ProofSignalCard key={signal.title} {...signal} />
              ))}
            </Grid>
          </Stack>
        </Container>
      </Card>
    </section>
  );
}

function ProofSignalCard({ audience, body, icon, iconTone, source, title }: ProofSignal) {
  return (
    <Card recipe="overlayInset" variant="section" padding="md" className="h-full">
      <Stack gap="md" className="h-full">
        <Flex align="center" justify="between" gap="sm">
          <IconCircle size="sm" variant="soft">
            <Icon icon={icon} size="sm" tone={iconTone} />
          </IconCircle>
          <Badge variant="outline" shape="pill" size="sm">
            {audience}
          </Badge>
        </Flex>

        <Stack gap="xs" style={{ flex: 1 }}>
          <Typography variant="label">{title}</Typography>
          <Typography variant="caption">{body}</Typography>
        </Stack>

        <Flex align="center" gap="xs">
          <Dot size="sm" color={getDotColor(iconTone)} />
          <Typography variant="caption">{source}</Typography>
        </Flex>
      </Stack>
    </Card>
  );
}

function getDotColor(iconTone: ProofSignal["iconTone"]) {
  switch (iconTone) {
    case "brand":
      return "brand";
    case "info":
      return "info";
    case "success":
      return "success";
    case "warning":
      return "warning";
    default:
      return "muted";
  }
}
