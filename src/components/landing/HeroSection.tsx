import { Link } from "@tanstack/react-router";
import { ROUTES } from "@/config/routes";
import { Flex } from "../ui/Flex";
import { Typography } from "../ui/Typography";
import { PlayIcon } from "./icons";

export function HeroSection() {
  return (
    <section className="px-6 pt-16 pb-24">
      <div className="max-w-4xl mx-auto text-center">
        {/* Tag */}
        <Flex justify="center" className="mb-8">
          <span className="px-4 py-2 rounded-full border border-ui-border-primary rounded-full text-xs font-medium text-ui-text-tertiary bg-ui-bg-secondary backdrop-blur-sm transition-colors">
            Project Management · Time Tracking
          </span>
        </Flex>

        {/* Headline */}
        <Typography
          variant="h1"
          className="text-4xl md:text-5xl lg:text-7xl font-bold leading-tight mb-6 tracking-tight text-ui-text-primary"
        >
          Revolutionize Your Workflow.
          <br />
          <span className="bg-linear-to-r from-cyan-600 via-teal-500 to-emerald-500 dark:from-cyan-400 dark:via-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">
            Harmonize Your Team.
          </span>
        </Typography>

        {/* Subheadline */}
        <Typography
          variant="lead"
          className="text-ui-text-secondary max-w-2xl mx-auto mb-10 text-lg md:text-xl"
        >
          Experience the future of project management with integrated tracking, automation, and
          collaboration.
        </Typography>

        {/* CTAs */}
        <Flex direction="column" gap="md" align="center" justify="center" className="sm:flex-row">
          <Link
            to={ROUTES.signup.path}
            className="px-8 py-3.5 bg-linear-to-r from-cyan-500 to-teal-400 rounded-full text-base font-bold text-white hover:shadow-lg hover:shadow-cyan-500/25 transition-all hover:scale-105 active:scale-95"
          >
            Get Started Free
          </Link>
          <a
            href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            target="_blank"
            rel="noopener noreferrer"
            className="group px-8 py-3.5 bg-transparent border border-ui-border-secondary rounded-full text-base font-medium text-ui-text-secondary hover:border-ui-border-primary hover:text-ui-text-primary transition-all flex items-center justify-center gap-2 hover:bg-ui-bg-secondary"
          >
            Watch Demo
            <PlayIcon className="w-4 h-4 text-cyan-600 dark:text-current" />
          </a>
        </Flex>
      </div>
    </section>
  );
}
