import { Bot, Search, Sparkles } from "@/lib/icons";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { Flex } from "../ui/Flex";
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
    <section className="px-6 py-24" id="resources">
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

        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="rounded-3xl border-ui-border/50 bg-ui-bg-secondary/80 p-6 lg:col-span-2">
            <Flex align="center" gap="sm" className="mb-5">
              <div className="rounded-full bg-ui-bg-soft p-2 text-brand">
                <Search className="h-4 w-4" />
              </div>
              <div>
                <Typography variant="label">Operator question</Typography>
                <Typography variant="caption">Search, docs, and work context together</Typography>
              </div>
            </Flex>

            <Card variant="soft" padding="md" className="rounded-2xl border-ui-border/40">
              <Typography variant="small">
                “How do I add a board to my project and keep the client-facing summary updated?”
              </Typography>
            </Card>

            <div className="mt-5 space-y-3">
              {[
                "Understands project structure, issue history, and linked documents",
                "Keeps the answer grounded in your actual workspace, not a generic help center",
                "Can immediately turn the answer into a next action",
              ].map((item) => (
                <Flex key={item} align="start" gap="sm">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-landing-accent" />
                  <Typography variant="small" color="secondary">
                    {item}
                  </Typography>
                </Flex>
              ))}
            </div>
          </Card>

          <Card className="rounded-3xl border-ui-border/50 bg-ui-bg-secondary/80 p-6 lg:col-span-3">
            <Flex align="center" justify="between" className="mb-5">
              <Flex align="center" gap="sm">
                <div className="rounded-full bg-brand-subtle p-2 text-brand">
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

            <Card variant="soft" padding="lg" className="rounded-2xl border-ui-border/40">
              <Typography variant="small" color="secondary" className="mb-4 leading-7">
                To add a new board, open the workspace from the sidebar, choose the project, and
                create the board from the project overview. If you attach the related spec and
                enable the client summary view, updates from linked issues and status changes can be
                summarized automatically.
              </Typography>

              <div className="space-y-3">
                {answerSteps.map((step, index) => (
                  <Flex key={step} align="start" gap="sm">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ui-bg text-sm font-semibold text-ui-text">
                      {index + 1}
                    </div>
                    <Typography variant="small" color="secondary">
                      {step}
                    </Typography>
                  </Flex>
                ))}
              </div>
            </Card>
          </Card>
        </div>
      </div>
    </section>
  );
}
