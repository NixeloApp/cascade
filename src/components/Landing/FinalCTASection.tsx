import { Link } from "@tanstack/react-router";
import { cva } from "class-variance-authority";
import { ROUTES } from "@/config/routes";
import { ArrowRight, Rocket, ShieldCheck } from "@/lib/icons";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, getCardRecipeClassName } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Typography } from "../ui/Typography";

const finalCtaVariants = {
  section: cva("px-6 py-24"),
  shell: cva(
    "rounded-3xl border-ui-border/50 bg-linear-to-br from-ui-bg-secondary via-ui-bg-elevated to-ui-bg-secondary p-8 shadow-elevated md:p-12",
  ),
  iconBadge: cva("rounded-full p-2", {
    variants: {
      tone: {
        brand: "bg-brand-subtle text-brand",
        success: "bg-status-success/15 text-status-success-text",
      },
    },
  }),
};

/** Closing CTA section for the landing page. */
export function FinalCTASection() {
  return (
    <section className={finalCtaVariants.section()}>
      <div className="mx-auto max-w-6xl">
        <Card className={finalCtaVariants.shell()}>
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" shape="pill" className="mb-5">
              Built for teams that need one system, not another tab
            </Badge>
            <Typography variant="landingSectionTitle">
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
            <div className={getCardRecipeClassName("landingFinalFeatureCard")}>
              <Flex align="center" gap="sm" className="mb-3">
                <div className={finalCtaVariants.iconBadge({ tone: "brand" })}>
                  <Rocket className="h-4 w-4" />
                </div>
                <Typography variant="label">Quickstart without churn</Typography>
              </Flex>
              <Typography variant="small" color="secondary">
                Import the basics, keep your team moving, and expand into docs, client views, and
                time tracking as needed.
              </Typography>
              <Button asChild variant="link" size="none" className="mt-4 text-brand">
                <a href="#features">
                  Explore the product
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>

            <div className={getCardRecipeClassName("landingFinalFeatureCard")}>
              <Flex align="center" gap="sm" className="mb-3">
                <div className={finalCtaVariants.iconBadge({ tone: "success" })}>
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <Typography variant="label">Ready for serious teams</Typography>
              </Flex>
              <Typography variant="small" color="secondary">
                Flexible pricing, enterprise controls, and a product model that can handle internal
                execution plus external-facing updates.
              </Typography>
              <Button asChild variant="link" size="none" className="mt-4 text-brand">
                <a href="#pricing">
                  Review pricing
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </Grid>
        </Card>
      </div>
    </section>
  );
}
