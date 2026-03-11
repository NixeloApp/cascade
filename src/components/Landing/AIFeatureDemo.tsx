import { cva } from "class-variance-authority";
import { Bot, Search, Sparkles } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { Flex, FlexItem } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

const answerSteps = [
  "Open the workspace and choose the project from the sidebar.",
  "Create a board from the board switcher or the project overview.",
  "Pick a template, then connect related docs so specs stay attached to execution.",
  "Invite teammates or clients and let AI summarize changes as the board evolves.",
];

const aiFeatureDemoVariants = {
  section: cva("px-6 py-24"),
  shell: cva("rounded-3xl border-ui-border/50 bg-ui-bg-secondary/80 p-6"),
  softCard: cva("rounded-2xl border-ui-border/40"),
  bulletList: cva("mt-5 space-y-3"),
  bulletDot: cva("mt-1 h-2.5 w-2.5 rounded-full bg-landing-accent"),
  iconBadge: cva("rounded-full p-2", {
    variants: {
      tone: {
        neutral: "bg-ui-bg-soft text-brand",
        brand: "bg-brand-subtle text-brand",
      },
    },
  }),
  stepBadge: cva("flex h-6 w-6 items-center justify-center rounded-full bg-ui-bg"),
};

/** Landing section showing an AI support and knowledge mockup. */
export function AIFeatureDemo() {
  return (
    <section className={aiFeatureDemoVariants.section()} id="resources">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <Badge variant="outline" shape="pill" className="mb-4">
            AI-native workflows
          </Badge>
          <Typography variant="h2" className="text-4xl md:text-5xl">
            Intelligent assistance across every handoff
          </Typography>
          <Typography variant="lead" className="mx-auto mt-4 max-w-3xl">
            Turn the same workspace into a search surface, operating manual, and action engine
            without splitting your team between docs, chats, and PM tools.
          </Typography>
        </div>

        <Grid cols={1} colsLg={5} gap="xl">
          <Card className={cn(aiFeatureDemoVariants.shell(), "lg:col-span-2")}>
            <Flex align="center" gap="sm" className="mb-5">
              <div className={aiFeatureDemoVariants.iconBadge({ tone: "neutral" })}>
                <Search className="h-4 w-4" />
              </div>
              <div>
                <Typography variant="label">Operator question</Typography>
                <Typography variant="caption">Search, docs, and work context together</Typography>
              </div>
            </Flex>

            <Card variant="soft" padding="md" className={aiFeatureDemoVariants.softCard()}>
              <Typography variant="small">
                “How do I add a board to my project and keep the client-facing summary updated?”
              </Typography>
            </Card>

            <div className={aiFeatureDemoVariants.bulletList()}>
              {[
                "Understands project structure, issue history, and linked documents",
                "Keeps the answer grounded in your actual workspace, not a generic help center",
                "Can immediately turn the answer into a next action",
              ].map((item) => (
                <Flex key={item} align="start" gap="sm">
                  <div className={aiFeatureDemoVariants.bulletDot()} />
                  <Typography variant="small" color="secondary">
                    {item}
                  </Typography>
                </Flex>
              ))}
            </div>
          </Card>

          <Card className={cn(aiFeatureDemoVariants.shell(), "lg:col-span-3")}>
            <Flex align="center" justify="between" className="mb-5">
              <Flex align="center" gap="sm">
                <div className={aiFeatureDemoVariants.iconBadge({ tone: "brand" })}>
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <Typography variant="label">Nixelo AI</Typography>
                  <Typography variant="caption">Grounded answer with next steps</Typography>
                </div>
              </Flex>
              <Badge variant="brand" shape="pill">
                <Sparkles className="h-3.5 w-3.5" />
                Context aware
              </Badge>
            </Flex>

            <Card variant="soft" padding="lg" className={aiFeatureDemoVariants.softCard()}>
              <Typography variant="small" color="secondary" className="mb-4 leading-7">
                To add a new board, open the workspace from the sidebar, choose the project, and
                create the board from the project overview. If you attach the related spec and
                enable the client summary view, updates from linked issues and status changes can be
                summarized automatically.
              </Typography>

              <Stack gap="md">
                {answerSteps.map((step, index) => (
                  <Flex key={step} align="start" gap="sm">
                    <FlexItem shrink={false} className={aiFeatureDemoVariants.stepBadge()}>
                      <Typography variant="small" className="font-semibold text-ui-text">
                        {index + 1}
                      </Typography>
                    </FlexItem>
                    <Typography variant="small" color="secondary">
                      {step}
                    </Typography>
                  </Flex>
                ))}
              </Stack>
            </Card>
          </Card>
        </Grid>
      </div>
    </section>
  );
}
