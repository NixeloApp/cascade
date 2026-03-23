import { Link } from "@tanstack/react-router";
import { ROUTES } from "@/config/routes";
import { ArrowRight } from "@/lib/icons";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Container } from "../ui/Container";
import { Flex } from "../ui/Flex";
import { Icon } from "../ui/Icon";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";
import { ProductShowcase } from "./ProductShowcase";

const heroSignals = [
  "Built for product, ops, and client delivery",
  "AI-native search and action layer",
  "Less context duplicated across tools",
] as const;

/** Landing page hero section with headline, CTA buttons, and product preview. */
export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-ui-bg-hero" />

      <Container
        size="lg"
        className="relative text-center"
        style={{ paddingInline: "1.5rem", paddingTop: "5rem", paddingBottom: "1rem" }}
      >
        <Stack gap="lg">
          <Container size="md">
            <Stack gap="md">
              <Flex
                justify="center"
                style={{ animation: "var(--animation-fade-in)", animationFillMode: "backwards" }}
              >
                <Badge variant="landingHero" shape="pill">
                  Docs, delivery, and time tracking in one operating system
                </Badge>
              </Flex>

              <Typography
                variant="h1"
                style={{
                  animation: "var(--animation-slide-up)",
                  animationDelay: "0.1s",
                  animationFillMode: "backwards",
                }}
              >
                Replace scattered project tools{" "}
                <span className="bg-linear-to-r from-landing-accent via-landing-accent-teal to-status-success-text bg-clip-text text-transparent">
                  with one sharper workspace.
                </span>
              </Typography>

              <Typography
                variant="lead"
                style={{
                  animation: "var(--animation-slide-up)",
                  animationDelay: "0.2s",
                  animationFillMode: "backwards",
                }}
              >
                Nixelo keeps specs, tasks, client updates, and AI assistance in the same flow so
                teams can search faster, act faster, and stop duplicating context.
              </Typography>
            </Stack>
          </Container>

          <Stack gap="md">
            <Flex
              direction="column"
              directionSm="row"
              gap="md"
              align="center"
              justify="center"
              style={{
                animation: "var(--animation-slide-up)",
                animationDelay: "0.3s",
                animationFillMode: "backwards",
              }}
            >
              <Button asChild variant="landingPrimary" size="none">
                <Link to={ROUTES.signup.path}>Get Started Free</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <a href="#product-showcase">
                  See workflow tour
                  <Icon icon={ArrowRight} size="sm" />
                </a>
              </Button>
            </Flex>

            <Flex
              justify="center"
              gap="sm"
              wrap
              style={{
                animation: "var(--animation-slide-up)",
                animationDelay: "0.4s",
                animationFillMode: "backwards",
              }}
            >
              {heroSignals.map((signal) => (
                <Badge key={signal} variant="outline" shape="pill">
                  {signal}
                </Badge>
              ))}
            </Flex>
          </Stack>

          <ProductShowcase />
        </Stack>
      </Container>
    </section>
  );
}
