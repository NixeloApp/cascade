import type { HTMLAttributes, ReactNode } from "react";
import { Bot, Search, Sparkles } from "@/lib/icons";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { Container } from "../ui/Container";
import { Dot } from "../ui/Dot";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { IconCircle } from "../ui/IconCircle";
import { SectionIntro } from "../ui/SectionIntro";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

const answerSteps = [
  "Open the workspace and choose the project from the sidebar.",
  "Create a board from the board switcher or the project overview.",
  "Pick a template, then connect related docs so specs stay attached to execution.",
  "Invite teammates or clients and let AI summarize changes as the board evolves.",
];

/** Landing section showing an AI support and knowledge mockup. */
export function AIFeatureDemo() {
  return (
    <section id="resources">
      <Container size="lg" padding="section">
        <Stack gap="2xl">
          <SectionIntro
            align="center"
            eyebrow="AI-native workflows"
            title="Intelligent assistance across every handoff"
            description="Turn the same workspace into a search surface, operating manual, and action engine without splitting your team between docs, chats, and PM tools."
          />

          <Grid cols={1} colsLg={5} gap="xl">
            <AIFeatureShell className="lg:col-span-2">
              <Stack gap="lg">
                <Flex align="center" gap="sm">
                  <IconCircle size="sm" variant="soft" tone="brand">
                    <Search size={16} />
                  </IconCircle>
                  <div>
                    <Typography variant="label">Operator question</Typography>
                    <Typography variant="caption">
                      Search, docs, and work context together
                    </Typography>
                  </div>
                </Flex>

                <AIFeatureInsetCard padding="md">
                  <Typography variant="small">
                    “How do I add a board to my project and keep the client-facing summary updated?”
                  </Typography>
                </AIFeatureInsetCard>

                <Stack gap="md">
                  {[
                    "Understands project structure, issue history, and linked documents",
                    "Keeps the answer grounded in your actual workspace, not a generic help center",
                    "Can immediately turn the answer into a next action",
                  ].map((item) => (
                    <Flex key={item} align="start" gap="sm">
                      <Dot size="md" color="brand" className="mt-1" />
                      <Typography variant="small" color="secondary">
                        {item}
                      </Typography>
                    </Flex>
                  ))}
                </Stack>
              </Stack>
            </AIFeatureShell>

            <AIFeatureShell className="lg:col-span-3">
              <Stack gap="lg">
                <Flex align="center" justify="between">
                  <Flex align="center" gap="sm">
                    <IconCircle size="sm" variant="brand">
                      <Bot size={16} />
                    </IconCircle>
                    <div>
                      <Typography variant="label">Nixelo AI</Typography>
                      <Typography variant="caption">Grounded answer with next steps</Typography>
                    </div>
                  </Flex>
                  <Badge variant="brand" shape="pill">
                    <Sparkles size={14} />
                    Context aware
                  </Badge>
                </Flex>

                <AIFeatureInsetCard padding="lg">
                  <Stack gap="md">
                    <Typography variant="small" color="secondary">
                      To add a new board, open the workspace from the sidebar, choose the project,
                      and create the board from the project overview. If you attach the related spec
                      and enable the client summary view, updates from linked issues and status
                      changes can be summarized automatically.
                    </Typography>

                    <Stack gap="md">
                      {answerSteps.map((step, index) => (
                        <Flex key={step} align="start" gap="sm">
                          <IconCircle size="xs" variant="soft">
                            <Typography as="span" variant="label">
                              {index + 1}
                            </Typography>
                          </IconCircle>
                          <Typography variant="small" color="secondary">
                            {step}
                          </Typography>
                        </Flex>
                      ))}
                    </Stack>
                  </Stack>
                </AIFeatureInsetCard>
              </Stack>
            </AIFeatureShell>
          </Grid>
        </Stack>
      </Container>
    </section>
  );
}

function AIFeatureShell({
  children,
  className,
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <Card recipe="landingStoryCard" padding="none" className={className}>
      {children}
    </Card>
  );
}

function AIFeatureInsetCard({ children, padding }: { children: ReactNode; padding: "md" | "lg" }) {
  return (
    <Card recipe="overlayInset" variant="section" padding={padding}>
      {children}
    </Card>
  );
}
