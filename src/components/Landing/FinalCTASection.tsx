import { Link } from "@tanstack/react-router";
import { ROUTES } from "@/config/routes";
import { ArrowRight, Rocket, ShieldCheck } from "@/lib/icons";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Typography } from "../ui/Typography";

/** Closing CTA section for the landing page. */
export function FinalCTASection() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <Card className="rounded-3xl border-ui-border/50 bg-linear-to-br from-ui-bg-secondary via-ui-bg-elevated to-ui-bg-secondary p-8 shadow-elevated md:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" shape="pill" className="mb-5">
              Built for teams that need one system, not another tab
            </Badge>
            <Typography variant="h2" className="text-4xl md:text-5xl">
              Make product work easier to run and easier to trust
            </Typography>
            <Typography variant="lead" className="mt-4">
              Start free, bring your current workflow in, and let docs, execution, and AI assist
              each other from day one.
            </Typography>

            <Flex justify="center" gap="md" wrap className="mt-8">
              <Button asChild size="lg">
                <Link to={ROUTES.signup.path}>Get started for free</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <a href="#product-showcase">See the workflow tour</a>
              </Button>
            </Flex>
          </div>

          <Grid cols={1} colsMd={2} gap="lg" className="mt-10">
            <Card className="rounded-2xl border-ui-border/50 bg-ui-bg-soft/80 p-5">
              <Flex align="center" gap="sm" className="mb-3">
                <div className="rounded-full bg-brand-subtle p-2 text-brand">
                  <Rocket className="h-4 w-4" />
                </div>
                <Typography variant="label">Quickstart without churn</Typography>
              </Flex>
              <Typography variant="small" color="secondary">
                Import the basics, keep your team moving, and expand into docs, client views, and
                time tracking as needed.
              </Typography>
              <a
                href="#features"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand transition-colors hover:text-brand-active"
              >
                Explore the product
                <ArrowRight className="h-4 w-4" />
              </a>
            </Card>

            <Card className="rounded-2xl border-ui-border/50 bg-ui-bg-soft/80 p-5">
              <Flex align="center" gap="sm" className="mb-3">
                <div className="rounded-full bg-status-success/15 p-2 text-status-success-text">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <Typography variant="label">Ready for serious teams</Typography>
              </Flex>
              <Typography variant="small" color="secondary">
                Flexible pricing, enterprise controls, and a product model that can handle internal
                execution plus external-facing updates.
              </Typography>
              <a
                href="#pricing"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand transition-colors hover:text-brand-active"
              >
                Review pricing
                <ArrowRight className="h-4 w-4" />
              </a>
            </Card>
          </Grid>
        </Card>
      </div>
    </section>
  );
}
