import { Link } from "@tanstack/react-router";
import { ROUTES } from "@/config/routes";
import { ArrowRight } from "@/lib/icons";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Container } from "../ui/Container";
import { Flex } from "../ui/Flex";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";
import { ProductShowcase } from "./ProductShowcase";

/** Landing page hero section with headline, CTA buttons, and product preview. */
export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-ui-bg-hero">
        <div className="absolute inset-0 hero-radial-bg" />
        <div className="absolute inset-0 hero-grid-bg" />
      </div>

      <Container
        size="lg"
        className="relative text-center"
        style={{ paddingInline: "1.5rem", paddingTop: "6rem", paddingBottom: "2rem" }}
      >
        <Stack gap="xl">
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
              Replace scattered project tools
              <br />
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
              Nixelo keeps specs, tasks, client updates, and AI assistance in the same flow so teams
              can search faster, act faster, and stop duplicating context.
            </Typography>
          </Stack>

          <Stack gap="lg">
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
                  <ArrowRight size={16} />
                </a>
              </Button>
            </Flex>

            <Flex
              justify="center"
              gap="lg"
              wrap
              style={{
                animation: "var(--animation-slide-up)",
                animationDelay: "0.4s",
                animationFillMode: "backwards",
              }}
            >
              <Typography variant="small" color="secondary">
                Built for product, ops, and client delivery teams
              </Typography>
              <Typography variant="small" color="secondary">
                AI-native search and action layer
              </Typography>
              <Typography variant="small" color="secondary">
                Fewer tools, less duplicated work
              </Typography>
            </Flex>
          </Stack>

          <ProductShowcase />
        </Stack>
      </Container>
    </section>
  );
}
