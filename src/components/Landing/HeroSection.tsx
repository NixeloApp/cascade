import { Link } from "@tanstack/react-router";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/Badge";
import { Flex } from "../ui/Flex";
import { Typography } from "../ui/Typography";
import { PlayIcon } from "./icons";

export function HeroSection() {
  return (
    <section className="relative px-6 pt-20 pb-32 overflow-hidden">
      {/* Near-black background with gradient overlays */}
      <div className="absolute inset-0 bg-ui-bg-hero">
        {/* Radial gradient from center */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, color-mix(in srgb, var(--color-landing-accent), transparent 85%), transparent)",
          }}
        />
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "linear-gradient(color-mix(in srgb, var(--color-ui-text-inverse), transparent 97%) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--color-ui-text-inverse), transparent 97%) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        {/* Top edge glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-px bg-linear-to-r from-transparent via-landing-accent/50 to-transparent" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Tag - with staggered animation */}
        <Flex justify="center" className="mb-10 animate-fade-in">
          <Badge
            variant="outline"
            shape="pill"
            className={cn(
              "px-4 py-2",
              "bg-ui-bg-soft backdrop-blur-sm",
              "transition-default hover:border-ui-border-secondary",
            )}
          >
            Project Management · Time Tracking
          </Badge>
        </Flex>

        {/* Headline - with tighter tracking for premium feel */}
        <Typography
          variant="h1"
          className={cn(
            "text-4xl md:text-5xl lg:text-7xl font-bold leading-tight mb-6",
            "tracking-tighter text-brand-foreground",
            "animate-slide-up",
          )}
          style={{ animationDelay: "0.1s", animationFillMode: "backwards" }}
        >
          Revolutionize Your Workflow.
          <br />
          <span className="bg-linear-to-r from-landing-accent via-landing-accent-teal to-status-success-text bg-clip-text text-transparent">
            Harmonize Your Team.
          </span>
        </Typography>

        {/* Subheadline - with opacity-based secondary text */}
        <Typography
          variant="lead"
          className={cn(
            "text-ui-text-secondary max-w-2xl mx-auto mb-12",
            "text-lg md:text-xl leading-relaxed",
            "animate-slide-up",
          )}
          style={{ animationDelay: "0.2s", animationFillMode: "backwards" }}
        >
          Experience the future of project management with integrated tracking, automation, and
          collaboration.
        </Typography>

        {/* CTAs - with hover animations */}
        <Flex
          direction="column"
          gap="md"
          align="center"
          justify="center"
          className={cn("sm:flex-row animate-slide-up")}
          style={{ animationDelay: "0.3s", animationFillMode: "backwards" }}
        >
          <Link
            to={ROUTES.signup.path}
            className={cn(
              "px-8 py-3.5 rounded-pill",
              "bg-linear-to-r from-landing-accent to-landing-accent-teal",
              "text-base font-bold text-brand-foreground",
              "shadow-elevated",
              "transition-all duration-default",
              "hover:shadow-xl hover:shadow-landing-accent/25",
              "hover:scale-105 active:scale-95",
            )}
          >
            Get Started Free
          </Link>
          <a
            href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "group px-8 py-3.5 rounded-pill",
              "bg-transparent border border-ui-border-secondary",
              "text-base font-medium text-ui-text-secondary",
              "transition-all duration-default",
              "hover:border-ui-border hover:text-brand-foreground",
              "hover:bg-ui-bg-hover",
              "flex items-center justify-center gap-2",
            )}
          >
            Watch Demo
            <PlayIcon className="w-4 h-4 text-landing-accent transition-transform duration-default group-hover:translate-x-0.5" />
          </a>
        </Flex>

        {/* Bottom decorative glow */}
        <div
          className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full blur-glow bg-landing-accent/10 pointer-events-none animate-fade-in"
          style={{ animationDelay: "0.5s", animationFillMode: "backwards" }}
        />
      </div>
    </section>
  );
}
