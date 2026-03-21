import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ROUTES } from "@/config/routes";
import { ArrowRight, Rocket, ShieldCheck } from "@/lib/icons";
import { Button } from "../ui/Button";
import { Card, getCardRecipeClassName } from "../ui/Card";
import { Container } from "../ui/Container";
import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { IconCircle } from "../ui/IconCircle";
import { SectionIntro } from "../ui/SectionIntro";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

/** Closing CTA section for the landing page. */
export function FinalCTASection() {
  return (
    <section id="final-cta">
      <Container
        size="lg"
        style={{ paddingInline: "1.5rem", paddingTop: "6rem", paddingBottom: "6rem" }}
      >
        <Card recipe="showcaseShell" padding="xl">
          <Stack gap="2xl">
            <SectionIntro
              align="center"
              eyebrow="Built for teams that need one system, not another tab"
              title="Make product work easier to run and easier to trust"
              description="Start free, bring your current workflow in, and let docs, execution, and AI assist each other from day one."
            />

            <Flex justify="center" gap="md" wrap>
              <Button asChild size="lg">
                <Link to={ROUTES.signup.path}>Get started for free</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <a href="#product-showcase">See the workflow tour</a>
              </Button>
            </Flex>

            <Grid cols={1} colsMd={2} gap="lg">
              <FinalFeatureCard
                href="#features"
                icon={Rocket}
                iconTone="brand"
                title="Quickstart without churn"
                body="Import the basics, keep your team moving, and expand into docs, client views, and time tracking as needed."
                cta="Explore the product"
              />
              <FinalFeatureCard
                href="#pricing"
                icon={ShieldCheck}
                iconTone="success"
                title="Ready for serious teams"
                body="Flexible pricing, enterprise controls, and a product model that can handle internal execution plus external-facing updates."
                cta="Review pricing"
              />
            </Grid>
          </Stack>
        </Card>
      </Container>
    </section>
  );
}

function FinalFeatureCard({
  body,
  cta,
  href,
  icon: Icon,
  iconTone,
  title,
}: {
  body: string;
  cta: string;
  href: string;
  icon: LucideIcon;
  iconTone: "brand" | "success";
  title: string;
}) {
  return (
    <div className={getCardRecipeClassName("landingFinalFeatureCard")}>
      <Stack gap="md">
        <Flex align="center" gap="sm">
          <IconCircle size="sm" variant={iconTone}>
            <Icon size={16} />
          </IconCircle>
          <Typography variant="label">{title}</Typography>
        </Flex>
        <Typography variant="small" color="secondary">
          {body}
        </Typography>
        <Button asChild variant="link" size="none">
          <a href={href}>
            {cta}
            <ArrowRight size={16} />
          </a>
        </Button>
      </Stack>
    </div>
  );
}
