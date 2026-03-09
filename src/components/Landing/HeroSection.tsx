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
    <section className="relative overflow-hidden px-6 pb-24 pt-28 sm:pt-32">
      <div className="absolute inset-0 bg-ui-bg-hero">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(99, 102, 241, 0.14), transparent)",
          }}
        />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        <div className="absolute left-1/2 top-0 h-px w-full max-w-4xl -translate-x-1/2 bg-linear-to-r from-transparent via-landing-accent/50 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-6xl text-center">
        <Flex justify="center" className="mb-8 animate-fade-in">
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
            "mb-6 text-4xl font-bold leading-tight tracking-tighter text-brand-foreground md:text-6xl lg:text-7xl",
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
            "mx-auto mb-10 max-w-3xl text-lg leading-relaxed text-ui-text-secondary md:text-xl",
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
          className="mt-8 animate-slide-up text-sm text-ui-text-tertiary"
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
