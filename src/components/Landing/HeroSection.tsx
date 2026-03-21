import { Link } from "@tanstack/react-router";
import { ROUTES } from "@/config/routes";
import { ArrowRight } from "@/lib/icons";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Container } from "../ui/Container";
import { Flex } from "../ui/Flex";
import { Typography } from "../ui/Typography";
import { ProductShowcase } from "./ProductShowcase";

/** Landing page hero section with headline, CTA buttons, and product preview. */
export function HeroSection() {
  return (
    <section className="landing-hero">
      <div className="absolute inset-0 bg-ui-bg-hero">
        <div className="absolute inset-0 hero-radial-bg" />
        <div className="absolute inset-0 hero-grid-bg" />
        <div className="landing-hero-beam" />
      </div>

      <Container size="lg" className="landing-hero-content">
        <Flex justify="center" className="landing-hero-badge-row">
          <Badge variant="landingHero" shape="pill">
            Docs, delivery, and time tracking in one operating system
          </Badge>
        </Flex>

        <Typography variant="h1" className="landing-hero-title">
          Replace scattered project tools
          <br />
          <span className="bg-linear-to-r from-landing-accent via-landing-accent-teal to-status-success-text bg-clip-text text-transparent">
            with one sharper workspace.
          </span>
        </Typography>

        <Typography variant="lead" className="landing-hero-lead">
          Nixelo keeps specs, tasks, client updates, and AI assistance in the same flow so teams can
          search faster, act faster, and stop duplicating context.
        </Typography>

        <Flex
          direction="column"
          directionSm="row"
          gap="md"
          align="center"
          justify="center"
          className="landing-hero-actions"
        >
          <Button
            asChild
            variant="landingPrimary"
            style={{ borderRadius: "var(--radius-pill)", paddingInline: "2rem" }}
          >
            <Link to={ROUTES.signup.path}>Get Started Free</Link>
          </Button>
          <Button
            asChild
            variant="secondary"
            size="lg"
            style={{ borderRadius: "var(--radius-pill)", paddingInline: "2rem" }}
          >
            <a href="#product-showcase">
              See workflow tour
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </Flex>

        <Flex justify="center" gap="lg" wrap className="landing-hero-stats">
          <span>Built for product, ops, and client delivery teams</span>
          <span>AI-native search and action layer</span>
          <span>Fewer tools, less duplicated work</span>
        </Flex>

        <ProductShowcase />

        <div className="landing-hero-glow" />
      </Container>
    </section>
  );
}
