import { Link } from "@tanstack/react-router";
import { ROUTES } from "@/config/routes";
import { ArrowRight } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Flex } from "../ui/Flex";
import { Typography } from "../ui/Typography";
import { ProductShowcase } from "./ProductShowcase";

/** Landing page hero section with headline, CTA buttons, and product preview. */
export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 pb-6 pt-20 sm:pb-8 sm:pt-24">
      <div className="absolute inset-0 bg-ui-bg-hero">
        <div className="absolute inset-0 hero-radial-bg" />
        <div className="absolute inset-0 hero-grid-bg" />
        <div className="absolute left-1/2 top-0 h-px w-full max-w-4xl -translate-x-1/2 bg-linear-to-r from-transparent via-landing-accent/50 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-4xl text-center">
        <Flex justify="center" className="mb-2 animate-fade-in sm:mb-3">
          <Badge
            variant="outline"
            shape="pill"
            className={cn(
              "bg-ui-bg-soft px-4 py-2 backdrop-blur-sm",
              "transition-default hover:border-ui-border-secondary",
            )}
          >
            Docs, delivery, and time tracking in one operating system
          </Badge>
        </Flex>

        <Typography
          variant="h1"
          className={cn(
            "mb-2 text-4xl font-bold leading-tight tracking-tighter text-ui-text md:text-6xl lg:text-7xl",
            "animate-slide-up",
          )}
          style={{ animationDelay: "0.1s", animationFillMode: "backwards" }}
        >
          Replace scattered project tools
          <br />
          <span className="bg-linear-to-r from-landing-accent via-landing-accent-teal to-status-success-text bg-clip-text text-transparent">
            with one sharper workspace.
          </span>
        </Typography>

        <Typography
          variant="lead"
          className={cn(
            "mx-auto mb-3 max-w-3xl text-lg leading-relaxed text-ui-text-secondary md:text-xl",
            "animate-slide-up",
          )}
          style={{ animationDelay: "0.2s", animationFillMode: "backwards" }}
        >
          Nixelo keeps specs, tasks, client updates, and AI assistance in the same flow so teams can
          search faster, act faster, and stop duplicating context.
        </Typography>

        <Flex
          direction="column"
          gap="md"
          align="center"
          justify="center"
          className={cn("animate-slide-up sm:flex-row")}
          style={{ animationDelay: "0.3s", animationFillMode: "backwards" }}
        >
          <Button asChild size="lg" className="rounded-full px-8">
            <Link to={ROUTES.signup.path}>Get Started Free</Link>
          </Button>
          <Button asChild variant="secondary" size="lg" className="rounded-full px-8">
            <a href="#product-showcase">
              See workflow tour
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </Flex>

        <Flex
          justify="center"
          gap="lg"
          wrap
          className="mt-0 animate-slide-up text-sm text-ui-text-secondary"
          style={{ animationDelay: "0.4s", animationFillMode: "backwards" }}
        >
          <span>Built for product, ops, and client delivery teams</span>
          <span>AI-native search and action layer</span>
          <span>Fewer tools, less duplicated work</span>
        </Flex>

        <ProductShowcase />

        <div
          className="pointer-events-none absolute -bottom-20 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-landing-accent/10 blur-glow"
          style={{ animationDelay: "0.5s", animationFillMode: "backwards" }}
        />
      </div>
    </section>
  );
}
